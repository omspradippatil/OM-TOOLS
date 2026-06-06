import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import './Navbar.css';

const DOWNLOADER_MENU = [
  { label: 'YouTube Downloader',   to: '/youtube-video-downloader',      icon: '🎬', desc: 'MP4 up to 4K' },
  { label: 'YouTube to MP3',       to: '/youtube-mp3-converter',         icon: '🎵', desc: '320kbps audio' },
  { label: 'Shorts Downloader',    to: '/shorts-downloader',             icon: '⚡', desc: 'HD vertical video' },
  { label: 'Playlist Downloader',  to: '/youtube-playlist-downloader',   icon: '📂', desc: 'Save full playlist in ZIP' },
  { label: 'TikTok Downloader',    to: '/tiktok-downloader',             icon: '📱', desc: 'No watermark video' },
  { label: 'Twitter / X Downloader', to: '/twitter-downloader',            icon: '🐦', desc: 'Save tweets & GIFs' },
  { label: 'Facebook Downloader',  to: '/facebook-downloader',           icon: '👤', desc: 'Download FB videos' },
  { label: 'Reddit Downloader',    to: '/reddit-downloader',             icon: '🤖', desc: 'Videos with audio' },
  { label: 'Pinterest Downloader', to: '/pinterest-downloader',          icon: '📌', desc: 'Video pins & GIFs' },
];

const VIDEO_MENU = [
  { label: 'Video Converter',   to: '/video-converter',   icon: '🔄', desc: 'MP4 ↔ WEBM ↔ MKV' },
  { label: 'Video Trimmer',     to: '/video-trimmer',     icon: '✂️', desc: 'Cut any video clip' },
  { label: 'Video Compressor',  to: '/video-compressor',  icon: '🗜️', desc: 'Shrink file size' },
  { label: 'Video to GIF',      to: '/video-to-gif',      icon: '🎞️', desc: 'Make animated GIFs' },
  { label: 'Video Muter',       to: '/video-muter',       icon: '🔇', desc: 'Remove audio track' },
  { label: 'Video Merger',      to: '/video-merger',      icon: '🔗', desc: 'Combine video clips' },
  { label: 'Video Speed',       to: '/video-speed-changer',icon: '⏩', desc: 'Slow & fast motion' },
  { label: 'Frame Extractor',   to: '/video-frame-extractor',icon: '🖼️', desc: 'Extract JPG/PNG frames' },
  { label: 'Video Cropper',     to: '/video-cropper',     icon: '✂️', desc: 'Crop aspect ratio' },
  { label: 'Video Rotator',     to: '/video-rotator',     icon: '🔃', desc: 'Rotate & flip video' },
];

const AUDIO_MENU = [
  { label: 'Audio Extractor',   to: '/audio-extractor',   icon: '🎵', desc: 'Get MP3 from video' },
  { label: 'Audio Converter',   to: '/audio-converter',   icon: '🎶', desc: 'MP3 WAV FLAC OGG' },
  { label: 'Audio Trimmer',     to: '/audio-trimmer',     icon: '✂️', desc: 'Cut audio files' },
  { label: 'Volume Booster',    to: '/volume-booster',    icon: '🔊', desc: 'Boost volume up to 4×' },
  { label: 'Audio Merger',      to: '/audio-merger',      icon: '🔗', desc: 'Combine audio tracks' },
  { label: 'Ringtone Maker',    to: '/ringtone-maker',    icon: '🔔', desc: 'Trim + fade transitions' },
  { label: 'Audio Normalizer',  to: '/audio-normalizer',  icon: '📊', desc: 'Loudness auto-level' },
  { label: 'Voice Recorder',    to: '/voice-recorder',    icon: '🎙️', desc: 'Browser mic recorder' },
];

const IMAGE_MENU = [
  { label: 'Image Compressor',  to: '/image-compressor',  icon: '🗜️', desc: 'Reduce file size 90%' },
  { label: 'Image Resizer',     to: '/image-resizer',     icon: '📐', desc: 'Resize dimensions' },
  { label: 'Image Converter',   to: '/image-converter',   icon: '🔄', desc: 'JPG PNG WebP AVIF' },
  { label: 'Image Cropper',     to: '/image-cropper',     icon: '✂️', desc: 'Visually crop images' },
  { label: 'Bulk Resizer',      to: '/bulk-image-resizer',icon: '📦', desc: 'Batch resize to ZIP' },
];


