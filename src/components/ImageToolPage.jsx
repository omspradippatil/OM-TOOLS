import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO.jsx';
import './ImageToolPage.css';

/* ─────────────────────────────────────────────────────
   Helper: format bytes into human-readable string
───────────────────────────────────────────────────── */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/* ─────────────────────────────────────────────────────
   Helper: load image element from File
───────────────────────────────────────────────────── */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image.')); };
    img.src = url;
  });
}

/* ─────────────────────────────────────────────────────
   Helper: canvas → Blob (with quality)
───────────────────────────────────────────────────── */
export function canvasToBlob(canvas, mime = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas toBlob returned null.')); },
      mime,
      quality
    );
  });
}

/* ─────────────────────────────────────────────────────
   Before/After Slider Component
───────────────────────────────────────────────────── */
function BeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel = 'Before', afterLabel = 'After' }) {
  const [pct, setPct] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const updatePct = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPct(p);
  }, []);

  const onPointerDown = (e) => {
    dragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    updatePct(e.clientX);
  };
  const onPointerMove = (e) => { if (dragging.current) updatePct(e.clientX); };
  const onPointerUp   = () => { dragging.current = false; };

  return (
    <div
      className="itp-ba"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="Before and after comparison slider"
    >
      {/* BEFORE */}
      <img src={beforeSrc} className="itp-ba__before" alt="Original" draggable={false} />
      <span className="itp-ba__label itp-ba__label--before">{beforeLabel}</span>

      {/* AFTER — clipped */}
      <div
        className="itp-ba__after-wrap"
        style={{ width: `${100 - pct}%` }}
      >
        <img
          src={afterSrc}
          className="itp-ba__after"
          alt="Result"
          draggable={false}
          style={{ right: 0 }}
        />
      </div>
      <span className="itp-ba__label itp-ba__label--after">{afterLabel}</span>

      {/* DIVIDER */}
      <div className="itp-ba__divider" style={{ left: `${pct}%` }}>
        <div className="itp-ba__handle">
          ◀▶
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DropZone Component
───────────────────────────────────────────────────── */
function DropZone({ accept, onFile, label, sublabel, emoji, thumbUrl }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onFile(file);
  }, [onFile]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`itp-drop${drag ? ' itp-drop--over' : ''}${thumbUrl ? ' itp-drop--has-image' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Upload image — ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept || 'image/*'}
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
        className="itp-drop__input"
        aria-hidden="true"
      />
      {thumbUrl && (
        <div
          className="itp-drop__preview"
          style={{ backgroundImage: `url(${thumbUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className="itp-drop__body">
        <div className="itp-drop__icon-wrap" aria-hidden="true">
          <span>{thumbUrl ? '✅' : emoji || '🖼️'}</span>
        </div>
        <p className="itp-drop__title">{drag ? 'Release to upload' : (thumbUrl ? 'Image loaded — click to change' : label)}</p>
        <p className="itp-drop__sub">{sublabel}</p>
        {!thumbUrl && (
          <div className="itp-drop__cta">
            <span className="itp-drop__cta-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Browse or drop image
            </span>
          </div>
        )}
        <p className="itp-drop__hint">🔒 Image never leaves your device</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FAQAccordion
───────────────────────────────────────────────────── */
function FAQAccordion({ faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="itp-faq__list">
      {faqs.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
          <button
            className="faq-item__trigger"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="faq-item__q">{faq.q}</span>
            <span className="faq-item__chevron" aria-hidden="true">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="faq-item__panel">
              <p className="faq-item__a">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main ImageToolPage Component
   
   Props:
   - seo:             { title, description, keywords, url }
   - icon:            emoji
   - title, subtitle: strings
   - accept:          file accept attr (default "image/*")
   - dropLabel/Sub:   strings
   - renderControls:  (file, imgEl, options, setOptions, imgInfo) => JSX
   - processImage:    async (imgEl, file, options) => { blob, filename, mime }
   - faqs:            [{ q, a }]
   - showBeforeAfter: bool (show split-slider after processing)
───────────────────────────────────────────────────── */
export default function ImageToolPage({
  seo = {},
  icon = '🖼️',
  title,
  subtitle,
  accept = 'image/*',
  dropLabel = 'Drop your image here',
  dropSublabel = 'JPG, PNG, WebP, GIF, BMP, AVIF',
  renderControls,
  processImage,
  faqs = [],
  showBeforeAfter = false,
}) {
  const [file, setFile]           = useState(null);
  const [imgEl, setImgEl]         = useState(null);
  const [imgUrl, setImgUrl]       = useState(null); // original object URL
  const [imgInfo, setImgInfo]     = useState(null); // { w, h, size }
  const [options, setOptions]     = useState({});
  const [stage, setStage]         = useState('idle'); // idle | process | done | error
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultFilename, setResultFilename] = useState('');
  const abortRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []); // eslint-disable-line

  const handleFile = useCallback(async (f) => {
    // Cleanup previous
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setError('');
    setStage('idle');
    setProgress(0);

    try {
      const { img, url } = await loadImage(f);
      setFile(f);
      setImgEl(img);
      setImgUrl(url);
      setImgInfo({ w: img.naturalWidth, h: img.naturalHeight, size: f.size });
    } catch (e) {
      setError(e.message || 'Could not load image.');
      setStage('error');
    }
  }, [imgUrl, resultUrl]);

  const handleProcess = async () => {
    if (!file || !imgEl || stage === 'process') return;
    abortRef.current = false;
    setStage('process');
    setProgress(0);
    setError('');

    try {
      const onProgress = (p) => { if (!abortRef.current) setProgress(p); };

      const result = await processImage(imgEl, file, options, onProgress);
      if (abortRef.current) return;

      if (!result?.blob) throw new Error('Processing returned no output.');

      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultBlob(result.blob);
      setResultFilename(result.filename || `output.jpg`);
      setProgress(1);
      setStage('done');
    } catch (e) {
      if (abortRef.current) return;
      console.error('[ImageToolPage] Error:', e);
      setError(e?.message || 'Processing failed. Try a different image or format.');
      setStage('error');
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = resultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setImgEl(null);
    setImgUrl(null);
    setImgInfo(null);
    setResultUrl(null);
    setResultBlob(null);
    setResultFilename('');
    setOptions({});
    setError('');
    setStage('idle');
    setProgress(0);
  };

  const pct = Math.round(progress * 100);
  const savings = resultBlob && file
    ? Math.round((1 - resultBlob.size / file.size) * 100)
    : 0;

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        url={seo.url}
      />
      <main id="main-content" className="itp-page">

        {/* ── Hero ── */}
        <section className="itp-hero">
          <div className="itp-hero__glow" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--1" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--2" aria-hidden="true" />
          <div className="container">
            <div className="itp-hero__body">
              <div className="itp-hero__icon-wrap" aria-hidden="true">
                <span>{icon}</span>
              </div>
              <div className="itp-hero__text">
                <div className="itp-hero__pills">
                  <span className="itp-pill itp-pill--teal">🖼️ Image Tool</span>
                  <span className="itp-pill itp-pill--free">✦ Free Forever</span>
                  <span className="itp-pill itp-pill--native">🔒 100% In-Browser</span>
                </div>
                <h1 className="itp-hero__title">{title}</h1>
                <p className="itp-hero__sub">{subtitle}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workspace ── */}
        <section className="itp-workspace">
          <div className="container container-md">
            <div className="itp-card">

              {/* ── RESULT STATE ── */}
              {stage === 'done' && resultUrl ? (
                <div className="itp-result">
                  {/* Stats bar */}
                  <div className="itp-result__stats">
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">Original</span>
                      <span className="itp-result__stat-val">{formatBytes(file?.size || 0)}</span>
                    </div>
                    <div className="itp-result__stat-divider" />
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">Result</span>
                      <span className="itp-result__stat-val itp-result__stat-val--accent">{formatBytes(resultBlob?.size || 0)}</span>
                    </div>
                    {imgInfo && (
                      <>
                        <div className="itp-result__stat-divider" />
                        <div className="itp-result__stat">
                          <span className="itp-result__stat-label">Dimensions</span>
                          <span className="itp-result__stat-val" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {imgInfo.w} × {imgInfo.h}
                          </span>
                        </div>
                      </>
                    )}
                    {Math.abs(savings) >= 1 && (
                      <span className={`itp-result__savings ${savings > 0 ? 'itp-result__savings--pos' : 'itp-result__savings--neg'}`}>
                        {savings > 0 ? `−${savings}%` : `+${Math.abs(savings)}%`}
                      </span>
                    )}
                  </div>

                  {/* Before/After or single preview */}
                  {showBeforeAfter && imgUrl ? (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <BeforeAfterSlider
                        beforeSrc={imgUrl}
                        afterSrc={resultUrl}
                        beforeLabel="Original"
                        afterLabel="Result"
                      />
                    </div>
                  ) : (
                    <div className="itp-result__preview">
                      <img src={resultUrl} alt="Result" className="itp-result__img" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="itp-result__actions">
                    <button className="itp-result__download" onClick={handleDownload} id="download-output-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download {resultFilename.split('.').pop()?.toUpperCase()}
                    </button>
                    <button className="itp-result__again" onClick={handleReset}>↺ Start over</button>
                  </div>
                </div>

              ) : (
                <>
                  {/* Drop zone */}
                  <DropZone
                    accept={accept}
                    onFile={handleFile}
                    label={dropLabel}
                    sublabel={dropSublabel}
                    emoji={icon}
                    thumbUrl={imgUrl}
                  />

                  {/* File info bar */}
                  {file && imgInfo && (
                    <div className="itp-filebar animate-fade-up">
                      <img
                        src={imgUrl}
                        className="itp-filebar__thumb"
                        alt="Preview"
                      />
                      <div className="itp-filebar__info">
                        <span className="itp-filebar__name">{file.name}</span>
                        <span className="itp-filebar__meta">
                          <span className="itp-filebar__tag">{file.name.split('.').pop()?.toUpperCase()}</span>
                          <span className="itp-filebar__dim">{imgInfo.w} × {imgInfo.h}</span>
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <button
                        className="itp-filebar__change"
                        onClick={handleReset}
                        aria-label="Remove image"
                      >✕</button>
                    </div>
                  )}

                  {/* Controls */}
                  {file && renderControls && (
                    <div className="itp-controls animate-fade-up">
                      {renderControls(file, imgEl, options, setOptions, imgInfo)}
                    </div>
                  )}

                  {/* Progress */}
                  {stage === 'process' && (
                    <div className="itp-prog animate-fade-up" role="status" aria-live="polite">
                      <div className="itp-prog__top">
                        <span className="itp-prog__label">
                          {pct < 10 ? 'Processing…' : pct < 99 ? `Processing… ${pct}%` : 'Finishing…'}
                        </span>
                        <span className="itp-prog__pct">{pct}%</span>
                      </div>
                      <div className="itp-prog__track">
                        <div className="itp-prog__bar" style={{ width: `${pct || 100}%` }} />
                      </div>
                      <p className="itp-prog__hint">🔒 Processing runs entirely in your browser</p>
                    </div>
                  )}

                  {/* Error */}
                  {stage === 'error' && error && (
                    <div className="itp-error animate-fade-up" role="alert">
                      <div className="itp-error__icon">⚠️</div>
                      <div>
                        <p className="itp-error__title">Processing failed</p>
                        <p className="itp-error__msg">{error}</p>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setStage('idle'); setError(''); }}
                      >Try again</button>
                    </div>
                  )}

                  {/* Go button */}
                  {file && stage !== 'process' && (
                    <button
                      className="itp-go-btn"
                      onClick={handleProcess}
                      disabled={stage === 'process'}
                      id="process-btn"
                    >
                      <span className="itp-go-btn__icon" aria-hidden="true">{icon}</span>
                      <span>{title}</span>
                      <span className="itp-go-btn__arrow" aria-hidden="true">→</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Privacy bar */}
            <div className="itp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Images are processed using the <strong>browser Canvas API</strong> — nothing is ever uploaded to any server.
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {faqs.length > 0 && (
          <section className="itp-faq section-sm">
            <div className="container container-sm">
              <h2 className="itp-faq__title">Frequently Asked Questions</h2>
              <FAQAccordion faqs={faqs} />
            </div>
          </section>
        )}

        {/* ── Back link ── */}
        <div className="itp-back">
          <div className="container">
            <Link to="/" className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              All Tools
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}

// Named exports for use in custom image tool pages
export { BeforeAfterSlider, DropZone, FAQAccordion };
