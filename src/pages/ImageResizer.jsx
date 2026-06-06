import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { SEO_DATA } from '../constants/seoData.js';
import { loadImage, canvasToBlob, formatBytes, BeforeAfterSlider } from '../components/ImageToolPage.jsx';
import '../components/ImageToolPage.css';

const FAQS = [
  { q: 'What are the size presets?', a: 'We provide 15+ presets covering social media covers, profile pictures, OG meta images, HD/4K wallpapers, YouTube thumbnails, app icons, and custom dimensions like 256×94.' },
  { q: 'What does the Aspect Ratio Lock do?', a: 'When locked 🔒, changing the width automatically updates the height (and vice versa) to maintain the original image proportions. Unlock 🔓 to set dimensions independently.' },
  { q: 'What is the difference between Stretch, Contain, and Cover?', a: 'Stretch fills the exact dimensions, possibly distorting the image. Contain fits the image inside without distortion (adds letterbox bars). Cover fills the frame and crops the edges if needed.' },
  { q: 'What output formats are available?', a: 'JPG (smallest for photos), PNG (lossless), WebP (best quality-to-size ratio). We recommend WebP for all web use cases.' },
  { q: 'Is there a file size limit?', a: 'No hard limit — everything runs in your browser. Very large images (>20MP) may be slow depending on your device.' },
];

const PRESETS = [
  { label: '256×94',       w: 256,  h: 94,   group: 'Custom' },
  { label: '1:1 — 1024',  w: 1024, h: 1024, group: 'Social' },
  { label: 'IG Post',     w: 1080, h: 1080, group: 'Social' },
  { label: 'IG Story',    w: 1080, h: 1920, group: 'Social' },
  { label: 'FB Cover',    w: 820,  h: 312,  group: 'Social' },
  { label: 'TW Header',   w: 1500, h: 500,  group: 'Social' },
  { label: 'OG Image',    w: 1200, h: 630,  group: 'Web' },
  { label: 'YT Thumb',    w: 1280, h: 720,  group: 'Web' },
  { label: 'HD 1080p',    w: 1920, h: 1080, group: 'Wallpaper' },
  { label: '2K',          w: 2560, h: 1440, group: 'Wallpaper' },
  { label: '4K UHD',      w: 3840, h: 2160, group: 'Wallpaper' },
  { label: 'Icon 512',    w: 512,  h: 512,  group: 'Icons' },
  { label: 'Icon 256',    w: 256,  h: 256,  group: 'Icons' },
  { label: 'Icon 128',    w: 128,  h: 128,  group: 'Icons' },
  { label: 'Icon 64',     w: 64,   h: 64,   group: 'Icons' },
  { label: 'Icon 32',     w: 32,   h: 32,   group: 'Icons' },
];

const FIT_MODES = [
  { id: 'stretch', label: 'Stretch', desc: 'Fill exact size (may distort)' },
  { id: 'contain', label: 'Contain', desc: 'Fit inside (letterbox)' },
  { id: 'cover',   label: 'Cover',   desc: 'Fill & crop edges' },
];

const FMT_OPTIONS = [
  { id: 'jpg',  label: 'JPG',  mime: 'image/jpeg' },
  { id: 'png',  label: 'PNG',  mime: 'image/png'  },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
];

