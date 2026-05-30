const os = require('os');
const path = require('path');
const { create: createYoutubeDl } = require('youtube-dl-exec');

const platform = os.platform();
let binaryPath;

if (platform === 'win32') {
  binaryPath = path.join(__dirname, '../../node_modules/youtube-dl-exec/bin/yt-dlp.exe');
} else {
  binaryPath = path.join(__dirname, '../bin/yt-dlp_linux');
}

const youtubedl = createYoutubeDl(binaryPath);

/**
 * Try to get video info using a specific player client strategy.
 * iOS/tv_embedded clients are not subject to YouTube's bot-check requirement.
 */
async function getVideoInfo(url, playerClient = 'ios') {
  return await youtubedl(url, {
    dumpJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    // iOS player client bypasses the "sign in to confirm you're not a bot" block
    // tv_embedded is a secondary fallback that also avoids the check
    extractorArgs: `youtube:player_client=${playerClient}`,
    addHeaders: [
      'User-Agent:Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ],
    // Allow retries on network errors
    retries: 3,
    fragmentRetries: 3,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { url, quality, mode } = JSON.parse(event.body || '{}');
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'url is required' }) };

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Try player clients in order: ios → tv_embedded → mweb → default
      // ios and tv_embedded do NOT require sign-in / PO token verification
      const clientsToTry = ['ios', 'tv_embedded', 'mweb', 'default'];
      let output = null;
      let lastError = null;

      for (const client of clientsToTry) {
        try {
          output = await getVideoInfo(url, client);
          console.log(`[download] yt-dlp succeeded with player_client=${client}`);
          break;
        } catch (err) {
          lastError = err;
          const msg = err.message || '';
          console.warn(`[download] player_client=${client} failed: ${msg.slice(0, 120)}`);

          // If it's a definitive content error (private, unavailable) — stop immediately
          if (
            msg.includes('Video unavailable') ||
            msg.includes('Private video') ||
            msg.includes('This video has been removed') ||
            msg.includes('age-restricted')
          ) {
            throw new Error(msg.split('\n')[0]);
          }
          // Otherwise try next client
        }
      }

      if (!output) {
        throw new Error(
          lastError
            ? lastError.message.split('\n')[0]
            : 'yt-dlp could not extract video info. YouTube may be blocking server IPs.'
        );
      }

      let format;
      const formats = output.formats || [];

      if (formats.length === 0) {
        throw new Error('No formats found for this video.');
      }

      if (mode === 'audio') {
        // Find pure audio formats (no video, has audio)
        const audioFormats = formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
        // Sort by audio bitrate (abr) or total bitrate (tbr) descending
        audioFormats.sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));

        // Fallback: if no pure audio formats, look for formats with any audio (acodec !== 'none')
        const anyAudioFormats = formats.filter(f => f.acodec !== 'none');
        const avFormats = anyAudioFormats.filter(f => f.vcodec !== 'none').sort((a, b) => (a.height || 999) - (b.height || 999));

        format = audioFormats[0] || avFormats[0] || anyAudioFormats[0] || formats[0];
      } else {
        const targetHeight = quality === 'max' ? 9999 : parseInt(quality, 10);
        const avFormats = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
        const videoFormats = formats.filter(f => f.vcodec !== 'none');

        const getSizeClass = (f) => Math.max(f.width || 0, f.height || 0);

        // Normalize target size class by maximum dimension (1920 for 1080p class, 1280 for 720p class, etc.)
        const targetSize = targetHeight >= 1080 ? 1920 :
                           targetHeight >= 720  ? 1280 :
                           targetHeight >= 480  ? 854  : 640;

        const findBestFormat = (formatList) => {
          if (formatList.length === 0) return null;

          const isH264 = (f) => f.vcodec && (f.vcodec.includes('h264') || f.vcodec.includes('avc1') || f.vcodec.includes('avc'));

          // Sort primary by resolution size class descending, secondary by H.264 codec, tertiary by bitrate descending
          formatList.sort((a, b) => {
            const sizeA = getSizeClass(a);
            const sizeB = getSizeClass(b);
            if (sizeB !== sizeA) {
              return sizeB - sizeA;
            }
            const aH = isH264(a) ? 1 : 0;
            const bH = isH264(b) ? 1 : 0;
            if (bH !== aH) return bH - aH;
            return (b.tbr || b.bitrate || 0) - (a.tbr || a.bitrate || 0);
          });

          if (quality === 'max') return formatList[0];

          // Try to match the exact size class
          const exact = formatList.find(f => getSizeClass(f) === targetSize);
          if (exact) return exact;

          // Fallback to the closest smaller size class
          const closest = formatList.filter(f => getSizeClass(f) <= targetSize);
          return closest.length > 0 ? closest[0] : formatList[formatList.length - 1];
        };

        const bestAv = findBestFormat(avFormats);
        const bestVideo = findBestFormat(videoFormats);

        // If requested 720p or higher class, always return separate high-bitrate video + separate audio streams
        if (bestVideo && getSizeClass(bestVideo) >= targetSize && targetSize >= 1280) {
          const audioFormats = formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none').sort((a, b) => (b.abr || 0) - (a.abr || 0));
          const bestAudio = audioFormats[0];
          if (bestAudio) {
            format = bestVideo;
            format.audioUrl = bestAudio.url; // Inject audioUrl for frontend merging
          } else {
            format = bestAv || bestVideo || formats[0];
          }
        } else {
          format = bestAv || bestVideo || formats[0];
        }
      }

      if (!format || !format.url) {
        throw new Error('Could not find any downloadable formats for this video.');
      }

      const title = (output.title || 'video').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = mode === 'audio' ? 'mp3' : 'mp4';

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          url: format.url,
          audioUrl: format.audioUrl || null,
          filename: `${title}.${ext}`,
          status: 'stream'
        }),
      };
    } else {
       throw new Error('Only YouTube URLs are supported in the raw backend right now.');
    }

  } catch (err) {
    console.error('Download Backend Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
