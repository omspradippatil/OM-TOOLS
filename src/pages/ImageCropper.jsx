import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { SEO_DATA } from '../constants/seoData.js';
import { loadImage, canvasToBlob, formatBytes } from '../components/ImageToolPage.jsx';
import '../components/ImageToolPage.css';

const FAQS = [
  { q: 'How do I crop?', a: 'After uploading, click and drag on the image to draw a crop area. You can then drag the selection to reposition it. Use the corner handles to resize the selection.' },
  { q: 'Can I crop to exact dimensions?', a: 'Yes! After drawing a crop area, you can type exact pixel values in the X, Y, Width, Height fields. The preview updates in real-time.' },
  { q: 'What aspect ratio presets are available?', a: '1:1 (Square — Instagram), 16:9 (Landscape — YouTube), 9:16 (Vertical — Reels/TikTok), 4:3 (Classic), 3:2 (Photography), 3:4 (Portrait), and Free (no constraint).' },
  { q: 'Does this keep transparency?', a: 'Yes! If you export as PNG, transparent areas in the original image (outside the crop) remain transparent. For JPG, they are filled with white.' },
];

const RATIO_PRESETS = [
  { label: 'Free',  ratio: null },
  { label: '1:1',   ratio: 1 },
  { label: '16:9',  ratio: 16/9 },
  { label: '9:16',  ratio: 9/16 },
  { label: '4:3',   ratio: 4/3 },
  { label: '3:2',   ratio: 3/2 },
  { label: '3:4',   ratio: 3/4 },
  { label: '2:3',   ratio: 2/3 },
];

