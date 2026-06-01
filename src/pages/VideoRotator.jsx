import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What rotation options are available?', a: 'Rotate 90° clockwise, 90° counter-clockwise, 180° flip. Plus horizontal flip (mirror) and vertical flip for fixing upside-down or mirrored videos.' },
  { q: 'Will this reduce video quality?', a: 'Minimal quality loss. We use libx264 with CRF 18 (near-lossless) — the quality difference from the original is imperceptible.' },
  { q: 'Why do I need this instead of just rotating on my phone?', a: 'Many videos have incorrect rotation metadata but the actual pixels are fine. This tool actually re-encodes the pixels correctly, ensuring the rotation is baked in permanently.' },
  { q: 'What formats are supported?', a: 'Any format your browser can read: MP4, WEBM, MKV, AVI, MOV. Output is always MP4.' },
];

const ROTATION_OPTIONS = [
  { value: 'cw90',   label: '↻ Rotate 90° Clockwise',         filter: 'transpose=1' },
  { value: 'ccw90',  label: '↺ Rotate 90° Counter-Clockwise', filter: 'transpose=2' },
  { value: '180',    label: '↔ Rotate 180°',                   filter: 'transpose=1,transpose=1' },
  { value: 'hflip',  label: '⟺ Flip Horizontal (Mirror)',     filter: 'hflip' },
  { value: 'vflip',  label: '⟷ Flip Vertical (Upside-down)',  filter: 'vflip' },
];

function renderControls(file, options, setOptions) {
  const rotation = options.rotation || 'cw90';
  return (
    <>
      <p className="ltp-controls__title">Rotation Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="rotation-select">Transform</label>
        <select
          id="rotation-select"
          className="ltp-ctrl-select"
          value={rotation}
          onChange={(e) => setOptions({ ...options, rotation: e.target.value })}
        >
          {ROTATION_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
        The rotation is permanently baked into the video. No metadata tricks — works everywhere.
      </p>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const outName = 'output.mp4';

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const selectedOpt = ROTATION_OPTIONS.find(r => r.value === (options.rotation || 'cw90'));
  const filter = selectedOpt?.filter || 'transpose=1';

  const args = [
    '-vf', filter,
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'ultrafast',
    '-c:a', 'copy',
  ];

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';
  const suffix = options.rotation || 'cw90';
  return { data: result, filename: `${base}-${suffix}.mp4`, mime: 'video/mp4' };
}

export default function VideoRotator() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-rotator']}
      icon="🔃"
      title="Video Rotator & Flipper"
      subtitle="Rotate videos 90°, 180°, 270° or flip horizontally/vertically. Fix incorrectly oriented recordings permanently."
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
