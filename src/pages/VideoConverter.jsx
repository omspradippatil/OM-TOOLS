import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FORMAT_OPTIONS = [
  { value: 'mp4',  label: 'MP4 — Best compatibility' },
  { value: 'webm', label: 'WEBM — Web-optimized' },
  { value: 'mkv',  label: 'MKV — High quality container' },
  { value: 'avi',  label: 'AVI — Classic format' },
  { value: 'mov',  label: 'MOV — Apple QuickTime' },
];

const FAQS = [
  { q: 'Which formats are supported?', a: 'You can convert between MP4, WEBM, MKV, AVI, MOV and many more. The input can be any common video format.' },
  { q: 'Will converting change the quality?', a: 'Re-encoding has a tiny quality cost. For lossless transfer, choose a container format (MKV) with the same codec using passthrough (coming soon). For most use cases, quality loss is imperceptible.' },
  { q: 'Why is it slow on my phone?', a: 'ffmpeg.wasm runs pure WebAssembly — it uses 1 CPU core. A 100 MB video may take 2–5 minutes on mobile. Desktop is much faster.' },
];

function renderControls(file, options, setOptions) {
  return (
    <>
      <p className="ltp-controls__title">Conversion Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="vc-format">Output Format</label>
        <select
          id="vc-format"
          className="ltp-ctrl-select"
          value={options.format || 'mp4'}
          onChange={(e) => setOptions({ ...options, format: e.target.value })}
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}

async function processFile(file, options, onProgress) {
  const ext    = options.format || 'mp4';
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const outName = `output.${ext}`;

  const buf = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  let args = [];
  const fromExt = inExt.toLowerCase();
  const toExt = ext.toLowerCase();

  if (fromExt === toExt) {
    // Same format, just copy streams
    args = ['-c', 'copy'];
  } else {
    // Different formats, re-encode to ensure container compatibility
    if (['mp4', 'mkv', 'mov'].includes(toExt)) {
      args = ['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k'];
    } else if (toExt === 'webm') {
      args = ['-c:v', 'libvpx', '-c:a', 'libvorbis', '-b:a', '128k'];
    } else if (toExt === 'avi') {
      args = ['-c:v', 'mpeg4', '-c:a', 'libmp3lame', '-b:a', '128k'];
    } else {
      args = ['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac'];
    }
  }

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const baseName = file.name.split('.').slice(0, -1).join('.') || 'video';
  const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime' };

  return { data: result, filename: `${baseName}.${ext}`, mime: mimeMap[ext] || 'video/mp4' };
}

export default function VideoConverter() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-converter']}
      icon="🔄"
      title="Video Converter"
      subtitle="Convert any video to MP4, WEBM, MKV, AVI or MOV — instantly in your browser. No upload, 100% private."
      accept="video/*"
      acceptLabel="Video files"
      dropIcon="🎬"
      dropLabel="Drop your video here"
      dropSublabel="MP4, MKV, WEBM, AVI, MOV — any video format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
