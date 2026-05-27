import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What does CRF mean?', a: 'CRF (Constant Rate Factor) controls quality. A lower value = better quality but larger file. Higher value = smaller file but worse quality. CRF 28 is a good balance for WhatsApp sharing.' },
  { q: 'What resolution should I pick?', a: 'For WhatsApp sharing, 720p or 480p works great. For Instagram, 1080p is recommended. For maximum compression, 480p or 360p.' },
];

const RESOLUTION_OPTIONS = [
  { value: 'original', label: 'Original (keep resolution)' },
  { value: '1080',     label: '1080p (1920×1080)' },
  { value: '720',      label: '720p (1280×720)' },
  { value: '480',      label: '480p (854×480)' },
  { value: '360',      label: '360p (640×360)' },
];

function renderControls(file, options, setOptions) {
  const crf = options.crf ?? 28;
  return (
    <>
      <p className="ltp-controls__title">Compression Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="vc-res">Resolution</label>
        <select
          id="vc-res"
          className="ltp-ctrl-select"
          value={options.resolution || 'original'}
          onChange={(e) => setOptions({ ...options, resolution: e.target.value })}
        >
          {RESOLUTION_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="vc-crf">
          Quality (CRF {crf}) — {crf <= 24 ? '🟢 High' : crf <= 30 ? '🟡 Balanced' : '🔴 Small file'}
        </label>
        <div className="ltp-ctrl-slider-wrap">
          <input
            id="vc-crf"
            type="range"
            min="18"
            max="40"
            step="1"
            className="ltp-ctrl-slider"
            value={crf}
            onChange={(e) => setOptions({ ...options, crf: parseInt(e.target.value) })}
          />
          <span className="ltp-ctrl-slider-value">CRF {crf}</span>
        </div>
      </div>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const outName = 'output.mp4';

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const crf = options.crf ?? 28;
  const args = ['-c:v', 'libx264', '-crf', String(crf), '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k'];

  if (options.resolution && options.resolution !== 'original') {
    args.push('-vf', `scale=-2:${options.resolution}`);
  }

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';

  return { data: result, filename: `${base}_compressed.mp4`, mime: 'video/mp4' };
}

export default function VideoCompressor() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-compressor']}
      icon="🗜️"
      title="Video Compressor"
      subtitle="Shrink video file size for WhatsApp, Discord, and Instagram. Choose quality and resolution — processed privately on your device."
      accept="video/*"
      dropIcon="🗜️"
      dropLabel="Drop your video here"
      dropSublabel="MP4, MKV, WEBM, MOV — any format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
