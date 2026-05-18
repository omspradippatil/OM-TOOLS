import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import './Navbar.css';

const NAV_LINKS = [
  {
    label: 'Media Tools',
    children: [
      { label: 'YouTube Downloader',   to: '/youtube-video-downloader', icon: '▶' },
      { label: 'YouTube to MP3',       to: '/youtube-mp3-converter',    icon: '🎵' },
      { label: 'Shorts Downloader',    to: '/shorts-downloader',        icon: '⚡' },
      { label: 'Instagram Downloader', to: '/instagram-downloader',     icon: '📸' },
      { label: 'Reel Downloader',      to: '/instagram-reel-downloader',icon: '🎞' },
      { label: 'Thumbnail Download',   to: '/thumbnail-downloader',     icon: '🖼' },
    ],
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [activeMenu, setActiveMenu]   = useState(null);
  const [scrolled, setScrolled]       = useState(false);
  const [showAuth, setShowAuth]       = useState(false);
  const [userMenu, setUserMenu]       = useState(false);
  const location                      = useLocation();
  const userMenuRef                   = useRef(null);

  useEffect(() => { setMobileOpen(false); setActiveMenu(null); setUserMenu(false); }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setActiveMenu(null); setMobileOpen(false); setUserMenu(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    }
    if (userMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenu]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
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
          <nav className="navbar__nav" aria-label="Main navigation">
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
                        className={({ isActive }) => `navbar__dropdown-item${isActive ? ' active' : ''}`}
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

          {/* Actions */}
          <div className="navbar__actions">
            {user ? (
              /* User avatar + dropdown */
              <div className="navbar__user" ref={userMenuRef}>
                <button
                  className="navbar__avatar-btn"
                  onClick={() => setUserMenu(!userMenu)}
                  aria-label="User menu"
                  aria-expanded={userMenu}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={displayName} className="navbar__avatar-img" />
                  ) : (
                    <span className="navbar__avatar-letter">{avatarLetter}</span>
                  )}
                </button>
                {userMenu && (
                  <div className="navbar__user-dropdown">
                    <div className="navbar__user-info">
                      <span className="navbar__user-name">{displayName}</span>
                      <span className="navbar__user-email">{user.email}</span>
                    </div>
                    <hr className="navbar__user-divider" />
                    <button className="navbar__user-signout" onClick={logout}>
                      <span aria-hidden="true">🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )}

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
                    className={({ isActive }) => `navbar__mobile-link${isActive ? ' active' : ''}`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
            <div className="navbar__mobile-cta">
              {user ? (
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
                  🚪 Sign Out ({displayName})
                </button>
              ) : (
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileOpen(false); setShowAuth(true); }}>
                  Sign In / Sign Up
                </button>
              )}
              <Link to="/youtube-video-downloader" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                ⚡ Start Downloading
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
