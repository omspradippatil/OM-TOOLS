import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import UrlInput from '../components/UrlInput.jsx';
import ProcessingOverlay from '../components/ProcessingOverlay.jsx';
import { detectPlatform, isValidUrl } from '../constants/tools.js';
import {
  fetchCobaltLink,
  downloadToBuffer,
  convertWithFFmpeg,
  saveToDevice,
  mimeForExt,
  formatToOptions,
} from '../services/downloader.js';
import './ToolPage.css';

/* ── Skeleton loader ── */
function SkeletonCard() {
  return (
    <div className="dl-skeleton">
      <div className="skeleton dl-skeleton__thumb" />
      <div className="dl-skeleton__info">
        <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 16, borderRadius: 6 }} />
        <div className="dl-skeleton__formats">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Download card ── */
function DownloadCard({ result, onDownload, busy }) {
  return (
    <div className="dl-card animate-fade-up">
      {result.thumbnail && (
        <div className="dl-card__thumb-wrap">
          <img src={result.thumbnail} alt={result.title} className="dl-card__thumb" loading="lazy"
            onError={(e) => { e.target.style.display='none'; }} />
          {result.duration && <span className="dl-card__duration">{result.duration}</span>}
        </div>
      )}
      <div className="dl-card__info">
        <h3 className="dl-card__title">{result.title}</h3>
        {result.channel && <p className="dl-card__channel">📺 {result.channel}</p>}
        <div className="dl-card__formats">
          {result.formats.map((fmt) => (
            <button
              key={fmt.id}
              className="dl-format-btn"
              onClick={() => onDownload(fmt)}
              disabled={busy}
              aria-label={`Download ${fmt.label} ${fmt.quality}`}
            >
              <span className="dl-format-btn__label">{fmt.label}</span>
              <span className="dl-format-btn__quality">{fmt.quality}</span>
              {fmt.size && <span className="dl-format-btn__size">{fmt.size}</span>}
            </button>
          ))}
        </div>
        <div className="dl-card__privacy-note">
          <span aria-hidden="true">🔒</span>
          Downloads happen directly on your device — no data passes through our servers
        </div>
      </div>
    </div>
  );
}

/* ── FAQ ── */
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
              <button className="faq-item__trigger" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
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

