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
  'https://cobalt.api.timelessnesses.me',
  'https://cobalt.drgns.space',
  'https://cobalt.catto.space',
  'https://co.wuk.sh',
  'https://cobalt.darwi.dev',
  'https://cobaltapi.cjs.nz',
  'https://api.cobalt.tools',
  'https://cobalt.api.minnick.me',
];

// State caching for Cobalt instances to maximize start speed and prevent timeout delays
const failedInstances = new Map();
const FAILURE_COOLDOWN = 3 * 60 * 1000; // 3 minutes cooldown for failed servers
let lastWorkingInstance = null;
let cobaltBlocked = false;


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
    // Expected: the 2s timeout fires if instances.cobalt.best is slow — we fall back to static pool.
    console.debug('[Cobalt] Dynamic instances unavailable, using static pool:', err.message || err);
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
    downloadMode: options.mode === 'audio' ? 'audio' : 'video',
  };

  if (body.downloadMode === 'audio') {
    body.audioFormat = options.audioFormat || 'mp3';
  } else {
    body.videoQuality = options.quality || '1080';
  }


  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, 4000); // 4-second timeout per instance


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
      if (isClientErrorCode(errMsg)) {
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
        // Skip this server — stream is empty/broken, next server will be tried
        console.debug(`[Cobalt] Skipping ${instanceUrl} — stream check failed:`, verifyErr.message || verifyErr);
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

async function tryLocalBackend(url, options) {
  const res = await fetch('/api/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      quality: options.quality || '1080',
      mode: options.mode || 'auto',
    }),
    signal: options.signal,
  });

  if (res.ok) {
    const data = await res.json();
    if (data && data.url) {
      console.log('[Downloader] Local backend fallback succeeded!');
      return {
        url: data.url,
        audioUrl: data.audioUrl || null,
        filename: data.filename || 'download.mp4',
        status: data.status || 'stream',
        totalSize: 0,
        supportsRange: true, // yt-dlp direct streams usually support Range headers
      };
    }
  }
  const data = await res.json().catch(() => ({}));
  if (data && data.error) {
    throw new Error(data.error);
  }
  throw new Error(`HTTP ${res.status}`);
}

/**
 * Step 1: Ask Cobalt for a direct download URL.
 * For YouTube, tries our own yt-dlp backend FIRST (most reliable),
 * then falls back to Cobalt public instances.
 * Returns: { url, filename, status, totalSize, supportsRange }
 */
