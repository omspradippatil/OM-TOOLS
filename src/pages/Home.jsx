import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import UrlInput from '../components/UrlInput.jsx';
import { TOOLS, SUPPORTED_PLATFORMS } from '../constants/tools.js';
import { SEO_DATA } from '../constants/seoData.js';
import './Home.css';

/* ── Animated Counter Hook ── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
}

/* ── FAQ Accordion ── */
const FAQS = [
  {
    q: 'How do I download a YouTube video?',
    a: 'Paste the YouTube video URL in the input box above, select your preferred quality and format (MP4, WEBM), then click Download. No sign-up required.',
  },
  {
    q: 'Can I download Instagram Reels?',
    a: 'Yes! Paste any Instagram Reel or post URL into OM Tools and download the video in original HD quality — no watermark, completely free.',
  },
  {
    q: 'Is OM Tools completely free?',
    a: 'Yes. All tools on OM Tools are 100% free with no registration required. Media downloaders, PDF tools, and image utilities are all free forever.',
  },
  {
    q: 'What formats are supported for download?',
    a: 'YouTube downloads support MP4 (up to 4K), WEBM, and MP3/M4A audio. Instagram supports MP4 and JPG. PDF and image tools support their respective formats.',
  },
  {
    q: 'Are my files safe and private?',
    a: 'Absolutely. PDF and image tools process files entirely in your browser — no data is sent to any server. Media download links are fetched securely and not stored.',
  },
  {
    q: 'Does OM Tools work on mobile?',
    a: 'Yes! OM Tools is mobile-first and fully responsive. Download videos, process PDFs, and compress images from any smartphone or tablet.',
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button
        className="faq-item__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        id={`faq-trigger-${index}`}
        aria-controls={`faq-panel-${index}`}
      >
        <span className="faq-item__q">{q}</span>
        <span className="faq-item__chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div
          className="faq-item__panel"
          id={`faq-panel-${index}`}
          role="region"
          aria-labelledby={`faq-trigger-${index}`}
        >
          <p className="faq-item__a">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── Tool Card ── */
function ToolCard({ tool }) {
  return (
    <Link to={tool.slug} className="tool-card" aria-label={tool.name}>
      <div className="tool-card__glow" aria-hidden="true" />
      <div className="tool-card__header">
        <span className="tool-card__icon" aria-hidden="true">{tool.emoji}</span>
        <div className="tool-card__badges">
          {tool.isNew && <span className="badge badge-new">New</span>}
          {tool.isPopular && <span className="badge badge-primary">Popular</span>}
          {tool.badge && <span className="badge badge-success">{tool.badge}</span>}
        </div>
      </div>
      <h3 className="tool-card__name">{tool.name}</h3>
      <p className="tool-card__desc">{tool.description}</p>
      {tool.formats.length > 0 && (
        <div className="tool-card__formats">
          {tool.formats.map((f) => (
            <span key={f} className="tool-card__format">{f}</span>
          ))}
        </div>
      )}
      <span className="tool-card__arrow" aria-hidden="true">→</span>
    </Link>
  );
}

/* ── Stats data ── */
const STATS = [
  { label: 'Videos Downloaded', value: 2400000, suffix: '+', prefix: '' },
  { label: 'Active Users',      value: 180000,  suffix: '+', prefix: '' },
  { label: 'Tools Available',   value: 9,       suffix: '',  prefix: '' },
  { label: 'Uptime',            value: 99,      suffix: '%', prefix: '' },
];

function StatCard({ stat }) {
  const [count, ref] = useCounter(stat.value);

  return (
    <div className="stat-card" ref={ref}>
      <span className="stat-card__value">
        {stat.prefix}{count.toLocaleString()}{stat.suffix}
      </span>
      <span className="stat-card__label">{stat.label}</span>
    </div>
  );
}

/* ── Features ── */
const FEATURES = [
  { icon: '⚡', title: 'Lightning Fast',      desc: 'Instant processing — get your download link in seconds.' },
  { icon: '📱', title: 'Mobile Optimized',    desc: 'Designed mobile-first. Smooth on any device or browser.' },
  { icon: '🔒', title: 'Secure & Private',    desc: 'No account needed. Files processed securely — never stored.' },
  { icon: '🎯', title: 'Multi-Format',        desc: 'MP4, WEBM, MP3, M4A — choose the format that suits you.' },
  { icon: '🌐', title: 'All Platforms',       desc: 'YouTube, Instagram, TikTok, Twitter, Facebook supported.' },
  { icon: '♾️', title: 'Always Free',         desc: 'Every tool is free forever — no hidden charges, no watermarks.' },
];

/* ── Home Page ── */
export default function Home() {
  const seo = SEO_DATA.home;

  // FAQ schema for structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

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
        {/* ── Hero ── */}
        <section className="hero" aria-label="Media downloader hero">
          <div className="hero__blobs" aria-hidden="true">
            <div className="hero__blob hero__blob--1" />
            <div className="hero__blob hero__blob--2" />
            <div className="hero__blob hero__blob--3" />
          </div>
          <div className="hero__grid" aria-hidden="true" />

          <div className="container">
            <div className="hero__content">
              <div className="hero__eyebrow animate-fade-up">
                <span className="hero__live-dot" aria-hidden="true" />
                Free &amp; Unlimited Downloads
              </div>

              <h1 className="hero__title animate-fade-up delay-1">
                Download Anything,<br />
                <span className="gradient-text">Anywhere, Anytime</span>
              </h1>

              <p className="hero__subtitle animate-fade-up delay-2">
                The premium utility platform for media downloading, PDF tools, and image processing.
                YouTube, Instagram, Reels, Shorts — all in one place.
              </p>

              <div className="hero__input animate-fade-up delay-3">
                <UrlInput autoNavigate />
              </div>

              {/* Platform pills */}
              <div className="hero__platforms animate-fade-up delay-4">
                {SUPPORTED_PLATFORMS.map((p) => (
                  <span key={p.id} className="platform-pill" style={{ '--c': p.color }}>
                    <span aria-hidden="true">{p.emoji}</span>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="stats-section section-sm" aria-label="Platform statistics">
          <div className="container">
            <div className="stats-grid">
              {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
            </div>
          </div>
        </section>

        {/* ── Popular Tools ── */}
        <section className="section tools-section" aria-label="Available tools" id="tools">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">
                <span aria-hidden="true">🛠</span> All Tools
              </p>
              <h2 className="section-title">Everything you need in one place</h2>
              <p className="section-subtitle">
                From media downloading to PDF processing — premium tools, completely free.
              </p>
            </div>
            <div className="tools-grid">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Supported Platforms ── */}
        <section className="platforms-section section-sm" aria-label="Supported platforms">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">
                <span aria-hidden="true">🌐</span> Platforms
              </p>
              <h2 className="section-title">Works with all major platforms</h2>
            </div>
            <div className="platforms-grid">
              {SUPPORTED_PLATFORMS.map((p) => (
                <div key={p.id} className="platform-card" style={{ '--c': p.color }}>
                  <span className="platform-card__icon" aria-hidden="true">{p.emoji}</span>
                  <span className="platform-card__name">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="features-section section" aria-label="Platform features">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">
                <span aria-hidden="true">✨</span> Why OM Tools
              </p>
              <h2 className="section-title">Built for speed, simplicity, and scale</h2>
              <p className="section-subtitle">
                We obsess over performance and user experience so you can download without frustration.
              </p>
            </div>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="feature-card__icon" aria-hidden="true">{f.icon}</span>
                  <h3 className="feature-card__title">{f.title}</h3>
                  <p className="feature-card__desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="cta-section section-sm" aria-label="Call to action">
          <div className="container">
            <div className="cta-card">
              <div className="cta-card__glow" aria-hidden="true" />
              <h2 className="cta-card__title">
                Ready to download anything?
              </h2>
              <p className="cta-card__subtitle">
                Join thousands of users who use OM Tools every day.
                No sign-up, no limits, no ads.
              </p>
              <div className="cta-card__actions">
                <Link to="/youtube-video-downloader" className="btn btn-primary btn-lg">
                  ⚡ Start for Free
                </Link>
                <a
                  href="https://github.com/omspradippatil/OM-TOOLS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-lg"
                >
                  ⭐ Star on GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section section" aria-label="Frequently asked questions" id="faq">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">
                <span aria-hidden="true">❓</span> FAQ
              </p>
              <h2 className="section-title">Frequently asked questions</h2>
              <p className="section-subtitle">
                Everything you need to know about OM Tools. Can't find the answer? Reach out on GitHub.
              </p>
            </div>
            <div className="faq-list">
              {FAQS.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
