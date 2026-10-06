import { NextRequest, NextResponse } from 'next/server';

/**
 * Smart Social Video & Media Importer API
 * Parses TikTok, Instagram Reels, YouTube Videos & Shorts, Facebook Videos,
 * Vimeo, Pinterest, Twitter/X, and Direct Video URLs.
 *
 * Endpoint: POST /api/siwify/social-import
 * Body: { url: string }
 * Returns: VideoImportResult
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // ── Detect platform ───────────────────────────────────────────────
    const platform = detectPlatform(trimmedUrl);
    if (!platform) {
      return NextResponse.json({
        error: 'Unsupported URL. Please paste a link from TikTok, Instagram, YouTube, Facebook, Vimeo, Pinterest, X/Twitter, or a direct video link (.mp4/.webm).'
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
      case 'vimeo':
        result = await importVimeo(trimmedUrl);
        break;
      case 'twitter':
        result = await importTwitter(trimmedUrl);
        break;
      case 'pinterest':
        result = await importPinterest(trimmedUrl);
        break;
      case 'direct_video':
        result = importDirectVideo(trimmedUrl);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Social import error:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to import video. Please check the URL and try again.'
    }, { status: 500 });
  }
}

// ── Types ──────────────────────────────────────────────────────────────
export interface VideoImportResult {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'vimeo' | 'twitter' | 'pinterest' | 'direct_video';
  platformLabel: string;
  platformIcon: string;
  title: string;
  description?: string;
  thumbnail: string;
  embedUrl?: string;
  videoUrl?: string;
  author?: string;
  authorUrl?: string;
  duration?: string;
  originalUrl: string;
  suggested_slide: {
    type: 'youtube' | 'video' | 'image';
    mediaUrl: string;
    title: string;
    subtitle?: string;
    caption?: string;
    ctaText: string;
    ctaLink: string;
    animation: string;
    thumbnail?: string;
  };
}

// ── Platform Detection ────────────────────────────────────────────────
function detectPlatform(url: string): VideoImportResult['platform'] | null {
  const clean = url.toLowerCase();
  if (clean.includes('tiktok.com')) return 'tiktok';
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) return 'instagram';
  if (clean.includes('facebook.com') || clean.includes('fb.watch') || clean.includes('fb.com')) return 'facebook';
  if (clean.includes('vimeo.com')) return 'vimeo';
  if (clean.includes('twitter.com') || clean.includes('x.com')) return 'twitter';
  if (clean.includes('pinterest.com') || clean.includes('pin.it')) return 'pinterest';
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(clean) || clean.includes('/video/upload/') || clean.includes('res.cloudinary.com')) return 'direct_video';
  return null;
}

// ── 1. TikTok Import (oEmbed API) ──────────────────────────────────────
async function importTikTok(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  let title = 'TikTok Video';
  let thumbnail = '';
  let author = '';

  try {
    const res = await fetch(oEmbedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiWiFyBot/1.0; +https://siwify.com)' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      title = data.title || 'TikTok Video';
      thumbnail = data.thumbnail_url || '';
      author = data.author_name || '';
    }
  } catch { /* proceed with fallback */ }

  const videoIdMatch = url.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch?.[1];
  const embedUrl = videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : undefined;

  // Fallback high-res thumbnail if TikTok CDN blocked
  if (!thumbnail) {
    thumbnail = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80';
  }

  return {
    platform: 'tiktok',
    platformLabel: 'TikTok',
    platformIcon: '🎵',
    title,
    thumbnail,
    embedUrl,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      subtitle: author ? `Featured Reel by @${author} on TikTok` : 'Trending on TikTok',
      caption: '🎵 TIKTOK REEL',
      ctaText: 'Watch on TikTok',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 2. YouTube Import (oEmbed API) ────────────────────────────────────
async function importYouTube(url: string): Promise<VideoImportResult> {
  const videoId = extractYouTubeId(url);
  const maxThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  const hqThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

  let title = 'YouTube Video';
  let author = '';
  let thumbnail = maxThumbnail;

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      author = data.author_name || '';
      thumbnail = maxThumbnail || data.thumbnail_url || hqThumbnail;
    }
  } catch { /* proceed */ }

  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : undefined;

  return {
    platform: 'youtube',
    platformLabel: 'YouTube',
    platformIcon: '▶️',
    title,
    thumbnail: thumbnail || hqThumbnail,
    embedUrl,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'youtube',
      mediaUrl: url, // YouTube carousel player expects original or embed url
      title: title.length > 75 ? title.substring(0, 72) + '...' : title,
      subtitle: author ? `Official Video by ${author}` : 'Watch in HD',
      caption: url.includes('/shorts/') ? '▶️ YOUTUBE SHORTS' : '▶️ FEATURED VIDEO',
      ctaText: 'Watch Video',
      ctaLink: url,
      animation: 'fade',
      thumbnail: thumbnail || hqThumbnail,
    },
  };
}

