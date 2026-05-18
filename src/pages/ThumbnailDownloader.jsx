import ToolPage from './ToolPage.jsx';
import { SEO_DATA } from '../constants/seoData.js';

const FAQS = [
  { q: 'What thumbnail sizes are available?', a: 'MaxRes (1280×720), HQ (480×360), MQ (320×180), and SD (120×90) — all available for download.' },
  { q: 'Can I download thumbnails for any YouTube video?', a: 'Yes, as long as the video is public and has a thumbnail, you can download it.' },
  { q: 'What format are thumbnails downloaded in?', a: 'Thumbnails are downloaded as JPG images, which is the format YouTube uses natively.' },
];

const FORMATS = [
  { id: 'maxres', label: 'JPG', quality: 'MaxRes 1280×720', size: '~120 KB' },
  { id: 'hq',     label: 'JPG', quality: 'HQ 480×360',      size: '~40 KB'  },
  { id: 'mq',     label: 'JPG', quality: 'MQ 320×180',      size: '~20 KB'  },
  { id: 'sd',     label: 'JPG', quality: 'SD 120×90',        size: '~8 KB'   },
];

export default function ThumbnailDownloader() {
  return (
    <ToolPage
      seo={SEO_DATA['thumbnail-downloader']}
      title="YouTube Thumbnail Downloader"
      subtitle="Extract YouTube video thumbnails in all available resolutions — MaxRes, HQ, MQ, SD. Free and instant."
      icon="🖼"
      platform="youtube"
      formats={FORMATS}
      supportedTypes={['MaxRes', 'HQ', 'MQ', 'SD', 'JPG']}
      faqs={FAQS}
      inputPlaceholder="Paste YouTube video URL to extract thumbnail..."
    />
  );
}
