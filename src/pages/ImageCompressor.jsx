import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { SEO_DATA } from '../constants/seoData.js';
import './OfflineTool.css';

export default function ImageCompressor() {
  const seo = SEO_DATA['image-compressor'];
  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />
      <main id="main-content">
        <section className="offline-hero">
          <div className="offline-hero__bg" aria-hidden="true" />
          <div className="container">
            <div className="offline-hero__content">
              <span className="offline-hero__icon" aria-hidden="true">🗜</span>
              <div className="badge badge-success offline-hero__badge">⚡ Works Offline</div>
              <h1 className="offline-hero__title">Image Compressor</h1>
              <p className="offline-hero__subtitle">
                Compress JPG, PNG and WebP images with no quality loss. Runs 100% locally in your browser.
              </p>
              <div className="offline-coming-soon">
                <div className="offline-cs__icon">🔧</div>
                <h2 className="offline-cs__title">Tool Launching Soon</h2>
                <p className="offline-cs__desc">
                  The Image Compressor is under active development. It will use the browser Canvas API for lossless and lossy compression without any uploads.
                </p>
                <Link to="/" className="btn btn-primary">← Back to All Tools</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
