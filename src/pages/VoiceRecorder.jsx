import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { SEO_DATA } from '../constants/seoData.js';
import '../components/LocalToolPage.css';

const FAQS = [
  { q: 'What format is the recording saved in?', a: 'Recordings are saved as WebM (Opus codec) — the highest quality format supported natively by all modern browsers. You can convert it to MP3 using our Audio Converter tool.' },
  { q: 'Does this upload my audio to a server?', a: 'No! The recording is 100% processed in your browser using the native MediaRecorder API. Nothing is ever uploaded — your audio stays completely private on your device.' },
  { q: 'Why do I need to allow microphone access?', a: 'The browser requires explicit permission to access your microphone. This permission is only used to capture audio — we never store or transmit it.' },
  { q: 'Can I record for a long time?', a: 'Yes, there\'s no hard limit. However, long recordings may use more browser memory. For recordings over 30 minutes, we recommend using dedicated recording software.' },
  { q: 'Does this work on iPhone?', a: 'Yes! The MediaRecorder API is supported in Safari on iOS 14.5 and later. You\'ll need to allow microphone access when prompted.' },
];

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function VoiceRecorder() {
  const [status, setStatus]       = useState('idle'); // idle | requesting | recording | paused | done | error
  const [duration, setDuration]   = useState(0);
  const [error, setError]         = useState('');
  const [recordings, setRecordings] = useState([]); // [{url, name, size, duration}]
  const [visualData, setVisualData] = useState(new Array(40).fill(2));

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const startTimeRef     = useRef(null);
  const animFrameRef     = useRef(null);
  const analyserRef      = useRef(null);
  const streamRef        = useRef(null);

  const seo = SEO_DATA['voice-recorder'] || {};

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      recordings.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []); // eslint-disable-line

  // Visualizer animation
  const drawVisualizer = (analyser) => {
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const bars = 40;
      const step = Math.floor(buf.length / bars);
      const values = Array.from({ length: bars }, (_, i) => {
        const slice = Array.from(buf.slice(i * step, (i + 1) * step));
        const avg   = slice.reduce((a, b) => a + b, 0) / slice.length;
        return Math.max(2, (avg / 255) * 100);
      });
      setVisualData(values);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const startRecording = async () => {
    setStatus('requesting');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Set up audio analyser for visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        clearInterval(timerRef.current);
        cancelAnimationFrame(animFrameRef.current);
        setVisualData(new Array(40).fill(2));
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
        const ext  = mimeType.includes('webm') ? 'webm' : 'ogg';

        setRecordings(prev => [{
          url,
          name: `recording-${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.${ext}`,
          size: blob.size,
          duration: secs,
          mime: mimeType,
        }, ...prev]);
        setStatus('done');
      };

      mr.start(250); // collect data every 250ms
      startTimeRef.current = Date.now();
      setDuration(0);
      setStatus('recording');

      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      drawVisualizer(analyser);
    } catch (e) {
      console.error('[VoiceRecorder] Error:', e);
      if (e.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (e.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(e.message || 'Failed to start recording. Please try again.');
      }
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - duration * 1000;
      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);
      drawVisualizer(analyserRef.current);
      setStatus('recording');
    }
  };

  const downloadRecording = (rec) => {
    const a = document.createElement('a');
    a.href = rec.url;
    a.download = rec.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = (idx) => {
    setRecordings(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const newRecording = () => {
    setStatus('idle');
    setDuration(0);
    setError('');
  };

  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />
      <main id="main-content" className="ltp-page">
        <section className="ltp-hero">
          <div className="ltp-hero__glow" aria-hidden="true" />
          <div className="container">
            <div className="ltp-hero__body">
              <div className="ltp-hero__icon-wrap" aria-hidden="true">
                <span className="ltp-hero__icon">🎙️</span>
              </div>
              <div className="ltp-hero__text">
                <div className="ltp-hero__pills">
                  <span className="ltp-pill ltp-pill--lock">🔒 100% Private</span>
                  <span className="ltp-pill ltp-pill--free">✦ Browser Native</span>
                </div>
                <h1 className="ltp-hero__title">Voice Recorder</h1>
                <p className="ltp-hero__sub">Record audio directly from your microphone. Play back and download instantly. No upload — 100% private.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ltp-workspace">
          <div className="container container-md">
            <div className="ltp-card">
              {/* ── Visualizer ── */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '3px',
                height: '80px',
                padding: '0.5rem 1rem',
                marginBottom: '1.5rem',
                background: 'rgba(108,99,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(108,99,255,0.15)',
              }}>
                {visualData.map((h, i) => (
                  <div key={i} style={{
                    width: '4px',
                    height: `${h}%`,
                    background: status === 'recording'
                      ? `hsl(${250 + i * 2}, 70%, 65%)`
                      : 'rgba(108,99,255,0.2)',
                    borderRadius: '2px',
                    transition: 'height 80ms ease',
                  }} />
                ))}
              </div>

              {/* ── Timer ── */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: status === 'recording' ? 'var(--primary-light)' : 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}>
                  {formatDuration(duration)}
                </span>
                {status === 'recording' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', display: 'inline-block', animation: 'blob-pulse 1s ease-in-out infinite' }} />
                    <span style={{ color: '#ff4444', fontSize: '0.85rem', fontWeight: 600 }}>RECORDING</span>
                  </div>
                )}
                {status === 'paused' && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>⏸ Paused</div>
                )}
              </div>

              {/* ── Controls ── */}
              {status === 'idle' && (
                <button className="ltp-go-btn" onClick={startRecording} id="start-recording-btn">
                  <span className="ltp-go-btn__icon" style={{ color: '#ff4444' }}>🎙️</span>
                  <span>Start Recording</span>
                  <span className="ltp-go-btn__arrow">→</span>
                </button>
              )}

              {status === 'requesting' && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                  <span className="spinner" /> Requesting microphone access…
                </p>
              )}

              {(status === 'recording' || status === 'paused') && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {status === 'recording' ? (
                    <button
                      onClick={pauseRecording}
                      style={{
                        padding: '0.7rem 1.5rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >⏸ Pause</button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      style={{
                        padding: '0.7rem 1.5rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(108,99,255,0.4)',
                        background: 'rgba(108,99,255,0.15)',
                        color: 'var(--primary-light)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >▶ Resume</button>
                  )}
                  <button
                    onClick={stopRecording}
                    style={{
                      padding: '0.7rem 1.5rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff4444, #ff6b6b)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(255,68,68,0.4)',
                    }}
                  >⏹ Stop & Save</button>
                </div>
              )}

              {status === 'error' && (
                <div className="ltp-error animate-fade-up" role="alert">
                  <div className="ltp-error__icon">🎙️</div>
                  <div>
                    <p className="ltp-error__title">Microphone Error</p>
                    <p className="ltp-error__msg">{error}</p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => setStatus('idle')}>Try again</button>
                </div>
              )}

              {/* ── Recordings List ── */}
              {recordings.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                    🎵 {recordings.length} Recording{recordings.length > 1 ? 's' : ''}
                  </p>
                  {recordings.map((rec, i) => (
                    <div key={i} className="ltp-filebar animate-fade-up" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div className="ltp-filebar__icon">🎙️</div>
                      <div className="ltp-filebar__info" style={{ flex: 1 }}>
                        <span className="ltp-filebar__name">{rec.name}</span>
                        <span className="ltp-filebar__meta">
                          <span className="ltp-filebar__tag">{rec.name.split('.').pop().toUpperCase()}</span>
                          {formatDuration(rec.duration)} · {(rec.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <audio src={rec.url} controls style={{ width: '100%', marginTop: '0.4rem', height: '32px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => downloadRecording(rec)}
                          className="ltp-result__download"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          id={`download-rec-${i}`}
                        >
                          ↓ Save
                        </button>
                        <button
                          onClick={() => deleteRecording(i)}
                          className="ltp-filebar__change"
                          style={{ color: 'var(--accent)' }}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(status === 'done' || (recordings.length > 0 && status === 'idle')) && (
                <button className="ltp-go-btn" onClick={newRecording} style={{ marginTop: '1rem' }} id="new-recording-btn">
                  <span className="ltp-go-btn__icon" style={{ color: '#ff4444' }}>🎙️</span>
                  <span>Record Another</span>
                  <span className="ltp-go-btn__arrow">→</span>
                </button>
              )}
            </div>

            <div className="ltp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Your audio is recorded and processed entirely in your browser using the <strong>MediaRecorder API</strong>. Nothing is ever uploaded.
            </div>
          </div>
        </section>

        {/* Tip: Convert to MP3 */}
        <section className="section-sm" style={{ paddingTop: 0 }}>
          <div className="container container-sm">
            <div style={{
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.2rem' }}>Want MP3 format?</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recordings are saved as WebM (Opus). Use our Audio Converter to convert to MP3, WAV or any other format.</p>
              </div>
              <Link to="/audio-converter" className="btn btn-outline btn-sm">Open Converter →</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="ltp-faq section-sm">
          <div className="container container-sm">
            <h2 className="ltp-faq__title">Frequently Asked Questions</h2>
            <div className="ltp-faq__list">
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-item__trigger" aria-expanded="false" onClick={(e) => {
                    const isOpen = e.currentTarget.getAttribute('aria-expanded') === 'true';
                    e.currentTarget.setAttribute('aria-expanded', String(!isOpen));
                    e.currentTarget.closest('.faq-item').classList.toggle('faq-item--open', !isOpen);
                    const panel = e.currentTarget.nextElementSibling;
                    if (panel) panel.style.display = isOpen ? 'none' : 'block';
                  }}>
                    <span className="faq-item__q">{faq.q}</span>
                    <span className="faq-item__chevron">+</span>
                  </button>
                  <div className="faq-item__panel" style={{ display: 'none' }}>
                    <p className="faq-item__a">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ltp-back">
          <div className="container">
            <Link to="/" className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              All Tools
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
