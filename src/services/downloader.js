/**
 * OM Tools — On-Device Downloader Service
 *
 * Architecture:
 * 1. Cobalt API  → fetches direct signed media URL (YouTube/Instagram/etc.)
 * 2. Fetch API   → streams the actual video/audio DATA to the browser with progress
 * 3. ffmpeg.wasm → converts in-browser (e.g. MP4 → MP3) using WebAssembly
 * 4. Blob URL    → browser saves the processed file directly to the user's device
 *
 * Speed Architecture:
 * - Stream verification uses lightweight Range: bytes=0-0 header check ONLY (does NOT consume the URL).
 * - downloadToBuffer uses 6 parallel chunk connections to bypass single-connection throttling.
 * - Smart routing: files ≤150MB with Range support → parallel 6-thread downloader (real progress).
 *   Files >150MB or no Range support → native browser anchor (0 RAM usage).
 */

const FALLBACK_INSTANCES = [
  'https://dog.kittycat.boo',
  'https://fox.kittycat.boo',
  'https://api.cobalt.liubquanti.click',
  'https://cobaltapi.kittycat.boo',
  'https://cobaltapi.squair.xyz',
  'https://api.cobalt.blackcat.sweeux.org',
  'https://api.dl.woof.monster',
  'https://cobaltapi.cjs.nz'
];

// State caching for Cobalt instances to maximize start speed and prevent timeout delays
const failedInstances = new Map();
const FAILURE_COOLDOWN = 3 * 60 * 1000; // 3 minutes cooldown for failed servers
let lastWorkingInstance = null;

let cachedDynamicInstances = null;
let lastDynamicInstancesFetch = 0;
const DYNAMIC_INSTANCES_TTL = 15 * 60 * 1000; // 15 minutes TTL for successful dynamic instance lists

function mergeSignals(signal1, signal2) {
  const controller = new AbortController();

  const onAbort = () => {
    controller.abort();
    cleanup();
  };

  const cleanup = () => {
    if (signal1) signal1.removeEventListener('abort', onAbort);
    if (signal2) signal2.removeEventListener('abort', onAbort);
  };

  if (signal1) {
    if (signal1.aborted) {
      controller.abort();
      return { signal: controller.signal, cleanup: () => {} };
    }
    signal1.addEventListener('abort', onAbort);
  }

  if (signal2) {
    if (signal2.aborted) {
      controller.abort();
      cleanup();
      return { signal: controller.signal, cleanup: () => {} };
    }
    signal2.addEventListener('abort', onAbort);
  }

  return {
    signal: controller.signal,
    cleanup
  };
}

function isClientErrorCode(code) {
  if (!code) return false;
  const str = String(code).toLowerCase();
  // Only treat as client errors when the issue is the URL/content itself,
  // NOT server-capability issues like login requirements (which are per-server).
  return (
    str === 'api.content.video.unavailable' ||
    str === 'api.content.video.private' ||
    str === 'api.content.video.age' ||
    str === 'api.content.video.not_found' ||
    str === 'api.link.unsupported' ||
    str === 'api.link.invalid' ||
    str.includes('invalid_url') ||
    str.includes('too_long')
  );
}

