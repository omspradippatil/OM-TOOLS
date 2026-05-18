// OM Tools — Tool Registry
export const TOOLS = [
  // ── Media Downloaders ──
  {
    id: 'youtube-downloader',
    slug: '/youtube-video-downloader',
    name: 'YouTube Downloader',
    shortName: 'YouTube Video',
    description: 'Download YouTube videos in MP4, WEBM. Supports 4K, 1080p, 720p and more.',
    icon: '▶',
    emoji: '🎬',
    category: 'media',
    platforms: ['youtube'],
    formats: ['MP4', 'WEBM'],
    qualities: ['4K', '1080p', '720p', '480p', '360p', '240p', '144p'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 'youtube-mp3',
    slug: '/youtube-mp3-converter',
    name: 'YouTube to MP3',
    shortName: 'MP3 Converter',
    description: 'Extract high-quality audio from YouTube videos. Download as MP3 or M4A.',
    icon: '🎵',
    emoji: '🎵',
    category: 'media',
    platforms: ['youtube'],
    formats: ['MP3', 'M4A', 'OGG'],
    qualities: ['320kbps', '256kbps', '192kbps', '128kbps'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 'shorts-downloader',
    slug: '/shorts-downloader',
    name: 'Shorts Downloader',
    shortName: 'YT Shorts',
    description: 'Download YouTube Shorts in full quality with one click.',
    icon: '⚡',
    emoji: '⚡',
    category: 'media',
    platforms: ['youtube'],
    formats: ['MP4'],
    qualities: ['1080p', '720p', '480p'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 'instagram-downloader',
    slug: '/instagram-downloader',
    name: 'Instagram Downloader',
    shortName: 'Instagram',
    description: 'Download Instagram posts, reels, stories and IGTV videos instantly.',
    icon: '📸',
    emoji: '📸',
    category: 'media',
    platforms: ['instagram'],
    formats: ['MP4', 'JPG'],
    qualities: ['Original', 'High', 'Medium'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 'reel-downloader',
    slug: '/instagram-reel-downloader',
    name: 'Reel Downloader',
    shortName: 'IG Reels',
    description: 'Download Instagram Reels in HD quality without watermark.',
    icon: '🎞',
    emoji: '🎞',
    category: 'media',
    platforms: ['instagram'],
    formats: ['MP4'],
    qualities: ['HD', 'Original'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 'thumbnail-downloader',
    slug: '/thumbnail-downloader',
    name: 'Thumbnail Downloader',
    shortName: 'Thumbnails',
    description: 'Extract YouTube video thumbnails in all available resolutions.',
    icon: '🖼',
    emoji: '🖼',
    category: 'media',
    platforms: ['youtube'],
    formats: ['JPG', 'WebP'],
    qualities: ['MaxRes', 'HQ', 'MQ', 'SD'],
    isNew: true,
    isPopular: false,
  },
];

export const CATEGORIES = [
  { id: 'media', name: 'Media Tools', description: 'Download & convert media from top platforms' },
];

export const SUPPORTED_PLATFORMS = [
  { id: 'youtube',   name: 'YouTube',    color: '#FF0000', emoji: '▶' },
  { id: 'instagram', name: 'Instagram',  color: '#E1306C', emoji: '📸' },
  { id: 'tiktok',    name: 'TikTok',     color: '#010101', emoji: '🎵' },
  { id: 'twitter',   name: 'Twitter/X',  color: '#1DA1F2', emoji: '🐦' },
  { id: 'facebook',  name: 'Facebook',   color: '#1877F2', emoji: '👍' },
];

// Detect platform from URL
export function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('youtu.be') || u.includes('youtube.com')) {
    if (u.includes('/shorts/')) return { platform: 'youtube', type: 'shorts' };
    if (u.includes('list='))    return { platform: 'youtube', type: 'playlist' };
    return { platform: 'youtube', type: 'video' };
  }
  if (u.includes('instagram.com')) {
    if (u.includes('/reel/'))   return { platform: 'instagram', type: 'reel' };
    if (u.includes('/stories/')) return { platform: 'instagram', type: 'story' };
    return { platform: 'instagram', type: 'post' };
  }
  if (u.includes('tiktok.com'))  return { platform: 'tiktok', type: 'video' };
  if (u.includes('twitter.com') || u.includes('x.com')) return { platform: 'twitter', type: 'tweet' };
  if (u.includes('facebook.com') || u.includes('fb.watch')) return { platform: 'facebook', type: 'video' };
  return null;
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
