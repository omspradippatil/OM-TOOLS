import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What is a YouTube Short?', a: 'YouTube Shorts are vertical videos under 60 seconds, similar to TikTok and Instagram Reels.' },
  { q: 'Can I download Shorts in HD?', a: 'Yes! OM Tools downloads YouTube Shorts in up to 1080p HD quality.' },
  { q: 'How do I get the Shorts URL?', a: 'Tap the share button on the Short and copy the link. It will look like youtube.com/shorts/VIDEO_ID.' },
  { q: 'Is downloading Shorts free?', a: 'Yes — completely free, no sign-up needed.' },
];

const FORMATS = [
  { id: 'mp4-1080', label: 'MP4', quality: '1080p HD', size: '~12 MB' },
  { id: 'mp4-720',  label: 'MP4', quality: '720p',     size: '~6 MB'  },
  { id: 'mp4-480',  label: 'MP4', quality: '480p',     size: '~3 MB'  },
];

export default function ShortsDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['shorts-downloader']}
      title="YouTube Shorts Downloader"
      subtitle="Download YouTube Shorts in HD quality with one click. Free, no watermark, no sign-up."
      icon="⚡"
      platform="youtube"
      formats={FORMATS}
      supportedTypes={['MP4', '1080p HD', '720p', '480p']}
      faqs={FAQS}
      inputPlaceholder="Paste YouTube Shorts URL (youtube.com/shorts/...)..."
    />
  );
}
