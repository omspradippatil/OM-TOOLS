import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

// ── Media Downloaders ──
import Home                from './pages/Home.jsx';
import YoutubeDownloader   from './pages/YoutubeDownloader.jsx';
import YoutubeMP3          from './pages/YoutubeMP3.jsx';
import ShortsDownloader    from './pages/ShortsDownloader.jsx';
import InstagramDownloader from './pages/InstagramDownloader.jsx';
import ReelDownloader      from './pages/ReelDownloader.jsx';
import ThumbnailDownloader from './pages/ThumbnailDownloader.jsx';
import PlaylistDownloader  from './pages/PlaylistDownloader.jsx';

// ── Social Media Downloaders ──
import TikTokDownloader   from './pages/TikTokDownloader.jsx';
import TwitterDownloader  from './pages/TwitterDownloader.jsx';
import FacebookDownloader from './pages/FacebookDownloader.jsx';
import RedditDownloader   from './pages/RedditDownloader.jsx';
import PinterestDownloader from './pages/PinterestDownloader.jsx';

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

// ── New Video Editors ──
import VideoMerger       from './pages/VideoMerger.jsx';
import VideoSpeedChanger from './pages/VideoSpeedChanger.jsx';
import VideoFrameExtractor from './pages/VideoFrameExtractor.jsx';
import VideoCropper      from './pages/VideoCropper.jsx';
import VideoRotator      from './pages/VideoRotator.jsx';

// ── New Audio Tools ──
import AudioMerger    from './pages/AudioMerger.jsx';
import RingtoneMaker  from './pages/RingtoneMaker.jsx';
import AudioNormalizer from './pages/AudioNormalizer.jsx';
import VoiceRecorder  from './pages/VoiceRecorder.jsx';

// ── Image Tools ──
import ImageCompressor  from './pages/ImageCompressor.jsx';
import ImageResizer     from './pages/ImageResizer.jsx';
import ImageConverter   from './pages/ImageConverter.jsx';
import ImageCropper     from './pages/ImageCropper.jsx';
import BulkImageResizer from './pages/BulkImageResizer.jsx';

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

        {/* Social Media Downloaders */}
        <Route path="/tiktok-downloader"   element={<TikTokDownloader />} />
        <Route path="/twitter-downloader"  element={<TwitterDownloader />} />
        <Route path="/facebook-downloader" element={<FacebookDownloader />} />
        <Route path="/reddit-downloader"   element={<RedditDownloader />} />
        <Route path="/pinterest-downloader" element={<PinterestDownloader />} />

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

        {/* New Video Editors */}
        <Route path="/video-merger"         element={<VideoMerger />} />
        <Route path="/video-speed-changer"  element={<VideoSpeedChanger />} />
        <Route path="/video-frame-extractor" element={<VideoFrameExtractor />} />
        <Route path="/video-cropper"        element={<VideoCropper />} />
        <Route path="/video-rotator"        element={<VideoRotator />} />

        {/* New Audio Tools */}
        <Route path="/audio-merger"     element={<AudioMerger />} />
        <Route path="/ringtone-maker"   element={<RingtoneMaker />} />
        <Route path="/audio-normalizer" element={<AudioNormalizer />} />
        <Route path="/voice-recorder"   element={<VoiceRecorder />} />

        {/* Image Tools */}
        <Route path="/image-compressor"  element={<ImageCompressor />} />
        <Route path="/image-resizer"     element={<ImageResizer />} />
        <Route path="/image-converter"   element={<ImageConverter />} />
        <Route path="/image-cropper"     element={<ImageCropper />} />
        <Route path="/bulk-image-resizer" element={<BulkImageResizer />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
