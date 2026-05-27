import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'How much can I boost the volume?', a: 'You can boost up to 4× (400%). Beyond that, distortion (clipping) becomes very noticeable. We recommend 1.5×–2× for most use cases.' },
  { q: 'Will boosting cause distortion?', a: 'At high levels (3×–4×), quiet passages will be clear but loud parts may clip. Use 1.5×–2× for a natural boost without distortion.' },
];

const PRESETS = [
  { label: '1.5× (+50%)',  value: 1.5 },
  { label: '2× (+100%)',   value: 2 },
  { label: '2.5× (+150%)', value: 2.5 },
  { label: '3× (+200%)',   value: 3 },
  { label: '4× (+300%)',   value: 4 },
];

function renderControls(file, options, setOptions) {
  const vol = options.volume ?? 2;
  return (
    <>
      <p className="ltp-controls__title">Volume Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="vb-slider">
          Volume Boost — {vol}× {vol <= 1.5 ? '🟢 Subtle' : vol <= 2.5 ? '🟡 Moderate' : '🔴 High (may clip)'}
        </label>
        <div className="ltp-ctrl-slider-wrap">
          <input
            id="vb-slider"
            type="range"
            min="1"
            max="4"
            step="0.5"
            className="ltp-ctrl-slider"
            value={vol}
            onChange={(e) => setOptions({ ...options, volume: parseFloat(e.target.value) })}
          />
          <span className="ltp-ctrl-slider-value">{vol}×</span>
        </div>
      </div>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label">Quick Presets</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`btn btn-sm ${vol === p.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setOptions({ ...options, volume: p.value })}
              style={{ fontSize: '0.8rem' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {vol >= 3 && (
        <p className="ltp-ctrl-desc" style={{ color: 'var(--warning)' }}>
          ⚠️ At {vol}×, loud parts of the audio may clip. Consider using 2× for a clean boost.
        </p>
      )}
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp3';
  const inName = `input.${inExt}`;
  const outName = 'output.mp3';

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const vol  = options.volume ?? 2;
  const args = ['-af', `volume=${vol}`, '-codec:a', 'libmp3lame', '-b:a', '320k'];

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'audio';

  return { data: result, filename: `${base}_boosted.mp3`, mime: 'audio/mpeg' };
}

export default function VolumeBooster() {
  return (
    <LocalToolPage
      seo={SEO_DATA['volume-booster']}
      icon="🔊"
      title="Volume Booster"
      subtitle="Boost the volume of any audio file up to 4×. Perfect for quiet recordings, videos and podcasts. Runs 100% in your browser."
      accept="audio/*"
      dropIcon="🔊"
      dropLabel="Drop your audio file here"
      dropSublabel="MP3, WAV, FLAC, OGG, AAC, M4A..."
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
