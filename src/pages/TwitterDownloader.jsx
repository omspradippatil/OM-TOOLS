import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'Can I download Twitter/X videos?', a: 'Yes! Paste any public tweet URL containing a video or animated GIF. Works with both twitter.com and x.com links.' },
  { q: 'Does this work for Twitter GIFs?', a: 'Absolutely. Twitter GIFs are actually MP4 videos internally — they\'ll be downloaded as MP4 files.' },
  { q: 'Why are some qualities grayed out?', a: 'The available quality depends on what the original tweet uploader uploaded. Some tweets only have one quality option.' },
  { q: 'Can I download from private accounts?', a: 'No. Only public tweets and public account videos can be accessed. Private tweets require account login which we cannot do.' },
];

const FEATURES = [
  { icon: '🐦', title: 'Twitter & X Support', desc: 'Works with all twitter.com and x.com video tweet URLs. Just paste and download.' },
  { icon: '🎞️', title: 'GIF to MP4', desc: 'Download Twitter GIFs as MP4 files — the actual format Twitter stores them in.' },
  { icon: '📺', title: 'Up to 1080p HD', desc: 'Get the highest quality available for any tweet video.' },
  { icon: '⚡', title: 'Instant & Free', desc: 'No account, no sign-up, no limits. Completely free forever.' },
];

export default function TwitterDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['twitter-downloader']}
      title="Twitter / X Video Downloader"
      subtitle="Download videos and GIFs from Twitter and X in HD quality. Works with both twitter.com and x.com links."
      icon="🐦"
      platform="twitter"
      supportedTypes={['Twitter Videos', 'X Videos', 'Animated GIFs', 'Up to 1080p']}
      inputPlaceholder="Paste Twitter/X URL... (e.g. https://twitter.com/user/status/...)"
      faqs={FAQS}
      features={FEATURES}
    />
  );
}
