import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { SEO_DATA } from '../constants/seoData.js';
import './OfflineTool.css';

export default function CompressPDF() {
  const seo = SEO_DATA['compress-pdf'];
  return (
    <>
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} url={seo.url} />
      <main id="main-content">
        <section className="offline-hero">
          <div className="offline-hero__bg" aria-hidden="true" />
          <div className="container">
            <div className="offline-hero__content">
              <span className="offline-hero__icon" aria-hidden="true">📦</span>
              <div className="badge badge-success offline-hero__badge">⚡ Works Offline</div>
              <h1 className="offline-hero__title">Compress PDF</h1>
              <p className="offline-hero__subtitle">
                Reduce PDF file size while preserving quality. Runs locally — your files never leave your device.
              </p>
              <div className="offline-coming-soon">
                <div className="offline-cs__icon">🔧</div>
                <h2 className="offline-cs__title">Tool Launching Soon</h2>
                <p className="offline-cs__desc">
                  The Compress PDF tool is under development and will run entirely in your browser. 
                  Try <a href="https://om-pdf.netlify.app/compress" target="_blank" rel="noopener noreferrer" className="offline-cs__link">OM PDF Compress</a> for a working version.
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
