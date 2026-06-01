import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'How do I set the timestamp?', a: 'Enter the time in seconds (e.g. 30 for 0:30) or in HH:MM:SS format (e.g. 1:23 for 1 minute 23 seconds). The preview player above shows the current timestamp.' },
  { q: 'What image formats can I get?', a: 'JPG (smaller file, great for web/sharing) or PNG (lossless quality, larger file, best for editing).' },
  { q: 'Is the quality high?', a: 'Yes! We use ffmpeg with the highest quality JPEG setting (q:v 2) or lossless PNG. The output matches your video\'s original resolution.' },
  { q: 'What videos are supported?', a: 'Any format your browser can play: MP4, WEBM, MKV, AVI, MOV, and more.' },
];

function renderControls(file, options, setOptions, duration) {
  const fmt  = options.format || 'jpg';
  const time = options.time ?? 0;

  return (
    <>
      <p className="ltp-controls__title">Frame Settings</p>

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="frame-time">Timestamp (seconds)</label>
        <input
          id="frame-time"
          type="number"
          className="ltp-ctrl-select"
          min="0"
          max={duration ? Math.floor(duration) : undefined}
          step="0.1"
          value={time}
          onChange={(e) => setOptions({ ...options, time: parseFloat(e.target.value) || 0 })}
          placeholder="e.g. 30"
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      {duration && (
        <div className="ltp-ctrl-row">
          <label className="ltp-ctrl-label" htmlFor="frame-slider">Scrub Timeline</label>
          <input
            id="frame-slider"
            type="range"
            min="0"
            max={Math.floor(duration)}
            step="0.1"
            value={time}
            onChange={(e) => setOptions({ ...options, time: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      )}

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="frame-format">Output Format</label>
        <select
          id="frame-format"
          className="ltp-ctrl-select"
          value={fmt}
          onChange={(e) => setOptions({ ...options, format: e.target.value })}
        >
          <option value="jpg">JPG — Smaller file, great for sharing</option>
          <option value="png">PNG — Lossless, best quality</option>
        </select>
      </div>
    </>
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const fmt    = options.format || 'jpg';
  const outName = `output.${fmt}`;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const timeStr = String(options.time ?? 0);

  const args = [
    '-ss', timeStr,
    '-frames:v', '1',
  ];

  if (fmt === 'jpg') {
    args.push('-q:v', '2'); // highest JPEG quality
  }

  onProgress(0.1);
  const result = await runFFmpeg(data, inName, outName, args, (p) => onProgress(0.1 + p * 0.9));

  const base = file.name.split('.').slice(0, -1).join('.') || 'frame';
  const mimeMap = { jpg: 'image/jpeg', png: 'image/png' };
  return { data: result, filename: `${base}-frame-${timeStr}s.${fmt}`, mime: mimeMap[fmt] };
}

export default function VideoFrameExtractor() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-frame-extractor']}
      icon="🖼️"
      title="Video Frame Extractor"
      subtitle="Extract any single frame from a video as a high-quality JPG or PNG image. Set the exact timestamp you want."
      accept="video/*"
      dropIcon="🎬"
      dropLabel="Drop your video here"
      dropSublabel="MP4, MKV, WEBM, AVI, MOV — any video format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
