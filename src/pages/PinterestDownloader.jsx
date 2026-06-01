import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What Pinterest content can I download?', a: 'You can download Pinterest video pins and animated GIF pins. Static image pins are not videos and cannot be downloaded with this tool.' },
  { q: 'How do I find the Pinterest pin URL?', a: 'Open the pin you want to download, then copy the URL from your browser address bar. The URL will look like: https://www.pinterest.com/pin/...' },
  { q: 'Do I need a Pinterest account?', a: 'No Pinterest account is needed. However, only publicly accessible pins can be downloaded. Pins on secret boards cannot be accessed.' },
  { q: 'Why is the video quality limited?', a: 'Pinterest compresses videos when they are uploaded. The quality available is the maximum Pinterest provides — we download the original full quality file.' },
];

const FEATURES = [
  { icon: '📌', title: 'Pinterest Videos', desc: 'Download any public Pinterest video pin in original quality.' },
  { icon: '🎞️', title: 'GIF Pins', desc: 'Download Pinterest animated GIF pins as MP4 video files.' },
  { icon: '🔒', title: 'No Account Needed', desc: 'Download Pinterest videos without logging in to any account.' },
  { icon: '⚡', title: 'Instant & Free', desc: 'Paste the URL and download immediately. No sign-up, no ads, completely free.' },
];

export default function PinterestDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['pinterest-downloader']}
      title="Pinterest Video Downloader"
      subtitle="Download Pinterest video pins and animated GIFs in original quality. Free, instant, no account required."
      icon="📌"
      platform="pinterest"
      supportedTypes={['Pinterest Videos', 'GIF Pins', 'HD Quality', 'No Account']}
      inputPlaceholder="Paste Pinterest pin URL... (e.g. https://www.pinterest.com/pin/...)"
      faqs={FAQS}
      features={FEATURES}
    />
  );
}