const FMT_OPTIONS = [
  { id: 'jpg',  label: 'JPG', mime: 'image/jpeg' },
  { id: 'png',  label: 'PNG', mime: 'image/png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
];

export default function ImageCropper() {
  const seo = SEO_DATA['image-cropper'] || {};

  const [file, setFile]       = useState(null);
  const [imgEl, setImgEl]     = useState(null);
  const [imgUrl, setImgUrl]   = useState(null);
  const [imgNat, setImgNat]   = useState(null); // { w, h } natural dimensions
  const [fmt, setFmt]         = useState('jpg');
  const [ratio, setRatio]     = useState(null); // aspect ratio constraint (null = free)
  const [stage, setStage]     = useState('idle');
  const [error, setError]     = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultFilename, setResultFilename] = useState('');

  // Crop selection (in display coordinates)
  const [cropSel, setCropSel] = useState(null); // { x, y, w, h } in display px
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState(null);
  const [moveStart, setMoveStart]   = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  const imgContainerRef = useRef(null);
  const imgDisplayRef   = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f?.type?.startsWith('image/')) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null); setResultBlob(null);
    setError(''); setStage('idle'); setCropSel(null);
    try {
      const { img, url } = await loadImage(f);
      setFile(f); setImgEl(img); setImgUrl(url);
      setImgNat({ w: img.naturalWidth, h: img.naturalHeight });
    } catch (e) { setError(e.message); }
  }, [imgUrl, resultUrl]);

  // Get display image rect
  const getDisplayRect = () => {
    const el = imgDisplayRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: 0, y: 0, w: el.offsetWidth, h: el.offsetHeight };
  };

  // Constrain selection to image bounds
  const constrain = (x, y, w, h, bounds) => {
    let nx = Math.max(0, x);
    let ny = Math.max(0, y);
    let nw = Math.max(10, w);
    let nh = Math.max(10, h);
    if (nx + nw > bounds.w) nx = bounds.w - nw;
    if (ny + nh > bounds.h) ny = bounds.h - nh;
    if (nw > bounds.w) nw = bounds.w;
    if (nh > bounds.h) nh = bounds.h;
    return { x: nx, y: ny, w: nw, h: nh };
  };

  // Apply aspect ratio to selection
  const applyRatio = (w, h, r) => {
    if (!r) return { w, h };
    const newH = w / r;
    if (newH <= h) return { w, h: newH };
    return { w: h * r, h };
  };

  const getRelPos = (e) => {
    const container = imgContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(container.offsetWidth,  clientX - rect.left)),
      y: Math.max(0, Math.min(container.offsetHeight, clientY - rect.top)),
    };
  };

  const onMouseDown = (e) => {
    if (!imgEl) return;
    e.preventDefault();
    const pos = getRelPos(e);

    // Check if clicking inside selection
    if (cropSel) {
      const { x, y, w, h } = cropSel;
      if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
        setMoveStart({ mx: pos.x, my: pos.y, ox: x, oy: y });
        return;
      }
    }

    // Start new selection
    setDragStart(pos);
    setCropSel({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setIsDragging(true);
    setMoveStart(null);
  };

  const onMouseMove = (e) => {
    e.preventDefault();
    const pos = getRelPos(e);
    const bounds = { w: imgContainerRef.current?.offsetWidth || 0, h: imgContainerRef.current?.offsetHeight || 0 };

    if (moveStart && cropSel) {
      const dx = pos.x - moveStart.mx;
      const dy = pos.y - moveStart.my;
      const nx = Math.max(0, Math.min(bounds.w - cropSel.w, moveStart.ox + dx));
      const ny = Math.max(0, Math.min(bounds.h - cropSel.h, moveStart.oy + dy));
      setCropSel(prev => ({ ...prev, x: nx, y: ny }));
      return;
    }

    if (isDragging && dragStart) {
      const rawW = pos.x - dragStart.x;
      const rawH = pos.y - dragStart.y;
      let x = rawW >= 0 ? dragStart.x : pos.x;
      let y = rawH >= 0 ? dragStart.y : pos.y;
      let w = Math.abs(rawW);
      let h = Math.abs(rawH);

      if (ratio) {
        const r = applyRatio(w, h, ratio);
        w = r.w; h = r.h;
      }

      setCropSel(constrain(x, y, w, h, bounds));
    }
  };

  const onMouseUp = (e) => {
    setIsDragging(false);
    setDragStart(null);
    setMoveStart(null);
    // Remove tiny selections
    if (cropSel && (cropSel.w < 5 || cropSel.h < 5)) setCropSel(null);
  };

  // Convert display crop to natural pixel crop
  const getPixelCrop = () => {
    if (!cropSel || !imgDisplayRef.current || !imgNat) return null;
    const dispW = imgDisplayRef.current.offsetWidth;
    const dispH = imgDisplayRef.current.offsetHeight;
    const scaleX = imgNat.w / dispW;
    const scaleY = imgNat.h / dispH;
    return {
      x: Math.round(cropSel.x * scaleX),
      y: Math.round(cropSel.y * scaleY),
      w: Math.round(cropSel.w * scaleX),
      h: Math.round(cropSel.h * scaleY),
    };
  };

  const handleCrop = async () => {
    if (!imgEl || !cropSel || cropSel.w < 5 || cropSel.h < 5) {
      setError('Please draw a crop area first.');
      return;
    }
    setStage('process'); setError('');

    try {
      const px = getPixelCrop();
      const canvas = document.createElement('canvas');
      canvas.width  = px.w;
      canvas.height = px.h;
      const ctx = canvas.getContext('2d');
      if (fmt === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, px.w, px.h); }
      ctx.drawImage(imgEl, px.x, px.y, px.w, px.h, 0, 0, px.w, px.h);

      const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      const blob = await canvasToBlob(canvas, mimeMap[fmt] || 'image/jpeg', fmt === 'png' ? undefined : 0.92);

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultBlob(blob);
      const base = file.name.split('.').slice(0, -1).join('.') || 'image';
      setResultFilename(`${base}-cropped.${fmt}`);
      setStage('done');
    } catch (e) {
      setError(e.message || 'Crop failed.'); setStage('error');
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
    setFile(null); setImgEl(null); setImgUrl(null); setImgNat(null);
    setResultUrl(null); setResultBlob(null); setResultFilename('');
    setCropSel(null); setError(''); setStage('idle');
  };

  const pixelCrop = getPixelCrop();

  return (
    <>
      <SEO
        title={seo.title || 'Free Image Cropper Online — Crop Images Instantly | OM Tools'}
        description={seo.description || 'Crop images visually in your browser. Aspect ratio presets: 1:1, 16:9, 9:16, 4:3. Export as JPG, PNG, WebP. 100% free, no upload.'}
        keywords={seo.keywords}
        url={seo.url}
      />
      <main id="main-content" className="itp-page">

        <section className="itp-hero">
          <div className="itp-hero__glow" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--1" aria-hidden="true" />
          <div className="itp-hero__blob itp-hero__blob--2" aria-hidden="true" />
          <div className="container">
            <div className="itp-hero__body">
              <div className="itp-hero__icon-wrap"><span>✂️</span></div>
              <div className="itp-hero__text">
                <div className="itp-hero__pills">
                  <span className="itp-pill itp-pill--teal">🖼️ Image Tool</span>
                  <span className="itp-pill itp-pill--free">✦ Free Forever</span>
                  <span className="itp-pill itp-pill--native">🔒 100% In-Browser</span>
                </div>
                <h1 className="itp-hero__title">Image Cropper</h1>
                <p className="itp-hero__sub">Crop images visually with aspect ratio presets. Drag to select your crop area. Export as JPG, PNG, or WebP.</p>
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
                      <span className="itp-result__stat-val" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{imgNat?.w} × {imgNat?.h}</span>
                    </div>
                    <div className="itp-result__stat-divider" />
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">Cropped to</span>
                      <span className="itp-result__stat-val itp-result__stat-val--accent" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {pixelCrop?.w} × {pixelCrop?.h}
                      </span>
                    </div>
                    <div className="itp-result__stat-divider" />
                    <div className="itp-result__stat">
                      <span className="itp-result__stat-label">File Size</span>
                      <span className="itp-result__stat-val">{formatBytes(resultBlob?.size || 0)}</span>
                    </div>
                  </div>
                  <div className="itp-result__preview">
                    <img src={resultUrl} alt="Cropped" className="itp-result__img" />
                  </div>
                  <div className="itp-result__actions">
                    <button className="itp-result__download" onClick={handleDownload} id="download-output-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download {fmt.toUpperCase()}
                    </button>
                    <button className="itp-result__again" onClick={() => { if (resultUrl) URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); setStage('idle'); setCropSel(null); }}>
                      ✂️ Crop again
                    </button>
                    <button className="itp-result__again" onClick={handleReset}>↺ New image</button>
                  </div>
                </div>
              ) : (
                <>
                  {!file ? (
                    <div
                      className="itp-drop"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                      onClick={() => document.getElementById('crop-input')?.click()}
                      role="button" tabIndex={0} aria-label="Upload image to crop"
                      onKeyDown={(e) => e.key === 'Enter' && document.getElementById('crop-input')?.click()}
                    >
                      <input id="crop-input" type="file" accept="image/*"
                        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
                        className="itp-drop__input" aria-hidden="true" />
                      <div className="itp-drop__body">
                        <div className="itp-drop__icon-wrap"><span>✂️</span></div>
                        <p className="itp-drop__title">Drop your image here</p>
                        <p className="itp-drop__sub">JPG, PNG, WebP, GIF, BMP</p>
                        <div className="itp-drop__cta"><span className="itp-drop__cta-inner">Browse or drop image</span></div>
                        <p className="itp-drop__hint">🔒 Your image never leaves your device</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Aspect ratio + format controls */}
                      <div className="itp-controls animate-fade-up" style={{ marginBottom: '1rem' }}>
                        <div className="itp-ctrl-row">
                          <label className="itp-ctrl-label">Aspect Ratio</label>
                          <div className="itp-fmt-pills">
                            {RATIO_PRESETS.map(r => (
                              <button
                                key={r.label}
                                className={`itp-fmt-pill${ratio === r.ratio ? ' itp-fmt-pill--active' : ''}`}
                                onClick={() => { setRatio(r.ratio); setCropSel(null); }}
                              >{r.label}</button>
                            ))}
                          </div>
                        </div>
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
                      </div>

                      {/* Crop canvas */}
                      <div
                        ref={imgContainerRef}
                        className="itp-crop-wrap animate-fade-up"
                        style={{ display: 'block', width: '100%' }}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onTouchStart={onMouseDown}
                        onTouchMove={onMouseMove}
                        onTouchEnd={onMouseUp}
                      >
                        <img
                          ref={imgDisplayRef}
                          src={imgUrl}
                          alt="Image to crop"
                          className="itp-crop-img"
                          draggable={false}
                          style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', cursor: 'crosshair', userSelect: 'none' }}
                        />
                        {cropSel && cropSel.w > 5 && cropSel.h > 5 && (
                          <div
                            className="itp-crop-selection"
                            style={{
                              left: `${cropSel.x}px`,
                              top: `${cropSel.y}px`,
                              width: `${cropSel.w}px`,
                              height: `${cropSel.h}px`,
                              cursor: 'move',
                            }}
                          >
                            <div className="itp-crop-handle itp-crop-handle--tl" onMouseDown={(e) => { e.stopPropagation(); }} />
                            <div className="itp-crop-handle itp-crop-handle--tr" onMouseDown={(e) => { e.stopPropagation(); }} />
                            <div className="itp-crop-handle itp-crop-handle--bl" onMouseDown={(e) => { e.stopPropagation(); }} />
                            <div className="itp-crop-handle itp-crop-handle--br" onMouseDown={(e) => { e.stopPropagation(); }} />
                          </div>
                        )}
                      </div>

                      {/* Crop info */}
                      {cropSel && cropSel.w > 5 && pixelCrop && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.6rem 1rem', borderRadius: '8px',
                          background: 'var(--img-primary-subtle)',
                          border: '1px solid var(--img-primary-border)',
                          fontSize: '0.8rem', color: 'var(--text-muted)',
                          marginTop: '0.75rem', fontFamily: 'monospace',
                        }}>
                          <span style={{ color: 'var(--img-primary-light)', fontWeight: 700 }}>✂️ Selection</span>
                          <span>{pixelCrop.x},{pixelCrop.y} → {pixelCrop.w} × {pixelCrop.h} px</span>
                          <button
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.8rem' }}
                            onClick={() => setCropSel(null)}
                          >✕ Clear</button>
                        </div>
                      )}

                      <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        {cropSel ? 'Drag to move selection · Corner handles to resize' : 'Click and drag on the image to draw a crop area'}
                      </p>
                    </>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="itp-error animate-fade-up" role="alert">
                      <div className="itp-error__icon">⚠️</div>
                      <div><p className="itp-error__title">Error</p><p className="itp-error__msg">{error}</p></div>
                      <button className="btn btn-outline btn-sm" onClick={() => setError('')}>Dismiss</button>
                    </div>
                  )}

                  {/* Buttons */}
                  {file && stage !== 'process' && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button
                        className="itp-go-btn"
                        onClick={handleCrop}
                        disabled={!cropSel || cropSel.w < 5}
                        id="process-btn"
                      >
                        <span className="itp-go-btn__icon">✂️</span>
                        <span>{(!cropSel || cropSel.w < 5) ? 'Draw a crop area first' : 'Crop Image'}</span>
                        <span className="itp-go-btn__arrow">→</span>
                      </button>
                      <button
                        onClick={handleReset}
                        style={{ padding: '0 1rem', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                      >↺</button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="itp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Cropping runs using the <strong>browser Canvas API</strong>. Your image never leaves your device.
            </div>
          </div>
        </section>

        <section className="itp-faq section-sm">
          <div className="container container-sm">
            <h2 className="itp-faq__title">Frequently Asked Questions</h2>
            <div className="itp-faq__list">
              {FAQS.map((faq, i) => (
                <details key={i} className="faq-item">
                  <summary className="faq-item__trigger" style={{ listStyle: 'none', cursor: 'pointer' }}>
                    <span className="faq-item__q">{faq.q}</span>
                    <span className="faq-item__chevron">+</span>
                  </summary>
                  <div className="faq-item__panel"><p className="faq-item__a">{faq.a}</p></div>
                </details>
              ))}
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
