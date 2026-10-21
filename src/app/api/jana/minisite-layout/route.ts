import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { query, queryOne, execute, transaction } from '@/lib/db';
import {
  COMPONENT_META,
  DEFAULT_TIER_RULES,
  getAllTierRules,
  getBusinessTier,
  getTierRules,
  MinisiteTier,
  validateMinisiteLayout,
} from '@/lib/minisite-governance';
import {
  fetchMinisiteLayout,
  fetchMinisiteTemplateLayout,
  GOVERNANCE_KEY,
  MINISITE_LAYOUT_KEY,
  MinisiteLayout,
} from '@/lib/minisite-layout';
import { invalidateCache } from '@/lib/cache';
import { saveMinisiteDraft } from '@/lib/minisite-drafts';

function getErrorStatus(error: any) {
  if (Number.isInteger(error?.status)) return error.status;
  const message = String(error?.message || '');
  if (message === 'Not authenticated') return 401;
  if (message.toLowerCase().includes('access required')) return 403;
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const isGovernance = searchParams.get('governance') === '1';

    if (isGovernance) {
      const rules = await getAllTierRules();
      return NextResponse.json({
        rules,
        defaults: DEFAULT_TIER_RULES,
        meta: COMPONENT_META,
      });
    }

    const isOverview = searchParams.get('overview') === '1';
    if (isOverview) {
      let bizError: string | null = null;
      let cfgError: string | null = null;
      let allBiz: any[] = [];

      try {
        allBiz = await query<any>(
          `SELECT b.*, bt.name as type_name
           FROM businesses b
           LEFT JOIN business_types bt ON b.type_id = bt.id
           ORDER BY b.name ASC`
        );
      } catch (err1: any) {
        try {
          allBiz = await query<any>(
            `SELECT * FROM businesses ORDER BY name ASC`
          );
          bizError = `Join failed, fallback succeeded: ${err1?.message || err1}`;
        } catch (err2: any) {
          bizError = `Primary: ${err1?.message || err1} | Fallback: ${err2?.message || err2}`;
          allBiz = [];
        }
      }

      const allConfigs = await query<any>(
        `SELECT type, config FROM website_configs WHERE type LIKE 'minisite_layout_%'`
      ).catch((err: any) => {
        cfgError = err?.message || String(err);
        return [];
      });

      // Map existing layouts by slug
      const layoutMap = new Map<string, { mode: string; updatedAt?: string; componentsCount: number }>();
      for (const row of allConfigs || []) {
        try {
          const typeKey = String(row.type || '').toLowerCase();
          const targetSlug = typeKey.replace(/^minisite_layout_/, '');
          const cfg = typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {});
          const components = Array.isArray(cfg.components) ? cfg.components : [];
          layoutMap.set(targetSlug, {
            mode: cfg.mode || 'replace',
            updatedAt: cfg.updated_at || null,
            componentsCount: components.length,
          });
        } catch {}
      }

      const existingLayouts: any[] = [];
      const availableForBuilder: any[] = [];

      for (const b of allBiz || []) {
        const bSlug = (b.slug || b.id || '').toLowerCase();
        const bId = String(b.id || '').toLowerCase();
        const layoutInfo = layoutMap.get(bSlug) || layoutMap.get(bId);

        const tier = getBusinessTier(b);
        const item = {
          id: b.id,
          name: b.name,
          slug: b.slug || b.id,
          type_id: b.type_id,
          type_name: b.type_name || 'Generic Typology',
          subscription_tier: b.subscription_tier || 'free',
          tier,
          logo_url: b.logo_url || null,
          cover_image: b.cover_image || null,
          hasLayout: Boolean(layoutInfo && layoutInfo.componentsCount > 0),
          layoutMode: layoutInfo?.mode || null,
          layoutUpdatedAt: layoutInfo?.updatedAt || null,
          componentsCount: layoutInfo?.componentsCount || 0,
        };

        if (item.hasLayout) {
          existingLayouts.push(item);
        } else {
          availableForBuilder.push(item);
        }
      }

      return NextResponse.json({
        existingLayouts,
        availableForBuilder,
        stats: {
          total: allBiz.length,
          builderCount: existingLayouts.length,
          sectionalCount: availableForBuilder.length,
        },
        _debug: { bizError, cfgError },
      });
    }

    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    // Lookup business with all metadata
    const business = await queryOne<any>(
      `SELECT b.*,
              bt.name as type_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE b.slug = ? OR b.id = ? LIMIT 1`,
      [slug, slug]
    );

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Parse custom_data safely
    let parsedCustomData: any = {};
    try {
      parsedCustomData = typeof business.custom_data === 'string'
        ? JSON.parse(business.custom_data)
        : (business.custom_data || {});
    } catch {
      parsedCustomData = {};
    }

    const tier: MinisiteTier = getBusinessTier(business);
    const allowedComponents = await getTierRules(tier);

    // Fetch existing layout
    let layout = await fetchMinisiteLayout(business.slug || slug);

    // If no custom layout, check for category template
    let isFromTemplate = false;
    if (!layout && business.type_id) {
      const templateLayout = await fetchMinisiteTemplateLayout(business.type_id);
      const templateComponents = validateMinisiteLayout(
        templateLayout?.components || [],
        allowedComponents
      );
      if (templateLayout && templateComponents.length > 0) {
        layout = { ...templateLayout, components: templateComponents };
        isFromTemplate = true;
      }
    }

    // Parallel fetch of site-specific database assets for this business
    const [galleryRows, productRows, blogRows, expRows] = await Promise.all([
      query<any>(
        `SELECT id, url, caption, is_hero, section_id, placement, show_on_main, show_on_minisite, approval_status 
         FROM vendor_gallery 
         WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
         ORDER BY is_hero DESC, id DESC`,
        [business.id]
      ).catch(() => []),
      query<any>(
        `SELECT id, title, price, duration, image_url, category, description, is_featured, is_active
         FROM tour_products 
         WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1
         ORDER BY is_featured DESC, created_at DESC`,
        [business.id]
      ).catch(() => []),
      query<any>(
        `SELECT id, title, content, excerpt, section_id, cover_image, published_at
         FROM section_blogs 
         WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1 
         ORDER BY published_at DESC`,
        [business.id]
      ).catch(() => []),
      query<any>(
        `SELECT id, name, description, pricing, cover_image
         FROM experience_packages 
         WHERE active = 1 AND JSON_CONTAINS(CAST(business_ids AS JSON), JSON_QUOTE(?), '$') 
         ORDER BY created_at DESC`,
        [String(business.id)]
      ).catch(() => []),
    ]);

    const normalizedExpPackages = (expRows || []).map((p: any) => {
      const pr = typeof p.pricing === 'string' ? JSON.parse(p.pricing) : (p.pricing || {});
      return {
        id: p.id,
        title: p.name,
        description: p.description,
        price: pr.package_price || pr.price || pr.base_price || 0,
        category: pr.category || pr.vendor_category || 'package',
        image_url: pr.cover_image || p.cover_image || null,
        is_featured: pr.featured || false,
      };
    });

    const combinedProducts = [...normalizedExpPackages, ...productRows];

    // Extract structured services/amenities from custom_data
    const vibe = parsedCustomData.vibe || parsedCustomData.sec_3_services || {};
    const identity = {
      ...(parsedCustomData.basic || {}),
      ...(parsedCustomData.sec_1_identity || {}),
      ...(parsedCustomData.business_info || {}),
    };
    const rawAmenities = vibe.amenities || identity.amenities || [];
    let extractedServices: string[] = [];
    if (Array.isArray(rawAmenities)) {
      extractedServices = rawAmenities.map((a: any) =>
        typeof a === 'object' ? a.name || a.label || JSON.stringify(a) : String(a)
      );
    } else if (typeof rawAmenities === 'string') {
      extractedServices = rawAmenities.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const siteContext = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.vendor_phone || identity.phone || identity.mobile || business.phone || '',
      logo_url: identity.business_logo || identity.logo || business.logo_url || '',
      cover_image: identity.cover_image || business.cover_image || '',
      tagline: identity.tagline || business.tagline || '',
      description: identity.description || business.description || '',
      services: extractedServices,
      gallery: galleryRows,
      products: combinedProducts,
      blogs: blogRows,
      customData: parsedCustomData,
    };

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        type_id: business.type_id,
        type_name: business.type_name,
        tier,
        phone: siteContext.phone,
        logo_url: siteContext.logo_url,
        cover_image: siteContext.cover_image,
        description: siteContext.description,
      },
      siteContext,
      layout,
      isFromTemplate,
      allowedComponents,
      allComponentsMeta: COMPONENT_META,
    });
  } catch (error: any) {
    console.error('[API minisite-layout GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: getErrorStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const isGovernance = searchParams.get('governance') === '1';

    const body = await request.json();

    // Handle Governance updates
    if (isGovernance) {
      const updatedRules = body.rules;
      if (!updatedRules || typeof updatedRules !== 'object') {
        return NextResponse.json({ error: 'Invalid governance rules payload' }, { status: 400 });
      }

      await execute(
        `INSERT INTO website_configs (type, config)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE config = VALUES(config)`,
        [GOVERNANCE_KEY, JSON.stringify(updatedRules)]
      );

      invalidateCache.websiteSettings();
      return NextResponse.json({ success: true, rules: updatedRules });
    }

    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const saved = await saveMinisiteDraft({
      businessId: body.businessId || slug,
      layout: {
        mode: body.mode,
        components: body.components,
        site_settings: body.site_settings,
      },
      createdBy: admin.id || 'admin',
    });

    try {
      revalidatePath(`/${saved.slug}`);
      revalidatePath('/[slug]', 'page');
    } catch (e) {
      console.warn('[revalidatePath warning]', e);
    }

    return NextResponse.json({
      success: true,
      ...saved,
      status: 'draft',
    });
  } catch (error: any) {
    console.error('[API minisite-layout POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: getErrorStatus(error) });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const business = await queryOne<{ id: string; slug: string }>(
      'SELECT id, slug FROM businesses WHERE slug = ? OR id = ? LIMIT 1',
      [slug, slug]
    );
    await transaction(async connection => {
      if (business) {
        const [activeRows] = await connection.execute(
          `SELECT id FROM minisite_vendor_handoffs
           WHERE business_id = ? AND status IN
             ('draft', 'sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted', 'published')`,
          [business.id]
        );
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status IN
             ('draft', 'sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted', 'published')`,
          [business.id]
        );
        for (const row of activeRows as Array<{ id: string }>) {
          await connection.execute(
            `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
             VALUES (?, 'layout_reset', ?, ?)`,
            [row.id, JSON.stringify({ slug }), admin.id]
          );
        }
      }
      await connection.execute(
        'DELETE FROM website_configs WHERE type = ?',
        [MINISITE_LAYOUT_KEY(business?.slug || slug)]
      );
    });
    invalidateCache.websiteSettings();
    invalidateCache.websiteSettings();
    try {
      revalidatePath(`/${business?.slug || slug}`);
      revalidatePath('/[slug]', 'page');
    } catch (e) {
      console.warn('[revalidatePath warning]', e);
    }

    return NextResponse.json({
      success: true,
      message: `Minisite layout deleted for ${slug}. Reverted to default section architecture.`,
    });
  } catch (error: any) {
    console.error('[API minisite-layout DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: getErrorStatus(error) });
  }
}
