import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What is a ringtone fade effect?', a: 'A fade-in slowly increases volume from silence at the start of your clip. A fade-out gradually decreases volume to silence at the end. This makes transitions sound smooth and professional.' },
  { q: 'How do I make an iPhone ringtone (M4R)?', a: 'Select "M4A (iPhone Ringtone)" as the output format. Then rename the downloaded file from .m4a to .m4r and transfer it to your iPhone via iTunes or Finder. iPhones require ringtones to be under 30 seconds.' },
  { q: 'What is the maximum ringtone length?', a: 'For iPhone ringtones, Apple requires them to be 30 seconds or less. For Android, you can use any length MP3 file.' },
  { q: 'Can I use any audio format as input?', a: 'Yes — MP3, WAV, FLAC, OGG, M4A and other formats are all supported as input.' },
];

const FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3 — Most compatible (Android, PC)' },
  { value: 'm4a', label: 'M4A — iPhone Ringtone (rename to .m4r)' },
];

const FADE_OPTIONS = [
  { value: '0',   label: 'No fade' },
  { value: '0.5', label: '0.5s fade in/out' },
  { value: '1',   label: '1s fade in/out' },
  { value: '2',   label: '2s fade in/out' },
];

function renderControls(file, options, setOptions, duration) {
  const fmt   = options.format || 'mp3';
  const start = parseFloat(options.start ?? 0);
  const end   = parseFloat(options.end ?? (duration ? Math.min(30, duration) : 30));
  const fade  = options.fade || '1';

  const safeEnd = duration ? Math.min(end, duration) : end;
  const safeStart = Math.max(0, start);

  return (
    <>
      <p className="ltp-controls__title">Ringtone Settings</p>

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="rt-start">Start (seconds)</label>
        <input
          id="rt-start"
          type="number"
          className="ltp-ctrl-select"
          min="0"
          max={duration ? Math.floor(duration - 0.5) : undefined}
          step="0.1"
          value={safeStart}
          onChange={(e) => setOptions({ ...options, start: parseFloat(e.target.value) || 0 })}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="rt-end">End (seconds)</label>
        <input
          id="rt-end"
          type="number"
          className="ltp-ctrl-select"
          min="0.5"
          max={duration ? Math.floor(duration) : undefined}
          step="0.1"
          value={safeEnd}
          onChange={(e) => setOptions({ ...options, end: parseFloat(e.target.value) || 30 })}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      {duration && (
        <p style={{ color: 'var(--primary-light)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          Duration: {Math.max(0, (safeEnd - safeStart)).toFixed(1)}s
          {(safeEnd - safeStart) > 30 && <strong style={{ color: 'var(--accent)' }}> ⚠ Over 30s — not suitable for iPhone ringtones</strong>}
        </p>
      )}

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="rt-fade">Fade Duration</label>
        <select id="rt-fade" className="ltp-ctrl-select" value={fade} onChange={(e) => setOptions({ ...options, fade: e.target.value })}>
          {FADE_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="rt-format">Output Format</label>
        <select id="rt-format" className="ltp-ctrl-select" value={fmt} onChange={(e) => setOptions({ ...options, format: e.target.value })}>
          {FORMAT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {fmt === 'm4a' && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
          💡 <strong>iPhone tip:</strong> After download, rename the file from <code>.m4a</code> to <code>.m4r</code> and add it to iTunes/Finder to use as a ringtone.
        </p>
      )}
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp3';
  const inName = `input.${inExt}`;
  const fmt    = options.format || 'mp3';
  const outName = `output.${fmt}`;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const start    = parseFloat(options.start ?? 0);
  const end      = parseFloat(options.end ?? 30);
  const fadeDur  = parseFloat(options.fade || '1');
  const duration = Math.max(0.1, end - start);

  // Build audio filter chain
  const filters = [];
  if (fadeDur > 0) {
    const fadeOutStart = Math.max(0, duration - fadeDur);
    filters.push(`afade=t=in:st=0:d=${fadeDur}`);
    filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeDur}`);
  }

  const args = [
    '-ss', String(start),
    '-to', String(end),
  ];

  if (fmt === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', '320k');
  } else if (fmt === 'm4a') {
    args.push('-codec:a', 'aac', '-b:a', '256k');
  }

  if (filters.length > 0) {
    args.push('-af', filters.join(','));
  }

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'audio';
  const mimeMap = { mp3: 'audio/mpeg', m4a: 'audio/mp4' };
  return { data: result, filename: `${base}-ringtone.${fmt}`, mime: mimeMap[fmt] || 'audio/mpeg' };
}

export default function RingtoneMaker() {
  return (
    <LocalToolPage
      seo={SEO_DATA['ringtone-maker']}
      icon="🔔"
      title="Ringtone Maker"
      subtitle="Trim any audio file and add smooth fade in/out effects. Export as MP3 or M4A (iPhone ringtone). 100% in-browser."
      accept="audio/*,.flac"
      dropIcon="🎵"
      dropLabel="Drop your audio here"
      dropSublabel="MP3, WAV, FLAC, OGG, M4A — any audio format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
