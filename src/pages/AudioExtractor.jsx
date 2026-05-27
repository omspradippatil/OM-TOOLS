import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What audio formats can I extract to?', a: 'MP3 (most compatible), WAV (lossless, large files), AAC (smaller than MP3, great quality), OGG (open source format).' },
  { q: 'What bitrate should I choose for MP3?', a: '320kbps = highest quality, best for music. 192kbps = great quality, smaller size. 128kbps = good for voice recordings and podcasts.' },
];

const FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3 — Most compatible' },
  { value: 'wav', label: 'WAV — Lossless, large file' },
  { value: 'aac', label: 'AAC — Smaller, high quality' },
  { value: 'ogg', label: 'OGG — Open source' },
];

const BITRATE_OPTIONS = ['320', '256', '192', '128', '96'];

function renderControls(file, options, setOptions) {
  const fmt = options.format || 'mp3';
  return (
    <>
      <p className="ltp-controls__title">Audio Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="ae-format">Output Format</label>
        <select
          id="ae-format"
          className="ltp-ctrl-select"
          value={fmt}
          onChange={(e) => setOptions({ ...options, format: e.target.value })}
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      {(fmt === 'mp3' || fmt === 'aac') && (
        <div className="ltp-ctrl-row">
          <label className="ltp-ctrl-label" htmlFor="ae-bitrate">Bitrate</label>
          <select
            id="ae-bitrate"
            className="ltp-ctrl-select"
            value={options.bitrate || '320'}
            onChange={(e) => setOptions({ ...options, bitrate: e.target.value })}
          >
            {BITRATE_OPTIONS.map((b) => (
              <option key={b} value={b}>{b} kbps</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

async function processFile(file, options, onProgress) {
  const inExt  = file.name.split('.').pop() || 'mp4';
  const inName = `input.${inExt}`;
  const fmt    = options.format || 'mp3';
  const outName = `output.${fmt}`;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  const args = ['-vn']; // strip video
  if (fmt === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', `${options.bitrate || '320'}k`);
  } else if (fmt === 'aac') {
    args.push('-codec:a', 'aac', '-b:a', `${options.bitrate || '256'}k`);
  } else if (fmt === 'wav') {
    args.push('-codec:a', 'pcm_s16le');
  } else if (fmt === 'ogg') {
    args.push('-codec:a', 'libvorbis', '-q:a', '6');
  }

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'video';
  const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', ogg: 'audio/ogg' };

  return { data: result, filename: `${base}.${fmt}`, mime: mimeMap[fmt] || 'audio/mpeg' };
}

export default function AudioExtractor() {
  return (
    <LocalToolPage
      seo={SEO_DATA['audio-extractor']}
      icon="🎵"
      title="Audio Extractor"
      subtitle="Extract audio from any video file and save as MP3, WAV, AAC or OGG. Fast, private, no upload required."
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
