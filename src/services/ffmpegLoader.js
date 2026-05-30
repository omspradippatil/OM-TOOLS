/**
 * ffmpegLoader.js
 * Lazy-loads @ffmpeg/ffmpeg (wasm) exactly once per session.
 * Caches the instance — subsequent calls return instantly.
 *
 * Core: @ffmpeg/core@0.12.6 UMD build (NOT ESM — ESM breaks in blob URL context)
 * CDN fallback chain: jsDelivr → unpkg
 *
 * IMPORTANT: Always use the UMD build (/dist/umd/), NOT the ESM build (/dist/esm/).
 * The ESM build uses import.meta.url which fails when converted to a Blob URL.
 */

let _instance    = null;  // { ffmpeg, fetchFile }
let _loadPromise = null;  // in-flight load promise

const CDN_BASES = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
];

/**
 * Load (or return cached) ffmpeg instance.
 * @param {Function} [onLog] - optional callback(message: string)
 * @returns {Promise<{ ffmpeg, fetchFile }>}
 */
export async function loadFFmpeg(onLog) {
  if (_instance)    return _instance;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    // Dynamic imports keep ffmpeg out of the main bundle
    const { FFmpeg }               = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    if (onLog) {
      ffmpeg.on('log', ({ message }) => onLog(message));
    }

    // Try each CDN in order — first one to succeed wins
    let loaded = false;
    let lastErr = null;

    for (const BASE of CDN_BASES) {
      try {
        await ffmpeg.load({
          // UMD build: does NOT use import.meta.url — safe to use as blob URL
          coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`,   'text/javascript'),
          wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        console.log('[ffmpeg] Loaded from:', BASE);
        loaded = true;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`[ffmpeg] CDN failed (${BASE}):`, err.message || err);
      }
    }

    if (!loaded) {
      throw new Error(
        `Failed to load ffmpeg.wasm from all CDNs. ` +
        `Last error: ${lastErr?.message || lastErr}. ` +
        `Check your internet connection and try again.`
      );
    }

    _instance = { ffmpeg, fetchFile };
    return _instance;
  })();

  // If load fails, reset so the next call can retry
  _loadPromise.catch(() => { _loadPromise = null; });

  return _loadPromise;
}

/**
 * Run an ffmpeg command on an in-memory file.
 *
 * @param {Uint8Array}  inputData   raw bytes of input file
 * @param {string}      inputName   virtual FS filename (e.g. "input.mp4")
 * @param {string}      outputName  virtual FS filename (e.g. "output.mp3")
 * @param {string[]}    args        ffmpeg CLI args between -i and output
 * @param {Function}    [onProgress] called with 0–1
 * @param {Function}    [onLog]      called with log string
 * @returns {Promise<Uint8Array>}
 */
export async function runFFmpeg(inputData, inputName, outputName, args, onProgress, onLog) {
  const { ffmpeg, fetchFile } = await loadFFmpeg(onLog);

  const progressHandler = onProgress
    ? ({ progress }) => { onProgress(Math.max(0, Math.min(1, progress))); }
    : null;

  if (progressHandler) ffmpeg.on('progress', progressHandler);

  try {
    // Write input to virtual FS
    await ffmpeg.writeFile(inputName, await fetchFile(new Blob([inputData])));

    // Execute
    await ffmpeg.exec(['-i', inputName, ...args, outputName]);

    // Read output
    const data = await ffmpeg.readFile(outputName);
    return data instanceof Uint8Array ? data : new Uint8Array(data);

  } finally {
    if (progressHandler) ffmpeg.off('progress', progressHandler);
    // Clean up virtual FS — ignore errors (file may not exist if exec failed early)
    try { await ffmpeg.deleteFile(inputName);  } catch { /* ok */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ok */ }
  }
}

/**
 * Returns true when WebAssembly is supported.
 * Since we use the single-threaded UMD build of ffmpeg.wasm,
 * SharedArrayBuffer is NOT required — works in all modern browsers.
 */
export function isFFmpegSupported() {
  return typeof WebAssembly !== 'undefined';
}
