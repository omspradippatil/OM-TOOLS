import ImageToolPage, { canvasToBlob } from '../components/ImageToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What formats can I convert between?', a: 'Input: JPG, PNG, WebP, GIF, BMP, AVIF (and anything your browser supports). Output: JPG, PNG, WebP, and AVIF (Chrome 85+/Edge). The tool checks your browser\'s capabilities and shows only supported output formats.' },
  { q: 'Why is WebP so much smaller than JPG?', a: 'WebP uses a more modern compression algorithm (VP8/VP8L) that achieves 25–34% smaller file sizes compared to JPEG at the same visual quality. It\'s the recommended format for web use.' },
  { q: 'What happens to transparent areas when I convert PNG to JPG?', a: 'JPG does not support transparency. Transparent areas will be filled with white. To keep transparency, convert to PNG or WebP.' },
  { q: 'Does converting from JPG to PNG improve quality?', a: 'No. Converting from a lossy format (JPG) to a lossless one (PNG) does not recover lost quality — it just stores the already-compressed pixels losslessly. Quality can only be preserved if you keep the original file.' },
  { q: 'What is AVIF?', a: 'AVIF is the newest image format (based on AV1 codec) with ~50% better compression than JPEG at equivalent quality. It is supported in Chrome 85+, Edge 85+, Firefox 93+, and Safari 16+. We check browser support before offering it as an option.' },
];

function renderControls(file, imgEl, options, setOptions) {
  const fmt     = options.format || 'webp';
  const quality = options.quality ?? 90;

  // Detect AVIF support
  const avifSupported = (() => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').startsWith('data:image/avif');
  })();

  const fmts = [
    { id: 'jpg',  label: 'JPG',  desc: 'Universal compatibility, lossy' },
    { id: 'png',  label: 'PNG',  desc: 'Lossless, supports transparency' },
    { id: 'webp', label: 'WebP', desc: 'Smaller than JPG, great quality' },
    ...(avifSupported ? [{ id: 'avif', label: 'AVIF', desc: 'Newest format, smallest size' }] : []),
  ];

  const isLossless = fmt === 'png';

  const handleSlider = (e) => {
    const val = Number(e.target.value);
    e.target.style.setProperty('--pct', `${val}%`);
    setOptions({ ...options, quality: val });
  };

  return (
    <>
      <p className="itp-controls__title">Conversion Settings</p>

      {/* Output format */}
      <div className="itp-ctrl-row">
        <label className="itp-ctrl-label">Convert To</label>
        <div className="itp-fmt-pills">
          {fmts.map(f => (
            <button
              key={f.id}
              className={`itp-fmt-pill${fmt === f.id ? ' itp-fmt-pill--active' : ''}`}
              onClick={() => setOptions({ ...options, format: f.id })}
              title={f.desc}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality (not for PNG) */}
      <div className="itp-ctrl-row">
        <label className="itp-ctrl-label" htmlFor="conv-quality">
          Quality
          {isLossless && <span style={{ color: 'var(--text-subtle)', fontWeight: 400, marginLeft: '0.4rem' }}>(lossless)</span>}
        </label>
        <div className="itp-slider-wrap">
          <input
            id="conv-quality"
            type="range"
            className="itp-slider"
            min={1} max={100}
            value={isLossless ? 100 : quality}
            disabled={isLossless}
            onInput={handleSlider}
            onChange={handleSlider}
            style={{ '--pct': `${isLossless ? 100 : quality}%`, opacity: isLossless ? 0.4 : 1 }}
          />
          <span className="itp-slider-val">{isLossless ? 'N/A' : quality}</span>
        </div>
      </div>

      {fmt === 'jpg' && (
        <p style={{ fontSize: '0.79rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
          ⚠️ JPG does not support transparency. Transparent areas will be filled with white.
        </p>
      )}

      {fmt === 'avif' && (
        <p style={{ fontSize: '0.79rem', color: 'var(--img-primary-light)', lineHeight: 1.5 }}>
          🚀 AVIF: Up to 50% smaller than JPEG at equivalent quality. Supported in Chrome 85+, Edge, Firefox 93+.
        </p>
      )}

      {fmt === 'webp' && (
        <p style={{ fontSize: '0.79rem', color: 'var(--img-primary-light)', lineHeight: 1.5 }}>
          ✅ WebP: 25–35% smaller than JPEG with similar quality. Supported in all modern browsers.
        </p>
      )}
    </>
  );
}

async function processImage(imgEl, file, options, onProgress) {
  const fmt     = options.format || 'webp';
  const quality = (options.quality ?? 90) / 100;

  const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
  const extMap  = { jpg: 'jpg', png: 'png', webp: 'webp', avif: 'avif' };
  const mime    = mimeMap[fmt] || 'image/webp';
  const ext     = extMap[fmt] || 'webp';

  onProgress(0.1);

  const canvas = document.createElement('canvas');
  canvas.width  = imgEl.naturalWidth;
  canvas.height = imgEl.naturalHeight;
  const ctx = canvas.getContext('2d');

  // White background for JPG
  if (fmt === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(imgEl, 0, 0);
  onProgress(0.5);

  const blob = await canvasToBlob(canvas, mime, fmt === 'png' ? undefined : quality);
  onProgress(1);

  const base = file.name.split('.').slice(0, -1).join('.') || 'image';
  return { blob, filename: `${base}.${ext}`, mime };
}

export default function ImageConverter() {
  const seo = SEO_DATA['image-converter'] || {
    title: 'Free Image Converter Online — Convert JPG PNG WebP AVIF | OM Tools',
    description: 'Convert images between JPG, PNG, WebP, and AVIF formats. Quality control, transparent background support. 100% free, no upload.',
  };

  return (
    <ImageToolPage
      seo={seo}
      icon="🔄"
      title="Image Converter"
      subtitle="Convert images between JPG, PNG, WebP, and AVIF. See the quality and size difference instantly. 100% in your browser — no upload."
      accept="image/*"
      dropLabel="Drop your image to convert"
      dropSublabel="JPG, PNG, WebP, GIF, BMP, AVIF — any format"
      renderControls={renderControls}
      processImage={processImage}
      faqs={FAQS}
      showBeforeAfter={false}
    />
  );
}
