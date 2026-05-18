import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

import Home                from './pages/Home.jsx';
import YoutubeDownloader   from './pages/YoutubeDownloader.jsx';
import YoutubeMP3          from './pages/YoutubeMP3.jsx';
import ShortsDownloader    from './pages/ShortsDownloader.jsx';
import InstagramDownloader from './pages/InstagramDownloader.jsx';
import ReelDownloader      from './pages/ReelDownloader.jsx';
import ThumbnailDownloader from './pages/ThumbnailDownloader.jsx';
import NotFound            from './pages/NotFound.jsx';

function AppLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <Routes>
        <Route path="/"                          element={<Home />} />
        <Route path="/youtube-video-downloader"  element={<YoutubeDownloader />} />
        <Route path="/youtube-mp3-converter"     element={<YoutubeMP3 />} />
        <Route path="/shorts-downloader"         element={<ShortsDownloader />} />
        <Route path="/instagram-downloader"      element={<InstagramDownloader />} />
        <Route path="/instagram-reel-downloader" element={<ReelDownloader />} />
        <Route path="/thumbnail-downloader"      element={<ThumbnailDownloader />} />
        <Route path="*"                          element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
