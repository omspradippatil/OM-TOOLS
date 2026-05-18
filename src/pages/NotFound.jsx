import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import './NotFound.css';

export default function NotFound() {
  return (
    <>
      <SEO
        title="404 — Page Not Found | OM Tools"
        description="The page you are looking for does not exist. Return to OM Tools and explore our free media downloader and utility tools."
        noindex
      />
      <main id="main-content" className="notfound">
        <div className="notfound__bg" aria-hidden="true" />
        <div className="container">
          <div className="notfound__content">
            <div className="notfound__code" aria-hidden="true">404</div>
            <h1 className="notfound__title">Page not found</h1>
            <p className="notfound__desc">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
            <div className="notfound__actions">
              <Link to="/" className="btn btn-primary btn-lg">⚡ Back to Home</Link>
              <Link to="/youtube-video-downloader" className="btn btn-outline btn-lg">YouTube Downloader</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
