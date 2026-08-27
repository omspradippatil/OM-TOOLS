import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import SEO from '../components/SEO.jsx';
import { SEO_DATA } from '../constants/seoData.js';
import { loadImage, canvasToBlob, formatBytes } from '../components/ImageToolPage.jsx';
import '../components/ImageToolPage.css';

const FAQS = [
  { q: 'How many images can I resize at once?', a: 'Up to 20 images at once. All images are processed in parallel in your browser using the Canvas API.' },
  { q: 'Can I mix different image formats?', a: 'Yes! You can upload JPG, PNG, WebP, GIF, BMP — all at once. The output format is set globally for all images.' },
  { q: 'How does the ZIP download work?', a: 'We use JSZip (a browser-native library) to package all resized images into a single ZIP file without any server involvement. The ZIP is created and downloaded entirely in your browser.' },
  { q: 'What if some images fail?', a: 'Failed images are marked with an error indicator. Successful images can still be downloaded. You can retry failed images individually.' },
];

const FIT_MODES = [
  { id: 'stretch', label: 'Stretch' },
  { id: 'contain', label: 'Contain' },
  { id: 'cover',   label: 'Cover' },
];

const FMT_OPTIONS = [
  { id: 'jpg',  label: 'JPG',  mime: 'image/jpeg' },
  { id: 'png',  label: 'PNG',  mime: 'image/png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
];

const PRESETS = [
  { label: '256×94',  w: 256,  h: 94 },
  { label: '512×512', w: 512,  h: 512 },
  { label: '1:1 HD',  w: 1080, h: 1080 },
  { label: 'HD 720p', w: 1280, h: 720 },
  { label: 'FHD',     w: 1920, h: 1080 },
  { label: 'YT Thumb',w: 1280, h: 720 },
  { label: 'OG Image',w: 1200, h: 630 },
  { label: 'Icon 128',w: 128,  h: 128 },
];

async function resizeOne(file, tw, th, fitMode, mime) {
  const { img } = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = tw; canvas.height = th;
  const ctx = canvas.getContext('2d');
  const iw = img.naturalWidth, ih = img.naturalHeight;

  if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tw, th); }

  if (fitMode === 'stretch') {
    ctx.drawImage(img, 0, 0, tw, th);
  } else if (fitMode === 'contain') {
    const scale = Math.min(tw / iw, th / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  } else {
    const scale = Math.max(tw / iw, th / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  }

  return canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92);
}

