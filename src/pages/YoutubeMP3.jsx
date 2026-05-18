import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What audio formats are supported?', a: 'OM Tools supports MP3 (up to 320kbps) and M4A. Choose your preferred quality for the best experience.' },
  { q: 'How long does conversion take?', a: 'Audio extraction is nearly instant — typically under 10 seconds for most videos.' },
  { q: 'Can I convert long videos to MP3?', a: 'Yes! There is no length limit. Convert podcasts, lectures, or any YouTube video to MP3.' },
  { q: 'Will the audio quality be good?', a: 'Audio is extracted at the highest available bitrate from the source video — up to 320kbps.' },
];

const FEATURES = [
  { icon: '🎵', title: 'High Quality Audio', desc: 'Extract crystal-clear audio up to 320kbps MP3.' },
  { icon: '⚡', title: 'Lightning Fast', desc: 'Audio-only extraction is significantly faster than video downloads.' },
  { icon: '♾️', title: 'No Limits', desc: 'No length or size restrictions. Convert any YouTube video.' },
  { icon: '📱', title: 'Mobile Ready', desc: 'Works perfectly on all smartphones and tablets.' },
];

const FORMATS = [
  { id: 'mp3-320', label: 'MP3', quality: '320 kbps', size: '~8 MB' },
  { id: 'mp3-256', label: 'MP3', quality: '256 kbps', size: '~6 MB' },
  { id: 'mp3-192', label: 'MP3', quality: '192 kbps', size: '~4.5 MB' },
  { id: 'm4a',     label: 'M4A', quality: 'Original', size: '~7 MB' },
];

export default function YoutubeMP3() {
  return (
    <ToolPage
      seo={SEO_DATA['youtube-mp3-converter']}
      title="YouTube to MP3 Converter"
      subtitle="Extract audio from any YouTube video. Download as MP3 at 320kbps or M4A — free and instant."
      icon="🎵"
      platform="youtube"
      formats={FORMATS}
      supportedTypes={['MP3', 'M4A', '320kbps', '256kbps', '192kbps']}
      faqs={FAQS}
      features={FEATURES}
      inputPlaceholder="Paste YouTube URL to extract audio..."
    />
  );
}
