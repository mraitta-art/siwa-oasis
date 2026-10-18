import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  AccommodationTemplateTier,
  TIER_META,
  TIER_ORDER,
  ACCOMMODATION_SECTIONS,
  ACCOMMODATION_FIELDS,
  getAccommodationTemplateSpecification,
  CANONICAL_ACCOMMODATION_PRESETS,
} from '@/lib/accommodation-template-registry';

export const dynamic = 'force-dynamic';

/**
 * /api/accommodation-template
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  - Returns template specification for a tier, list of all tiers, or a saved preset.
 * POST - Saves a customized template or applies a tier preset to a business.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get('tier') || 'luxury_estate') as AccommodationTemplateTier;
    const businessId = searchParams.get('business_id');
    const mode = searchParams.get('mode'); // 'meta' | 'preset' | 'spec' | 'all'

    // Return all tiers metadata and summary
    if (mode === 'meta' || mode === 'all') {
      const allTiers = TIER_ORDER.map((t) => {
        const spec = getAccommodationTemplateSpecification(t);
        return {
          tier: t,
          meta: TIER_META[t],
          sectionsCount: spec.sectionsCount,
          fieldsCount: spec.fieldsCount,
          preset: CANONICAL_ACCOMMODATION_PRESETS[t],
        };
      });

      return NextResponse.json({
        masterTier: 'luxury_estate',
        totalSectionsMaster: ACCOMMODATION_SECTIONS.length,
        totalFieldsMaster: ACCOMMODATION_FIELDS.length,
        tiers: allTiers,
      });
    }

    // Return preset data directly
    if (mode === 'preset') {
      const preset = CANONICAL_ACCOMMODATION_PRESETS[tier] || CANONICAL_ACCOMMODATION_PRESETS.luxury_estate;
      return NextResponse.json({
        tier,
        meta: TIER_META[tier],
        preset,
      });
    }

    // If business ID provided, check if business has existing saved custom_data
    let businessData: any = null;
    if (businessId) {
      const rows = await query<any>(
        'SELECT id, name, slug, custom_data FROM businesses WHERE id = ? OR slug = ? LIMIT 1',
        [businessId, businessId]
      ).catch(() => []);
      if (rows && rows.length > 0) {
        try {
          businessData = typeof rows[0].custom_data === 'string'
            ? JSON.parse(rows[0].custom_data)
            : rows[0].custom_data;
        } catch {
          businessData = null;
        }
      }
    }

    const spec = getAccommodationTemplateSpecification(tier);

    return NextResponse.json({
      success: true,
      specification: spec,
      preset: CANONICAL_ACCOMMODATION_PRESETS[tier],
      businessExistingData: businessData,
    });
  } catch (error: any) {
    console.error('[/api/accommodation-template GET error]', error);
    return NextResponse.json(
      { error: error.message || 'Server error loading template' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id, tier = 'luxury_estate', template_values = {} } = body;

    if (!business_id) {
      return NextResponse.json(
        { error: 'business_id is required to apply template' },
        { status: 400 }
      );
    }

    const targetTier = (TIER_ORDER.includes(tier) ? tier : 'luxury_estate') as AccommodationTemplateTier;
    const basePreset = CANONICAL_ACCOMMODATION_PRESETS[targetTier] || {};
    const mergedValues = {
      ...basePreset,
      ...template_values,
      applied_template_tier: targetTier,
      template_updated_at: new Date().toISOString(),
    };

    // Retrieve current business row
    const existing = await query<any>(
      'SELECT id, custom_data FROM businesses WHERE id = ? OR slug = ? LIMIT 1',
      [business_id, business_id]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: `Business "${business_id}" not found` },
        { status: 404 }
      );
    }

    const currentBusiness = existing[0];
    let cd: Record<string, any> = {};
    try {
      cd = typeof currentBusiness.custom_data === 'string'
        ? JSON.parse(currentBusiness.custom_data)
        : (currentBusiness.custom_data || {});
    } catch {
      cd = {};
    }

    // Merge template values directly into facilities and accommodation namespaces
    cd.sec_3_facilities = {
      ...(cd.sec_3_facilities || {}),
      ...mergedValues,
    };
    cd.accommodation = {
      ...(cd.accommodation || {}),
      ...mergedValues,
    };

    // If identity fields present, sync to sec_1_identity
    if (mergedValues.whatsapp_number) {
      cd.sec_1_identity = cd.sec_1_identity || {};
      cd.sec_1_identity.whatsapp = mergedValues.whatsapp_number;
    }
    if (mergedValues.cover_image) {
      cd.sec_1_identity = cd.sec_1_identity || {};
      cd.sec_1_identity.cover_image = mergedValues.cover_image;
    }

    const updatedJson = JSON.stringify(cd);

    await query(
      'UPDATE businesses SET custom_data = ? WHERE id = ?',
      [updatedJson, currentBusiness.id]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully applied ${TIER_META[targetTier].label} to business ${currentBusiness.id}`,
      tier: targetTier,
      appliedFieldsCount: Object.keys(mergedValues).length,
    });
  } catch (error: any) {
    console.error('[/api/accommodation-template POST error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save accommodation template' },
      { status: 500 }
    );
  }
}
