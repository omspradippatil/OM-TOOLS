const youtubedl = require('youtube-dl-exec');

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
      // Use youtube-dl-exec (yt-dlp) to bypass YouTube's 403 errors and deciphering updates
      const output = await youtubedl(url, {
        dumpJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
      });
      
      let format;
      const formats = output.formats || [];
      
      if (formats.length === 0) {
        throw new Error('No formats found for this video.');
      }

      if (mode === 'audio') {
        // Fast MP3: get the lowest resolution merged video (unthrottled) to extract audio from
        const avFormats = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none').sort((a, b) => (a.height || 999) - (b.height || 999));
        format = avFormats[0] || formats.filter(f => f.acodec !== 'none')[0] || formats[0];
      } else {
        const targetHeight = quality === 'max' ? 9999 : parseInt(quality, 10);
        
        const avFormats = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
        const videoFormats = formats.filter(f => f.vcodec !== 'none');

        const findBestFormat = (formatList) => {
          if (formatList.length === 0) return null;
          
          const isH264 = (f) => f.vcodec && (f.vcodec.includes('h264') || f.vcodec.includes('avc1') || f.vcodec.includes('avc'));
          
          // Sort primary by height descending, secondary by H.264 codec priority, tertiary by bitrate descending
          formatList.sort((a, b) => {
            if ((b.height || 0) !== (a.height || 0)) {
              return (b.height || 0) - (a.height || 0);
            }
            const aH = isH264(a) ? 1 : 0;
            const bH = isH264(b) ? 1 : 0;
            if (bH !== aH) return bH - aH;
            return (b.tbr || b.bitrate || 0) - (a.tbr || a.bitrate || 0);
          });
          
          if (quality === 'max') return formatList[0];
          
          const exact = formatList.find(f => f.height === targetHeight);
          if (exact) return exact;
          
          const closest = formatList.filter(f => f.height <= targetHeight);
          return closest.length > 0 ? closest[0] : formatList[formatList.length - 1];
        };

        const bestAv = findBestFormat(avFormats);
        const bestVideo = findBestFormat(videoFormats);

        // For all HD resolutions (720p, 1080p+), always return separate high-bitrate video + separate audio streams to bypass low-bitrate merged fallbacks
        if (bestVideo && bestVideo.height >= targetHeight && targetHeight >= 720) {
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
