import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'How do I download an Instagram Reel?', a: 'Copy the Reel URL from Instagram (share → copy link), paste it here, and click Download.' },
  { q: 'Is the Reel download watermark-free?', a: 'Yes. OM Tools downloads the original Reel video without any added watermarks.' },
  { q: 'What quality are the Reels?', a: 'Reels are downloaded in original quality as uploaded by the creator.' },
  { q: 'Can I download private Reels?', a: 'No. Only publicly available Reels can be downloaded.' },
];

const FORMATS = [
  { id: 'mp4-hd', label: 'MP4', quality: 'HD Original', size: '~18 MB' },
  { id: 'mp4-sd', label: 'MP4', quality: 'SD',          size: '~7 MB'  },
];

export default function ReelDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['instagram-reel-downloader']}
      title="Instagram Reel Downloader"
      subtitle="Download Instagram Reels in original HD quality — no watermark, no sign-up, completely free."
      icon="🎞"
      platform="instagram"
      formats={FORMATS}
      supportedTypes={['MP4', 'HD Original', 'No Watermark', 'Public Reels']}
      faqs={FAQS}
      inputPlaceholder="Paste Instagram Reel URL (instagram.com/reel/...)..."
    />
  );
}
