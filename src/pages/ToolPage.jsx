import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import UrlInput from '../components/UrlInput.jsx';
import { detectPlatform } from '../constants/tools.js';
import './ToolPage.css';

/* ── Download result card ── */
function DownloadCard({ result, onDownload }) {
  return (
    <div className="dl-card animate-fade-up">
      {result.thumbnail && (
        <div className="dl-card__thumb-wrap">
          <img
            src={result.thumbnail}
            alt={result.title}
            className="dl-card__thumb"
            loading="lazy"
          />
          {result.duration && (
            <span className="dl-card__duration">{result.duration}</span>
          )}
        </div>
      )}
      <div className="dl-card__info">
        <h3 className="dl-card__title">{result.title}</h3>
        {result.channel && (
          <p className="dl-card__channel">📺 {result.channel}</p>
        )}
        <div className="dl-card__formats">
          {result.formats.map((fmt) => (
            <button
              key={fmt.id}
              className="dl-format-btn"
              onClick={() => onDownload(fmt)}
              aria-label={`Download ${fmt.label} ${fmt.quality}`}
            >
              <span className="dl-format-btn__label">{fmt.label}</span>
              <span className="dl-format-btn__quality">{fmt.quality}</span>
              {fmt.size && <span className="dl-format-btn__size">{fmt.size}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton loader ── */
function SkeletonCard() {
  return (
    <div className="dl-skeleton">
      <div className="skeleton dl-skeleton__thumb" />
      <div className="dl-skeleton__info">
        <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 16, borderRadius: 6 }} />
        <div className="dl-skeleton__formats">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── FAQ for tool pages ── */
function ToolFAQ({ faqs }) {
  const [open, setOpen] = useState(null);
  if (!faqs?.length) return null;
  return (
    <section className="tool-faq section-sm" aria-label="FAQ">
      <div className="container">
        <h2 className="tool-faq__heading">Frequently Asked Questions</h2>
        <div className="tool-faq__list">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
              <button
                className="faq-item__trigger"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="faq-item__q">{faq.q}</span>
                <span className="faq-item__chevron">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="faq-item__panel">
                  <p className="faq-item__a">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Generic Tool Page (used for media downloaders) ── */
export default function ToolPage({
  seo,
  title,
  subtitle,
  icon,
  platform,
  supportedTypes,
  formats,
  faqs,
  features,
  inputPlaceholder,
}) {
  const [searchParams] = useSearchParams();
  const [url, setUrl]         = useState(searchParams.get('url') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [downloaded, setDownloaded] = useState(false);

  // Auto-fetch if URL came from query string
  useEffect(() => {
    const q = searchParams.get('url');
    if (q) {
      setUrl(q);
      handleFetch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Simulate fetch (offline-safe demo) ──
     In production, replace with your backend API call.
     We build thumbnail URLs directly from YouTube's CDN
     and provide a demo result card for demonstration.
  */
  async function handleFetch(targetUrl) {
    setError('');
    setResult(null);
    setLoading(true);

    const trimmed = (targetUrl || url).trim();
    if (!trimmed) { setError('Please paste a URL first.'); setLoading(false); return; }

    const det = detectPlatform(trimmed);
    if (!det) { setError('This URL is not from a supported platform.'); setLoading(false); return; }

    if (platform && det.platform !== platform) {
      setError(`This tool is for ${platform} URLs. You pasted a ${det.platform} URL.`);
      setLoading(false); return;
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1600));

    // Build demo result — for YouTube extract video ID and use CDN thumbnail
    if (det.platform === 'youtube') {
      let videoId = null;
      try {
        const u = new URL(trimmed);
        videoId = u.searchParams.get('v') ||
          (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null) ||
          (trimmed.includes('/shorts/') ? trimmed.split('/shorts/')[1].split('?')[0] : null);
      } catch { /* ignore */ }

      setResult({
        title: 'YouTube Video (Demo Preview)',
        channel: 'Demo Channel',
        duration: '3:45',
        thumbnail: videoId
          ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          : null,
        formats: formats || [
          { id: 'mp4-1080', label: 'MP4', quality: '1080p HD', size: '~85 MB' },
          { id: 'mp4-720',  label: 'MP4', quality: '720p',     size: '~45 MB' },
          { id: 'mp4-480',  label: 'MP4', quality: '480p',     size: '~25 MB' },
          { id: 'mp3-320',  label: 'MP3', quality: '320 kbps', size: '~8 MB'  },
        ],
      });
    } else {
      // Instagram / other demo
      setResult({
        title: 'Instagram Media (Demo Preview)',
        channel: 'Instagram User',
        duration: null,
        thumbnail: null,
        formats: formats || [
          { id: 'mp4-hd', label: 'MP4', quality: 'HD Original', size: '~20 MB' },
          { id: 'mp4-sd', label: 'MP4', quality: 'SD',          size: '~8 MB'  },
        ],
      });
    }

    setLoading(false);
  }

  function handleDownloadFormat(fmt) {
    setDownloaded(true);
    // In production: trigger actual download via signed URL or redirect
    alert(`⚡ Preparing your ${fmt.label} ${fmt.quality} download...\n\nNote: Connect a backend API (e.g. yt-dlp service) to enable real downloads.`);
  }

  const faqSchema = faqs ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : undefined;

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        url={seo.url}
        schema={faqSchema}
      />

      <main id="main-content">
        {/* ── Tool Hero ── */}
        <section className="tool-hero">
          <div className="tool-hero__bg" aria-hidden="true" />
          <div className="container">
            <div className="tool-hero__content">
              <div className="tool-hero__badge">
                <span aria-hidden="true">{icon}</span>
                {platform && <span className="tool-hero__platform">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>}
              </div>
              <h1 className="tool-hero__title">{title}</h1>
              <p className="tool-hero__subtitle">{subtitle}</p>

              {/* URL Input */}
              <div className="tool-hero__input">
                <div className="tool-url-form">
                  <UrlInput
                    placeholder={inputPlaceholder || 'Paste URL here...'}
                    autoNavigate={false}
                  />
                  <button
                    className="btn btn-primary btn-lg tool-hero__fetch-btn"
                    onClick={() => handleFetch()}
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <><span className="spinner" aria-hidden="true" /> Analyzing...</>
                    ) : (
                      <><span aria-hidden="true">⚡</span> Get Download Link</>
                    )}
                  </button>
                </div>
              </div>

              {/* Supported types */}
              {supportedTypes && (
                <div className="tool-hero__tags">
                  {supportedTypes.map(t => (
                    <span key={t} className="badge badge-primary">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Result area ── */}
        <section className="tool-result section-sm" aria-live="polite" aria-atomic="true">
          <div className="container container-md">
            {error && (
              <div className="tool-error animate-fade-up" role="alert">
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}
            {loading && <SkeletonCard />}
            {result && !loading && (
              <DownloadCard result={result} onDownload={handleDownloadFormat} />
            )}
            {downloaded && (
              <p className="tool-download-note animate-fade-up">
                🎉 Your download is being prepared! Connect a backend service (yt-dlp) to enable real file downloads.
              </p>
            )}
          </div>
        </section>

        {/* ── Features ── */}
        {features && (
          <section className="tool-features section-sm">
            <div className="container">
              <h2 className="tool-features__heading">Why use OM Tools?</h2>
              <div className="tool-features__grid">
                {features.map((f) => (
                  <div key={f.title} className="feature-card">
                    <span className="feature-card__icon" aria-hidden="true">{f.icon}</span>
                    <h3 className="feature-card__title">{f.title}</h3>
                    <p className="feature-card__desc">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SEO content ── */}
        <section className="tool-seo-content section-sm">
          <div className="container container-sm">
            <div className="tool-seo-content__inner">
              <h2>{title} — Free Online Tool</h2>
              <p>
                Use OM Tools' <strong>{title}</strong> to download media from {platform || 'supported platforms'} quickly and for free.
                No registration required. Works on all modern browsers and mobile devices.
              </p>
              <h3>How to use {title}</h3>
              <ol>
                <li>Copy the URL of the video or media you want to download.</li>
                <li>Paste it into the input box above.</li>
                <li>Click <strong>Get Download Link</strong> and wait a moment.</li>
                <li>Choose your preferred format and quality.</li>
                <li>Click the format button to start downloading.</li>
              </ol>
              <div className="tool-back-link">
                <Link to="/" className="btn btn-outline btn-sm">← Back to All Tools</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {faqs && <ToolFAQ faqs={faqs} />}
      </main>
    </>
  );
}