export async function fetchCobaltLink(url, options = {}) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  // For YouTube: try our own yt-dlp backend first — it uses the iOS player client
  // which bypasses YouTube's bot-check. Cobalt is the secondary fallback.
  if (isYouTube) {
    try {
      const result = await tryLocalBackend(url, options);
      console.log('[Downloader] yt-dlp backend succeeded for YouTube.');
      return result;
    } catch (backendErr) {
      const msg = backendErr.message || '';
      console.warn('[Downloader] yt-dlp backend failed:', msg.slice(0, 120));

      // If content is definitely unavailable (private/removed), don't bother with Cobalt
      if (
        msg.includes('Video unavailable') ||
        msg.includes('Private video') ||
        msg.includes('This video has been removed') ||
        msg.includes('age-restricted')
      ) {
        throw backendErr;
      }
      // Otherwise fall through to Cobalt pool
    }
  }

  // If Cobalt is blocked during this session, abort early for YouTube
  if (cobaltBlocked && isYouTube) {
    throw new Error('All YouTube download servers are currently blocked or rate-limited. Please try again in a few minutes.');
  }

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
      console.debug(`[Cobalt] ${instanceUrl} skipped: ${err.message}`);
      failedInstances.set(instanceUrl, Date.now());
      lastError = err;

      if (err.isClientError) {
        throw err;
      }
    }
  }

  // All Cobalt instances also failed
  if (isYouTube) {
    cobaltBlocked = true;
  }

  throw new Error(`All available download servers failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
}




/**
 * Step 2: Download the raw media to a Uint8Array.
 * Uses a rolling-queue parallel chunker: fixed 2MB chunks, 8 concurrent connections.
 * This bypasses per-connection throttling while keeping memory bounded.
 * Falls back to robust sequential streaming if Range headers are not supported.
 */
export async function downloadToBuffer(url, onProgress, signal) {
  let fetchUrl = url;

  // Bypass CORS using our streaming proxy
  if (url.includes('googlevideo.com')) {
    fetchUrl = `/api/stream?url=${encodeURIComponent(url)}`;
  }

  try {
    // 1. Probe total size and Range support with a lightweight HEAD/GET
    const sizeRes = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-0' },
      signal,
    });

    if (!sizeRes.ok && sizeRes.status !== 206) {
      throw new Error(`Range probe returned status: ${sizeRes.status}`);
    }

    // Drain 1-byte body immediately
    await sizeRes.body?.cancel().catch(() => {});

    // Try Content-Range first (e.g. "bytes 0-0/45678901")
    let totalSize = 0;
    const contentRange = sizeRes.headers.get('Content-Range');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts.length > 1) totalSize = parseInt(parts[1], 10) || 0;
    }
    // Fallback: Content-Length on the full response
    if (!totalSize) {
      const cl = sizeRes.headers.get('Content-Length');
      if (cl) totalSize = parseInt(cl, 10) || 0;
    }
    // Fallback: Cobalt Estimated-Content-Length
    if (!totalSize) {
      const est = sizeRes.headers.get('Estimated-Content-Length');
      if (est && est !== '-1') totalSize = parseInt(est, 10) || 0;
    }

    const supportsRange = sizeRes.status === 206 ||
      (sizeRes.headers.get('Accept-Ranges') || '').toLowerCase() === 'bytes';

    // Use parallel rolling-queue if we know the total size and Range is supported
    if (totalSize > 3 * 1024 * 1024 && supportsRange) {
      const CHUNK_SIZE  = 2 * 1024 * 1024; // 2 MB per chunk — keeps memory bounded
      const CONCURRENCY = 8;               // 8 parallel connections

      const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
      const chunkBuffers = new Array(numChunks);

      let nextChunk      = 0; // next chunk index to dispatch
      let receivedBytes  = 0;
      let lastTime       = Date.now();
      let lastBytes      = 0;

      const reportProgress = () => {
        const now = Date.now();
        if (onProgress && now - lastTime >= 300) {
          const bytesPerSec = ((receivedBytes - lastBytes) / (now - lastTime)) * 1000;
          lastTime  = now;
          lastBytes = receivedBytes;
          onProgress({
            progress: Math.min(receivedBytes / totalSize, 1),
            speed:    (bytesPerSec / (1024 * 1024)).toFixed(1),
          });
        }
      };

      const downloadChunk = async (index) => {
        const start = index * CHUNK_SIZE;
        const end   = Math.min(start + CHUNK_SIZE - 1, totalSize - 1);

        const res = await fetch(fetchUrl, {
          headers: { 'Range': `bytes=${start}-${end}` },
          signal,
        });
        if (!res.ok) throw new Error(`Chunk ${index} failed: HTTP ${res.status}`);

        const reader = res.body.getReader();
        const parts  = [];
        let chunkReceived = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          chunkReceived  += value.length;
          receivedBytes  += value.length;
          reportProgress();
        }

        // Assemble this chunk's data
        const buf = new Uint8Array(chunkReceived);
        let off = 0;
        for (const p of parts) { buf.set(p, off); off += p.length; }
        chunkBuffers[index] = buf;
      };

      // Rolling queue: always keep CONCURRENCY workers in flight
      const workers = new Set();
      const errors  = [];

      const dispatch = () => {
        while (workers.size < CONCURRENCY && nextChunk < numChunks) {
          const idx = nextChunk++;
          const p = downloadChunk(idx).catch(e => errors.push(e));
          workers.add(p);
          p.finally(() => { workers.delete(p); dispatch(); });
        }
      };

      dispatch();

      // Wait until all workers finish
      while (workers.size > 0) {
        await Promise.race(workers);
      }

      if (errors.length > 0) throw errors[0];

      // Concatenate ordered chunks
      const finalData = new Uint8Array(totalSize);
      let offset = 0;
      for (const buf of chunkBuffers) {
        finalData.set(buf, offset);
        offset += buf.length;
      }

      if (onProgress) onProgress({ progress: 1, speed: '0' });
      console.log(`[Download] Parallel done — ${numChunks} chunks, ${(totalSize/1024/1024).toFixed(1)} MB`);
      return finalData;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('[Download] Parallel chunker failed, falling back to sequential:', err.message);
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
