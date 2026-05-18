import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What YouTube video formats can I download?', a: 'OM Tools supports MP4 (up to 4K), WEBM, and audio-only MP3/M4A. Choose the format and quality that suits your needs.' },
  { q: 'Is there a file size limit?', a: 'No. You can download any YouTube video regardless of length or size — it is completely free and unlimited.' },
  { q: 'Can I download YouTube playlists?', a: 'Currently OM Tools focuses on individual videos. Playlist support is coming soon.' },
  { q: 'Does it work on mobile?', a: 'Yes! OM Tools is fully mobile-optimized. Paste any YouTube URL on your phone and download instantly.' },
  { q: 'Is it legal to download YouTube videos?', a: 'Only download videos you own or have explicit permission to download. Downloading copyrighted content without permission may violate YouTube\'s Terms of Service.' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant Processing', desc: 'Get your download link in seconds — no waiting in queues.' },
  { icon: '🎯', title: '4K & HD Support', desc: 'Download up to 4K resolution when available on the source video.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'No account needed. Your URLs are never stored or logged.' },
  { icon: '📱', title: 'Works on Mobile', desc: 'Fully optimized for Android and iOS browsers.' },
];

export default function YoutubeDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['youtube-video-downloader']}
      title="YouTube Video Downloader"
      subtitle="Download any YouTube video in MP4, WEBM, or audio-only. Supports up to 4K. Free, fast, no sign-up."
      icon="▶"
      platform="youtube"
      supportedTypes={['MP4', 'WEBM', '4K', '1080p', '720p', '480p', '360p', 'Audio']}
      faqs={FAQS}
      features={FEATURES}
      inputPlaceholder="Paste YouTube video URL (e.g. https://youtube.com/watch?v=...)"
    />
  );
}
