import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';

/**
 * Vendor Minisite Social Carousel Slide Appender
 * Allows verified vendors to append imported social media video/image slides
 * directly to their hero carousel without touching complex builder code.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    if (!businessId) {
      return NextResponse.json({ error: 'Missing business ID' }, { status: 400 });
    }

    const body = await request.json();
    const { slide, source_url, platform, thumbnail } = body;

    if (!slide || !slide.title) {
      return NextResponse.json({ error: 'Invalid slide data' }, { status: 400 });
    }

    const siteId = `biz_${businessId}_hero`;
    const configType = `hero_carousel_${siteId}`;

    // 1. Fetch existing slides
    let existingSlides: any[] = [];
    let deletedDynamicIds: string[] = [];
    try {
      const rows = await query(
        `SELECT config FROM website_configs WHERE type = ? LIMIT 1`,
        [configType]
      );
      if (rows && rows.length > 0) {
        const parsed = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
        existingSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];
        deletedDynamicIds = Array.isArray(parsed?.deletedDynamicIds) ? parsed.deletedDynamicIds : [];
      }
    } catch { /* start fresh if no config */ }

    // 2. Prepare new slide
    const newSlide = {
      id: `slide_social_${Date.now()}`,
      title: slide.title,
      subtitle: slide.subtitle || `Featured ${platform ? platform.toUpperCase() : 'Video'}`,
      caption: slide.caption || (platform ? `${platform.toUpperCase()} REEL` : 'FEATURED'),
      mediaUrl: slide.mediaUrl || thumbnail || '',
      embedUrl: slide.embedUrl || (platform === 'tiktok' || platform === 'instagram' ? source_url : ''),
      type: slide.type || 'image',
      ctaText: slide.ctaText || 'Watch Now',
      ctaLink: slide.ctaLink || source_url || '#',
      displayOrder: existingSlides.length,
      imageFit: 'cover',
      imagePosition: 'center',
      bgColor: '#000000',
      overlayOpacity: 0.4,
      animation: 'kenburns',
      titleColor: '#FFFFFF',
      titleSize: 0,
      subtitleSize: 0,
      textAlign: 'center',
      _source: 'business',
      _platform: platform,
      _originalUrl: source_url,
    };

    const updatedSlides = [...existingSlides, newSlide].map((s, idx) => ({ ...s, displayOrder: idx }));
    const newConfig = JSON.stringify({
      slides: updatedSlides,
      deletedDynamicIds,
      siteId,
      updated_at: new Date().toISOString()
    });

    // 3. Upsert into website_configs
    await execute(
      `INSERT INTO website_configs (type, config, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = VALUES(updated_at)`,
      [configType, newConfig]
    );

    invalidateCache.websiteSettings();

    return NextResponse.json({
      success: true,
      slide: newSlide,
      totalSlides: updatedSlides.length,
      message: 'Slide successfully added to hero carousel'
    });
  } catch (error: any) {
    console.error('Error saving carousel slide:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save slide' }, { status: 500 });
  }
}
