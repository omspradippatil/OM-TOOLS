import ImageToolPage, { canvasToBlob } from '../components/ImageToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

// ── FAQs ──
const FAQS = [
  {
    q: 'What is the difference between JPG and WebP compression?',
    a: 'JPG compression works by reducing color data in areas where the eye is less sensitive. WebP is a newer format (by Google) that achieves 25–35% smaller file sizes at the same visual quality. We recommend WebP for web use and JPG for maximum compatibility.',
  },
  {
    q: 'Will the image dimensions change?',
    a: 'No. The Image Compressor only reduces file size (quality), not dimensions. If you want to resize, use our Image Resizer tool.',
  },
  {
    q: 'What quality setting should I use?',
    a: '80–85 is the sweet spot — most people cannot tell the difference visually, but file size drops 50–70%. For thumbnails or web previews, 60–70 is fine. For print, use 90–95.',
  },
  {
    q: 'Why does PNG not have a quality slider?',
    a: 'PNG is a lossless format — it cannot be compressed with quality degradation. To reduce PNG file size, convert it to WebP (which uses lossless or lossy compression). Use our Image Converter for that.',
  },
  {
    q: 'Is my image safe? Does it get uploaded anywhere?',
    a: 'Completely safe. The browser\'s built-in Canvas API handles everything — your image never leaves your device. No upload, no server, no logs.',
  },
];

// ── Controls ──
function renderControls(file, imgEl, options, setOptions) {
  const quality = options.quality ?? 82;
  const fmt = options.format || 'jpg';
  const isPNG = fmt === 'png';

  const handleSlider = (e) => {
    const val = Number(e.target.value);
    const pct = `${val}%`;
    e.target.style.setProperty('--pct', pct);
    setOptions({ ...options, quality: val });
  };

  const fmts = [
    { id: 'jpg',  label: 'JPG',  desc: 'Max compatibility' },
    { id: 'webp', label: 'WebP', desc: 'Smallest size' },
    { id: 'png',  label: 'PNG',  desc: 'Lossless' },
  ];

  return (
    <>
      <p className="itp-controls__title">Compression Settings</p>

      {/* Format selector */}
      <div className="itp-ctrl-row">
        <label className="itp-ctrl-label">Output Format</label>
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

      {/* Quality slider (disabled for PNG) */}
      <div className="itp-ctrl-row">
        <label className="itp-ctrl-label" htmlFor="compress-quality">
          Quality
          {isPNG && <span style={{ color: 'var(--text-subtle)', fontWeight: 400, marginLeft: '0.4rem' }}>(lossless)</span>}
        </label>
        <div className="itp-slider-wrap">
          <input
            id="compress-quality"
            type="range"
            className="itp-slider"
            min={1} max={100}
            value={isPNG ? 100 : quality}
            disabled={isPNG}
            onInput={handleSlider}
            onChange={handleSlider}
            style={{ '--pct': `${isPNG ? 100 : quality}%`, opacity: isPNG ? 0.4 : 1 }}
          />
          <span className="itp-slider-val">{isPNG ? '100' : quality}</span>
        </div>
      </div>

      {!isPNG && (
        <p style={{ fontSize: '0.79rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
          {quality >= 85 ? '🌟 Near-lossless — best quality, larger file'
            : quality >= 70 ? '✅ Optimal — great quality, significant savings'
            : quality >= 50 ? '⚡ Aggressive — visible compression, very small file'
            : '⚠️ Maximum compression — noticeable quality loss'}
        </p>
      )}
    </>
  );
}

// ── processImage ──
async function processImage(imgEl, file, options, onProgress) {
  const fmt     = options.format || 'jpg';
  const quality = (options.quality ?? 82) / 100;

  const mimeMap = { jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png' };
  const mime    = mimeMap[fmt] || 'image/jpeg';

  onProgress(0.1);

  const canvas = document.createElement('canvas');
  canvas.width  = imgEl.naturalWidth;
  canvas.height = imgEl.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0);

  onProgress(0.5);

  // PNG is lossless — pass quality=undefined
  const blob = await canvasToBlob(canvas, mime, fmt === 'png' ? undefined : quality);

  onProgress(1);

  const base = file.name.split('.').slice(0, -1).join('.') || 'image';
  const ext  = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[mime] || 'jpg';
  return { blob, filename: `${base}-compressed.${ext}`, mime };
}

// ── Page ──
export default function ImageCompressor() {
  const seo = SEO_DATA['image-compressor'] || {
    title: 'Free Image Compressor Online — Reduce Image Size | OM Tools',
    description: 'Compress JPG, PNG and WebP images in your browser. Reduce file size by up to 90% without losing quality. 100% free, no upload.',
  };

  return (
    <ImageToolPage
      seo={seo}
      icon="🗜️"
      title="Image Compressor"
      subtitle="Compress JPG, PNG, and WebP images without sacrificing quality. See the before/after comparison live. Zero upload — 100% in your browser."
      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
      dropLabel="Drop your image here"
      dropSublabel="JPG, PNG, WebP, GIF, BMP — any image format"
      renderControls={renderControls}
      processImage={processImage}
      faqs={FAQS}
      showBeforeAfter={true}
    />
  );
}
