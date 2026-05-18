import { Link } from 'react-router-dom';
import './Footer.css';

const FOOTER_LINKS = {
  'Media Tools': [
    { label: 'YouTube Downloader',   to: '/youtube-video-downloader' },
    { label: 'YouTube to MP3',       to: '/youtube-mp3-converter' },
    { label: 'Shorts Downloader',    to: '/shorts-downloader' },
    { label: 'Instagram Downloader', to: '/instagram-downloader' },
    { label: 'Reel Downloader',      to: '/instagram-reel-downloader' },
    { label: 'Thumbnail Download',   to: '/thumbnail-downloader' },
  ],
  'Company': [
    { label: 'About OM Tools', to: '/about' },
    { label: 'GitHub ↗',       to: 'https://github.com/omspradippatil/OM-TOOLS', external: true },
    { label: 'Portfolio ↗',    to: 'https://ompradippatil.netlify.app/', external: true },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container">
        <div className="footer__top">

          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-icon">⚡</span>
              <span className="footer__logo-text">OM <span>Tools</span></span>
            </Link>
            <p className="footer__tagline">
              Free media downloader &amp; utility platform.<br />
              Download YouTube, Instagram, convert audio — all free.
            </p>
            <div className="footer__socials">
              <a href="https://github.com/omspradippatil" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="GitHub profile">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://in.linkedin.com/in/om-pradip-patil" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="LinkedIn profile">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className="footer__col">
              <h3 className="footer__col-heading">{heading}</h3>
              <ul className="footer__col-links">
                {links.map((link) => (
                  <li key={link.to}>
                    {link.external ? (
                      <a href={link.to} target="_blank" rel="noopener noreferrer" className="footer__link">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="footer__link">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ── More Tools by OM Patil ── */}
          <div className="footer__col">
            <h3 className="footer__col-heading">More by OM Patil</h3>
            <a
              href="https://om-pdf.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__om-pdf-card"
              aria-label="Visit OM PDF — 20+ free PDF tools"
            >
              <span className="footer__om-pdf-icon" aria-hidden="true">📄</span>
              <div className="footer__om-pdf-text">
                <span className="footer__om-pdf-name">OM PDF</span>
                <span className="footer__om-pdf-desc">
                  20+ free PDF tools — merge, split, compress &amp; more. 100% offline.
                </span>
              </div>
              <span className="footer__om-pdf-arrow" aria-hidden="true">↗</span>
            </a>
          </div>

        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} <strong>OM Patil</strong>. All rights reserved. — OM Tools
          </p>
          <p className="footer__disclaimer">
            OM Tools is a utility platform for educational purposes.
            Only download content you own or have explicit permission to download.
          </p>
        </div>
      </div>
    </footer>
  );
}