async function fetchInstances() {
  const now = Date.now();
  if (cachedDynamicInstances && (now - lastDynamicInstancesFetch < DYNAMIC_INSTANCES_TTL)) {
    return cachedDynamicInstances;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch('https://instances.cobalt.best/api/instances.json', { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      cachedDynamicInstances = data
        .filter(inst => inst && inst.url && inst.url.startsWith('https'))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map(inst => inst.url.replace(/\/$/, ''));
      lastDynamicInstancesFetch = now;
      return cachedDynamicInstances;
    }
  } catch (err) {
    clearTimeout(id);
    console.warn('Failed to fetch dynamic Cobalt instances:', err.message || err);
    // Cache empty list for 2 minutes on failure to prevent repeated timeout delays on successive clicks
    cachedDynamicInstances = [];
    lastDynamicInstancesFetch = now - DYNAMIC_INSTANCES_TTL + (2 * 60 * 1000);
  }
  return cachedDynamicInstances || [];
}

/**
 * Lightweight stream validation using Range: bytes=0-0.
 * Only reads response HEADERS — does NOT consume the stream body.
 * This keeps the Cobalt tunnel URL intact for the actual download.
 * Returns { totalSize, supportsRange } or throws on error/empty stream.
 */
async function verifyStream(downloadUrl, userSignal) {
  // Route googlevideo through our edge proxy to avoid CORS
  const verifyUrl = downloadUrl.includes('googlevideo.com')
    ? `/api/stream?url=${encodeURIComponent(downloadUrl)}`
    : downloadUrl;

  const verifyController = new AbortController();
  const { signal: verifySignal, cleanup } = mergeSignals(userSignal, verifyController.signal);
  const timeoutId = setTimeout(() => verifyController.abort(), 5000);

  try {
    const verifyRes = await fetch(verifyUrl, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-0' },
      signal: verifySignal
    });

    clearTimeout(timeoutId);

    const contentLength = verifyRes.headers.get('Content-Length');
    const estLength = verifyRes.headers.get('Estimated-Content-Length');
    const contentRange = verifyRes.headers.get('Content-Range');
    const acceptRanges = verifyRes.headers.get('Accept-Ranges');

    // Cancel body immediately — we only needed headers
    verifyController.abort();
    cleanup();

    // Detect 0-byte empty streams (broken instances like dog.kittycat.boo)
    if (contentLength === '0' && (estLength === '-1' || !estLength)) {
      throw new Error('Server returned an empty stream (0 bytes)');
    }

    const supportsRange = verifyRes.status === 206 || (acceptRanges && acceptRanges !== 'none');

    // Parse total file size from Content-Range header (e.g. "bytes 0-0/45678901")
    let totalSize = 0;
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts.length > 1) {
        totalSize = parseInt(parts[1], 10) || 0;
      }
    }
    // Fallback: Estimated-Content-Length from Cobalt tunnel headers
    if (!totalSize && estLength && estLength !== '-1') {
      totalSize = parseInt(estLength, 10) || 0;
    }

    return { totalSize, supportsRange: !!supportsRange };
  } catch (err) {
    clearTimeout(timeoutId);
    cleanup();

    if (err.name === 'AbortError' && userSignal?.aborted) {
      throw err; // Propagate user cancellation
    }
    // If abort was ours (body cancel after headers), don't treat as failure
    if (err.name === 'AbortError') {
      throw new Error('Stream verification timed out');
    }
    throw new Error(`Stream verification failed: ${err.message || err}`);
  }
}

async function tryCobaltInstance(instanceUrl, url, options) {
  const body = {
    url,
    videoQuality: options.quality || '1080',
    downloadMode: options.mode || 'auto',
    audioFormat: options.audioFormat || 'mp3',
    audioBitrate: options.audioBitrate || '128',
  };

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 8000); // 8-second timeout per instance

  const { signal, cleanup } = mergeSignals(options.signal, timeoutController.signal);

  try {
    const res = await fetch(instanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal
    });

    clearTimeout(timeoutId);
    cleanup();

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.error?.code || data.error || `HTTP ${res.status}`;
      const err = new Error(errMsg);
      if (res.status === 400 || (data.status === 'error' && isClientErrorCode(errMsg))) {
        err.isClientError = true;
      }
      throw err;
    }

    if (data.status === 'error') {
      const errMsg = data.error?.code || data.error || 'Unknown error';
      const err = new Error(errMsg);
      if (isClientErrorCode(errMsg)) {
        err.isClientError = true;
      }
      throw err;
    }

    if (data.status === 'picker') {
      if (data.picker && data.picker.length > 0) {
        return {
          url: data.picker[0].url,
          filename: 'download',
          status: data.status,
          totalSize: 0,
          supportsRange: false,
        };
      }
      throw new Error('Picker status returned but no items available.');
    }

    if (data.status === 'tunnel' || data.status === 'redirect') {
      const downloadUrl = data.url;

      // Lightweight header-only verification — does NOT consume the tunnel URL
      let verifyResult = { totalSize: 0, supportsRange: false };
      try {
        verifyResult = await verifyStream(downloadUrl, options.signal);
      } catch (verifyErr) {
        if (verifyErr.name === 'AbortError' && options.signal?.aborted) {
          throw verifyErr;
        }
        console.warn(`Stream verification failed for ${instanceUrl}:`, verifyErr.message || verifyErr);
        throw new Error(`Stream verification failed: ${verifyErr.message || verifyErr}`);
      }

      return {
        url: downloadUrl,
        filename: data.filename || 'download',
        status: data.status,
        totalSize: verifyResult.totalSize,
        supportsRange: verifyResult.supportsRange,
      };
    }

    throw new Error(`Unexpected status: ${data.status}`);
  } catch (err) {
    clearTimeout(timeoutId);
    cleanup();

    if (err.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw err;
      }
      throw new Error('Request timed out');
    }
    throw err;
  }
}

