import LocalToolPage from '../components/LocalToolPage.jsx';
import { runFFmpeg } from '../services/ffmpegLoader.js';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What does audio normalization do?', a: 'Normalization analyzes the audio and adjusts the overall volume to meet broadcast loudness standards (EBU R128 / -16 LUFS). This fixes tracks that are too quiet or inconsistently loud.' },
  { q: 'What loudness standard does this use?', a: 'We use EBU R128 standard: Integrated loudness (I) = -16 LUFS, True peak (TP) = -1.5 dBTP, and Loudness range (LRA) = 11 LU. This matches YouTube, Spotify, and broadcast standards.' },
  { q: 'Will normalization affect audio quality?', a: 'The loudnorm filter in ffmpeg is a high-quality two-pass algorithm. Audio quality is preserved — only the loudness level is adjusted. There is minimal artifact introduction.' },
  { q: 'What input formats are supported?', a: 'MP3, WAV, FLAC, OGG, AAC, M4A and any other format ffmpeg can decode. Output format matches your selection.' },
];

const FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3 — Most compatible' },
  { value: 'wav', label: 'WAV — Lossless' },
  { value: 'ogg', label: 'OGG — Open source' },
];

function renderControls(file, options, setOptions) {
  const fmt = options.format || 'mp3';
  const inExt = file.name.split('.').pop().toLowerCase();

  return (
    <>
      <p className="ltp-controls__title">Normalization Settings</p>

      <div style={{
        background: 'rgba(108, 99, 255, 0.1)',
        border: '1px solid rgba(108, 99, 255, 0.3)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        color: 'var(--text-muted)',
      }}>
        <strong style={{ color: 'var(--primary-light)' }}>📊 EBU R128 Standard</strong><br />
        Target: <strong>-16 LUFS</strong> · True Peak: <strong>-1.5 dBTP</strong> · LRA: <strong>11 LU</strong><br />
        Compatible with YouTube, Spotify, Apple Music &amp; broadcast standards.
      </div>

      <div className="ltp-ctrl-row">
        <label className="ltp-ctrl-label" htmlFor="norm-format">Output Format</label>
        <select
          id="norm-format"
          className="ltp-ctrl-select"
          value={fmt}
          onChange={(e) => setOptions({ ...options, format: e.target.value })}
        >
          {FORMAT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
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

  // loudnorm filter: EBU R128 standard normalization
  // I=-16: integrated loudness target, TP=-1.5: true peak limit, LRA=11: loudness range
  const args = [
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
  ];

  if (fmt === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', '320k');
  } else if (fmt === 'wav') {
    args.push('-codec:a', 'pcm_s16le');
  } else if (fmt === 'ogg') {
    args.push('-codec:a', 'libvorbis', '-q:a', '6');
  }

  onProgress(0.05);
  const result = await runFFmpeg(data, inName, outName, args, (p) => onProgress(0.05 + p * 0.95));

  const base    = file.name.split('.').slice(0, -1).join('.') || 'audio';
  const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' };
  return { data: result, filename: `${base}-normalized.${fmt}`, mime: mimeMap[fmt] || 'audio/mpeg' };
}

export default function AudioNormalizer() {
  return (
    <LocalToolPage
      seo={SEO_DATA['audio-normalizer']}
      icon="📊"
      title="Audio Normalizer"
      subtitle="Auto-level audio to broadcast standard loudness (EBU R128 / -16 LUFS). Fix quiet recordings and inconsistent volume. 100% in-browser."
      accept="audio/*,.flac"
      dropIcon="🎵"
      dropLabel="Drop your audio file here"
      dropSublabel="MP3, WAV, FLAC, OGG, M4A — any audio format"
      renderControls={renderControls}
      processFile={processFile}
      faqs={FAQS}
    />
  );
}
