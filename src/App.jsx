import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// ── Media Downloaders ──
import Home                from './pages/Home.jsx';
import YoutubeDownloader   from './pages/YoutubeDownloader.jsx';
import YoutubeMP3          from './pages/YoutubeMP3.jsx';
import ShortsDownloader    from './pages/ShortsDownloader.jsx';
import InstagramDownloader from './pages/InstagramDownloader.jsx';
import ReelDownloader      from './pages/ReelDownloader.jsx';
import ThumbnailDownloader from './pages/ThumbnailDownloader.jsx';
import PlaylistDownloader  from './pages/PlaylistDownloader.jsx';

// ── Video & Audio Editor (ffmpeg.wasm) ──
import VideoConverter  from './pages/VideoConverter.jsx';
import VideoTrimmer    from './pages/VideoTrimmer.jsx';
import VideoCompressor from './pages/VideoCompressor.jsx';
import VideoToGif      from './pages/VideoToGif.jsx';
import VideoMuter      from './pages/VideoMuter.jsx';
import AudioExtractor  from './pages/AudioExtractor.jsx';
import AudioConverter  from './pages/AudioConverter.jsx';
import AudioTrimmer    from './pages/AudioTrimmer.jsx';
import VolumeBooster   from './pages/VolumeBooster.jsx';

import NotFound from './pages/NotFound.jsx';


function AppLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <Routes>
        {/* Media Downloaders */}
        <Route path="/"                               element={<Home />} />
        <Route path="/youtube-video-downloader"       element={<YoutubeDownloader />} />
        <Route path="/youtube-mp3-converter"          element={<YoutubeMP3 />} />
        <Route path="/shorts-downloader"              element={<ShortsDownloader />} />
        <Route path="/instagram-downloader"           element={<InstagramDownloader />} />
        <Route path="/instagram-reel-downloader"      element={<ReelDownloader />} />
        <Route path="/thumbnail-downloader"           element={<ThumbnailDownloader />} />
        <Route path="/youtube-playlist-downloader"    element={<PlaylistDownloader />} />

        {/* Video & Audio Editor */}
        <Route path="/video-converter"   element={<VideoConverter />} />
        <Route path="/video-trimmer"     element={<VideoTrimmer />} />
        <Route path="/video-compressor"  element={<VideoCompressor />} />
        <Route path="/video-to-gif"      element={<VideoToGif />} />
        <Route path="/video-muter"       element={<VideoMuter />} />
        <Route path="/audio-extractor"   element={<AudioExtractor />} />
        <Route path="/audio-converter"   element={<AudioConverter />} />
        <Route path="/audio-trimmer"     element={<AudioTrimmer />} />
        <Route path="/volume-booster"    element={<VolumeBooster />} />

        <Route path="*" element={<NotFound />} />
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
