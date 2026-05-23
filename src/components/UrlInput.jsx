import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectPlatform, isValidUrl } from '../constants/tools.js';
import './UrlInput.css';

const PLATFORM_ROUTES = {
  youtube: {
    video:    '/youtube-video-downloader',
    shorts:   '/shorts-downloader',
    playlist: '/youtube-playlist-downloader',
  },

  instagram: {
    reel:  '/instagram-reel-downloader',
    story: '/instagram-downloader',
    post:  '/instagram-downloader',
  },
  tiktok:   { video: '/youtube-video-downloader' },
  twitter:  { tweet: '/youtube-video-downloader' },
  facebook: { video: '/youtube-video-downloader' },
};

export default function UrlInput({
  placeholder = 'Paste YouTube or Instagram URL here...',
  autoNavigate = false,
  value: controlledValue,
  onValueChange,
  onFetch,
}) {
  // Support controlled mode (ToolPage passes value + onValueChange)
  const isControlled = controlledValue !== undefined;
  const [internalUrl, setInternalUrl] = useState('');
  const url = isControlled ? controlledValue : internalUrl;
  const setUrl = (val) => {
    if (!isControlled) setInternalUrl(val);
    onValueChange?.(val);
  };
  const [error, setError]       = useState('');
  const [detected, setDetected] = useState(null);
  const inputRef                = useRef(null);
  const navigate                = useNavigate();

  const handleChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    setError('');
    if (val.trim()) {
      const det = detectPlatform(val.trim());
      setDetected(det);
    } else {
      setDetected(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      const det = detectPlatform(text.trim());
      setDetected(det);
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please paste a URL to download.');
      return;
    }
    if (!isValidUrl(trimmed)) {
      setError('That doesn\'t look like a valid URL. Please check and try again.');
      return;
    }
    if (!detected) {
      setError('This platform is not supported yet. Try YouTube or Instagram.');
      return;
    }

    if (autoNavigate) {
      const route = PLATFORM_ROUTES[detected.platform]?.[detected.type];
      if (route) navigate(`${route}?url=${encodeURIComponent(trimmed)}`);
    } else if (onFetch) {
      // Tool page mode — delegate to parent
      onFetch(trimmed);
    }
  };

  const PLATFORM_LABELS = {
    youtube: { label: 'YouTube', color: '#FF0000', icon: '▶' },
    instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
    tiktok: { label: 'TikTok', color: '#69C9D0', icon: '🎵' },
    twitter: { label: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
    facebook: { label: 'Facebook', color: '#1877F2', icon: '👍' },
  };

  const platformInfo = detected ? PLATFORM_LABELS[detected.platform] : null;

  return (
    <form className="url-input" onSubmit={handleSubmit} noValidate>
      <div className={`url-input__wrap${error ? ' url-input__wrap--error' : ''}${detected ? ' url-input__wrap--detected' : ''}`}>
        {/* Detection badge */}
        {platformInfo && (
          <span
            className="url-input__detected-badge"
            style={{ '--badge-color': platformInfo.color }}
          >
            <span>{platformInfo.icon}</span>
            {platformInfo.label} {detected.type}
          </span>
        )}

        <div className="url-input__field-row">
          <svg className="url-input__link-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 12.5a5 5 0 007.071-7.071L13.5 4.367A5 5 0 006.43 11.44M12.5 7.5a5 5 0 00-7.071 7.071l1.07 1.062a5 5 0 007.071-7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            id="url-input-field"
            className="url-input__field"
            type="url"
            inputMode="url"
            value={url}
            onChange={handleChange}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Paste media URL"
            aria-describedby={error ? 'url-input-error' : undefined}
          />
          <button
            type="button"
            className="url-input__paste-btn btn btn-ghost btn-sm"
            onClick={handlePaste}
            aria-label="Paste from clipboard"
          >
            📋 Paste
          </button>
        </div>

        <button type="submit" className="url-input__submit btn btn-primary btn-lg">
          <svg viewBox="0 0 20 20" fill="currentColor" className="url-input__submit-icon" aria-hidden="true">
            <path fillRule="evenodd" d="M3 10a7 7 0 1114 0 7 7 0 01-14 0zm9.707-1.707a1 1 0 00-1.414-1.414L10 8.172 8.707 6.879a1 1 0 00-1.414 1.414L8.586 9.586l-1.293 1.293a1 1 0 001.414 1.414L10 11l1.293 1.293a1 1 0 001.414-1.414L11.414 9.586l1.293-1.293z" clipRule="evenodd"/>
          </svg>
          Download
        </button>
      </div>

      {error && (
        <p id="url-input-error" className="url-input__error" role="alert">
          ⚠ {error}
        </p>
      )}

      <p className="url-input__hint">
        Supports YouTube, Instagram, Shorts, Reels, TikTok, Twitter/X and more
      </p>
    </form>
  );
}
