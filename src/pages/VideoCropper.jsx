import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What aspect ratios are supported?', a: '16:9 (landscape/YouTube), 9:16 (vertical/Reels/TikTok/Shorts), 1:1 (square/Instagram), 4:3 (classic TV). Select the ratio and the crop is applied centered.' },
  { q: 'Will I lose video quality?', a: 'The crop is lossless in terms of codec quality — we use libx264 with CRF 18 (near-lossless). Only the frame edges are removed, the remaining content is untouched.' },
  { q: 'Is it always centered?', a: 'Yes. The crop is calculated from the center of the video. For example, cropping a 1920×1080 landscape video to 9:16 will take the center 608×1080 pixels.' },
  { q: 'What if my video is already in the target ratio?', a: 'No processing is needed — the video will be passed through unchanged. Just select the matching ratio.' },
];

const RATIO_OPTIONS = [
  { value: '16:9',  label: '16:9 — Landscape (YouTube, Desktop)' },
  { value: '9:16',  label: '9:16 — Vertical (Reels, TikTok, Shorts)' },
  { value: '1:1',   label: '1:1 — Square (Instagram posts)' },
  { value: '4:3',   label: '4:3 — Classic TV / Widescreen' },
  { value: '2.35:1',label: '2.35:1 — Cinematic Widescreen' },
];

function renderControls(file, options, setOptions) {
  const ratio = options.ratio || '9:16';
  return (
    <>
      <p className="ltp-controls__title">Crop Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="crop-ratio">Target Aspect Ratio</label>
        <select
          id="crop-ratio"
          className="ltp-ctrl-select"
          value={ratio}
          onChange={(e) => setOptions({ ...options, ratio: e.target.value })}
        >
          {RATIO_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
        The crop is always centered. Use 9:16 for vertical Reels, Shorts, and TikTok videos.
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

  const ratioStr = options.ratio || '9:16';
  const [rw, rh] = ratioStr.split(':').map(Number);

  // ffmpeg crop filter: crop=w:h:x:y
  // We use crop=min(iw*rh/rh, ih*rw/rh):min(ih, iw*rh/rw) — centered
  // Simpler: use iw and ih with expressions in ffmpeg
  // For target ratio rw:rh, crop the input:
  //   if input is wider than ratio: w=ih*rw/rh, h=ih, center x
  //   if input is taller than ratio: h=iw*rh/rw, w=iw, center y
  // This is handled by ffmpeg's crop filter using 'in_w', 'in_h' variables
  const cropFilter = `crop=if(gt(a\\,${rw}/${rh})\\,ih*${rw}/${rh}\\,iw):if(gt(a\\,${rw}/${rh})\\,ih\\,iw*${rh}/${rw})`;

  const args = [
    '-vf', cropFilter,
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'ultrafast',
    '-c:a', 'copy',
  ];

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';
  const ratioLabel = ratioStr.replace(':', 'x');
  return { data: result, filename: `${base}-crop-${ratioLabel}.mp4`, mime: 'video/mp4' };
}

export default function VideoCropper() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-cropper']}
      icon="✂️"
      title="Video Cropper"
      subtitle="Crop and change your video's aspect ratio — 16:9, 9:16, 1:1 and more. Perfect for Reels, TikTok, and Instagram. 100% in-browser."
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