export default function ImageResizer() {
  const seo = SEO_DATA['image-resizer'] || {
    title: 'Free Image Resizer Online — Resize Images to Any Size | OM Tools',
    description: 'Resize images to custom dimensions or presets like 256×94, 1920×1080, 1080×1080. Aspect ratio lock, multiple fit modes. 100% in your browser.',
  };

  const [file, setFile]           = useState(null);
  const [imgEl, setImgEl]         = useState(null);
  const [imgUrl, setImgUrl]       = useState(null);
  const [imgInfo, setImgInfo]     = useState(null);
  const [width, setWidth]         = useState('');
  const [height, setHeight]       = useState('');
  const [locked, setLocked]       = useState(true);
  const [fitMode, setFitMode]     = useState('stretch');
  const [fmt, setFmt]             = useState('jpg');
  const [stage, setStage]         = useState('idle');
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultFilename, setResultFilename] = useState('');
  const [resultDims, setResultDims] = useState(null);

  const handleFile = useCallback(async (f) => {
    if (!f?.type?.startsWith('image/')) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null); setResultBlob(null); setResultDims(null);
    setError(''); setStage('idle'); setProgress(0);
    try {
      const { img, url } = await loadImage(f);
      setFile(f); setImgEl(img); setImgUrl(url);
      setImgInfo({ w: img.naturalWidth, h: img.naturalHeight, size: f.size });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    } catch (e) { setError(e.message); }
  }, [imgUrl, resultUrl]);

  const applyPreset = (p) => {
    setWidth(String(p.w));
    setHeight(String(p.h));
  };

  const onWidthChange = (v) => {
    setWidth(v);
    if (locked && imgInfo && Number(v) > 0) {
      setHeight(String(Math.round(Number(v) * imgInfo.h / imgInfo.w)));
    }
  };

  const onHeightChange = (v) => {
    setHeight(v);
    if (locked && imgInfo && Number(v) > 0) {
      setWidth(String(Math.round(Number(v) * imgInfo.w / imgInfo.h)));
    }
  };

  const handleProcess = async () => {
    if (!imgEl || !file) return;
    const tw = Math.max(1, Math.round(Number(width) || imgInfo.w));
    const th = Math.max(1, Math.round(Number(height) || imgInfo.h));

    setStage('process'); setProgress(0); setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width  = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');

      // Fill background (white for JPG)
      if (fmt === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tw, th);
      }

      const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;

      if (fitMode === 'stretch') {
        ctx.drawImage(imgEl, 0, 0, tw, th);
      } else if (fitMode === 'contain') {
        const scale = Math.min(tw / iw, th / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(imgEl, (tw - dw) / 2, (th - dh) / 2, dw, dh);
      } else { // cover
        const scale = Math.max(tw / iw, th / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(imgEl, (tw - dw) / 2, (th - dh) / 2, dw, dh);
      }

      setProgress(0.7);

      const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      const mime = mimeMap[fmt] || 'image/jpeg';
      const blob = await canvasToBlob(canvas, mime, fmt === 'png' ? undefined : 0.92);

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultBlob(blob);
      setResultDims({ w: tw, h: th });
      const base = file.name.split('.').slice(0, -1).join('.') || 'image';
      setResultFilename(`${base}-${tw}x${th}.${fmt}`);
      setProgress(1);
      setStage('done');
    } catch (e) {
      setError(e.message || 'Resize failed.'); setStage('error');
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl; a.download = resultFilename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleReset = () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setImgEl(null); setImgUrl(null); setImgInfo(null);
    setResultUrl(null); setResultBlob(null); setResultFilename(''); setResultDims(null);
    setWidth(''); setHeight(''); setError(''); setStage('idle'); setProgress(0);
  };

  const pct = Math.round(progress * 100);
  const savings = resultBlob && file ? Math.round((1 - resultBlob.size / file.size) * 100) : 0;

  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />
      <main id="main-content" className="itp-page">

        <section className="itp-hero">
          <div className="itp-hero__glow" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--1" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--2" aria-hidden="true" />
          <div className="container">
            <div className="itp-hero__body">
              <div className="itp-hero__icon-wrap" aria-hidden="true"><span>📐</span></div>
              <div className="itp-hero__text">
                <div className="itp-hero__pills">
                  <span className="itp-pill itp-pill--teal">🖼️ Image Tool</span>
                  <span className="itp-pill itp-pill--free">✦ Free Forever</span>
                  <span className="itp-pill itp-pill--native">🔒 100% In-Browser</span>
                </div>
                <h1 className="itp-hero__title">Image Resizer</h1>
                <p className="itp-hero__sub">Resize any image to exact pixel dimensions. 15+ presets for social media, wallpapers, and icons. Aspect ratio lock included.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="itp-workspace">
          <div className="container container-md">
            <div className="itp-card">
              {stage === 'done' && resultUrl ? (
                <div className="itp-result">
                  <div className="itp-result__stats">
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">Original</span>
                      <span className="itp-result__stat-val" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{imgInfo?.w} × {imgInfo?.h}</span>
                    </div>
                    <div className="itp-result__stat-divider" />
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">Resized to</span>
                      <span className="itp-result__stat-val itp-result__stat-val--accent" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{resultDims?.w} × {resultDims?.h}</span>
                    </div>
                    <div className="itp-result__stat-divider" />
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">File Size</span>
                      <span className="itp-result__stat-val">{formatBytes(resultBlob?.size || 0)}</span>
                    </div>
                    {Math.abs(savings) >= 1 && (
                      <span className={`itp-result__savings ${savings > 0 ? 'itp-result__savings--pos' : 'itp-result__savings--neg'}`}>
                        {savings > 0 ? `−${savings}%` : `+${Math.abs(savings)}%`}
                      </span>
                    )}
                  </div>
                  <div className="itp-result__preview">
                    <img src={resultUrl} alt="Resized" className="itp-result__img" />
                  </div>
                  <div className="itp-result__actions">
                    <button className="itp-result__download" onClick={handleDownload} id="download-output-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download {fmt.toUpperCase()} — {resultDims?.w}×{resultDims?.h}
                    </button>
                    <button className="itp-result__again" onClick={handleReset}>↺ Start over</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Drop Zone */}
                  <div
                    className={`itp-drop${imgUrl ? ' itp-drop--has-image' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('resizer-input')?.click()}
                    role="button" tabIndex={0}
                    aria-label="Upload image to resize"
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('resizer-input')?.click()}
                    style={{ minHeight: imgUrl ? '180px' : '220px' }}
                  >
                    <input id="resizer-input" type="file" accept="image/*"
                      onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
                      className="itp-drop__input" aria-hidden="true" />
                    {imgUrl && <div className="itp-drop__preview" style={{ backgroundImage: `url(${imgUrl})` }} />}
                    <div className="itp-drop__body">
                      <div className="itp-drop__icon-wrap"><span>{imgUrl ? '✅' : '📐'}</span></div>
                      <p className="itp-drop__title">{imgUrl ? 'Image loaded — click to change' : 'Drop your image here'}</p>
                      <p className="itp-drop__sub">JPG, PNG, WebP, GIF, BMP</p>
                      {!imgUrl && <div className="itp-drop__cta"><span className="itp-drop__cta-inner">Browse or drop image</span></div>}
                      <p className="itp-drop__hint">🔒 Your image never leaves your device</p>
                    </div>
                  </div>

                  {/* File info bar */}
                  {file && imgInfo && (
                    <div className="itp-filebar animate-fade-up">
                      <img src={imgUrl} className="itp-filebar__thumb" alt="Preview" />
                      <div className="itp-filebar__info">
                        <span className="itp-filebar__name">{file.name}</span>
                        <span className="itp-filebar__meta">
                          <span className="itp-filebar__tag">{file.name.split('.').pop()?.toUpperCase()}</span>
                          <span className="itp-filebar__dim">{imgInfo.w} × {imgInfo.h}</span>
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <button className="itp-filebar__change" onClick={handleReset}>✕</button>
                    </div>
                  )}

                  {/* Controls */}
                  {file && (
                    <div className="itp-controls animate-fade-up">
                      <p className="itp-controls__title">Resize Settings</p>

                      {/* Size presets */}
                      <div className="itp-ctrl-row" style={{ alignItems: 'flex-start' }}>
                        <label className="itp-ctrl-label">Presets</label>
                        <div className="itp-preset-grid">
                          {PRESETS.map(p => (
                            <button
                              key={p.label}
                              className="itp-preset-pill"
                              onClick={() => applyPreset(p)}
                              title={`${p.w} × ${p.h}`}
                            >{p.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Dimension inputs */}
                      <div className="itp-ctrl-row">
                        <label className="itp-ctrl-label" htmlFor="resize-w">Width (px)</label>
                        <input
                          id="resize-w" type="number" className="itp-ctrl-input"
                          min={1} max={8000} value={width}
                          onChange={(e) => onWidthChange(e.target.value)}
                          placeholder={imgInfo?.w || '0'}
                        />
                        {/* Lock button */}
                        <button
                          className={`itp-lock-btn${locked ? ' itp-lock-btn--locked' : ''}`}
                          onClick={() => setLocked(!locked)}
                          title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                          aria-label={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        >
                          {locked ? '🔒' : '🔓'}
                        </button>
                        <label className="itp-ctrl-label" htmlFor="resize-h" style={{ minWidth: '70px' }}>Height (px)</label>
                        <input
                          id="resize-h" type="number" className="itp-ctrl-input"
                          min={1} max={8000} value={height}
                          onChange={(e) => onHeightChange(e.target.value)}
                          placeholder={imgInfo?.h || '0'}
                        />
                      </div>

                      {/* Fit mode */}
                      <div className="itp-ctrl-row">
                        <label className="itp-ctrl-label">Fit Mode</label>
                        <div className="itp-fmt-pills">
                          {FIT_MODES.map(f => (
                            <button
                              key={f.id}
                              className={`itp-fmt-pill${fitMode === f.id ? ' itp-fmt-pill--active' : ''}`}
                              onClick={() => setFitMode(f.id)}
                              title={f.desc}
                            >{f.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Output format */}
                      <div className="itp-ctrl-row">
                        <label className="itp-ctrl-label">Output Format</label>
                        <div className="itp-fmt-pills">
                          {FMT_OPTIONS.map(f => (
                            <button
                              key={f.id}
                              className={`itp-fmt-pill${fmt === f.id ? ' itp-fmt-pill--active' : ''}`}
                              onClick={() => setFmt(f.id)}
                            >{f.label}</button>
                          ))}
                        </div>
                      </div>

                      {fitMode !== 'stretch' && (
                        <p style={{ fontSize: '0.79rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                          {fitMode === 'contain' ? '📦 Contain: image fits inside the frame. Background filled with white (JPG) or transparent (PNG).'
                            : '✂️ Cover: image fills the frame completely. Edges may be cropped.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Progress */}
                  {stage === 'process' && (
                    <div className="itp-prog animate-fade-up">
                      <div className="itp-prog__top">
                        <span className="itp-prog__label">Resizing…</span>
                        <span className="itp-prog__pct">{pct}%</span>
                      </div>
                      <div className="itp-prog__track"><div className="itp-prog__bar" style={{ width: `${pct || 100}%` }} /></div>
                    </div>
                  )}

                  {/* Error */}
                  {stage === 'error' && error && (
                    <div className="itp-error animate-fade-up" role="alert">
                      <div className="itp-error__icon">⚠️</div>
                      <div><p className="itp-error__title">Resize failed</p><p className="itp-error__msg">{error}</p></div>
                      <button className="btn btn-outline btn-sm" onClick={() => { setStage('idle'); setError(''); }}>Try again</button>
                    </div>
                  )}

                  {/* Go button */}
                  {file && stage !== 'process' && (
                    <button className="itp-go-btn" onClick={handleProcess} id="process-btn">
                      <span className="itp-go-btn__icon">📐</span>
                      <span>Resize to {width || '?'} × {height || '?'} px</span>
                      <span className="itp-go-btn__arrow">→</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="itp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Resizing runs using the <strong>browser Canvas API</strong>. Your image never leaves your device.
            </div>
          </div>
        </section>

        <section className="itp-faq section-sm">
          <div className="container container-sm">
            <h2 className="itp-faq__title">Frequently Asked Questions</h2>
            <div className="itp-faq__list">
              {FAQS.map((faq, i) => {
                const [open, setOpen] = [false, () => {}];
                return (
                  <details key={i} className="faq-item">
                    <summary className="faq-item__trigger" style={{ listStyle: 'none', cursor: 'pointer' }}>
                      <span className="faq-item__q">{faq.q}</span>
                      <span className="faq-item__chevron">+</span>
                    </summary>
                    <div className="faq-item__panel"><p className="faq-item__a">{faq.a}</p></div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>

        <div className="itp-back">
          <div className="container">
            <Link to="/" className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              All Tools
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