export default function Navbar() {
  const { user, logout }       = useAuth();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [showAuth, setShowAuth]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState(null);
  const location = useLocation();
  const menuRef  = useRef(null);
  const userRef  = useRef(null);

  const toggleMobileSection = (section) => {
    setActiveMobileSection(current => current === section ? null : section);
  };

  // Close everything on route change
  useEffect(() => { setMenuOpen(false); setMobileOpen(false); setUserOpen(false); setActiveMobileSection(null); }, [location.pathname]);

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
                  <div className="nav__mega-cols">
                    {/* Column 1: Downloaders */}
                    <div className="nav__mega-col">
                      <p className="nav__mega-label">📥 Media &amp; Social</p>
                      <div className="nav__mega-list">
                        {DOWNLOADER_MENU.map(t => (
                          <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__mega-item${isActive ? ' active' : ''}`} role="menuitem">
                            <span className="nav__mega-icon" aria-hidden="true">{t.icon}</span>
                            <span>
                              <span className="nav__mega-name">{t.label}</span>
                              <span className="nav__mega-desc">{t.desc}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Video Editors */}
                    <div className="nav__mega-col">
                      <p className="nav__mega-label">🎥 Video Editors</p>
                      <div className="nav__mega-list">
                        {VIDEO_MENU.map(t => (
                          <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__mega-item${isActive ? ' active' : ''}`} role="menuitem">
                            <span className="nav__mega-icon" aria-hidden="true">{t.icon}</span>
                            <span>
                              <span className="nav__mega-name">{t.label}</span>
                              <span className="nav__mega-desc">{t.desc}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Audio Tools */}
                    <div className="nav__mega-col">
                      <p className="nav__mega-label">🎵 Audio Tools</p>
                      <div className="nav__mega-list">
                        {AUDIO_MENU.map(t => (
                          <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__mega-item${isActive ? ' active' : ''}`} role="menuitem">
                            <span className="nav__mega-icon" aria-hidden="true">{t.icon}</span>
                            <span>
                              <span className="nav__mega-name">{t.label}</span>
                              <span className="nav__mega-desc">{t.desc}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Image Tools */}
                    <div className="nav__mega-col">
                      <p className="nav__mega-label" style={{ color: '#14B8A6' }}>🖼️ Image Tools</p>
                      <div className="nav__mega-list">
                        {IMAGE_MENU.map(t => (
                          <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__mega-item${isActive ? ' active' : ''} nav__mega-item--image`} role="menuitem">
                            <span className="nav__mega-icon" aria-hidden="true">{t.icon}</span>
                            <span>
                              <span className="nav__mega-name">{t.label}</span>
                              <span className="nav__mega-desc">{t.desc}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="nav__mega-footer">
                    <span>🔒 Local processing (Video/Audio/Image) · No upload · 100% private · Free forever</span>
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
            {/* Section 1: Downloaders */}
            <div className="nav__drawer-sec">
              <button 
                className={`nav__drawer-trigger${activeMobileSection === 'media' ? ' open' : ''}`}
                onClick={() => toggleMobileSection('media')}
              >
                <span>📥 Media &amp; Social</span>
                <span className="nav__drawer-arrow">{activeMobileSection === 'media' ? '−' : '+'}</span>
              </button>
              {activeMobileSection === 'media' && (
                <div className="nav__drawer-coll">
                  {DOWNLOADER_MENU.map(t => (
                    <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__drawer-link${isActive ? ' active' : ''}`}>
                      <span aria-hidden="true">{t.icon}</span>
                      {t.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Video Editors */}
            <div className="nav__drawer-sec">
              <button 
                className={`nav__drawer-trigger${activeMobileSection === 'video' ? ' open' : ''}`}
                onClick={() => toggleMobileSection('video')}
              >
                <span>🎥 Video Editors</span>
                <span className="nav__drawer-arrow">{activeMobileSection === 'video' ? '−' : '+'}</span>
              </button>
              {activeMobileSection === 'video' && (
                <div className="nav__drawer-coll">
                  {VIDEO_MENU.map(t => (
                    <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__drawer-link${isActive ? ' active' : ''}`}>
                      <span aria-hidden="true">{t.icon}</span>
                      {t.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Audio Tools */}
            <div className="nav__drawer-sec">
              <button 
                className={`nav__drawer-trigger${activeMobileSection === 'audio' ? ' open' : ''}`}
                onClick={() => toggleMobileSection('audio')}
              >
                <span>🎵 Audio Tools</span>
                <span className="nav__drawer-arrow">{activeMobileSection === 'audio' ? '−' : '+'}</span>
              </button>
              {activeMobileSection === 'audio' && (
                <div className="nav__drawer-coll">
                  {AUDIO_MENU.map(t => (
                    <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__drawer-link${isActive ? ' active' : ''}`}>
                      <span aria-hidden="true">{t.icon}</span>
                      {t.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Image Tools */}
            <div className="nav__drawer-sec">
              <button 
                className={`nav__drawer-trigger${activeMobileSection === 'image' ? ' open' : ''}`}
                onClick={() => toggleMobileSection('image')}
              >
                <span style={{ color: '#14B8A6' }}>🖼️ Image Tools</span>
                <span className="nav__drawer-arrow" style={{ color: '#14B8A6' }}>{activeMobileSection === 'image' ? '−' : '+'}</span>
              </button>
              {activeMobileSection === 'image' && (
                <div className="nav__drawer-coll">
                  {IMAGE_MENU.map(t => (
                    <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav__drawer-link nav__drawer-link--image${isActive ? ' active' : ''}`}>
                      <span aria-hidden="true">{t.icon}</span>
                      {t.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <a href="https://om-pdf.netlify.app" target="_blank" rel="noopener noreferrer" className="nav__drawer-link nav__drawer-link--pdf">
              <span aria-hidden="true">📄</span> OM PDF — PDF Tools ↗
            </a>
            
            <div className="nav__drawer-foot">
              {user
                ? <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>Sign out</button>
                : <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileOpen(false); setShowAuth(true); }}>Sign in / Sign up</button>
              }
              <Link to="/youtube-video-downloader" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
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
