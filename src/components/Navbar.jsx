import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  {
    label: 'Media Tools',
    children: [
      { label: 'YouTube Downloader',  to: '/youtube-video-downloader', icon: '▶' },
      { label: 'YouTube to MP3',      to: '/youtube-mp3-converter',    icon: '🎵' },
      { label: 'Shorts Downloader',   to: '/shorts-downloader',        icon: '⚡' },
      { label: 'Instagram Downloader',to: '/instagram-downloader',     icon: '📸' },
      { label: 'Reel Downloader',     to: '/instagram-reel-downloader',icon: '🎞' },
      { label: 'Thumbnail Download',  to: '/thumbnail-downloader',     icon: '🖼' },
    ],
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [activeMenu, setActiveMenu]     = useState(null);
  const [scrolled, setScrolled]         = useState(false);
  const dropdownRef                     = useRef(null);
  const location                        = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setActiveMenu(null); setMobileOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} role="banner">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="OM Tools Home">
          <span className="navbar__logo-icon" aria-hidden="true">⚡</span>
          <span className="navbar__logo-text">
            OM <span className="navbar__logo-accent">Tools</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav" aria-label="Main navigation" ref={dropdownRef}>
          {NAV_LINKS.map((group) => (
            <div key={group.label} className="navbar__group">
              <button
                className={`navbar__group-trigger${activeMenu === group.label ? ' active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === group.label ? null : group.label)}
                aria-expanded={activeMenu === group.label}
                aria-haspopup="true"
              >
                {group.label}
                <svg className="navbar__chevron" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>

              {activeMenu === group.label && (
                <div className="navbar__dropdown" role="menu">
                  {group.children.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `navbar__dropdown-item${isActive ? ' active' : ''}`
                      }
                      role="menuitem"
                    >
                      <span className="navbar__dropdown-icon" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* CTA */}
        <div className="navbar__actions">
          <Link to="/youtube-video-downloader" className="btn btn-primary btn-sm navbar__cta">
            Start Downloading
          </Link>
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className={`hamburger-bar${mobileOpen ? ' open' : ''}`} />
            <span className={`hamburger-bar${mobileOpen ? ' open' : ''}`} />
            <span className={`hamburger-bar${mobileOpen ? ' open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="navbar__mobile" role="navigation" aria-label="Mobile navigation">
          {NAV_LINKS.map((group) => (
            <div key={group.label} className="navbar__mobile-group">
              <p className="navbar__mobile-heading">{group.label}</p>
              {group.children.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `navbar__mobile-link${isActive ? ' active' : ''}`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="navbar__mobile-cta">
            <Link to="/youtube-video-downloader" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>
              ⚡ Start Downloading
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
