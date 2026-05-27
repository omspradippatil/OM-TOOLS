import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO.jsx';
import { isFFmpegSupported } from '../services/ffmpegLoader.js';
import './LocalToolPage.css';

/* ═══════════════════════════════════════════════
   DropZone — Animated drag-and-drop area
═══════════════════════════════════════════════ */
function DropZone({ accept, onFile, icon, label, sublabel }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div
      className={`ltp-drop${drag ? ' ltp-drop--over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Upload — ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="ltp-drop__input" aria-hidden="true" />

      {/* Animated border */}
      <div className="ltp-drop__border" aria-hidden="true" />

      <div className="ltp-drop__body">
        <div className={`ltp-drop__icon-wrap${drag ? ' ltp-drop__icon-wrap--drag' : ''}`} aria-hidden="true">
          <span className="ltp-drop__emoji">{icon}</span>
          <div className="ltp-drop__ring" />
        </div>

        <p className="ltp-drop__title">{drag ? 'Release to upload' : label}</p>
        <p className="ltp-drop__sub">{sublabel}</p>

        <div className="ltp-drop__cta">
          <span className="ltp-drop__cta-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Browse or drop a file
          </span>
        </div>

        <p className="ltp-drop__hint">🔒 Your files never leave your device</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MediaPreview — Video or Audio player
═══════════════════════════════════════════════ */
function MediaPreview({ file, mediaUrl, onDurationChange }) {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v)$/i.test(file.name);
  const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|aac|m4a|opus|wma)$/i.test(file.name);

  const handleMeta = (e) => {
    const d = e.target.duration;
    if (d && isFinite(d) && onDurationChange) onDurationChange(d);
  };

  if (isVideo) {
    return (
      <div className="ltp-preview ltp-preview--video animate-fade-up">
        <div className="ltp-preview__label">
          <span className="ltp-preview__dot" /> Preview
        </div>
        <video
          className="ltp-preview__video"
          src={mediaUrl}
          controls
          preload="metadata"
          onLoadedMetadata={handleMeta}
          aria-label={`Preview of ${file.name}`}
        />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="ltp-preview ltp-preview--audio animate-fade-up">
        <div className="ltp-preview__label">
          <span className="ltp-preview__dot" /> Audio Preview
        </div>
        <div className="ltp-preview__audio-wrap">
          <div className="ltp-preview__audio-icon" aria-hidden="true">🎵</div>
          <div className="ltp-preview__audio-info">
            <p className="ltp-preview__audio-name">{file.name}</p>
            <audio
              className="ltp-preview__audio"
              src={mediaUrl}
              controls
              preload="metadata"
              onLoadedMetadata={handleMeta}
              aria-label={`Preview of ${file.name}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════
   FileBar — Compact file info + change button
═══════════════════════════════════════════════ */
function FileBar({ file, onClear, duration }) {
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);
  const ext    = file.name.split('.').pop().toUpperCase();

  const fmtDuration = (s) => {
    if (!s || !isFinite(s)) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <div className="ltp-filebar animate-fade-up">
      <div className="ltp-filebar__icon" aria-hidden="true">
        {ext === 'MP3' || ext === 'WAV' || ext === 'FLAC' ? '🎵' : '🎬'}
      </div>
      <div className="ltp-filebar__info">
        <span className="ltp-filebar__name" title={file.name}>{file.name}</span>
        <span className="ltp-filebar__meta">
          <span className="ltp-filebar__tag">{ext}</span>
          {sizeMB} MB
          {duration ? ` · ${fmtDuration(duration)}` : ''}
        </span>
      </div>
      <button className="ltp-filebar__change" onClick={onClear} aria-label="Change file">
        Change file
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   InlineProgress — Shown inside the tool card
═══════════════════════════════════════════════ */
function InlineProgress({ progress, stage }) {
  const pct = Math.round((progress || 0) * 100);
  const label = stage === 'process'
    ? (pct < 10 ? 'Loading ffmpeg.wasm…' : pct < 99 ? `Processing… ${pct}%` : 'Finalising…')
    : stage === 'done' ? 'Done!' : 'Error';

  return (
    <div className="ltp-prog animate-fade-up" role="status" aria-live="polite">
      <div className="ltp-prog__top">
        <span className="ltp-prog__label">{label}</span>
        <span className="ltp-prog__pct">{pct}%</span>
      </div>
      <div className="ltp-prog__track">
        <div
          className={`ltp-prog__bar${stage === 'done' ? ' ltp-prog__bar--done' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="ltp-prog__hint">🔒 Processing on your device · Your file stays private</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   OutputCard — Preview + download
═══════════════════════════════════════════════ */
function OutputCard({ outputUrl, outputName, outputMime, onReset }) {
  const isVideo = outputMime?.startsWith('video/');
  const isAudio = outputMime?.startsWith('audio/');
  const isGif   = outputMime === 'image/gif';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="ltp-result animate-fade-up">
      {/* Success header */}
      <div className="ltp-result__header">
        <div className="ltp-result__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="ltp-result__title">Processing complete!</p>
          <p className="ltp-result__file">{outputName}</p>
        </div>
      </div>

      {/* Output preview */}
      {isVideo && (
        <div className="ltp-result__preview">
          <video src={outputUrl} controls className="ltp-result__video" aria-label="Output preview" />
        </div>
      )}
      {isAudio && (
        <div className="ltp-result__preview ltp-result__preview--audio">
          <div className="ltp-result__audio-icon" aria-hidden="true">🎵</div>
          <audio src={outputUrl} controls className="ltp-result__audio" aria-label="Output preview" />
        </div>
      )}
      {isGif && (
        <div className="ltp-result__preview">
          <img src={outputUrl} alt="Generated GIF preview" className="ltp-result__gif" />
        </div>
      )}

      {/* Actions */}
      <div className="ltp-result__actions">
        <button className="ltp-result__download" onClick={handleDownload} id="download-output-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download {outputName.split('.').pop().toUpperCase()}
        </button>
        <button className="ltp-result__again" onClick={onReset}>
          ↺ Process another file
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ErrorCard
═══════════════════════════════════════════════ */
function ErrorCard({ msg, onRetry }) {
  return (
    <div className="ltp-error animate-fade-up" role="alert">
      <div className="ltp-error__icon" aria-hidden="true">❌</div>
      <div>
        <p className="ltp-error__title">Processing failed</p>
        <p className="ltp-error__msg">{msg || 'An unexpected error occurred. Please try again.'}</p>
      </div>
      <button className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FAQList
═══════════════════════════════════════════════ */
function FAQList({ faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="ltp-faq__list">
      {faqs.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
          <button
            className="faq-item__trigger"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
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

/* ═══════════════════════════════════════════════
   LocalToolPage — Main wrapper
═══════════════════════════════════════════════ */
export default function LocalToolPage({
  seo, icon, title, subtitle,
  accept, dropIcon, dropLabel, dropSublabel,
  renderControls,
  processFile,
  faqs,
}) {
  const [file, setFile]         = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [duration, setDuration] = useState(null);
  const [options, setOptions]   = useState({});
  const [stage, setStage]       = useState('idle'); // idle | process | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const [output, setOutput]     = useState(null);
  const abortRef = useRef(false);

  const supported = isFFmpegSupported();

  /* Cleanup URLs on unmount */
  useEffect(() => {
    return () => {
      if (mediaUrl)  URL.revokeObjectURL(mediaUrl);
      if (output?.url) URL.revokeObjectURL(output.url);
    };
  }, []); // eslint-disable-line

  const handleFile = useCallback((f) => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    if (output?.url) URL.revokeObjectURL(output.url);
    const url = URL.createObjectURL(f);
    setFile(f);
    setMediaUrl(url);
    setDuration(null);
    setOptions({});
    setOutput(null);
    setError('');
    setStage('idle');
    setProgress(0);
  }, [mediaUrl, output]);

  const handleClear = () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    if (output?.url) URL.revokeObjectURL(output.url);
    setFile(null);
    setMediaUrl(null);
    setDuration(null);
    setOutput(null);
    setOptions({});
    setError('');
    setStage('idle');
    setProgress(0);
  };

  const handleProcess = async () => {
    if (!file || stage === 'process') return;
    abortRef.current = false;
    setError('');
    setProgress(0);
    setStage('process');

    try {
      const result = await processFile(file, options, (p) => {
        if (!abortRef.current) setProgress(p);
      });

      if (abortRef.current) return;

      const blob = new Blob([result.data], { type: result.mime });
      const url  = URL.createObjectURL(blob);
      setOutput({ url, name: result.filename, mime: result.mime });
      setProgress(1);
      setStage('done');
    } catch (e) {
      if (abortRef.current) return;
      console.error('[ffmpeg] Processing error:', e);
      const msg = e?.message || String(e) || 'Processing failed. Please try a different file.';
      setError(msg);
      setStage('error');
    }
  };

  const handleRetry = () => {
    setError('');
    setStage('idle');
    setProgress(0);
  };

  const handleReset = () => {
    if (output?.url) URL.revokeObjectURL(output.url);
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setFile(null);
    setMediaUrl(null);
    setDuration(null);
    setOutput(null);
    setOptions({});
    setError('');
    setStage('idle');
    setProgress(0);
  };

  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />

      <main id="main-content" className="ltp-page">
        {/* ── Hero ── */}
        <section className="ltp-hero">
          <div className="ltp-hero__glow" aria-hidden="true" />
          <div className="container">
            <div className="ltp-hero__body">
              <div className="ltp-hero__icon-wrap" aria-hidden="true">
                <span className="ltp-hero__icon">{icon}</span>
              </div>
              <div className="ltp-hero__text">
                <div className="ltp-hero__pills">
                  <span className="ltp-pill ltp-pill--lock">🔒 100% Local</span>
                  <span className="ltp-pill ltp-pill--free">✦ Free Forever</span>
                </div>
                <h1 className="ltp-hero__title">{title}</h1>
                <p className="ltp-hero__sub">{subtitle}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tool card ── */}
        <section className="ltp-workspace">
          <div className="container container-md">

            {!isFFmpegSupported() && (
              <div className="ltp-compat-warn" role="alert">
                <span aria-hidden="true">⚠️</span>
                <div>
                  <strong>Browser not compatible.</strong> <code>WebAssembly</code> is required for in-browser processing.
                  Please update to a modern web browser (e.g. Chrome, Firefox, Safari, Edge).
                </div>
              </div>
            )}

            {isFFmpegSupported() && (
              <div className="ltp-card">
                {/* ── Step 1: File drop (only when no file) ── */}
                {!file && stage !== 'done' && (
                  <DropZone
                    accept={accept}
                    onFile={handleFile}
                    icon={dropIcon}
                    label={dropLabel}
                    sublabel={dropSublabel}
                  />
                )}

                {/* ── Step 2: File loaded ── */}
                {file && stage !== 'done' && (
                  <>
                    {/* File bar */}
                    <FileBar file={file} onClear={handleClear} duration={duration} />

                    {/* Media preview */}
                    {mediaUrl && stage === 'idle' && (
                      <MediaPreview
                        file={file}
                        mediaUrl={mediaUrl}
                        onDurationChange={setDuration}
                      />
                    )}

                    {/* Tool controls */}
                    {renderControls && stage === 'idle' && (
                      <div className="ltp-controls animate-fade-up">
                        {renderControls(file, options, setOptions, duration)}
                      </div>
                    )}

                    {/* Inline progress bar */}
                    {stage === 'process' && (
                      <InlineProgress progress={progress} stage={stage} />
                    )}

                    {/* Error */}
                    {stage === 'error' && (
                      <ErrorCard msg={error} onRetry={handleRetry} />
                    )}

                    {/* Process button */}
                    {stage === 'idle' && (
                      <button
                        className="ltp-go-btn"
                        onClick={handleProcess}
                        id="process-btn"
                        aria-label={`Process ${file.name}`}
                      >
                        <span className="ltp-go-btn__icon" aria-hidden="true">⚙</span>
                        <span>Process File</span>
                        <span className="ltp-go-btn__arrow" aria-hidden="true">→</span>
                      </button>
                    )}

                    {stage === 'process' && (
                      <button className="ltp-cancel-btn" onClick={() => { abortRef.current = true; setStage('idle'); setProgress(0); }}>
                        Cancel
                      </button>
                    )}
                  </>
                )}

                {/* ── Step 3: Done ── */}
                {stage === 'done' && output && (
                  <OutputCard
                    outputUrl={output.url}
                    outputName={output.name}
                    outputMime={output.mime}
                    onReset={handleReset}
                  />
                )}
              </div>
            )}

            {/* Privacy banner */}
            <div className="ltp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              All processing runs inside your browser using <strong>ffmpeg.wasm</strong>. Your files are never uploaded to any server.
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {faqs && faqs.length > 0 && (
          <section className="ltp-faq section-sm">
            <div className="container container-sm">
              <h2 className="ltp-faq__title">Frequently Asked Questions</h2>
              <FAQList faqs={faqs} />
            </div>
          </section>
        )}

        {/* Back */}
        <div className="ltp-back">
          <div className="container">
            <Link to="/" className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              All Tools
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
