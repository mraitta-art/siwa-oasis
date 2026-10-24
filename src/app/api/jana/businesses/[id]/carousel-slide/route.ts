import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { resolveSlideQuota } from '@/lib/slide-quota';
import { evaluateVendorTrial, readVendorTrial, resolveTrialQuota } from '@/lib/vendor-trial';

function parseJson(value: unknown): Record<string, any> {
  if (typeof value !== 'string') return (value as Record<string, any>) || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

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

    // Governance rule: tier maxSlides quota must be respected on append too.
    const tierRows = await query<any>(
      `SELECT b.subscription_tier, b.custom_data, t.name as tier_name, t.features as tier_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON t.id = b.subscription_tier
        WHERE b.id = ? LIMIT 1`,
      [businessId]
    );
    if (tierRows && tierRows.length > 0) {
      let features: Record<string, any> = {};
      try {
        features = typeof tierRows[0].tier_features === 'string' ? JSON.parse(tierRows[0].tier_features) : (tierRows[0].tier_features || {});
      } catch { features = {}; }
      const quota = resolveSlideQuota(
        tierRows[0].subscription_tier || 'free',
        tierRows[0].tier_name || tierRows[0].subscription_tier || 'Free',
        features,
      );
      if (updatedSlides.length > quota.effectiveMax) {
        return NextResponse.json({
          error: `Slide rejected: the "${quota.tierName}" plan allows max ${quota.effectiveMax} hero slides. To activate: upgrade the plan or raise maxSlides in Tier Manager.`,
          code: 'SLIDE_QUOTA_EXCEEDED',
          quota,
          currentCount: existingSlides.length,
        }, { status: 409 });
      }

      // Free period: one slide may be tried, and nothing new once it has ended.
      // Existing slides stay where they are — only the append is refused.
      const trial = evaluateVendorTrial(readVendorTrial(parseJson(tierRows[0].custom_data)));
      if (trial.status !== 'none') {
        if (!trial.can_edit) {
          return NextResponse.json({
            error: 'Your free period has ended, so new carousel slides are paused. Slides you already have stay visible.',
            code: 'TRIAL_ENDED',
          }, { status: 409 });
        }
        const trialSlides = resolveTrialQuota(features).slides;
        if (trialSlides != null && existingSlides.length >= trialSlides) {
          return NextResponse.json({
            error: trialSlides === 1
              ? 'Your free period includes one carousel slide. Delete it to try another — or keep it and let photos carry the rest of the page.'
              : `Your free period includes ${trialSlides} carousel slides. Delete one to add another.`,
            code: 'SLIDE_TRIAL_ALLOWANCE',
            limit: trialSlides,
            currentCount: existingSlides.length,
          }, { status: 409 });
        }
      }
    }

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
