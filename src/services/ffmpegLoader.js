/**
 * ffmpegLoader.js
 * Lazy-loads @ffmpeg/ffmpeg (wasm) from CDN exactly once per session.
 * Caches the instance so subsequent calls are instant.
 */

let _ffmpegInstance = null;
let _loadPromise    = null;

/** Load (or return cached) ffmpeg instance */
export async function loadFFmpeg(onLog) {
  if (_ffmpegInstance) return _ffmpegInstance;
  if (_loadPromise)   return _loadPromise;

  _loadPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    if (onLog) {
      ffmpeg.on('log', ({ message }) => onLog(message));
    }

    // Load WASM from CDN (avoids bundling ~30 MB)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await ffmpeg.load({
      coreURL:    await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL:    await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _ffmpegInstance = { ffmpeg, fetchFile };
    return _ffmpegInstance;
  })();

  return _loadPromise;
}

/**
 * Run an ffmpeg command on an input buffer.
 *
 * @param {Uint8Array} inputData  - raw bytes of the input file
 * @param {string}     inputName  - virtual filename in ffmpeg's FS (e.g. "input.mp4")
 * @param {string}     outputName - virtual filename for output (e.g. "output.mp3")
 * @param {string[]}   args       - ffmpeg CLI args (between input and output)
 * @param {Function}   onProgress - called with 0–1 progress values
 * @param {Function}   onLog      - optional log callback
 * @returns {Promise<Uint8Array>} output file bytes
 */
export async function runFFmpeg(inputData, inputName, outputName, args, onProgress, onLog) {
  const { ffmpeg, fetchFile } = await loadFFmpeg(onLog);

  // Track progress via ffmpeg's progress event
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.min(progress, 1));
    });
  }

  // Write input
  await ffmpeg.writeFile(inputName, await fetchFile(new Blob([inputData])));

  // Execute
  await ffmpeg.exec(['-i', inputName, ...args, outputName]);

  // Read output
  const data = await ffmpeg.readFile(outputName);

  // Cleanup virtual FS
  try { await ffmpeg.deleteFile(inputName);  } catch { /* ignore */ }
  try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }

  if (onProgress) {
    ffmpeg.off('progress');
  }

  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

/** Returns true if ffmpeg.wasm can run (SharedArrayBuffer available) */
export function isFFmpegSupported() {
  return typeof SharedArrayBuffer !== 'undefined';
}
