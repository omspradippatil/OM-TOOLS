import './ProcessingOverlay.css';

const STAGES = [
  { id: 'fetch',    label: 'Fetching media info',        icon: '🔍' },
  { id: 'download', label: 'Downloading to your device', icon: '⬇️' },
  { id: 'process',  label: 'Processing in browser',      icon: '⚙️' },
  { id: 'done',     label: 'Ready to save!',             icon: '✅' },
];

export default function ProcessingOverlay({
  stage,       // 'fetch' | 'download' | 'process' | 'done' | 'error'
  progress,    // 0–1
  speed,
  filename,
  errorMsg,
  onCancel,
  onClose,
}) {
  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const currentStage = STAGES[stageIndex] || STAGES[0];
  const pct = Math.round((progress || 0) * 100);
  const isError = stage === 'error';
  const isDone  = stage === 'done';

  return (
    <div className="proc-overlay" role="dialog" aria-modal="true" aria-label="Processing media">
      <div className="proc-overlay__bg" aria-hidden="true">
        <div className="proc-blob proc-blob--1" />
        <div className="proc-blob proc-blob--2" />
      </div>

      <div className="proc-card">
        {/* Icon */}
        <div className={`proc-card__icon-wrap${isError ? ' error' : isDone ? ' done' : ' spinning'}`}>
          <span className="proc-card__icon" aria-hidden="true">
            {isError ? '⚠️' : isDone ? '✅' : currentStage.icon}
          </span>
          {!isError && !isDone && (
            <svg className="proc-card__ring" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(108,99,255,0.2)" strokeWidth="3"/>
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="url(#ring-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${150.8 * pct / 100} 150.8`}
                strokeDashoffset="37.7"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
              <defs>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6C63FF"/>
                  <stop offset="100%" stopColor="#FF6B9D"/>
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* Status */}
        {isError ? (
          <>
            <h2 className="proc-card__title error">Something went wrong</h2>
            <p className="proc-card__desc">{errorMsg || 'An error occurred while processing your download.'}</p>
          </>
        ) : isDone ? (
          <>
            <h2 className="proc-card__title done">Download Complete!</h2>
            {filename && <p className="proc-card__filename">{filename}</p>}
            <p className="proc-card__desc">Your file has been saved to your device.</p>
          </>
        ) : (
          <>
            <h2 className="proc-card__title">{currentStage.label}</h2>
            {filename && <p className="proc-card__filename">{filename}</p>}
            <p className="proc-card__desc proc-card__desc--progress" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {stage === 'download' && `Downloading... ${pct}%`}
                {stage === 'process'  && `Converting... ${pct}%`}
                {stage === 'fetch'    && 'Please wait a moment...'}
              </span>
              {speed && stage === 'download' && <span className="badge badge-primary">{speed} MB/s</span>}
            </p>
          </>
        )}

        {/* Progress bar */}
        {!isError && !isDone && (
          <div className="proc-card__bar-wrap">
            <div
              className="proc-card__bar"
              style={{ width: `${Math.max(pct, stage === 'fetch' ? 0 : 2)}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            {stage === 'fetch' && <div className="proc-card__bar proc-card__bar--indeterminate" />}
          </div>
        )}

        {/* Stages */}
        {!isError && (
          <div className="proc-card__stages">
            {STAGES.map((s, i) => (
              <div
                key={s.id}
                className={`proc-stage${i < stageIndex ? ' done' : i === stageIndex ? ' active' : ''}`}
              >
                <span className="proc-stage__dot" aria-hidden="true" />
                <span className="proc-stage__label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Privacy badge */}
        {!isError && !isDone && (
          <div className="proc-card__privacy">
            <span aria-hidden="true">🔒</span>
            All processing happens on your device — nothing sent to our servers.
          </div>
        )}

        {/* Actions */}
        <div className="proc-card__actions">
          {isDone && (
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          )}
          {(isError || !isDone) && (
            <button
              className={`btn ${isError ? 'btn-outline' : 'btn-ghost'}`}
              onClick={isError ? onClose : onCancel}
            >
              {isError ? 'Close' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
