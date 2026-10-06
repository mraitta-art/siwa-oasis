import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
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
  deleteMinisiteLayout,
  fetchMinisiteLayout,
  fetchMinisiteTemplateLayout,
  GOVERNANCE_KEY,
  MinisiteLayout,
  saveMinisiteLayout,
} from '@/lib/minisite-layout';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
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

    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    // Lookup business
    const business = await queryOne<any>(
      `SELECT b.id, b.name, b.slug, b.type_id, b.subscription_tier, b.is_master,
              bt.name as type_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       WHERE b.slug = ? OR b.id = ? LIMIT 1`,
      [slug, slug]
    );

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const tier: MinisiteTier = getBusinessTier(business);
    const allowedComponents = await getTierRules(tier);

    // Fetch existing layout
    let layout = await fetchMinisiteLayout(business.slug || slug);

    // If no custom layout, check for category template
    let isFromTemplate = false;
    if (!layout && business.type_id) {
      const templateLayout = await fetchMinisiteTemplateLayout(business.type_id);
      if (templateLayout) {
        layout = templateLayout;
        isFromTemplate = true;
      }
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        type_id: business.type_id,
        type_name: business.type_name,
        tier,
      },
      layout,
      isFromTemplate,
      allowedComponents,
      allComponentsMeta: COMPONENT_META,
    });
  } catch (error: any) {
    console.error('[API minisite-layout GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
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

    // Lookup business to enforce tier rules
    const business = await queryOne<any>(
      'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE slug = ? OR id = ? LIMIT 1',
      [slug, slug]
    );

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const tier: MinisiteTier = getBusinessTier(business);
    const allowed = await getTierRules(tier);

    // Validate and strip non-allowed components
    const validatedComponents = validateMinisiteLayout(body.components, allowed);

    const layoutPayload: MinisiteLayout = {
      mode: body.mode === 'untied' ? 'untied' : 'replace',
      components: validatedComponents,
      site_settings: body.site_settings || {},
      updated_at: new Date().toISOString(),
      updated_by: admin.id || 'admin',
    };

    await saveMinisiteLayout(business.slug || slug, layoutPayload, admin.id);
    invalidateCache.websiteSettings();

    return NextResponse.json({
      success: true,
      layout: layoutPayload,
      strippedCount: (body.components?.length || 0) - validatedComponents.length,
    });
  } catch (error: any) {
    console.error('[API minisite-layout POST] Error:', error);
    const status = error.message?.includes('admin') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    await deleteMinisiteLayout(slug);
    invalidateCache.websiteSettings();

    return NextResponse.json({
      success: true,
      message: `Minisite layout deleted for ${slug}. Reverted to default section architecture.`,
    });
  } catch (error: any) {
    console.error('[API minisite-layout DELETE] Error:', error);
    const status = error.message?.includes('admin') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Server error' }, { status });
  }
}
