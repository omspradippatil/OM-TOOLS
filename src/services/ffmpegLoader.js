/**
 * ffmpegLoader.js
 * Lazy-loads @ffmpeg/ffmpeg (wasm) exactly once per session.
 * Caches the instance — subsequent calls return instantly.
 *
 * @ffmpeg/ffmpeg  ^0.12.x
 * @ffmpeg/util    ^0.12.x
 * @ffmpeg/core    0.12.6  (loaded from CDN)
 */

let _instance   = null;   // { ffmpeg, fetchFile }
let _loadPromise = null;  // in-flight load promise

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
    const { FFmpeg }              = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    if (onLog) {
      ffmpeg.on('log', ({ message }) => onLog(message));
    }

    // Use jsDelivr CDN — ESM is required for modern Vite bundle dynamic imports
    const BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _instance = { ffmpeg, fetchFile };
    return _instance;
  })();

  // If load fails, reset so we can retry
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
 * @param {Function}    [onProgress] called with 0-1
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
    // Clean up virtual FS
    try { await ffmpeg.deleteFile(inputName);  } catch { /* ok */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ok */ }
  }
}

/**
 * Returns true when WebAssembly is supported.
 * Since we use the single-threaded build of ffmpeg.wasm, we do not require SharedArrayBuffer.
 */
export function isFFmpegSupported() {
  return typeof WebAssembly !== 'undefined';
}
