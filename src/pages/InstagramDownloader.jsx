import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What Instagram content can I download?', a: 'OM Tools supports Instagram posts (videos), Reels, IGTV, and story videos.' },
  { q: 'Do I need an Instagram account?', a: 'No. You only need the public URL of the post. Private accounts are not supported.' },
  { q: 'Will there be a watermark?', a: 'No. Downloads are in their original quality without any added watermarks.' },
  { q: 'Can I download Instagram photos?', a: 'Yes, photos from Instagram posts can be downloaded as JPG.' },
];

const FORMATS = [
  { id: 'mp4-hd', label: 'MP4', quality: 'HD Original', size: '~20 MB' },
  { id: 'mp4-sd', label: 'MP4', quality: 'SD',          size: '~8 MB'  },
  { id: 'jpg',    label: 'JPG', quality: 'Full Res',    size: '~2 MB'  },
];

export default function InstagramDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['instagram-downloader']}
      title="Instagram Downloader"
      subtitle="Download Instagram videos, posts, stories, and IGTV. HD quality, no watermark, free."
      icon="📸"
      platform="instagram"
      formats={FORMATS}
      supportedTypes={['Videos', 'Reels', 'IGTV', 'Photos', 'No Watermark']}
      faqs={FAQS}
      inputPlaceholder="Paste Instagram post or reel URL..."
    />
  );
}
