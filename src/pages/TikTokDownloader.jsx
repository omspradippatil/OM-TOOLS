import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'Does this remove the TikTok watermark?', a: 'Yes! We use the Cobalt API which downloads the original watermark-free source video directly from TikTok\'s servers.' },
  { q: 'Can I download TikTok videos on iPhone / Android?', a: 'Absolutely. This tool works on all modern mobile browsers — Safari on iOS and Chrome on Android are both fully supported.' },
  { q: 'Why can\'t I download a private TikTok video?', a: 'Private videos require login credentials that we cannot access. Only public videos can be downloaded.' },
  { q: 'Can I also download just the audio (MP3)?', a: 'Yes! Choose the MP3 Audio format option to extract just the background music or audio from any TikTok video.' },
];

const FEATURES = [
  { icon: '🚫', title: 'No Watermark', desc: 'Downloads the original clean video directly from TikTok — no logo, no watermark.' },
  { icon: '⚡', title: 'Instant Download', desc: 'No waiting, no queue. Click the format button and the download starts immediately.' },
  { icon: '📱', title: 'Mobile Friendly', desc: 'Works perfectly on all smartphones and tablets. Download directly to your camera roll.' },
  { icon: '🔒', title: 'Private & Secure', desc: 'No account needed, no data stored. Your downloads are completely private.' },
];

export default function TikTokDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['tiktok-downloader']}
      title="TikTok Video Downloader"
      subtitle="Download TikTok videos without watermark in HD quality. Paste any TikTok URL and save the video instantly."
      icon="🎵"
      platform="tiktok"
      supportedTypes={['TikTok Videos', 'No Watermark', 'MP3 Audio', 'HD Quality']}
      inputPlaceholder="Paste TikTok URL here... (e.g. https://www.tiktok.com/@user/video/...)"
      faqs={FAQS}
      features={FEATURES}
    />
  );
}
