import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'Which audio formats are supported as input?', a: 'Any common audio format: MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, WMA and more.' },
  { q: 'Can I convert FLAC to MP3 losslessly?', a: 'FLAC is lossless, MP3 is lossy — so converting FLAC → MP3 will apply lossy compression. Use 320kbps for the highest quality MP3.' },
];

const FORMAT_OPTIONS = [
  { value: 'mp3',  label: 'MP3 — Most compatible' },
  { value: 'wav',  label: 'WAV — Lossless, large file' },
  { value: 'ogg',  label: 'OGG — Open source' },
  { value: 'flac', label: 'FLAC — Lossless compressed' },
  { value: 'aac',  label: 'AAC — Smaller, high quality' },
  { value: 'm4a',  label: 'M4A — Apple format' },
];

const BITRATE_OPTIONS = ['320', '256', '192', '128', '96'];

function renderControls(file, options, setOptions) {
  const fmt = options.format || 'mp3';
  return (
    <>
      <p className="ltp-controls__title">Conversion Settings</p>
      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="ac-format">Output Format</label>
        <select
          id="ac-format"
          className="ltp-ctrl-select"
          value={fmt}
          onChange={(e) => setOptions({ ...options, format: e.target.value })}
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      {(fmt === 'mp3' || fmt === 'aac' || fmt === 'm4a') && (
        <div className="ltp-ctrl-row">
          <label className="ltp-ctrl-label" htmlFor="ac-bitrate">Bitrate</label>
          <select
            id="ac-bitrate"
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
  const inExt  = file.name.split('.').pop() || 'mp3';
  const inName = `input.${inExt}`;
  const fmt    = options.format || 'mp3';
  const outName = `output.${fmt}`;

  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);

  let args = [];
  if (fmt === 'mp3') {
    args = ['-codec:a', 'libmp3lame', '-b:a', `${options.bitrate || '320'}k`];
  } else if (fmt === 'wav') {
    args = ['-codec:a', 'pcm_s16le'];
  } else if (fmt === 'ogg') {
    args = ['-codec:a', 'libvorbis', '-q:a', '6'];
  } else if (fmt === 'flac') {
    args = ['-codec:a', 'flac'];
  } else if (fmt === 'aac' || fmt === 'm4a') {
    args = ['-codec:a', 'aac', '-b:a', `${options.bitrate || '256'}k`];
  }

  const result = await runFFmpeg(data, inName, outName, args, onProgress);
  const base   = file.name.split('.').slice(0, -1).join('.') || 'audio';
  const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4' };

  return { data: result, filename: `${base}.${fmt}`, mime: mimeMap[fmt] || 'audio/mpeg' };
}

export default function AudioConverter() {
  return (
    <LocalToolPage
      seo={SEO_DATA['audio-converter']}
      icon="🎶"
      title="Audio Converter"
      subtitle="Convert audio between MP3, WAV, FLAC, OGG, AAC and M4A. All processing happens locally — your audio stays private."
      accept="audio/*"
      dropIcon="🎵"
      dropLabel="Drop your audio file here"
      dropSublabel="MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, WMA..."
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
