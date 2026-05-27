import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'How do I set start and end times?', a: 'Enter times in seconds. For example: Start = 30, End = 90 will give you a 60-second clip from 0:30 to 1:30.' },
  { q: 'What format is the output?', a: 'The output is always MP3 for maximum compatibility. The bitrate is kept at 320kbps for best quality.' },
];

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
          🎵 Total duration: <strong style={{ color: 'var(--text)' }}>{fmtTime(duration)}</strong> ({Math.round(duration)}s)
        </p>
      )}
      <div className="ltp-time-row">
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="at-start">Start Time (seconds)</label>
          <input
            id="at-start"
            type="number"
            min="0"
            max={duration ? Math.floor(duration - 1) : undefined}
            step="0.1"
            placeholder="e.g. 30"
            className="ltp-ctrl-input"
            value={options.start ?? ''}
            onChange={(e) => setOptions({ ...options, start: e.target.value })}
          />
        </div>
        <div className="ltp-ctrl-row" style={{ marginBottom: 0 }}>
          <label className="ltp-ctrl-label" htmlFor="at-end">End Time (seconds)</label>
          <input
            id="at-end"
            type="number"
            min="0"
            max={duration ? Math.floor(duration) : undefined}
            step="0.1"
            placeholder={duration ? `max: ${Math.round(duration)}s` : 'e.g. 90'}
            className="ltp-ctrl-input"
            value={options.end ?? ''}
            onChange={(e) => setOptions({ ...options, end: e.target.value })}
          />
        </div>
      </div>
      <p className="ltp-ctrl-desc">
        💡 Leave End empty to trim to the end of the file.
      </p>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp3';
  const inName = `input.${inExt}`;
  const outName = 'output.mp3';

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const start = parseFloat(options.start) || 0;
  const args  = ['-ss', String(start)];

  if (options.end !== undefined && options.end !== '') {
    const duration = Math.max(0.1, parseFloat(options.end) - start);
    args.push('-t', String(duration));
  }

  args.push('-codec:a', 'libmp3lame', '-b:a', '320k');

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'audio';

  return { data: result, filename: `${base}_trimmed.mp3`, mime: 'audio/mpeg' };
}

export default function AudioTrimmer() {
  return (
    <LocalToolPage
      seo={SEO_DATA['audio-trimmer']}
      icon="✂️"
      title="Audio Trimmer"
      subtitle="Cut any audio file to the exact segment you want. Perfect for ringtones, clips, and podcast excerpts. 100% in-browser."
      accept="audio/*"
      dropIcon="🎵"
      dropLabel="Drop your audio file here"
      dropSublabel="MP3, WAV, FLAC, OGG, AAC, M4A..."
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