/* ═══════════════════════════════════════════════
   Main ToolPage Component
═══════════════════════════════════════════════ */
export default function ToolPage({
  seo, title, subtitle, icon, platform,
  supportedTypes, formats, faqs, features, inputPlaceholder,
}) {
  const [searchParams] = useSearchParams();
  const [urlVal, setUrlVal]       = useState(searchParams.get('url') || '');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Processing overlay state
  const [procStage, setProcStage]       = useState(null); // null = hidden
  const [procProgress, setProcProgress] = useState(0);
  const [procSpeed, setProcSpeed]       = useState('');
  const [procFilename, setProcFilename] = useState('');
  const [procError, setProcError]       = useState('');

  const abortRef = useRef(null);

  useEffect(() => {
    const q = searchParams.get('url');
    if (q && isValidUrl(q)) handleFetch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Step 1: Fetch media info via Cobalt ── */
  async function handleFetch(targetUrl) {
    const url = (targetUrl || urlVal).trim();
    if (!url) { setFetchError('Please paste a URL first.'); return; }
    if (!isValidUrl(url)) { setFetchError('That doesn\'t look like a valid URL.'); return; }

    const det = detectPlatform(url);
    if (!det) { setFetchError('This platform is not supported yet.'); return; }
    if (platform && det.platform !== platform) {
      setFetchError(`This tool is for ${platform} URLs. Paste a ${platform}.com link.`);
      return;
    }

    setFetchError('');
    setResult(null);
    setLoading(true);

    try {
      // For YouTube: extract video ID for thumbnail CDN
      let videoId = null;
      if (det.platform === 'youtube') {
        try {
          const u = new URL(url);
          videoId = u.searchParams.get('v') ||
            (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null) ||
            (url.includes('/shorts/') ? url.split('/shorts/')[1]?.split('?')[0] : null);
        } catch { /* ignore */ }
      }

      // Build result card
      const isAudio = title.toLowerCase().includes('mp3') || title.toLowerCase().includes('audio');
      const isThumbnail = title.toLowerCase().includes('thumbnail');

      const resultFormats = formats || buildDefaultFormats(det.platform, det.type, isAudio, isThumbnail);

      setResult({
        title:     `${det.platform.charAt(0).toUpperCase() + det.platform.slice(1)} — ${det.type}`,
        channel:   det.platform === 'youtube' ? 'YouTube Video' : `${det.platform} Media`,
        duration:  null,
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null,
        sourceUrl: url,
        formats:   resultFormats,
      });
    } catch (e) {
      setFetchError(e.message || 'Failed to analyze the URL. Please try again.');
    }

    setLoading(false);
  }

  /* ── Step 2+: Real on-device download ── */
  async function handleDownload(fmt) {
    const fmtOpts = formatToOptions(fmt.id);
    const sourceUrl = result.sourceUrl;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setProcError('');
    setProcProgress(0);
    setProcSpeed('');
    setProcFilename('');
    setProcStage('fetch');

    try {
      /* ── Stage 1: Get Cobalt signed URL ── */
      let directUrl, audioUrl, filename;
      try {
        const cobalt = await fetchCobaltLink(sourceUrl, {
          mode:         fmtOpts.mode,
          quality:      fmtOpts.quality,
          audioFormat:  fmtOpts.audioFormat,
          audioBitrate: fmtOpts.audioBitrate,
          signal,
        });
        directUrl = cobalt.url;
        audioUrl  = cobalt.audioUrl;
        filename  = cobalt.filename || `om-tools-download.${fmtOpts.ext}`;
      } catch (cobaltErr) {
        // Cobalt failed — inform user clearly
        throw new Error(
          `Could not fetch the download link. ${cobaltErr.message || ''}\n\n` +
          'This can happen if the video is age-restricted, private, or the URL format changed. ' +
          'Try a different video or check the URL.'
        );
      }

      // Ensure correct extension in filename
      if (!filename.endsWith(`.${fmtOpts.ext}`)) {
        filename = filename.split('.').slice(0, -1).join('.') + `.${fmtOpts.ext}` || `download.${fmtOpts.ext}`;
      }
      setProcFilename(filename);

      // REDESIGN: Check if we can perform a native background download to hit 100% Wi-Fi speed and consume 0MB RAM
      const canDownloadNatively = !fmtOpts.needsConvert && !audioUrl;
        console.log('canDownloadNatively', canDownloadNatively);
      if (canDownloadNatively) {
        let downloadUrl = directUrl;
        if (!import.meta.env.PROD && directUrl.includes('googlevideo.com')) {
          downloadUrl = `/api/stream?url=${encodeURIComponent(directUrl)}&download=1&filename=${encodeURIComponent(filename)}`;
        }

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 15000);

        setProcStage('done');
        setProcProgress(1);

        // Log success to Firestore for dynamic counter
        try {
          const { db } = await import('../firebase');
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
          await addDoc(collection(db, 'downloads'), {
            timestamp: serverTimestamp(),
            platform: platform || 'youtube',
            quality: fmtOpts.quality || 'unknown',
            mode: fmtOpts.mode || 'video'
          });
        } catch (dbErr) {
          console.error('Failed to log successful download:', dbErr);
        }
        return;
      }

      /* ── Stage 2: Download raw bytes to browser ── */
      setProcStage('download');
      setProcProgress(0);

      const rawData = await downloadToBuffer(
        directUrl,
        (data) => {
          if (typeof data === 'number') {
            setProcProgress(data);
          } else {
            setProcProgress(data.progress);
            setProcSpeed(data.speed);
          }
        },
        signal
      );

      let audioData = null;
      if (audioUrl) {
        setProcProgress(0);
        audioData = await downloadToBuffer(
          audioUrl,
          (data) => {
            if (typeof data === 'number') {
              setProcProgress(data);
            } else {
              setProcProgress(data.progress);
              setProcSpeed(data.speed);
            }
          },
          signal
        );
      }

      /* ── Stage 3: Convert if needed (ffmpeg.wasm) ── */
      let finalData = rawData;
      if (fmtOpts.needsConvert || audioUrl) {
        setProcStage('process');
        setProcProgress(0);
        // Force a safe generic extension to prevent ffmpeg virtual filesystem path errors
        const sourceExt = 'mp4'; 
        finalData = await convertWithFFmpeg(rawData, sourceExt, fmtOpts.ext, {
          bitrate: fmtOpts.audioBitrate ? `${fmtOpts.audioBitrate}k` : '320k',
          audioData: audioData,
          onProgress: (p) => setProcProgress(p),
        });
      }

      /* ── Stage 4: Save to device ── */
      saveToDevice(finalData, filename, mimeForExt(fmtOpts.ext));
      setProcStage('done');
      setProcProgress(1);

      // Log success to Firestore for dynamic counter
      try {
        const { db } = await import('../firebase');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'downloads'), {
          timestamp: serverTimestamp(),
          platform: platform || 'youtube',
          quality: fmtOpts.quality || 'unknown',
          mode: fmtOpts.mode || 'video'
        });
      } catch (dbErr) {
        console.error('Failed to log successful download:', dbErr);
      }

    } catch (e) {
      if (e.name === 'AbortError') {
        setProcStage(null); // cancelled by user
        return;
      }
      setProcError(e.message || 'Download failed. Please try again.');
      setProcStage('error');
      
      // Log failure to Firestore
      try {
        const { db } = await import('../firebase');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'downloadLogs'), {
          error: (e && e.message) ? e.message : (e ? e.toString() : 'Unknown error'),
          url: sourceUrl,
          timestamp: serverTimestamp(),
          stage: procStage || 'unknown'
        });
      } catch (logErr) {
        console.error('Failed to save log to Firestore:', logErr);
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setProcStage(null);
  }

  function handleCloseOverlay() {
    setProcStage(null);
    setProcError('');
    setProcProgress(0);
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

      {/* Processing overlay — portal-like, above everything */}
      {procStage && (
        <ProcessingOverlay
          stage={procStage}
          progress={procProgress}
          speed={procSpeed}
          filename={procFilename}
          errorMsg={procError}
          onCancel={handleCancel}
          onClose={handleCloseOverlay}
        />
      )}

      <main id="main-content">
        {/* ── Tool Hero ── */}
        <section className="tool-hero">
          <div className="tool-hero__bg" aria-hidden="true" />
          <div className="container">
            <div className="tool-hero__content">
              <div className="tool-hero__badge">
                <span aria-hidden="true">{icon}</span>
                {platform && (
                  <span className="tool-hero__platform">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                )}
              </div>
              <h1 className="tool-hero__title">{title}</h1>
              <p className="tool-hero__subtitle">{subtitle}</p>

              {platform !== 'youtube' ? (
                <div className="tool-hero__coming-soon">
                  <h3><span aria-hidden="true">🚧</span> Under Construction</h3>
                  <p>Our raw downloader for {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'this platform'} is currently being built.</p>
                  <Link to="/youtube-video-downloader" className="btn btn-outline btn-sm">Try YouTube Downloader</Link>
                </div>
              ) : (
                <div className="tool-hero__input">
                  <UrlInput
                    placeholder={inputPlaceholder || 'Paste URL here...'}
                    autoNavigate={false}
                    value={urlVal}
                    onValueChange={setUrlVal}
                    onFetch={handleFetch}
                  />
                  {loading && (
                    <p className="tool-hero__analyzing">
                      <span className="spinner" aria-hidden="true" /> Analyzing URL...
                    </p>
                  )}
                </div>
              )}

              {supportedTypes && (
                <div className="tool-hero__tags">
                  {supportedTypes.map(t => <span key={t} className="badge badge-primary">{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Result area ── */}
        <section className="tool-result section-sm" aria-live="polite" aria-atomic="true">
          <div className="container container-md">
            {fetchError && (
              <div className="tool-error animate-fade-up" role="alert">
                <span aria-hidden="true">⚠️</span> {fetchError}
              </div>
            )}
            {loading && <SkeletonCard />}
            {result && !loading && (
              <DownloadCard result={result} onDownload={handleDownload} busy={!!procStage} />
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
                OM Tools' <strong>{title}</strong> downloads media directly to your device from
                {platform ? ` ${platform.charAt(0).toUpperCase() + platform.slice(1)}` : ' supported platforms'}.
                No registration required. Works on all modern browsers and mobile devices.
              </p>
              <h3>How to use {title}</h3>
              <ol>
                <li>Copy the URL of the video or media you want to download.</li>
                <li>Paste it into the input box above.</li>
                <li>Click <strong>Get Download Link</strong> and wait a moment.</li>
                <li>Choose your preferred format and quality.</li>
                <li>The download starts immediately — processed 100% on your device.</li>
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

/* ── Default format lists per platform/type ── */
function buildDefaultFormats(platform, type, isAudio, isThumbnail) {
  if (isThumbnail) {
    return [
      { id: 'maxres', label: 'JPG', quality: 'MaxRes 1280×720', size: '~120 KB' },
      { id: 'hq',     label: 'JPG', quality: 'HQ 480×360',      size: '~40 KB'  },
      { id: 'mq',     label: 'JPG', quality: 'MQ 320×180',      size: '~20 KB'  },
    ];
  }
  if (isAudio) {
    return [
      { id: 'mp3-320', label: 'MP3', quality: '320 kbps', size: '~8 MB'  },
      { id: 'mp3-256', label: 'MP3', quality: '256 kbps', size: '~6 MB'  },
      { id: 'mp3-192', label: 'MP3', quality: '192 kbps', size: '~4 MB'  },
      { id: 'm4a',     label: 'M4A', quality: 'Original', size: '~7 MB'  },
    ];
  }
  if (platform === 'youtube') {
    if (type === 'shorts') {
      return [
        { id: 'mp4-1080', label: 'MP4', quality: '1080p HD', size: '~12 MB' },
        { id: 'mp4-720',  label: 'MP4', quality: '720p',     size: '~6 MB'  },
        { id: 'mp4-480',  label: 'MP4', quality: '480p',     size: '~3 MB'  },
      ];
    }
    return [
      { id: 'mp4-1080', label: 'MP4', quality: '1080p HD', size: '~85 MB' },
      { id: 'mp4-720',  label: 'MP4', quality: '720p',     size: '~45 MB' },
      { id: 'mp4-480',  label: 'MP4', quality: '480p',     size: '~25 MB' },
      { id: 'mp4-360',  label: 'MP4', quality: '360p',     size: '~12 MB' },
      { id: 'mp3-320',  label: 'MP3', quality: '320 kbps', size: '~8 MB'  },
    ];
  }
  // Instagram / others
  return [
    { id: 'mp4-hd', label: 'MP4', quality: 'HD Original', size: '~20 MB' },
    { id: 'mp4-sd', label: 'MP4', quality: 'SD',          size: '~8 MB'  },
  ];
}
