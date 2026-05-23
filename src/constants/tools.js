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
    id: 'youtube-playlist',
    slug: '/youtube-playlist-downloader',
    name: 'Playlist Downloader',
    shortName: 'YT Playlist',
    description: 'Download full YouTube playlists in a single ZIP archive. Supports MP4 videos & MP3 audio.',
    icon: '📂',
    emoji: '📂',
    category: 'media',
    platforms: ['youtube'],
    formats: ['ZIP (MP4)', 'ZIP (MP3)'],
    qualities: ['1080p', '720p', '480p', '360p', '320kbps', '256kbps', '192kbps'],
    isNew: true,
    isPopular: false,
  },
];


export const CATEGORIES = [
  { id: 'media', name: 'Media Tools', description: 'Download & convert media from top platforms' },
];

export const SUPPORTED_PLATFORMS = [
  { id: 'youtube',   name: 'YouTube',    color: '#FF0000', emoji: '▶' },
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
