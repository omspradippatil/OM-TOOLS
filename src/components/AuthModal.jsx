import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, authError, clearError } = useAuth();

  const [tab, setTab]           = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [localErr, setLocalErr] = useState('');

  const err = localErr || authError;

  function switchTab(t) {
    setTab(t);
    setLocalErr('');
    clearError();
  }

  async function handleGoogle() {
    setBusy(true);
    setLocalErr('');
    clearError();
    const res = await loginWithGoogle();
    setBusy(false);
    if (res.ok) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalErr('');
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalErr('Please fill in all fields.');
      return;
    }
    if (tab === 'signup' && !name.trim()) {
      setLocalErr('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setLocalErr('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    const res = tab === 'signin'
      ? await loginWithEmail(email, password)
      : await registerWithEmail(email, password, name);
    setBusy(false);
    if (res.ok) onClose();
  }

  return (
    <div className="auth-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in to OM Tools">
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">×</button>

        {/* Header */}
        <div className="auth-modal__header">
          <span className="auth-modal__logo" aria-hidden="true">⚡</span>
          <h2 className="auth-modal__title">
            {tab === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="auth-modal__subtitle">
            {tab === 'signin'
              ? 'Sign in to track your downloads'
              : 'Join OM Tools — free forever'}
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-modal__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'signin'}
            className={`auth-modal__tab${tab === 'signin' ? ' active' : ''}`}
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signup'}
            className={`auth-modal__tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => switchTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Google button */}
        <button
          className="auth-modal__google"
          onClick={handleGoogle}
          disabled={busy}
          aria-label="Sign in with Google"
        >
          <svg viewBox="0 0 24 24" className="auth-modal__google-icon" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-modal__divider"><span>or</span></div>

        {/* Email form */}
        <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
          {tab === 'signup' && (
            <div className="auth-modal__field">
              <label htmlFor="auth-name" className="auth-modal__label">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="input auth-modal__input"
                placeholder="OM Patil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={60}
              />
            </div>
          )}

          <div className="auth-modal__field">
            <label htmlFor="auth-email" className="auth-modal__label">Email</label>
            <input
              id="auth-email"
              type="email"
              className="input auth-modal__input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={tab === 'signin' ? 'email' : 'new-email'}
              maxLength={120}
            />
          </div>

          <div className="auth-modal__field">
            <label htmlFor="auth-password" className="auth-modal__label">Password</label>
            <input
              id="auth-password"
              type="password"
              className="input auth-modal__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              maxLength={128}
            />
          </div>

          {err && (
            <div className="auth-modal__error" role="alert">
              <span aria-hidden="true">⚠️</span> {err}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-modal__submit"
            disabled={busy}
          >
            {busy ? (
              <><span className="spinner" aria-hidden="true" /> {tab === 'signin' ? 'Signing in...' : 'Creating account...'}</>
            ) : (
              tab === 'signin' ? '⚡ Sign In' : '🚀 Create Account'
            )}
          </button>
        </form>

        <p className="auth-modal__footer-note">
          By continuing you agree to our{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>Terms</a> and{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
