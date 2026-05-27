import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'How do I set start and end times?', a: 'Enter time in seconds. For example, to trim from 30s to 90s, set Start to 30 and End to 90.' },
  { q: 'Does trimming re-encode the video?', a: 'We use -c copy (stream copy) by default which is instant and lossless. For some formats, re-encoding may be needed for frame-accurate cuts.' },
];

function timeToSeconds(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function fmtTime(s) {
  if (!s || !isFinite(s)) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function renderControls(file, options, setOptions, duration) {
  return (
    <>
      <p className="ltp-controls__title">Trim Settings</p>
      {duration && (
        <p className="ltp-ctrl-desc" style={{ marginBottom: '-0.25rem' }}>
          🎬 Total duration: <strong style={{ color: 'var(--text)' }}>{fmtTime(duration)}</strong> ({Math.round(duration)}s)
        </p>
      )}
      <div className="ltp-time-row">
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="vt-start">Start Time (seconds)</label>
          <input
            id="vt-start"
            type="number"
            min="0"
            max={duration ? Math.floor(duration - 1) : undefined}
            step="0.1"
            placeholder="e.g. 10"
            className="ltp-ctrl-input"
            value={options.start ?? ''}
            onChange={(e) => setOptions({ ...options, start: e.target.value })}
          />
        </div>
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="vt-end">End Time (seconds)</label>
          <input
            id="vt-end"
            type="number"
            min="0"
            max={duration ? Math.floor(duration) : undefined}
            step="0.1"
            placeholder={duration ? `max: ${Math.round(duration)}s` : 'e.g. 60'}
            className="ltp-ctrl-input"
            value={options.end ?? ''}
            onChange={(e) => setOptions({ ...options, end: e.target.value })}
          />
        </div>
      </div>
      <p className="ltp-ctrl-desc">
        💡 Leave End empty to trim to the end of the video.
      </p>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const outName = `output.${inExt}`;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const start = timeToSeconds(options.start);
  const args  = ['-ss', String(start)];

  if (options.end !== undefined && options.end !== '') {
    const end = timeToSeconds(options.end);
    const duration = Math.max(0.1, end - start);
    args.push('-t', String(duration));
  }

  args.push('-c', 'copy');

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';
  const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime' };

  return { data: result, filename: `${base}_trimmed.${inExt}`, mime: mimeMap[inExt.toLowerCase()] || 'video/mp4' };
}

export default function VideoTrimmer() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-trimmer']}
      icon="✂️"
      title="Video Trimmer"
      subtitle="Cut any video to the exact segment you want. Runs entirely in your browser — no upload, no waiting."
      accept="video/*"
      dropIcon="✂️"
      dropLabel="Drop your video here"
      dropSublabel="MP4, MKV, WEBM, MOV — any format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