export default function BulkImageResizer() {
  const seo = SEO_DATA['bulk-image-resizer'] || {};

  const [files, setFiles]       = useState([]);
  const [thumbs, setThumbs]     = useState({}); // {idx: url}
  const [width, setWidth]       = useState('1280');
  const [height, setHeight]     = useState('720');
  const [fitMode, setFitMode]   = useState('stretch');
  const [fmt, setFmt]           = useState('jpg');
  const [stage, setStage]       = useState('idle'); // idle|process|done
  const [statuses, setStatuses] = useState({}); // {idx: 'done'|'error'|'processing'}
  const [blobs, setBlobs]       = useState({});  // {idx: Blob}
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (newFiles) => {
    const arr = Array.from(newFiles)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 20);
    if (!arr.length) return;

    setFiles(prev => {
      const combined = [...prev, ...arr].slice(0, 20);
      return combined;
    });

    // Generate thumbnails
    for (const f of arr) {
      const url = URL.createObjectURL(f);
      setThumbs(prev => ({ ...prev, [files.length + arr.indexOf(f)]: url }));
    }
  }, [files]);

  const removeFile = (i) => {
    if (thumbs[i]) URL.revokeObjectURL(thumbs[i]);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setThumbs(prev => {
      const t = { ...prev };
      delete t[i];
      return t;
    });
    setStatuses(prev => { const s = { ...prev }; delete s[i]; return s; });
    setBlobs(prev => { const b = { ...prev }; delete b[i]; return b; });
  };

  const handleProcess = async () => {
    if (!files.length || stage === 'process') return;
    const tw = Math.max(1, Number(width) || 1280);
    const th = Math.max(1, Number(height) || 720);
    const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mime = mimeMap[fmt] || 'image/jpeg';

    setStage('process');
    setStatuses({});
    setBlobs({});

    await Promise.all(
      files.map(async (f, i) => {
        setStatuses(prev => ({ ...prev, [i]: 'processing' }));
        try {
          const blob = await resizeOne(f, tw, th, fitMode, mime);
          setBlobs(prev => ({ ...prev, [i]: blob }));
          setStatuses(prev => ({ ...prev, [i]: 'done' }));
        } catch (e) {
          setStatuses(prev => ({ ...prev, [i]: 'error' }));
        }
      })
    );

    setStage('done');
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const ext = { jpg: 'jpg', png: 'png', webp: 'webp' }[fmt] || 'jpg';

    for (let i = 0; i < files.length; i++) {
      if (blobs[i]) {
        const base = files[i].name.split('.').slice(0, -1).join('.') || `image${i}`;
        zip.file(`${base}-${width}x${height}.${ext}`, blobs[i]);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-images-${width}x${height}.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadOne = (i) => {
    if (!blobs[i]) return;
    const ext = { jpg: 'jpg', png: 'png', webp: 'webp' }[fmt] || 'jpg';
    const base = files[i].name.split('.').slice(0, -1).join('.') || `image${i}`;
    const url = URL.createObjectURL(blobs[i]);
    const a = document.createElement('a');
    a.href = url; a.download = `${base}-${width}x${height}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    Object.values(thumbs).forEach(u => URL.revokeObjectURL(u));
    setFiles([]); setThumbs({}); setStatuses({}); setBlobs({});
    setStage('idle');
  };

  const doneCount = Object.values(statuses).filter(s => s === 'done').length;
  const errCount  = Object.values(statuses).filter(s => s === 'error').length;

  return (
    <>
      <SEO
        title={seo.title || 'Free Bulk Image Resizer — Resize Multiple Images at Once | OM Tools'}
        description={seo.description || 'Resize up to 20 images at once in your browser. Download all as a ZIP. Presets for social media, wallpapers, icons. 100% free, no upload.'}
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
              <div className="itp-hero__icon-wrap"><span>📦</span></div>
              <div className="itp-hero__text">
                <div className="itp-hero__pills">
                  <span className="itp-pill itp-pill--teal">🖼️ Image Tool</span>
                  <span className="itp-pill itp-pill--free">✦ Free Forever</span>
                  <span className="itp-pill itp-pill--native">🔒 100% In-Browser</span>
                </div>
                <h1 className="itp-hero__title">Bulk Image Resizer</h1>
                <p className="itp-hero__sub">Resize up to 20 images at once. Set dimensions, apply to all, download as a ZIP — all processed in your browser.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="itp-workspace">
          <div className="container container-md">
            <div className="itp-card">
              {/* Drop Zone */}
              <div
                className={`itp-drop${files.length ? ' itp-drop--has-image' : ''}`}
                style={{ minHeight: '160px' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                role="button" tabIndex={0} aria-label="Upload images to resize"
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" multiple
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                  className="itp-drop__input" aria-hidden="true" />
                <div className="itp-drop__body">
                  <div className="itp-drop__icon-wrap"><span>{files.length ? '📦' : '🖼️'}</span></div>
                  <p className="itp-drop__title">
                    {files.length === 0 ? 'Drop images here' : `${files.length} image${files.length > 1 ? 's' : ''} loaded — drop more`}
                  </p>
                  <p className="itp-drop__sub">JPG, PNG, WebP, GIF — up to 20 images</p>
                  <div className="itp-drop__cta">
                    <span className="itp-drop__cta-inner">Browse or drop images</span>
                  </div>
                  <p className="itp-drop__hint">🔒 Your images never leave your device</p>
                </div>
              </div>

              {/* Image grid */}
              {files.length > 0 && (
                <div className="itp-bulk-grid animate-fade-up">
                  {files.map((f, i) => (
                    <div key={i} className="itp-bulk-item">
                      {thumbs[i] && <img src={thumbs[i]} className="itp-bulk-item__img" alt={f.name} />}

                      {/* Status overlay */}
                      <div className="itp-bulk-item__overlay">
                        {statuses[i] === 'done' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadOne(i); }}
                            style={{ background: 'var(--img-primary)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                          >↓</button>
                        ) : statuses[i] === 'error' ? (
                          <span style={{ color: '#F87171', fontSize: '1.2rem' }}>⚠</span>
                        ) : statuses[i] !== 'processing' ? (
                          <button className="itp-bulk-item__remove" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>✕</button>
                        ) : (
                          <span style={{ color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace' }}>⏳</span>
                        )}
                      </div>

                      {/* Status bar */}
                      {statuses[i] === 'done' && (
                        <div className="itp-bulk-item__status" style={{ background: 'var(--img-primary)' }} />
                      )}
                      {statuses[i] === 'error' && (
                        <div className="itp-bulk-item__status" style={{ background: 'var(--danger)' }} />
                      )}
                      {statuses[i] === 'processing' && (
                        <div className="itp-bulk-item__status" style={{ background: 'var(--warning)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Controls */}
              {files.length > 0 && (
                <div className="itp-controls animate-fade-up">
                  <p className="itp-controls__title">Resize Settings — Applied to All Images</p>

                  {/* Presets */}
                  <div className="itp-ctrl-row" style={{ alignItems: 'flex-start' }}>
                    <label className="itp-ctrl-label">Quick Presets</label>
                    <div className="itp-preset-grid">
                      {PRESETS.map(p => (
                        <button key={p.label} className="itp-preset-pill"
                          onClick={() => { setWidth(String(p.w)); setHeight(String(p.h)); }}>{p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="itp-ctrl-row">
                    <label className="itp-ctrl-label" htmlFor="bulk-w">Width (px)</label>
                    <input id="bulk-w" type="number" className="itp-ctrl-input" min={1} max={8000}
                      value={width} onChange={(e) => setWidth(e.target.value)} />
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.9rem', fontWeight: 700, padding: '0 0.25rem' }}>×</span>
                    <label className="itp-ctrl-label" htmlFor="bulk-h">Height (px)</label>
                    <input id="bulk-h" type="number" className="itp-ctrl-input" min={1} max={8000}
                      value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>

                  {/* Fit + Format */}
                  <div className="itp-ctrl-row">
                    <label className="itp-ctrl-label">Fit Mode</label>
                    <div className="itp-fmt-pills">
                      {FIT_MODES.map(f => (
                        <button key={f.id}
                          className={`itp-fmt-pill${fitMode === f.id ? ' itp-fmt-pill--active' : ''}`}
                          onClick={() => setFitMode(f.id)}>{f.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="itp-ctrl-row">
                    <label className="itp-ctrl-label">Output Format</label>
                    <div className="itp-fmt-pills">
                      {FMT_OPTIONS.map(f => (
                        <button key={f.id}
                          className={`itp-fmt-pill${fmt === f.id ? ' itp-fmt-pill--active' : ''}`}
                          onClick={() => setFmt(f.id)}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress / results */}
              {stage === 'process' && (
                <div className="itp-prog animate-fade-up">
                  <div className="itp-prog__top">
                    <span className="itp-prog__label">Resizing {doneCount + errCount} / {files.length}…</span>
                    <span className="itp-prog__pct">{Math.round(((doneCount + errCount) / files.length) * 100)}%</span>
                  </div>
                  <div className="itp-prog__track">
                    <div className="itp-prog__bar" style={{ width: `${((doneCount + errCount) / files.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {stage === 'done' && (
                <div style={{
                  display: 'flex', gap: '0.75rem', marginTop: '1.25rem',
                  padding: '1rem', background: 'rgba(20,184,166,0.06)',
                  border: '1px solid var(--img-primary-border)', borderRadius: '12px', flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'var(--img-primary-light)', fontWeight: 700, fontSize: '0.9rem' }}>
                    ✅ {doneCount} resized{errCount > 0 ? `, ⚠️ ${errCount} failed` : ''}
                  </span>
                  <button
                    onClick={downloadAll}
                    className="itp-result__download"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    id="download-zip-btn"
                  >
                    ↓ Download ZIP ({doneCount} images)
                  </button>
                  <button onClick={handleReset} className="itp-result__again" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    ↺ Start over
                  </button>
                </div>
              )}

              {/* Go button */}
              {files.length > 0 && stage !== 'process' && stage !== 'done' && (
                <button className="itp-go-btn" onClick={handleProcess} id="process-btn">
                  <span className="itp-go-btn__icon">📦</span>
                  <span>Resize {files.length} Image{files.length > 1 ? 's' : ''} to {width}×{height}</span>
                  <span className="itp-go-btn__arrow">→</span>
                </button>
              )}
            </div>

            <div className="itp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              All resizing and ZIP packaging runs <strong>entirely in your browser</strong>. No upload, no server, no tracking.
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