/**
 * Step 1: Ask Cobalt for a direct download URL.
 * Uses the first healthy server — no speed benchmarking (which consumed tunnel URLs).
 * Real speed gain comes from 6-thread parallel chunking in downloadToBuffer.
 * Returns: { url, filename, status, totalSize, supportsRange }
 */
export async function fetchCobaltLink(url, options = {}) {
  // 1. Fetch dynamic list of instances (with caching)
  let instances = [];
  try {
    instances = await fetchInstances();
  } catch (e) {
    console.warn('Error fetching dynamic instances list:', e);
  }

  // 2. Merge with fallback instances
  const rawPool = [...new Set([...instances, ...FALLBACK_INSTANCES])];

  // 3. Filter out recently failed instances to prevent wasting time on them
  const now = Date.now();
  let pool = rawPool.filter(inst => {
    const failTime = failedInstances.get(inst);
    return !failTime || (now - failTime > FAILURE_COOLDOWN);
  });

  // If all instances have failed/cooled down, reset and try all of them
  if (pool.length === 0) {
    pool = rawPool;
  }

  // 4. Move the last known working instance to the front of the pool
  if (lastWorkingInstance && pool.includes(lastWorkingInstance)) {
    pool = [lastWorkingInstance, ...pool.filter(inst => inst !== lastWorkingInstance)];
  }

  // 5. Try each instance sequentially — return immediately on first success
  let lastError = null;

  for (const instanceUrl of pool) {
    if (options.signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }

    try {
      const result = await tryCobaltInstance(instanceUrl, url, options);
      // Cache this instance as the last working one for instant start on subsequent requests
      lastWorkingInstance = instanceUrl;
      console.log(`[Cobalt] Using ${instanceUrl} | size=${(result.totalSize / 1024 / 1024).toFixed(1)}MB range=${result.supportsRange}`);
      return result;
    } catch (err) {
      console.warn(`Instance ${instanceUrl} failed:`, err.message);
      failedInstances.set(instanceUrl, Date.now());
      lastError = err;

      if (err.isClientError) {
        throw err;
      }
    }
  }

  throw new Error(`All available download servers failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
}



/**
 * Step 2: Download the raw media to a Uint8Array.
 * Uses 6x parallel chunk downloading if supported by the server,
 * multiplying download speeds by up to 6x and bypassing connection throttling.
 * Falls back dynamically to robust sequential downloading if Range headers are not supported.
 */
export async function downloadToBuffer(url, onProgress, signal) {
  let fetchUrl = url;

  // Bypass CORS using our streaming proxy
  if (url.includes('googlevideo.com')) {
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

    // If total size is valid and larger than 3MB, use parallel 6-thread download
    if (totalSize > 3 * 1024 * 1024) {
      const concurrency = 6;
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
        if (now - lastTime >= 400) {
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
  const res = await fetch(fetchUrl, { signal });
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
    if (now - lastTime >= 400) {
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
    'mp3-320':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: false, audioFormat: 'mp3', audioBitrate: '320' },
    'mp3-256':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: false, audioFormat: 'mp3', audioBitrate: '256' },
    'mp3-192':   { mode: 'audio', quality: 'max',  ext: 'mp3', needsConvert: false, audioFormat: 'mp3', audioBitrate: '192' },
    'm4a':       { mode: 'audio', quality: 'max',  ext: 'm4a', needsConvert: false, audioFormat: 'best' },
    'mp4-hd':    { mode: 'auto',  quality: 'max',  ext: 'mp4', needsConvert: false },
    'mp4-sd':    { mode: 'auto',  quality: '480',  ext: 'mp4', needsConvert: false },
    'maxres':    { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
    'hq':        { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
    'mq':        { mode: 'auto',  quality: 'max',  ext: 'jpg', needsConvert: false, isThumbnail: true },
  };
  return map[formatId] || { mode: 'auto', quality: 'max', ext: 'mp4', needsConvert: false };
}
