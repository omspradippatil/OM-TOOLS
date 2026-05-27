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

  // ── Video & Audio Editor (Client-Side / ffmpeg.wasm) ──
  {
    id: 'video-converter',
    slug: '/video-converter',
    name: 'Video Converter',
    shortName: 'Video Converter',
    description: 'Convert any video to MP4, WEBM, MKV, AVI or MOV — entirely in your browser. No upload.',
    icon: '🔄',
    emoji: '🔄',
    category: 'editor',
    platforms: [],
    formats: ['MP4', 'WEBM', 'MKV', 'AVI', 'MOV'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'video-trimmer',
    slug: '/video-trimmer',
    name: 'Video Trimmer',
    shortName: 'Video Trimmer',
    description: 'Cut any video to the exact segment you want. Lossless stream copy. 100% in-browser.',
    icon: '✂️',
    emoji: '✂️',
    category: 'editor',
    platforms: [],
    formats: ['MP4'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'video-compressor',
    slug: '/video-compressor',
    name: 'Video Compressor',
    shortName: 'Video Compressor',
    description: 'Compress videos for WhatsApp & Discord. Choose quality and resolution. 100% private.',
    icon: '🗜️',
    emoji: '🗜️',
    category: 'editor',
    platforms: [],
    formats: ['MP4'],
    qualities: ['1080p', '720p', '480p', '360p'],
    isNew: true,
    isPopular: true,
    badge: '100% Local',
  },
  {
    id: 'video-to-gif',
    slug: '/video-to-gif',
    name: 'Video to GIF',
    shortName: 'GIF Maker',
    description: 'Convert video clips to high-quality animated GIFs with two-pass palette generation.',
    icon: '🎞️',
    emoji: '🎞️',
    category: 'editor',
    platforms: [],
    formats: ['GIF'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'video-muter',
    slug: '/video-muter',
    name: 'Video Muter',
    shortName: 'Video Muter',
    description: 'Remove audio from any video instantly using stream copy. Lightning fast, lossless quality.',
    icon: '🔇',
    emoji: '🔇',
    category: 'editor',
    platforms: [],
    formats: ['MP4'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'audio-extractor',
    slug: '/audio-extractor',
    name: 'Audio Extractor',
    shortName: 'Audio Extractor',
    description: 'Extract audio from any video file. Save as MP3, WAV, AAC or OGG. No upload required.',
    icon: '🎵',
    emoji: '🎵',
    category: 'editor',
    platforms: [],
    formats: ['MP3', 'WAV', 'AAC', 'OGG'],
    qualities: ['320kbps', '256kbps', '192kbps', '128kbps'],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'audio-converter',
    slug: '/audio-converter',
    name: 'Audio Converter',
    shortName: 'Audio Converter',
    description: 'Convert audio between MP3, WAV, FLAC, OGG, AAC and M4A. 100% private, no upload.',
    icon: '🎶',
    emoji: '🎶',
    category: 'editor',
    platforms: [],
    formats: ['MP3', 'WAV', 'FLAC', 'OGG', 'AAC'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'audio-trimmer',
    slug: '/audio-trimmer',
    name: 'Audio Trimmer',
    shortName: 'Audio Trimmer',
    description: 'Cut any audio file to the exact segment you need. Perfect for ringtones and clips.',
    icon: '✂️',
    emoji: '✂️',
    category: 'editor',
    platforms: [],
    formats: ['MP3'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
  {
    id: 'volume-booster',
    slug: '/volume-booster',
    name: 'Volume Booster',
    shortName: 'Volume Booster',
    description: 'Boost audio volume up to 4×. Perfect for quiet recordings and podcasts. 100% in-browser.',
    icon: '🔊',
    emoji: '🔊',
    category: 'editor',
    platforms: [],
    formats: ['MP3'],
    qualities: [],
    isNew: true,
    isPopular: false,
    badge: '100% Local',
  },
];


export const CATEGORIES = [
  { id: 'media',  name: 'Media Tools',           description: 'Download & convert media from top platforms' },
  { id: 'editor', name: 'Video & Audio Editor',   description: 'Process media files locally — 100% private, no upload' },
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
