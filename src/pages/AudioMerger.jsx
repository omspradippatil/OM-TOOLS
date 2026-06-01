import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { SEO_DATA } from '../constants/seoData.js';
import { isFFmpegSupported } from '../services/ffmpegLoader.js';
import '../components/LocalToolPage.css';

const FAQS = [
  { q: 'How many audio files can I merge?', a: 'Up to 10 audio files can be merged in a single session. All processing is done locally in your browser.' },
  { q: 'Can I mix different audio formats?', a: 'Yes! You can combine MP3, WAV, OGG, FLAC and other formats together. The output will be an MP3 file.' },
  { q: 'Will there be any gap between the tracks?', a: 'No. The audio files are concatenated seamlessly with no gap between them. Use the reorder buttons to set the playback sequence.' },
  { q: 'Is the quality preserved?', a: 'For MP3 output, we use 320kbps bitrate which is the highest quality available for MP3. WAV files are losslessly encoded in the merge.' },
];

export default function AudioMerger() {
  const [files, setFiles]       = useState([]);
  const [stage, setStage]       = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('');
  const inputRef = useRef(null);
  const abortRef = useRef(false);

  const seo = SEO_DATA['audio-merger'] || {};

  const isAudioFile = (f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|aac|m4a|opus|wma)$/i.test(f.name);

  const handleFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles).filter(isAudioFile);
    if (arr.length === 0) return;
    setFiles(prev => [...prev, ...arr].slice(0, 10));
    setError('');
    setStage('idle');
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
  }, [outputUrl]);

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const moveFile = (from, to) => {
    setFiles(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleProcess = async () => {
    if (files.length < 2 || stage === 'process') return;
    abortRef.current = false;
    setError('');
    setProgress(0);
    setStage('process');

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress: p }) => {
        if (!abortRef.current) setProgress(Math.min(p, 1));
      });

      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      } catch {
        const fallback = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${fallback}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${fallback}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      if (abortRef.current) return;

      const inputNames = [];
      for (let i = 0; i < files.length; i++) {
        const ext = files[i].name.split('.').pop() || 'mp3';
        const name = `input${i}.${ext}`;
        const buf = await files[i].arrayBuffer();
        await ffmpeg.writeFile(name, new Uint8Array(buf));
        inputNames.push(name);
      }

      // Build concat filter string for audio: [0:a][1:a]..concat=n=N:v=0:a=1[out]
      const filterInputs = inputNames.map((_, i) => `[${i}:a]`).join('');
      const filterStr = `${filterInputs}concat=n=${inputNames.length}:v=0:a=1[out]`;

      const inputArgs = inputNames.flatMap(n => ['-i', n]);

      await ffmpeg.exec([
        ...inputArgs,
        '-filter_complex', filterStr,
        '-map', '[out]',
        '-c:a', 'libmp3lame',
        '-b:a', '320k',
        'output.mp3',
      ]);

      const data = await ffmpeg.readFile('output.mp3');
      const outBytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);

      for (const n of inputNames) await ffmpeg.deleteFile(n).catch(() => {});
      await ffmpeg.deleteFile('output.mp3').catch(() => {});
      ffmpeg.terminate();

      if (abortRef.current) return;

      const blob = new Blob([outBytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setOutputName('merged-audio.mp3');
      setProgress(1);
      setStage('done');
    } catch (e) {
      if (abortRef.current) return;
      setError(e?.message || 'Processing failed. Ensure all files are valid audio and try again.');
      setStage('error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setFiles([]);
    setOutputUrl(null);
    setOutputName('');
    setError('');
    setStage('idle');
    setProgress(0);
  };

  const pct = Math.round(progress * 100);

  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />
      <main id="main-content" className="ltp-page">
        <section className="ltp-hero">
          <div className="ltp-hero__glow" aria-hidden="true" />
          <div className="container">
            <div className="ltp-hero__body">
              <div className="ltp-hero__icon-wrap" aria-hidden="true">
                <span className="ltp-hero__icon">🔗</span>
              </div>
              <div className="ltp-hero__text">
                <div className="ltp-hero__pills">
                  <span className="ltp-pill ltp-pill--lock">🔒 100% Local</span>
                  <span className="ltp-pill ltp-pill--free">✦ Free Forever</span>
                </div>
                <h1 className="ltp-hero__title">Audio Merger</h1>
                <p className="ltp-hero__sub">Join multiple audio files into one seamless MP3. Reorder your tracks, then merge — 100% in your browser.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ltp-workspace">
          <div className="container container-md">
            {!isFFmpegSupported() ? (
              <div className="ltp-compat-warn" role="alert">
                <span aria-hidden="true">⚠️</span>
                <div><strong>Browser not compatible.</strong> <code>WebAssembly</code> is required. Please update your browser.</div>
              </div>
            ) : (
              <div className="ltp-card">
                {stage === 'done' ? (
                  <div className="ltp-result animate-fade-up">
                    <div className="ltp-result__header">
                      <div className="ltp-result__check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div>
                        <p className="ltp-result__title">Merge complete!</p>
                        <p className="ltp-result__file">{outputName}</p>
                      </div>
                    </div>
                    <div className="ltp-result__preview ltp-result__preview--audio">
                      <div className="ltp-result__audio-icon" aria-hidden="true">🎵</div>
                      <audio src={outputUrl} controls className="ltp-result__audio" aria-label="Merged audio preview" />
                    </div>
                    <div className="ltp-result__actions">
                      <button className="ltp-result__download" onClick={handleDownload} id="download-output-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download MP3
                      </button>
                      <button className="ltp-result__again" onClick={handleReset}>↺ Start over</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="ltp-drop"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                      onClick={() => inputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload audio files to merge"
                      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                    >
                      <input ref={inputRef} type="file" accept="audio/*,.flac" multiple
                        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                        className="ltp-drop__input" aria-hidden="true" />
                      <div className="ltp-drop__border" aria-hidden="true" />
                      <div className="ltp-drop__body">
                        <div className="ltp-drop__icon-wrap" aria-hidden="true">
                          <span className="ltp-drop__emoji">🎵</span>
                          <div className="ltp-drop__ring" />
                        </div>
                        <p className="ltp-drop__title">{files.length === 0 ? 'Drop audio files here' : `${files.length} file${files.length > 1 ? 's' : ''} added — drop more`}</p>
                        <p className="ltp-drop__sub">MP3, WAV, FLAC, OGG, AAC — up to 10 tracks</p>
                        <div className="ltp-drop__cta">
                          <span className="ltp-drop__cta-inner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            {files.length === 0 ? 'Browse or drop files' : 'Add more tracks'}
                          </span>
                        </div>
                        <p className="ltp-drop__hint">🔒 Your files never leave your device</p>
                      </div>
                    </div>

                    {files.length > 0 && stage === 'idle' && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                          Tracks will be merged in the order shown below
                        </p>
                        {files.map((f, i) => (
                          <div key={i} className="ltp-filebar animate-fade-up" style={{ marginBottom: '0.5rem' }}>
                            <div className="ltp-filebar__icon" aria-hidden="true">{i + 1}</div>
                            <div className="ltp-filebar__info">
                              <span className="ltp-filebar__name">{f.name}</span>
                              <span className="ltp-filebar__meta">
                                <span className="ltp-filebar__tag">{f.name.split('.').pop().toUpperCase()}</span>
                                {(f.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {i > 0 && <button onClick={() => moveFile(i, i - 1)} className="ltp-filebar__change">↑</button>}
                              {i < files.length - 1 && <button onClick={() => moveFile(i, i + 1)} className="ltp-filebar__change">↓</button>}
                              <button onClick={() => removeFile(i)} className="ltp-filebar__change" style={{ color: 'var(--accent)' }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stage === 'process' && (
                      <div className="ltp-prog animate-fade-up" role="status">
                        <div className="ltp-prog__top">
                          <span className="ltp-prog__label">{pct < 5 ? 'Loading ffmpeg.wasm…' : `Merging… ${pct}%`}</span>
                          <span className="ltp-prog__pct">{pct}%</span>
                        </div>
                        <div className="ltp-prog__track"><div className="ltp-prog__bar" style={{ width: `${pct}%` }} /></div>
                        <p className="ltp-prog__hint">🔒 Processing on your device · Your files stay private</p>
                      </div>
                    )}

                    {stage === 'error' && (
                      <div className="ltp-error animate-fade-up" role="alert">
                        <div className="ltp-error__icon">❌</div>
                        <div><p className="ltp-error__title">Merge failed</p><p className="ltp-error__msg">{error}</p></div>
                        <button className="btn btn-outline btn-sm" onClick={() => { setStage('idle'); setError(''); }}>Try again</button>
                      </div>
                    )}

                    {stage === 'idle' && files.length >= 2 && (
                      <button className="ltp-go-btn" onClick={handleProcess} id="process-btn">
                        <span className="ltp-go-btn__icon">🎵</span>
                        <span>Merge {files.length} Audio Tracks</span>
                        <span className="ltp-go-btn__arrow">→</span>
                      </button>
                    )}
                    {stage === 'idle' && files.length === 1 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>Add at least one more audio file to merge</p>
                    )}
                    {stage === 'process' && (
                      <button className="ltp-cancel-btn" onClick={() => { abortRef.current = true; setStage('idle'); setProgress(0); }}>Cancel</button>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="ltp-privacy-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              All processing runs inside your browser using <strong>ffmpeg.wasm</strong>. Your files are never uploaded to any server.
            </div>
          </div>
        </section>

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
