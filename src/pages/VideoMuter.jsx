import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What does "muting" a video do?', a: 'It removes the audio track from the video file entirely. The video plays silently. The process is instant using stream copy — no re-encoding needed.' },
  { q: 'Will the video quality change?', a: 'No. We use -c copy (stream copy) which copies the video data without any re-encoding. Quality is 100% preserved.' },
];

async function processFile(file, _options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const outName = 'output.mp4';

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  onProgress(0.1);
  const result = await runFFmpeg(
    data, inName, outName,
    ['-c:v', 'copy', '-an'], // -an = remove audio
    (p) => onProgress(0.1 + p * 0.9)
  );

  const base = file.name.split('.').slice(0, -1).join('.') || 'video';
  return { data: result, filename: `${base}_muted.mp4`, mime: 'video/mp4' };
}

export default function VideoMuter() {
  return (
    <LocalToolPage
      seo={SEO_DATA['video-muter']}
      icon="🔇"
      title="Video Muter"
      subtitle="Remove audio from any video instantly. Stream copy means no re-encoding — lightning fast and lossless. 100% in-browser."
      accept="video/*"
      dropIcon="🔇"
      dropLabel="Drop your video here"
      dropSublabel="MP4, WEBM, MKV, MOV — any format"
      renderControls={null}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
