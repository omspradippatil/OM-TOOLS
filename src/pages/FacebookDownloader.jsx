import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What Facebook videos can I download?', a: 'Public videos from Facebook posts, Facebook Watch, and Facebook Reels. The video must be publicly accessible (not friends-only or private).' },
  { q: 'How do I get a Facebook video URL?', a: 'On desktop, click on the video to open it full screen, then copy the URL from the address bar. On mobile, tap the three dots (⋯) next to the video and choose "Copy link".' },
  { q: 'Why does my Facebook video URL not work?', a: 'Only public videos work. Friends-only, private, and group-restricted videos cannot be downloaded. Also ensure you\'re copying the video URL and not the post URL.' },
  { q: 'Can I download Facebook Reels?', a: 'Yes! Facebook Reels are supported. Simply copy the Reel URL and paste it below.' },
];

const FEATURES = [
  { icon: '📘', title: 'Facebook & FB Watch', desc: 'Download from public Facebook posts, Watch videos, and Facebook Reels.' },
  { icon: '🎬', title: 'HD & SD Quality', desc: 'Choose between high definition or standard definition download.' },
  { icon: '🔒', title: 'No Login Required', desc: 'No Facebook account needed. Only public videos can be downloaded.' },
  { icon: '📱', title: 'Works on Mobile', desc: 'Download Facebook videos directly to your phone\'s storage.' },
];

export default function FacebookDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['facebook-downloader']}
      title="Facebook Video Downloader"
      subtitle="Download public Facebook videos, Watch content and Reels in HD or SD quality. No account needed."
      icon="📘"
      platform="facebook"
      supportedTypes={['Facebook Videos', 'Facebook Watch', 'Facebook Reels', 'HD & SD']}
      inputPlaceholder="Paste Facebook video URL... (e.g. https://www.facebook.com/...)"
      faqs={FAQS}
      features={FEATURES}
    />
  );
}
