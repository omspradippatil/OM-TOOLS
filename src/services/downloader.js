/**
 * OM Tools — On-Device Downloader Service
 *
 * Architecture:
 * 1. Cobalt API  → fetches direct signed media URL (YouTube/Instagram/etc.)
 * 2. Fetch API   → streams the actual video/audio DATA to the browser with progress
 * 3. ffmpeg.wasm → converts in-browser (e.g. MP4 → MP3) using WebAssembly
 * 4. Blob URL    → browser saves the processed file directly to the user's device
 *
 * Nothing passes through OM Tools' servers. Processing is 100% on-device.
 */

/**
 * Step 1: Ask Cobalt for a direct download URL.
 * In production → calls /.netlify/functions/download (server-side, no CORS/browser blocks)
 * In dev        → calls Cobalt API directly with minimal params
 */
export async function fetchCobaltLink(url, options = {}) {
  const isProd = import.meta.env.PROD;
  // Use our raw backend (Netlify function in prod, Vite proxy in dev)
  const endpoint = isProd ? '/.netlify/functions/download' : '/api/download';

  // Build minimal body
  const body = {
    url,
    quality: options.quality || '1080',
    mode: options.mode   || 'auto',
  };

  let res;
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(body),
      signal:  options.signal,
    });
  } catch (networkErr) {
    throw new Error(`Network error — check your connection. (${networkErr.message})`);
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch video: ${res.status}`);
  }

  return { url: data.url, audioUrl: data.audioUrl, filename: data.filename || 'download', status: data.status };
}


/**
 * Step 2: Download the raw media to a Uint8Array.
 * Uses 4x parallel chunk downloading if supported by the proxy/server,
 * multiplying download speeds by up to 4x and bypassing connection throttling.
 * Falls back dynamically to robust sequential downloading if Range headers are not supported.
 */
export async function downloadToBuffer(url, onProgress, signal) {
  let fetchUrl = url;

  // Bypass CORS using our local Vite proxy in development
  if (!import.meta.env.PROD && url.includes('googlevideo.com')) {
    fetchUrl = `/api/stream?url=${encodeURIComponent(url)}`;
  }

  try {
    // 1. Try to fetch content length using a lightweight Range check
    const sizeRes = await fetch(fetchUrl, {
      headers: { 'Range': 'bytes=0-0' },
      signal
    });

    if (!sizeRes.ok) {
      throw new Error(`Range check returned status: ${sizeRes.status}`);
    }

    const contentRange = sizeRes.headers.get('Content-Range');
    let totalSize = 0;
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts.length > 1) {
        totalSize = parseInt(parts[1], 10);
      }
    }

    // If total size is valid and larger than 3MB, use parallel 4-thread download
    if (totalSize > 3 * 1024 * 1024) {
      const concurrency = 4;
      const chunkSize = Math.ceil(totalSize / concurrency);
      const promises = [];
      const progressTracker = Array(concurrency).fill(0);
      
      let lastTime = Date.now();
      let lastBytes = 0;
      let totalReceived = 0;

      const updateProgress = (index, bytesReceived) => {
        progressTracker[index] = bytesReceived;
        totalReceived = progressTracker.reduce((sum, val) => sum + val, 0);
        
        const now = Date.now();
        if (now - lastTime >= 500) {
          const bytesPerSec = ((totalReceived - lastBytes) / (now - lastTime)) * 1000;
          const mbPerSec = (bytesPerSec / (1024 * 1024)).toFixed(1);
          lastTime = now;
          lastBytes = totalReceived;
          
          if (onProgress) {
            onProgress({ progress: totalReceived / totalSize, speed: mbPerSec });
          }
        }
      };

      const downloadChunk = async (index) => {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize - 1, totalSize - 1);
        
        const chunkRes = await fetch(fetchUrl, {
          headers: { 'Range': `bytes=${start}-${end}` },
          signal
        });
        
        if (!chunkRes.ok) throw new Error(`Chunk ${index} failed: ${chunkRes.status}`);
        
        const reader = chunkRes.body.getReader();
        const chunks = [];
        let received = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          updateProgress(index, received);
        }
        
        const chunkData = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          chunkData.set(chunk, offset);
          offset += chunk.length;
        }
        return chunkData;
      };

      // Start parallel downloads
      for (let i = 0; i < concurrency; i++) {
        promises.push(downloadChunk(i));
      }

      const results = await Promise.all(promises);
      
      // Concatenate all concurrent chunks
      const finalData = new Uint8Array(totalSize);
      let offset = 0;
      for (const resData of results) {
        finalData.set(resData, offset);
        offset += resData.length;
      }

      if (onProgress) onProgress({ progress: 1, speed: 0 });
      return finalData;
    }
  } catch (err) {
    console.warn('Parallel download failed or not supported, falling back to sequential stream:', err);
  }

  // 2. Sequential fallback (standard single-thread stream)
  const res = await fetch(getFetchUrl(), { signal });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const contentLength = res.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  let lastTime = Date.now();
  let lastReceived = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;

    const now = Date.now();
    if (now - lastTime >= 500) {
      const bytesPerSec = ((received - lastReceived) / (now - lastTime)) * 1000;
      const mbPerSec = (bytesPerSec / (1024 * 1024)).toFixed(1);
      lastTime = now;
      lastReceived = received;

      if (total && onProgress) {
        onProgress({ progress: received / total, speed: mbPerSec });
      }
    }
  }

  if (!total && onProgress) onProgress({ progress: 1, speed: 0 });

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Step 3 (optional): Convert media format using ffmpeg.wasm — all in the browser.
 * Only loaded when needed (code-split lazy import).
 * @param {Uint8Array} inputData  - Raw media bytes
 * @param {string}     inputExt   - Source extension: 'mp4', 'webm', etc.
 * @param {string}     outputExt  - Target extension: 'mp3', 'm4a', 'mp4', etc.
 * @param {object}     opts       - { bitrate, quality, onProgress }
 */
export async function convertWithFFmpeg(inputData, inputExt, outputExt, opts = {}) {
  // Lazy-load ffmpeg (only when conversion is actually needed)
  const { FFmpeg }    = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();

  if (opts.onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      opts.onProgress(Math.min(progress, 1));
    });
  }

  // Load single-threaded WASM core from CDN (no SharedArrayBuffer needed)
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  const inputName  = `input.${inputExt}`;
  const outputName = `output.${outputExt}`;

  await ffmpeg.writeFile(inputName, inputData);
  if (opts.audioData) {
    await ffmpeg.writeFile('audio.input', opts.audioData);
  }

  // Build ffmpeg command based on target format
  let cmd;
  if (opts.audioData) {
    cmd = ['-i', inputName, '-i', 'audio.input', '-c:v', 'copy', '-c:a', 'aac', outputName];
  } else if (outputExt === 'mp3') {
    const bitrate = opts.bitrate || '320k';
    cmd = ['-i', inputName, '-vn', '-b:a', bitrate, outputName];
  } else if (outputExt === 'm4a') {
    cmd = ['-i', inputName, '-vn', '-acodec', 'aac', '-b:a', '256k', outputName];
  } else if (outputExt === 'mp4') {
    cmd = ['-i', inputName, '-c:v', 'copy', '-c:a', 'copy', outputName];
  } else if (outputExt === 'webm') {
    cmd = ['-i', inputName, '-c:v', 'libvpx-vp9', '-c:a', 'libopus', outputName];
  } else {
    cmd = ['-i', inputName, outputName];
  }

  await ffmpeg.exec(cmd);
  const data = await ffmpeg.readFile(outputName);

  // Cleanup
  await ffmpeg.deleteFile(inputName).catch(() => {});
  if (opts.audioData) await ffmpeg.deleteFile('audio.input').catch(() => {});
  await ffmpeg.deleteFile(outputName).catch(() => {});
  ffmpeg.terminate();

  return data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
}

/**
 * Step 4: Trigger browser file save dialog.
 * @param {Uint8Array|Blob} data
 * @param {string}          filename
 * @param {string}          mimeType
 */
export function saveToDevice(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5000);
}

/**
 * Detect MIME type from filename extension
 */
export function mimeForExt(ext) {
  const map = {
    mp4:  'video/mp4',
    webm: 'video/webm',
    mp3:  'audio/mpeg',
    m4a:  'audio/mp4',
    ogg:  'audio/ogg',
    wav:  'audio/wav',
    jpg:  'image/jpeg',
    png:  'image/png',
  };
  return map[ext?.toLowerCase()] || 'application/octet-stream';
}

/**
 * Derive output extension and Cobalt mode from format selection
 */
export function formatToOptions(formatId) {
  const map = {
    'mp4-4k':    { mode: 'auto',  quality: '2160', ext: 'mp4', needsConvert: false },
    'mp4-1080':  { mode: 'auto',  quality: '1080', ext: 'mp4', needsConvert: false },
    'mp4-720':   { mode: 'auto',  quality: '720',  ext: 'mp4', needsConvert: false },
    'mp4-480':   { mode: 'auto',  quality: '480',  ext: 'mp4', needsConvert: false },
    'mp4-360':   { mode: 'auto',  quality: '360',  ext: 'mp4', needsConvert: false },
    'mp3-320':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: true,  audioFormat: 'mp3', audioBitrate: '320' },
    'mp3-256':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: true,  audioFormat: 'mp3', audioBitrate: '256' },
    'mp3-192':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: true,  audioFormat: 'mp3', audioBitrate: '192' },
    'm4a':       { mode: 'audio', quality: 'max',  ext: 'm4a', needsConvert: false, audioFormat: 'best' },
    'mp4-hd':    { mode: 'auto',  quality: 'max',  ext: 'mp4', needsConvert: false },
    'mp4-sd':    { mode: 'auto',  quality: '480',  ext: 'mp4', needsConvert: false },
    'maxres':    { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
    'hq':        { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
    'mq':        { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
  };
  return map[formatId] || { mode: 'auto', quality: 'max', ext: 'mp4', needsConvert: false };
}
