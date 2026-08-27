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
    const { url } = JSON.parse(event.body || '{}');
    if (!url) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'url is required' })
      };
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Only YouTube playlist URLs are supported.' })
      };
    }

    // Normalize watch/music links to a clean standard YouTube playlist URL
    let fetchUrl = url;
    try {
      const parsedUrl = new URL(url);
      const playlistId = parsedUrl.searchParams.get('list');
      if (playlistId) {
        fetchUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      } else {
        fetchUrl = url.replace('music.youtube.com', 'www.youtube.com');
      }
    } catch (e) {
      fetchUrl = url.replace('music.youtube.com', 'www.youtube.com');
    }


    // Fetch the playlist page HTML
    const res = await fetch(fetchUrl, {

      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch playlist page (HTTP ${res.status})`);
    }

    const text = await res.text();

    // Extract ytInitialData
    const startPattern = 'var ytInitialData =';
    const startIdx = text.indexOf(startPattern);
    if (startIdx === -1) {
      throw new Error('Could not parse playlist page. YouTube did not return initial data.');
    }

    const jsonStart = text.indexOf('{', startIdx);
    if (jsonStart === -1) {
      throw new Error('Failed to parse YouTube initial data.');
    }

    let braceCount = 1;
    let i = jsonStart + 1;
    let inString = false;
    let escape = false;

    while (braceCount > 0 && i < text.length) {
      const char = text[i];
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
      }
      i++;
    }

    const jsonStr = text.substring(jsonStart, i);
    const data = JSON.parse(jsonStr);

    // Recursive helper to find keys in deep objects
    function findKey(obj, keyToFind) {
      if (!obj || typeof obj !== 'object') return null;
      if (obj[keyToFind] !== undefined) return obj[keyToFind];
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const val = findKey(item, keyToFind);
          if (val) return val;
        }
      } else {
        for (const k in obj) {
          const val = findKey(obj[k], keyToFind);
          if (val) return val;
        }
      }
      return null;
    }

    // Check for alerts (e.g. Playlist does not exist)
    const alerts = data.alerts;
    if (alerts && Array.isArray(alerts)) {
      for (const alert of alerts) {
        const textVal = alert.alertRenderer?.text?.runs?.[0]?.text || alert.alertRenderer?.text?.simpleText;
        if (textVal) {
          throw new Error(`YouTube error: ${textVal}`);
        }
      }
    }

    // Extract playlist metadata
    const metadata = findKey(data, 'playlistMetadataRenderer');
    const headerTitle = data.header?.playlistHeaderRenderer?.title?.simpleText ||
                        data.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text;
    const playlistTitle = metadata?.title || headerTitle || 'YouTube Playlist';

    // Extract playlist videos supporting both legacy playlistVideoRenderer and modern lockupViewModel
    const videos = [];
    const seenIds = new Set();

    function scanForVideos(obj) {
      if (!obj || typeof obj !== 'object') return;

      // Legacy format: playlistVideoRenderer
      if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
        const r = obj.playlistVideoRenderer;
        const videoId = r.videoId;
        if (!seenIds.has(videoId)) {
          seenIds.add(videoId);
          const title = r.title?.runs?.[0]?.text || r.title?.simpleText || 'Untitled Video';
          const thumbnails = r.thumbnail?.thumbnails || [];
          const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          const duration = r.lengthText?.simpleText || '00:00';
          const channel = r.shortBylineText?.runs?.[0]?.text || 'Unknown';

          videos.push({
            id: videoId,
            title,
            thumbnail,
            duration,
            channel,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }

      // Modern format: lockupViewModel
      if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
        const m = obj.lockupViewModel;
        const videoId = m.contentId;
        if (!seenIds.has(videoId)) {
          seenIds.add(videoId);
          const title = m.metadata?.lockupMetadataViewModel?.title?.content || 'Untitled Video';
          const imgSources = m.contentImage?.thumbnailViewModel?.image?.sources || [];
          const thumbnail = imgSources.length > 0 ? imgSources[imgSources.length - 1].url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          let channel = 'Unknown';
          const rows = m.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
          for (const row of rows) {
            const parts = row.metadataParts || [];
            for (const p of parts) {
              if (p.text?.content) {
                channel = p.text.content;
                break;
              }
            }
            if (channel !== 'Unknown') break;
          }

          let duration = '00:00';
          const overlays = m.contentImage?.thumbnailViewModel?.overlays || [];
          for (const ov of overlays) {
            if (ov.thumbnailOverlayBadgeViewModel?.badge?.thumbnailBadgeViewModel?.text) {
              duration = ov.thumbnailOverlayBadgeViewModel.badge.thumbnailBadgeViewModel.text;
              break;
            }
            if (ov.thumbnailOverlayTimeStatusRenderer?.text?.simpleText) {
              duration = ov.thumbnailOverlayTimeStatusRenderer.text.simpleText;
              break;
            }
          }

          videos.push({
            id: videoId,
            title,
            thumbnail,
            duration,
            channel,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }

      if (Array.isArray(obj)) {
        for (const item of obj) scanForVideos(item);
      } else {
        for (const k of Object.keys(obj)) scanForVideos(obj[k]);
      }
    }

    scanForVideos(data);

    if (videos.length === 0) {
      throw new Error('This playlist is empty, private, or could not be loaded.');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        title: playlistTitle,
        videos
      })
    };

  } catch (err) {
    console.error('Playlist Backend Error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
