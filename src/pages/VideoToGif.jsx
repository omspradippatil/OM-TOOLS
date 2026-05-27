import LocalToolPage from '../components/LocalToolPage.jsx';
import { loadFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'Why does my GIF look low quality?', a: 'GIFs are limited to 256 colors per frame. We use ffmpeg\'s two-pass palette generation which gives the best possible GIF quality. For better results, use a lower FPS and smaller width.' },
  { q: 'My GIF file is huge — how do I reduce it?', a: 'Lower the FPS (10–15 is usually enough for smooth motion) and the width (320px is fine for social media). Keep the clip short — ideally under 10 seconds.' },
];

const WIDTH_OPTIONS = [
  { value: '640', label: '640px (Large)' },
  { value: '480', label: '480px (Medium — recommended)' },
  { value: '320', label: '320px (Small — good for social)' },
  { value: '240', label: '240px (Tiny)' },
];

function renderControls(file, options, setOptions, duration) {
  const fps = options.fps ?? 15;
  return (
    <>
      <p className="ltp-controls__title">GIF Settings</p>
      {duration && (
        <p className="ltp-ctrl-desc" style={{ marginBottom: '-0.25rem' }}>
          🎬 Video duration: <strong style={{ color: 'var(--text)' }}>{Math.round(duration)}s</strong> — keep clips under 10s for best GIF size
        </p>
      )}
      <div className="ltp-time-row">
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="gif-start">Start (seconds)</label>
          <input
            id="gif-start"
            type="number"
            min="0"
            max={duration ? Math.floor(duration - 1) : undefined}
            step="0.1"
            placeholder="e.g. 0"
            className="ltp-ctrl-input"
            value={options.start ?? ''}
            onChange={(e) => setOptions({ ...options, start: e.target.value })}
          />
        </div>
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="gif-end">End (seconds)</label>
          <input
            id="gif-end"
            type="number"
            min="0"
            max={duration ? Math.floor(duration) : undefined}
            step="0.1"
            placeholder={duration ? `max: ${Math.round(duration)}s` : 'e.g. 5'}
            className="ltp-ctrl-input"
            value={options.end ?? ''}
            onChange={(e) => setOptions({ ...options, end: e.target.value })}
          />
        </div>
      </div>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="gif-width">Output Width</label>
        <select
          id="gif-width"
          className="ltp-ctrl-select"
          value={options.width || '480'}
          onChange={(e) => setOptions({ ...options, width: e.target.value })}
        >
          {WIDTH_OPTIONS.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="gif-fps">
          Frame Rate — {fps} FPS
        </label>
        <div className="ltp-ctrl-slider-wrap">
          <input
            id="gif-fps"
            type="range"
            min="5"
            max="30"
            step="1"
            className="ltp-ctrl-slider"
            value={fps}
            onChange={(e) => setOptions({ ...options, fps: parseInt(e.target.value) })}
          />
          <span className="ltp-ctrl-slider-value">{fps} FPS</span>
        </div>
      </div>
      <p className="ltp-ctrl-desc">💡 Keep clips under 10 seconds for reasonable GIF file sizes.</p>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const paletteName = 'palette.png';
  const outName = 'output.gif';
  const fps   = options.fps ?? 15;
  const width = options.width || '480';
  const start = parseFloat(options.start) || 0;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const { ffmpeg, fetchFile } = await loadFFmpeg();

  // Write input once
  await ffmpeg.writeFile(inName, await fetchFile(new Blob([data])));

  const trimArgs = ['-ss', String(start)];
  if (options.end !== undefined && options.end !== '') {
    const duration = Math.max(0.1, parseFloat(options.end) - start);
    trimArgs.push('-t', String(duration));
  }

  // Pass 1: Generate palette
  onProgress(0.1);
  await ffmpeg.exec([
    ...trimArgs,
    '-i', inName,
    '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
    paletteName,
  ]);

  // Pass 2: Generate GIF using palette
  onProgress(0.3);
  const progressHandler = ({ progress }) => onProgress(0.3 + progress * 0.7);
  ffmpeg.on('progress', progressHandler);
  await ffmpeg.exec([
    ...trimArgs,
    '-i', inName,
    '-i', paletteName,
    '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    outName,
  ]);
  ffmpeg.off('progress', progressHandler);

  const result = await ffmpeg.readFile(outName);
  try { await ffmpeg.deleteFile(inName); } catch { /**/ }
  try { await ffmpeg.deleteFile(paletteName); } catch { /**/ }
  try { await ffmpeg.deleteFile(outName); } catch { /**/ }

  const base = file.name.split('.').slice(0, -1).join('.') || 'video';
  const out  = result instanceof Uint8Array ? result : new Uint8Array(result);
  return { data: out, filename: `${base}.gif`, mime: 'image/gif' };
}

export default function VideoToGif() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-to-gif']}
      icon="🎞️"
      title="Video to GIF Maker"
      subtitle="Convert any video clip to a high-quality animated GIF. Two-pass palette generation for stunning colors. 100% in-browser."
      accept="video/*"
      dropIcon="🎞️"
      dropLabel="Drop your video here"
      dropSublabel="MP4, WEBM, MKV, MOV — any format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
