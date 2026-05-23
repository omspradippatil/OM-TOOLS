import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import UrlInput from '../components/UrlInput.jsx';
import { detectPlatform, isValidUrl } from '../constants/tools.js';
import { SEO_DATA } from '../constants/seoData.js';
import {
  fetchCobaltLink,
  downloadToBuffer,
  saveToDevice,
  formatToOptions,
  mimeForExt,
} from '../services/downloader.js';
import JSZip from 'jszip';
import './PlaylistDownloader.css';

export default function PlaylistDownloader() {
  const [searchParams] = useSearchParams();
  const [urlVal, setUrlVal] = useState(searchParams.get('url') || '');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState('');

  // Checklist Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [formatId, setFormatId] = useState('mp4-720'); // Default to 720p Video

  // Batch download state
  const [zipStage, setZipStage] = useState(null); // null, 'fetching', 'downloading', 'zipping', 'done', 'error'
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemProgress, setItemProgress] = useState(0);
  const [itemSpeed, setItemSpeed] = useState('');
  const [currentItemTitle, setCurrentItemTitle] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [zipProgress, setZipProgress] = useState(0);
  const [failedItems, setFailedItems] = useState([]);
  const [zipError, setZipError] = useState('');

  const abortRef = useRef(null);

  useEffect(() => {
    const q = searchParams.get('url');
    if (q && isValidUrl(q)) {
      handleFetch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch playlist items from server
  async function handleFetch(targetUrl) {
    const url = (targetUrl || urlVal).trim();
    if (!url) {
      setError('Please paste a playlist URL first.');
      return;
    }
    if (!isValidUrl(url)) {
      setError('That doesn\'t look like a valid URL.');
      return;
    }

    const det = detectPlatform(url);
    if (!det || det.type !== 'playlist') {
      setError('Please provide a valid YouTube playlist URL.');
      return;
    }

    setError('');
    setPlaylist(null);
    setLoading(true);

    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setPlaylist(data);
      // Select all videos by default
      setSelectedIds(new Set(data.videos.map((v) => v.id)));
    } catch (err) {
      setError(err.message || 'Failed to fetch playlist details. Please check the URL or try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Handle selection checkbox toggles
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!playlist) return;
    setSelectedIds(new Set(playlist.videos.map((v) => v.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Perform sequential batch download & zipping
  async function startBatchDownload() {
    if (!playlist || selectedIds.size === 0) return;

    const selectedVideos = playlist.videos.filter((v) => selectedIds.has(v.id));
    const fmtOpts = formatToOptions(formatId);

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setZipError('');
    setFailedItems([]);
    setZipProgress(0);
    setCurrentItemIndex(0);
    setItemProgress(0);
    setItemSpeed('');
    setOverallProgress(0);
    setZipStage('fetching');

    const zip = new JSZip();
    let downloadedCount = 0;

    try {
      for (let idx = 0; idx < selectedVideos.length; idx++) {
        if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');

        const video = selectedVideos[idx];
        setCurrentItemIndex(idx);
        setCurrentItemTitle(video.title);
        setItemProgress(0);
        setItemSpeed('');
        setZipStage('fetching');

        try {
          // 1. Fetch direct download link from Cobalt
          const cobalt = await fetchCobaltLink(video.url, {
            mode: fmtOpts.mode,
            quality: fmtOpts.quality,
            audioFormat: fmtOpts.audioFormat,
            audioBitrate: fmtOpts.audioBitrate,
            signal,
          });

          // Ensure extension is corrected
          let filename = cobalt.filename || `video_${video.id}.${fmtOpts.ext}`;
          if (!filename.endsWith(`.${fmtOpts.ext}`)) {
            filename = filename.split('.').slice(0, -1).join('.') + `.${fmtOpts.ext}`;
          }

          // 2. Stream download the file bytes to browser memory
          setZipStage('downloading');
          const buffer = await downloadToBuffer(
            cobalt.url,
            (progressData) => {
              if (typeof progressData === 'number') {
                setItemProgress(progressData);
              } else {
                setItemProgress(progressData.progress);
                setItemSpeed(progressData.speed);
              }
            },
            signal
          );

          // 3. Add to ZIP archive
          zip.file(filename, buffer);
          downloadedCount++;
        } catch (itemErr) {
          if (itemErr.name === 'AbortError') throw itemErr;
          console.warn(`Failed to download: ${video.title}`, itemErr);
          setFailedItems((prev) => [...prev, video.title]);
        }

        // Update overall percentage progress
        setOverallProgress((idx + 1) / selectedVideos.length);
      }

      if (downloadedCount === 0) {
        throw new Error('All selected videos failed to download. Please try a different quality or format.');
      }

      // 4. Generate Zip File
      setZipStage('zipping');
      setZipProgress(0);

      const zipBlob = await zip.generateAsync(
        { type: 'blob', streamFiles: true },
        (metadata) => {
          setZipProgress(Math.round(metadata.percent));
        }
      );

      // 5. Trigger download save dialog
      const cleanTitle = playlist.title.replace(/[^a-zA-Z0-9]/g, '_') || 'Playlist';
      saveToDevice(zipBlob, `${cleanTitle}_${fmtOpts.ext}.zip`, 'application/zip');
      
      setZipStage('done');

      // Log success to Firestore for download counts
      try {
        const { db } = await import('../firebase');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'downloads'), {
          timestamp: serverTimestamp(),
          platform: 'youtube',
          quality: fmtOpts.quality || 'unknown',
          mode: `playlist_${fmtOpts.mode || 'video'}`,
          videoCount: downloadedCount
        });
      } catch (dbErr) {
        console.error('Failed to log successful download:', dbErr);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setZipStage(null);
        return;
      }
      setZipError(err.message || 'An error occurred during downloading or zipping.');
      setZipStage('error');

      // Log failure to Firestore
      try {
        const { db } = await import('../firebase');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'downloadLogs'), {
          error: err.message || err.toString(),
          url: playlist?.title || 'Unknown Playlist',
          timestamp: serverTimestamp(),
          stage: `playlist_${zipStage || 'unknown'}`
        });
      } catch (logErr) {
        console.error('Failed to save log to Firestore:', logErr);
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setZipStage(null);
  }

  const selectedVideosCount = selectedIds.size;
  const isVideoFormat = formatId.startsWith('mp4');
  const showMemoryWarning = selectedVideosCount > 10 && isVideoFormat;

  const seo = SEO_DATA['youtube-playlist-downloader'] || {
    title: 'YouTube Playlist Downloader Free — Save Video/MP3 in ZIP | OM Tools',
    description: 'Download full YouTube playlists as MP4 videos or MP3 audio in a single ZIP file. Free, on-device zipping, works on all devices.',
    keywords: 'youtube playlist downloader, download youtube playlist, youtube playlist to mp3, save playlist zip, download playlist online free',
    url: 'https://om-tools.netlify.app/youtube-playlist-downloader',
  };

  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />

      {/* Progress Dialog Overlay */}
      {zipStage && zipStage !== 'done' && zipStage !== 'error' && (
        <div className="playlist-overlay">
          <div className="playlist-overlay__card animate-pulse-glow">
            <div className="playlist-overlay__header">
              <h3 className="playlist-overlay__title">
                {zipStage === 'fetching' && 'Connecting to Download Servers...'}
                {zipStage === 'downloading' && 'Streaming Playlist Media...'}
                {zipStage === 'zipping' && 'Compressing into ZIP...'}
              </h3>
              <p className="playlist-overlay__subtitle">
                {zipStage !== 'zipping' 
                  ? `Processing item ${currentItemIndex + 1} of ${selectedIds.size}` 
                  : 'Wrapping up your download archive'}
              </p>
            </div>

            {/* Current Item Progress */}
            {zipStage !== 'zipping' && (
              <div className="progress-track">
                <div className="progress-track__labels">
                  <span className="progress-track__name">Current File</span>
                  <span className="progress-track__percentage">{Math.round(itemProgress * 100)}%</span>
                </div>
                <div className="progress-track__bar-wrap">
                  <div 
                    className="progress-track__bar" 
                    style={{ width: `${itemProgress * 100}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Overall Playlist Progress / Zipping Progress */}
            <div className="progress-track">
              <div className="progress-track__labels">
                <span className="progress-track__name">
                  {zipStage === 'zipping' ? 'ZIP Compression' : 'Overall Playlist'}
                </span>
                <span className="progress-track__percentage">
                  {zipStage === 'zipping' ? `${zipProgress}%` : `${Math.round(overallProgress * 100)}%`}
                </span>
              </div>
              <div className="progress-track__bar-wrap">
                <div 
                  className={`progress-track__bar progress-track__bar--accent`} 
                  style={{ width: `${zipStage === 'zipping' ? zipProgress : overallProgress * 100}%` }} 
                />
              </div>
            </div>

            {/* Detail Stats */}
            {zipStage !== 'zipping' && (
              <div className="playlist-overlay__detail-row">
                <span>Speed: {itemSpeed ? `${itemSpeed} MB/s` : 'Calculating...'}</span>
                <span>Skipped: {failedItems.length}</span>
              </div>
            )}

            {/* Item Title Info */}
            {zipStage !== 'zipping' && (
              <div className="playlist-overlay__item-info">
                <div className="playlist-overlay__item-title">{currentItemTitle}</div>
                <div className="playlist-overlay__item-status">
                  {zipStage === 'fetching' ? 'Requesting video links...' : 'Fetching raw media bytes...'}
                </div>
              </div>
            )}

            <button onClick={handleCancel} className="btn btn-outline" style={{ marginTop: 'var(--space-sm)' }}>
              🚫 Cancel Download
            </button>
          </div>
        </div>
      )}

      <main id="main-content">
        {/* Hero Section */}
        <section className="tool-hero">
          <div className="tool-hero__bg" aria-hidden="true" />
          <div className="container">
            <div className="tool-hero__content">
              <div className="tool-hero__badge">
                <span aria-hidden="true">📂</span>
                <span className="tool-hero__platform">YouTube Playlist</span>
              </div>
              <h1 className="tool-hero__title">Playlist Downloader</h1>
              <p className="tool-hero__subtitle">
                Save whole YouTube playlists as a single ZIP file containing videos or high-quality MP3s. On-device compression.
              </p>

              <div className="tool-hero__input">
                <UrlInput
                  placeholder="Paste YouTube playlist link (e.g. https://youtube.com/playlist?list=...)"
                  onFetch={handleFetch}
                />
              </div>

              {loading && (
                <div className="tool-hero__analyzing">
                  <div className="spinner" />
                  Analyzing playlist and loading video details...
                </div>
              )}

              {error && (
                <div className="tool-error" style={{ marginTop: 'var(--space-md)' }}>
                  <span>⚠</span> {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Workspace: Display playlist files and formats */}
        {playlist && zipStage !== 'done' && zipStage !== 'error' && (
          <section className="tool-result section-sm">
            <div className="container">
              <div className="playlist-container">
                
                {/* Playlist Info Banner */}
                <div className="playlist-header-card">
                  <div className="playlist-header-card__thumb-wrap">
                    {playlist.videos[0] && (
                      <img 
                        src={playlist.videos[0].thumbnail} 
                        alt={playlist.title} 
                        className="playlist-header-card__thumb"
                      />
                    )}
                    <div className="playlist-header-card__badge">
                      <span className="playlist-header-card__badge-icon">📂</span>
                      <span>PLAYLIST</span>
                    </div>
                  </div>
                  <div className="playlist-header-card__info">
                    <h2 className="playlist-header-card__title">{playlist.title}</h2>
                    <p className="playlist-header-card__meta">
                      📺 YouTube · {playlist.videos.length} videos available
                    </p>
                  </div>
                </div>

                <div className="playlist-workspace">
                  
                  {/* Left checklist column */}
                  <div className="playlist-list-card">
                    <div className="playlist-list-card__header">
                      <h3 className="playlist-list-card__title">Select Videos to Download</h3>
                      <div className="playlist-list-card__actions">
                        <button onClick={handleSelectAll} className="btn btn-ghost btn-sm">
                          ☑ Select All
                        </button>
                        <button onClick={handleClearAll} className="btn btn-ghost btn-sm">
                          ☐ Clear
                        </button>
                      </div>
                    </div>

                    <div className="playlist-list__scroll">
                      {playlist.videos.map((video) => {
                        const isSelected = selectedIds.has(video.id);
                        return (
                          <div 
                            key={video.id} 
                            className={`playlist-item${isSelected ? ' playlist-item--selected' : ''}`}
                            onClick={() => handleToggleSelect(video.id)}
                          >
                            <div className="playlist-item__checkbox-wrap">
                              <input 
                                type="checkbox"
                                className="playlist-item__checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by click on parent row
                              />
                            </div>
                            <div className="playlist-item__thumb-wrap">
                              <img src={video.thumbnail} alt={video.title} className="playlist-item__thumb" loading="lazy" />
                              <span className="playlist-item__duration">{video.duration}</span>
                            </div>
                            <div className="playlist-item__info">
                              <h4 className="playlist-item__title">{video.title}</h4>
                              <p className="playlist-item__channel">👤 {video.channel}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right settings and action column */}
                  <div className="playlist-settings-card">
                    <h3 className="playlist-settings-card__title">Download Options</h3>

                    {/* Format setting */}
                    <div className="setting-group">
                      <label className="setting-group__label">Choose Output Format</label>
                      <select 
                        className="setting-group__select"
                        value={formatId}
                        onChange={(e) => setFormatId(e.target.value)}
                      >
                        <optgroup label="Video ZIP (MP4)">
                          <option value="mp4-1080">1080p Full HD Video</option>
                          <option value="mp4-720">720p HD Video</option>
                          <option value="mp4-480">480p SD Video</option>
                          <option value="mp4-360">360p Low Quality</option>
                        </optgroup>
                        <optgroup label="Audio ZIP (MP3)">
                          <option value="mp3-320">MP3 320kbps (Best)</option>
                          <option value="mp3-256">MP3 256kbps (Good)</option>
                          <option value="mp3-192">MP3 192kbps (Standard)</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Warn users on browser memory crash boundaries */}
                    {showMemoryWarning && (
                      <div className="playlist-warning-box">
                        <span className="playlist-warning-box__icon">⚠️</span>
                        <div className="playlist-warning-box__text">
                          <strong>Memory Warning:</strong> Downloading {selectedVideosCount} video files at HD resolution in a single session requires significant browser memory (RAM). If downloading on a phone or older laptop, we recommend downloading in smaller batches (under 10 videos) or choosing 480p/360p or MP3 format.
                        </div>
                      </div>
                    )}

                    {/* Selection Summary */}
                    <div className="playlist-summary">
                      <div className="playlist-summary__row">
                        <span className="playlist-summary__label">Selected Videos</span>
                        <span className="playlist-summary__value">{selectedVideosCount} / {playlist.videos.length}</span>
                      </div>
                      <div className="playlist-summary__row">
                        <span className="playlist-summary__label">Output Archive</span>
                        <span className="playlist-summary__value">{isVideoFormat ? 'ZIP (MP4 Video)' : 'ZIP (MP3 Audio)'}</span>
                      </div>
                    </div>

                    <button 
                      onClick={startBatchDownload} 
                      disabled={selectedVideosCount === 0}
                      className="btn btn-primary btn-lg" 
                      style={{ width: '100%' }}
                    >
                      ⚡ Download Selected ({selectedVideosCount})
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </section>
        )}

        {/* Error Screen */}
        {zipStage === 'error' && (
          <section className="tool-result section-sm animate-fade-up">
            <div className="container container-sm">
              <div className="tool-error" style={{ marginBottom: 'var(--space-md)' }}>
                <span>⚠</span> {zipError}
              </div>
              <button onClick={() => setZipStage(null)} className="btn btn-primary" style={{ width: '100%' }}>
                ◀ Back to Playlist
              </button>
            </div>
          </section>
        )}

        {/* Success Screen & Extract Instructions */}
        {zipStage === 'done' && (
          <section className="tool-result section-sm">
            <div className="container">
              <div className="playlist-success-card">
                <div className="playlist-success-card__icon-wrap">
                  ✓
                </div>
                <div className="playlist-success-card__content">
                  <h2 className="playlist-success-card__title">Download Complete!</h2>
                  <p className="playlist-success-card__desc">
                    Your ZIP archive has been compiled entirely on-device and saved to your Downloads folder.
                  </p>
                  {failedItems.length > 0 && (
                    <p style={{ color: 'var(--accent)', fontSize: '0.875rem', marginTop: '4px' }}>
                      ⚠️ Note: {failedItems.length} videos were skipped because they are restricted or unavailable.
                    </p>
                  )}
                </div>

                {/* Clear Extract Instructions */}
                <div className="extract-instructions">
                  <div className="extract-instructions__header">
                    <span>📦</span> How to Extract Your ZIP File
                  </div>
                  <div className="extract-instructions__grid">
                    <div className="extract-step">
                      <span className="extract-step__platform">Windows</span>
                      <span className="extract-step__text">
                        Right-click the downloaded `.zip` file, select <strong>Extract All...</strong>, then click <strong>Extract</strong>.
                      </span>
                    </div>
                    <div className="extract-step">
                      <span className="extract-step__platform">macOS</span>
                      <span className="extract-step__text">
                        Double-click the `.zip` file in Finder. It will automatically extract into a folder in the same location.
                      </span>
                    </div>
                    <div className="extract-step">
                      <span className="extract-step__platform">Android</span>
                      <span className="extract-step__text">
                        Open the <strong>Files by Google</strong> app, select the zip file in <strong>Downloads</strong>, tap it, and select <strong>Extract</strong>.
                      </span>
                    </div>
                    <div className="extract-step">
                      <span className="extract-step__platform">iPhone &amp; iPad</span>
                      <span className="extract-step__text">
                        Open the native <strong>Files</strong> app, go to <strong>Downloads</strong>, and tap the `.zip` archive to extract it instantly.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-md" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                  <button onClick={() => setZipStage(null)} className="btn btn-outline" style={{ flex: 1 }}>
                    ◀ Back to Playlist
                  </button>
                  <Link to="/" className="btn btn-primary" style={{ flex: 1 }}>
                    🏠 Go to Homepage
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
