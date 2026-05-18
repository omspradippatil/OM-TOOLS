import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import './Navbar.css';

const TOOLS_MENU = [
  { label: 'YouTube Downloader',   to: '/youtube-video-downloader', icon: '▶', desc: 'MP4 up to 4K' },
  { label: 'YouTube to MP3',       to: '/youtube-mp3-converter',    icon: '🎵', desc: '320kbps audio' },
  { label: 'Shorts Downloader',    to: '/shorts-downloader',        icon: '⚡', desc: 'HD vertical video' },
];

export default function Navbar() {
  const { user, logout }       = useAuth();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [showAuth, setShowAuth]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const location = useLocation();
  const menuRef  = useRef(null);
  const userRef  = useRef(null);

  // Close everything on route change
  useEffect(() => { setMenuOpen(false); setMobileOpen(false); setUserOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setMobileOpen(false); setUserOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Outside-click handlers
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName  = user?.displayName || user?.email?.split('@')[0] || 'You';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className={`nav${scrolled ? ' nav--raised' : ''}`} role="banner">
        <div className="nav__bar">

          {/* ── Logo ── */}
          <Link to="/" className="nav__logo" aria-label="OM Tools">
            <span className="nav__logo-mark" aria-hidden="true">⚡</span>
            <span className="nav__logo-name">OM<span>Tools</span></span>
          </Link>

          {/* ── Desktop links ── */}
          <nav className="nav__links" aria-label="Primary navigation">
            {/* Tools mega-dropdown */}
            <div className="nav__item" ref={menuRef}>
              <button
                className={`nav__trigger${menuOpen ? ' active' : ''}`}
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                Tools
                <svg className="nav__arrow" viewBox="0 0 10 6" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="nav__mega" role="menu">
                  <p className="nav__mega-label">Media Downloaders</p>
                  <div className="nav__mega-grid">
                    {TOOLS_MENU.map(t => (
                      <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__mega-item${isActive ? ' active' : ''}`} role="menuitem">
                        <span className="nav__mega-icon" aria-hidden="true">{t.icon}</span>
                        <span>
                          <span className="nav__mega-name">{t.label}</span>
                          <span className="nav__mega-desc">{t.desc}</span>
                        </span>
                      </NavLink>
                    ))}
                  </div>
                  <div className="nav__mega-footer">
                    <span>🔒 On-device processing · No uploads · 100% free</span>
                  </div>
                </div>
              )}
            </div>

            <a href="https://om-pdf.netlify.app" target="_blank" rel="noopener noreferrer" className="nav__link">
              PDF Tools ↗
            </a>
          </nav>

          {/* ── Right side ── */}
          <div className="nav__end">
            {user ? (
              <div className="nav__user" ref={userRef}>
                <button className="nav__avatar" onClick={() => setUserOpen(v => !v)} aria-label="Account menu" aria-expanded={userOpen}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt={displayName} className="nav__avatar-img" />
                    : <span className="nav__avatar-letter">{avatarLetter}</span>
                  }
                </button>
                {userOpen && (
                  <div className="nav__user-panel">
                    <div className="nav__user-meta">
                      <span className="nav__user-name">{displayName}</span>
                      <span className="nav__user-email">{user.email}</span>
                    </div>
                    <button className="nav__signout" onClick={logout}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav__signin" onClick={() => setShowAuth(true)}>Sign in</button>
            )}

            <Link to="/youtube-video-downloader" className="nav__cta">
              Download free
            </Link>

            {/* Hamburger */}
            <button
              className={`nav__ham${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <div className="nav__drawer">
            <p className="nav__drawer-label">Media Tools</p>
            {TOOLS_MENU.map(t => (
              <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__drawer-link${isActive ? ' active' : ''}`}>
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </NavLink>
            ))}
            <a href="https://om-pdf.netlify.app" target="_blank" rel="noopener noreferrer" className="nav__drawer-link">
              <span aria-hidden="true">📄</span> OM PDF — PDF Tools ↗
            </a>
            <div className="nav__drawer-foot">
              {user
                ? <button className="btn btn-outline" style={{width:'100%', justifyContent:'center'}} onClick={logout}>Sign out</button>
                : <button className="btn btn-outline" style={{width:'100%', justifyContent:'center'}} onClick={() => { setMobileOpen(false); setShowAuth(true); }}>Sign in / Sign up</button>
              }
              <Link to="/youtube-video-downloader" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}}>
                ⚡ Start downloading
              </Link>
            </div>
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