// ── 3. Instagram Reel / Post Import ──────────────────────────────────
async function importInstagram(url: string): Promise<VideoImportResult> {
  let title = 'Instagram Reel';
  let thumbnail = '';
  let author = '';

  const shortcodeMatch = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch?.[2];
  const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : undefined;

  try {
    const oEmbedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`;
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      thumbnail = data.thumbnail_url || '';
      author = data.author_name || '';
    }
  } catch { /* proceed */ }

  if (!thumbnail) {
    thumbnail = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&q=80';
  }

  return {
    platform: 'instagram',
    platformLabel: 'Instagram',
    platformIcon: '📸',
    title,
    thumbnail,
    embedUrl,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      subtitle: author ? `Featured Reel by @${author}` : 'Explore on Instagram',
      caption: '📸 INSTAGRAM REEL',
      ctaText: 'View on Instagram',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 4. Facebook Video / Reel ──────────────────────────────────────────
async function importFacebook(url: string): Promise<VideoImportResult> {
  let title = 'Facebook Video';
  let thumbnail = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80';
  let author = '';

  try {
    const oEmbedUrl = `https://graph.facebook.com/v18.0/oembed_video?url=${encodeURIComponent(url)}`;
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      thumbnail = data.thumbnail_url || thumbnail;
      author = data.author_name || '';
    }
  } catch { /* proceed */ }

  return {
    platform: 'facebook',
    platformLabel: 'Facebook',
    platformIcon: '📘',
    title,
    thumbnail,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      subtitle: author ? `Video by ${author}` : 'Watch on Facebook',
      caption: '📘 FACEBOOK WATCH',
      ctaText: 'Watch on Facebook',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 5. Vimeo Import (oEmbed API) ──────────────────────────────────────
async function importVimeo(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  let title = 'Vimeo Cinematic Video';
  let thumbnail = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&q=80';
  let author = '';

  try {
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      thumbnail = data.thumbnail_url || thumbnail;
      author = data.author_name || '';
    }
  } catch { /* proceed */ }

  return {
    platform: 'vimeo',
    platformLabel: 'Vimeo',
    platformIcon: '🎥',
    title,
    thumbnail,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: title.length > 75 ? title.substring(0, 72) + '...' : title,
      subtitle: author ? `Cinematic film by ${author}` : 'Watch in Ultra HD',
      caption: '🎥 CINEMATIC VIMEO',
      ctaText: 'Watch Film',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 6. Twitter / X Import ─────────────────────────────────────────────
async function importTwitter(url: string): Promise<VideoImportResult> {
  const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
  let title = 'X / Twitter Post';
  let author = '';
  const thumbnail = 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&q=80';

  try {
    const res = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      author = data.author_name || '';
      // Strip HTML tags for clean title
      const cleanHtml = (data.html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanHtml) title = cleanHtml.substring(0, 80);
    }
  } catch { /* proceed */ }

  return {
    platform: 'twitter',
    platformLabel: 'X (Twitter)',
    platformIcon: '🐦',
    title,
    thumbnail,
    author,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: title.length > 75 ? title.substring(0, 72) + '...' : title,
      subtitle: author ? `Post by ${author}` : 'View discussion on X',
      caption: '🐦 X DISCOVERY',
      ctaText: 'View on X',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 7. Pinterest Import ───────────────────────────────────────────────
async function importPinterest(url: string): Promise<VideoImportResult> {
  const thumbnail = 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80';
  return {
    platform: 'pinterest',
    platformLabel: 'Pinterest',
    platformIcon: '📌',
    title: 'Siwa Oasis Inspiration Pin',
    thumbnail,
    originalUrl: url,
    suggested_slide: {
      type: 'image',
      mediaUrl: thumbnail,
      title: 'Visual Inspiration from Siwa',
      subtitle: 'Curated Photography & Experiences',
      caption: '📌 PINTEREST PIN',
      ctaText: 'View on Pinterest',
      ctaLink: url,
      animation: 'kenburns',
      thumbnail,
    },
  };
}

// ── 8. Direct Video (.mp4, .webm, Cloudinary) ────────────────────────
function importDirectVideo(url: string): VideoImportResult {
  const fileName = url.split('/').pop()?.split('?')[0] || 'Direct Video';
  const cleanTitle = decodeURIComponent(fileName)
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Cloudinary video thumbnail generator if hosted on Cloudinary
  let thumbnail = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80';
  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    thumbnail = url.replace('/video/upload/', '/video/upload/so_0,w_1200,h_630,c_fill/').replace(/\.[^/.]+$/, '.jpg');
  }

  return {
    platform: 'direct_video',
    platformLabel: 'Direct Video',
    platformIcon: '📁',
    title: cleanTitle || 'High Definition Video',
    thumbnail,
    videoUrl: url,
    originalUrl: url,
    suggested_slide: {
      type: 'video',
      mediaUrl: url,
      title: cleanTitle || 'High Definition Video',
      subtitle: 'Immersive Video Experience',
      caption: '🎥 4K VIDEO',
      ctaText: 'Explore Experience',
      ctaLink: '#',
      animation: 'fade',
      thumbnail,
    },
  };
}

// ── Helper ───────────────────────────────────────────────────────────
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
