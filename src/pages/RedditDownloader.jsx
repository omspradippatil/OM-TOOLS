import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'Why does Reddit split audio and video into separate streams?', a: 'Reddit uses DASH streaming which separates audio and video into different tracks. Our downloader automatically merges them into a single MP4 file for you.' },
  { q: 'What Reddit video URLs are supported?', a: 'Any reddit.com post URL containing a video — including v.redd.it links, animated GIFs, and video posts from any subreddit.' },
  { q: 'Can I download GIFs from Reddit?', a: 'Yes! Most Reddit "GIFs" are actually MP4 videos. They will be downloaded as MP4 files which you can convert to GIF using our Video to GIF tool.' },
  { q: 'What about Reddit NSFW content?', a: 'NSFW content from Reddit may require age verification on Reddit\'s side. Only publicly accessible content can be downloaded.' },
];

const FEATURES = [
  { icon: '🤖', title: 'Audio+Video Merged', desc: 'Automatically merges Reddit\'s split DASH audio and video streams into one clean MP4.' },
  { icon: '🌐', title: 'All Subreddits', desc: 'Download from any public subreddit. Works with r/all, r/videos, and any community.' },
  { icon: '🎞️', title: 'Reddit GIFs', desc: 'Download Reddit GIFs (which are actually MP4 videos) in their highest quality.' },
  { icon: '⚡', title: 'Fast & Free', desc: 'No Reddit account needed. No registration. Instant downloads, completely free.' },
];

export default function RedditDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['reddit-downloader']}
      title="Reddit Video Downloader"
      subtitle="Download Reddit videos with audio properly merged. Supports all subreddits and v.redd.it links."
      icon="🤖"
      platform="reddit"
      supportedTypes={['Reddit Videos', 'v.redd.it Links', 'Reddit GIFs', 'Audio+Video Merged']}
      inputPlaceholder="Paste Reddit post URL... (e.g. https://www.reddit.com/r/...)"
      faqs={FAQS}
      features={FEATURES}
    />
  );
}
