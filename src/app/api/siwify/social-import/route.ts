import { NextRequest, NextResponse } from 'next/server';

/**
 * Smart Social Video Import API
 * Parses TikTok, Instagram, YouTube, and Facebook Reels URLs
 * and extracts video metadata + thumbnail for carousel import.
 *
 * Endpoint: POST /api/siwify/social-import
 * Body: { url: string }
 * Returns: { platform, title, thumbnail, embedUrl, videoUrl?, duration?, author? }
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // ── Detect platform ───────────────────────────────────────────────
    const platform = detectPlatform(trimmedUrl);
    if (!platform) {
      return NextResponse.json({
        error: 'Unsupported URL. Please paste a TikTok, Instagram Reel, YouTube, or Facebook Video link.'
      }, { status: 400 });
    }

    // ── Extract metadata based on platform ────────────────────────────
    let result: VideoImportResult;

    switch (platform) {
      case 'tiktok':
        result = await importTikTok(trimmedUrl);
        break;
      case 'youtube':
        result = await importYouTube(trimmedUrl);
        break;
      case 'instagram':
        result = await importInstagram(trimmedUrl);
        break;
      case 'facebook':
        result = await importFacebook(trimmedUrl);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Social import error:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to import video. Please try again.'
    }, { status: 500 });
  }
}

// ── Types ──────────────────────────────────────────────────────────────
interface VideoImportResult {
  platform: string;
  title: string;
  description?: string;
  thumbnail: string;
  embedUrl?: string;
  videoUrl?: string;
  author?: string;
  duration?: string;
  originalUrl: string;
  suggested_slide: {
    type: 'youtube' | 'video' | 'image';
    mediaUrl: string;
    title: string;
    subtitle?: string;
    ctaText: string;
    ctaLink: string;
    animation: string;
  };
}

// ── Platform Detection ────────────────────────────────────────────────
function detectPlatform(url: string): string | null {
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) return 'facebook';
  return null;
}

// ── TikTok Import (oEmbed API) ────────────────────────────────────────
async function importTikTok(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(oEmbedUrl, {
    headers: { 'User-Agent': 'SiWiFy/1.0 (siwify.com social importer)' },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    // Graceful fallback when oEmbed unavailable (private/region-locked)
    return buildFallbackResult('tiktok', url, 'TikTok Video', 'https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/placeholder.jpeg');
  }

  const data = await res.json();
  const title = data.title || 'TikTok Video';
  const thumbnail = data.thumbnail_url || '';
  const author = data.author_name || '';

  // TikTok embed HTML → extract video ID for embed URL
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch?.[1];
  const embedUrl = videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : undefined;

  return {
    platform: 'tiktok',
    title,
    thumbnail,
    embedUrl,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'youtube', // use iframe embed
      mediaUrl: embedUrl || url,
      title: title.substring(0, 80),
      subtitle: author ? `@${author} on TikTok` : 'TikTok',
      ctaText: 'Watch on TikTok',
      ctaLink: url,
      animation: 'fade',
    }
  };
}

// ── YouTube Import (oEmbed API — no API key needed) ───────────────────
async function importYouTube(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(8000) });

  // Extract YouTube video ID for thumbnail
  const videoId = extractYouTubeId(url);
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : '';

  if (!res.ok) {
    return buildFallbackResult('youtube', url, 'YouTube Video', thumbnail);
  }

  const data = await res.json();
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : undefined;

  return {
    platform: 'youtube',
    title: data.title || 'YouTube Video',
    thumbnail: thumbnail || data.thumbnail_url || '',
    embedUrl,
    author: data.author_name || '',
    originalUrl: url,
    suggested_slide: {
      type: 'youtube',
      mediaUrl: embedUrl || url,
      title: (data.title || 'YouTube Video').substring(0, 80),
      subtitle: data.author_name ? `by ${data.author_name}` : '',
      ctaText: 'Watch Video',
      ctaLink: url,
      animation: 'fade',
    }
  };
}

// ── Instagram Reel Import (oEmbed API) ────────────────────────────────
async function importInstagram(url: string): Promise<VideoImportResult> {
  // Instagram oEmbed (requires FB developer app for private, but works for public)
  const oEmbedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`;

  try {
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const thumbnail = data.thumbnail_url || '';
      const title = data.title || 'Instagram Reel';
      // Extract post shortcode for embed
      const shortcodeMatch = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
      const shortcode = shortcodeMatch?.[2];
      const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : undefined;
      return {
        platform: 'instagram',
        title,
        thumbnail,
        embedUrl,
        author: data.author_name || '',
        originalUrl: url,
        suggested_slide: {
          type: 'youtube',
          mediaUrl: embedUrl || url,
          title: title.substring(0, 80),
          subtitle: data.author_name ? `@${data.author_name}` : 'Instagram',
          ctaText: 'View on Instagram',
          ctaLink: url,
          animation: 'fade',
        }
      };
    }
  } catch { /* fall through to generic fallback */ }

  // Fallback: extract shortcode and build embed manually
  const shortcodeMatch = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch?.[2];
  const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : undefined;
  return buildFallbackResult('instagram', url, 'Instagram Reel', '', embedUrl);
}

// ── Facebook Video ─────────────────────────────────────────────────────
async function importFacebook(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://graph.facebook.com/v18.0/oembed_video?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      return {
        platform: 'facebook',
        title: data.title || 'Facebook Video',
        thumbnail: data.thumbnail_url || '',
        author: data.author_name || '',
        originalUrl: url,
        suggested_slide: {
          type: 'youtube',
          mediaUrl: url,
          title: (data.title || 'Facebook Video').substring(0, 80),
          subtitle: data.author_name || 'Facebook',
          ctaText: 'Watch on Facebook',
          ctaLink: url,
          animation: 'fade',
        }
      };
    }
  } catch { /* fall through */ }
  return buildFallbackResult('facebook', url, 'Facebook Video', '');
}

// ── Helpers ───────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m?.[1]) return m[1];
  }
  return null;
}

function buildFallbackResult(
  platform: string,
  url: string,
  title: string,
  thumbnail: string,
  embedUrl?: string
): VideoImportResult {
  return {
    platform,
    title,
    thumbnail,
    embedUrl,
    originalUrl: url,
    suggested_slide: {
      type: 'youtube',
      mediaUrl: embedUrl || url,
      title,
      subtitle: platform.charAt(0).toUpperCase() + platform.slice(1),
      ctaText: `Watch on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      ctaLink: url,
      animation: 'fade',
    }
  };
}
