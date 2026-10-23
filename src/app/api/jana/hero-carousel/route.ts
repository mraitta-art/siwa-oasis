import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { parseBizSiteId, resolveSlideQuota } from '@/lib/slide-quota';

const MAX_CAROUSEL_CONFIG_BYTES = 3 * 1024 * 1024;
const VALID_SLIDE_TYPES = new Set(['image', 'youtube', 'video', 'branded', 'embed']);

/**
 * Governance rule check: a biz_* carousel may not exceed the tier's
 * maxSlides policy (subscription_tiers.features.maxSlides).
 * Returns null when the write is allowed, otherwise a ready-to-send
 * 409 body explaining WHY it was rejected and HOW to activate more slides.
 */
async function checkBizCarouselQuota(siteId: string, proposedCount: number) {
  const businessId = parseBizSiteId(siteId);
  if (!businessId) return null; // main-website / readymade targets are not tier-bound

  const biz = await query<any>(
    `SELECT b.name, b.subscription_tier, t.name as tier_name, t.features as tier_features
       FROM businesses b
       LEFT JOIN subscription_tiers t ON t.id = b.subscription_tier
      WHERE b.id = ? LIMIT 1`,
    [businessId]
  );
  if (!biz || biz.length === 0) return null; // unknown business — don't block admin flows

  const business = biz[0];
  let features: Record<string, any> = {};
  try {
    features = typeof business.tier_features === 'string'
      ? JSON.parse(business.tier_features)
      : (business.tier_features || {});
  } catch { features = {}; }

  const quota = resolveSlideQuota(
    business.subscription_tier || 'free',
    business.tier_name || business.subscription_tier || 'Free',
    features,
  );

  if (proposedCount <= quota.effectiveMax) return null;

  return {
    error: `Slide save rejected: the "${quota.tierName}" plan allows max ${quota.effectiveMax} slides (attempted ${proposedCount}). To activate: raise maxSlides in Tier Manager (jana → Tiers) or upgrade this business's plan.`,
    code: 'SLIDE_QUOTA_EXCEEDED',
    quota,
    currentCount: proposedCount,
  };
}

function authorizationError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Admin access required';
  const status = message === 'Not authenticated' ? 401 : 403;
  return NextResponse.json({ error: message }, { status });
}

async function loadCarouselConfig(siteId: string) {
  const isBusinessCarousel = siteId.startsWith('biz_');
  const isLegacyDiscoveryCarousel = siteId === 'discovery' || siteId === 'main';
  const fallbackTypes = isBusinessCarousel || !isLegacyDiscoveryCarousel
    ? [`hero_carousel_${siteId}`]
    : [`hero_carousel_${siteId}`, 'hero_carousel_main', 'hero_carousel_discovery'];
  for (const type of fallbackTypes) {
    try {
      const results = await query(
        `SELECT config FROM website_configs WHERE type = ? LIMIT 1`,
        [type]
      );
      if (results.length > 0) {
        const config = typeof results[0].config === 'string'
          ? JSON.parse(results[0].config)
          : results[0].config;
        return { config, type };
      }
    } catch (error) {
      console.error(`Failed to load carousel config for ${type}:`, error);
    }
  }
  return { config: null, type: null };
}

// GET: Load hero carousel slides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || 'main';
    const { config, type } = await loadCarouselConfig(siteId);

    if (config) {
      return NextResponse.json({ ...(config || { slides: [] }), siteId, sourceType: type });
    }

    return NextResponse.json({ slides: [], siteId, sourceType: null });
  } catch (e: any) {
    console.error('Failed to load hero carousel:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Save hero carousel slides
export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (error) {
      return authorizationError(error);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_CAROUSEL_CONFIG_BYTES) {
      return NextResponse.json(
        { error: 'Carousel configuration exceeds 3 MB. Re-upload inline images to persistent media storage before saving.' },
        { status: 413 }
      );
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_CAROUSEL_CONFIG_BYTES) {
      return NextResponse.json(
        { error: 'Carousel configuration exceeds 3 MB. Re-upload inline images to persistent media storage before saving.' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Carousel request must contain valid JSON.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Carousel request must be a JSON object.' }, { status: 400 });
    }
    const { slides, deletedDynamicIds = [], siteId = 'main' } = body;
    const configType = `hero_carousel_${siteId}`;
    
    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
        { status: 400 }
      );
    }
    
    // Validate each slide - YouTube slides use URL, branded slides have no media
    for (const slide of slides) {
      if (!slide || typeof slide !== 'object' || typeof slide.id !== 'string' || !slide.id || !VALID_SLIDE_TYPES.has(slide.type)) {
        return NextResponse.json(
          { error: 'Each slide must have a valid id and type.' },
          { status: 400 }
        );
      }
      if (typeof slide.mediaUrl === 'string' && /^(data|blob|file):/i.test(slide.mediaUrl)) {
        return NextResponse.json(
          { error: 'Carousel media must use a persistent URL, not browser-local media. Re-upload this media and try again.' },
          { status: 400 }
        );
      }
      // Only require mediaUrl for image/video types (not youtube which uses URL, not branded)
      if ((slide.type === 'image' || slide.type === 'video') &&
          (typeof slide.mediaUrl !== 'string' || !slide.mediaUrl.trim())) {
        return NextResponse.json(
          { error: `Slide "${slide.title || slide.id}" of type "${slide.type}" must have a mediaUrl` },
          { status: 400 }
        );
      }
    }
    
    const config = JSON.stringify({ slides, deletedDynamicIds, siteId });
    
    // Governance rule: block net slide additions that push a vendor minisite
    // past its tier's maxSlides. Deletes / reorders (count not increasing)
    // are always allowed, even for legacy sets already above the cap.
    const { config: existingConfig } = await loadCarouselConfig(siteId);
    const existingCount = Array.isArray(existingConfig?.slides) ? existingConfig.slides.length : 0;
    if (slides.length > existingCount) {
      const quotaBlock = await checkBizCarouselQuota(siteId, slides.length);
      if (quotaBlock) {
        return NextResponse.json(quotaBlock, { status: 409 });
      }
    }

    // Insert or update
    await execute(
      `INSERT INTO website_configs (type, config, updated_at) 
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       config = VALUES(config),
       updated_at = VALUES(updated_at)`,
      [configType, config]
    );
    
    invalidateCache.websiteSettings();
    
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${slides.length} slides for ${siteId}`,
      slideCount: slides.length 
    });
  } catch (e: any) {
    console.error('Failed to save hero carousel:', e);
    return NextResponse.json({ error: 'The carousel could not be saved. Please retry, and contact support if the issue continues.' }, { status: 500 });
  }
}

// DELETE: Delete hero carousel config
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || 'main';
    const configType = `hero_carousel_${siteId}`;
    
    await execute(
      `DELETE FROM website_configs WHERE type = ?`,
      [configType]
    );
    
    invalidateCache.websiteSettings();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
