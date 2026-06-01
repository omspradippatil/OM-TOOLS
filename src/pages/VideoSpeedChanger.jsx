import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What speed options are available?', a: '0.25× (extreme slow-mo), 0.5× (half speed), 0.75× (slightly slow), 1.5× (slightly fast), 2× (double), 3× (triple) and 4× (quadruple speed).' },
  { q: 'Will the audio pitch change?', a: 'No! We use ffmpeg\'s atempo filter which changes playback speed while preserving the original audio pitch. Speech and music remain natural.' },
  { q: 'Why does 4× speed take longer to process?', a: 'ffmpeg\'s atempo filter has a maximum of 2×, so for 4× speed we chain two atempo=2.0 filters, which requires two audio passes — hence slightly longer processing.' },
  { q: 'What video formats are supported?', a: 'Any format your browser can read: MP4, WEBM, MKV, AVI, MOV. The output will always be in MP4 format.' },
];

const SPEED_OPTIONS = [
  { value: '0.25', label: '0.25× — Extreme Slow-Mo' },
  { value: '0.5',  label: '0.5× — Half Speed' },
  { value: '0.75', label: '0.75× — Slightly Slow' },
  { value: '1.5',  label: '1.5× — Slightly Fast' },
  { value: '2',    label: '2× — Double Speed' },
  { value: '3',    label: '3× — Triple Speed' },
  { value: '4',    label: '4× — Quadruple Speed' },
];

function renderControls(file, options, setOptions) {
  const speed = options.speed || '2';
  return (
    <>
      <p className="ltp-controls__title">Speed Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="speed-select">Playback Speed</label>
        <select
          id="speed-select"
          className="ltp-ctrl-select"
          value={speed}
          onChange={(e) => setOptions({ ...options, speed: e.target.value })}
        >
          {SPEED_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
        Audio pitch is preserved automatically using ffmpeg's atempo filter.
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

  const speed  = parseFloat(options.speed || '2');
  const videoSpeed = (1 / speed).toFixed(6);

  // atempo must be between 0.5 and 2.0
  // For >2 or <0.5 we chain multiple filters
  let atempoFilters = [];
  let s = speed;
  if (s > 2) {
    while (s > 2) {
      atempoFilters.push('atempo=2.0');
      s /= 2;
    }
    if (s !== 1) atempoFilters.push(`atempo=${s.toFixed(6)}`);
  } else if (s < 0.5) {
    while (s < 0.5) {
      atempoFilters.push('atempo=0.5');
      s /= 0.5;
    }
    if (s !== 1) atempoFilters.push(`atempo=${s.toFixed(6)}`);
  } else {
    atempoFilters.push(`atempo=${speed.toFixed(6)}`);
  }

  const audioFilter = atempoFilters.join(',');
  const args = [
    '-vf', `setpts=${videoSpeed}*PTS`,
    '-af', audioFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-c:a', 'aac',
  ];

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';
  return { data: result, filename: `${base}-${speed}x.mp4`, mime: 'video/mp4' };
}

export default function VideoSpeedChanger() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-speed-changer']}
      icon="⏩"
      title="Video Speed Changer"
      subtitle="Speed up or slow down any video from 0.25× to 4×. Audio pitch is preserved automatically. 100% in-browser."
      accept="video/*"
      dropIcon="⏩"
      dropLabel="Drop your video here"
      dropSublabel="MP4, MKV, WEBM, AVI, MOV — any video format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
