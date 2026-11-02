import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

/**
 * GET /api/admin/universal-minisite-builder/metadata
 * Returns all markets, governorates/locations, developers, developments, and categories.
 */
export async function GET(request: NextRequest) {
  try {
    const [markets, locations, developers, developments, categories] = await Promise.all([
      query('SELECT id, slug, name_en, name_ar FROM markets ORDER BY name_en'),
      query('SELECT id, market_id, name_en, name_ar, type FROM locations WHERE type IN ("city", "town", "district", "governorate") ORDER BY name_en'),
      query('SELECT id, slug, name, name_ar FROM developers WHERE active = 1 ORDER BY name'),
      query('SELECT id, slug, COALESCE(name_en, name_ar, slug) AS name, developer_id, market_id FROM developments WHERE active = 1 ORDER BY name_en, name_ar'),
      query(`
        SELECT id, name, name_ar, icon, is_parent, parent_id 
        FROM business_types 
        WHERE active = 1 AND id != 'SECTION_TEMPLATE'
        ORDER BY is_parent DESC, name
      `)
    ]);

    return NextResponse.json({
      markets,
      locations,
      developers,
      developments,
      categories
    });
  } catch (error: any) {
    console.error('[API universal-builder metadata error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/universal-minisite-builder
 * Creates a complete minisite entity (Unit, Room/Lodge, Tour, Restaurant).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const {
      assetType, // 'real_estate' | 'hospitality' | 'tour' | 'restaurant'
      marketId,
      locationId,
      developmentId,
      developerId,
      nameEn,
      nameAr,
      slug: customSlug,
      descriptionEn,
      descriptionAr,
      coverImage,
      gallery = [],
      // Specific specs
      specs = {},
      // Contact & booking routing
      contactPhone,
      contactWhatsapp
    } = payload;

    if (!nameAr && !nameEn) {
      return NextResponse.json({ error: 'Name is required in Arabic or English' }, { status: 400 });
    }

    const baseSlug = (customSlug || nameEn || nameAr)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve typology category — use real business_types IDs from DB
    // real_estate → parent "real_estate"; hospitality → "accommodation"; tour → "adventure"; restaurant → "food"
    // Caller can pass typeId directly to use a sub-type (e.g. "eco_lodge", "safari_4x4", "fine_dining")
    let typeId: string = payload.typeId || 'real_estate';
    if (!payload.typeId) {
      if (assetType === 'real_estate')  typeId = 'real_estate';
      else if (assetType === 'hospitality') typeId = 'accommodation';
      else if (assetType === 'tour')        typeId = 'adventure';
      else if (assetType === 'restaurant')  typeId = 'food';
    }

    const businessId = randomUUID();

    // Prepare structured custom_data
    const customData = {
      basic: {
        business_name: nameEn || nameAr,
        business_name_ar: nameAr || nameEn,
        description: descriptionEn || descriptionAr,
        description_ar: descriptionAr || descriptionEn,
        logo: coverImage || '',
        cover_image: coverImage || '',
        phone: contactPhone || '',
        whatsapp: contactWhatsapp || contactPhone || ''
      },
      asset_type: assetType,
      specs: specs,
      gallery: gallery,
      location: {
        market_id: marketId,
        location_id: locationId
      }
    };

    // Insert into businesses
    await execute(`
      INSERT INTO businesses (
        id,
        slug,
        name,
        name_ar,
        type_id,
        market_id,
        location_id,
        development_id,
        status,
        published,
        service_level,
        custom_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 'level_2', ?)
    `, [
      businessId,
      slug,
      nameEn || nameAr,
      nameAr || nameEn,
      typeId,
      marketId || 'siwa',
      locationId || null,
      developmentId || null,
      JSON.stringify(customData)
    ]);

    // If unit/real estate, also insert into units table for inventory search
    if (assetType === 'real_estate') {
      try {
        await execute(`
          INSERT INTO units (
            id,
            business_id,
            development_id,
            title_ar,
            title_en,
            unit_type,
            listing_kind,
            bedrooms,
            bathrooms,
            area_sqm,
            price,
            price_per_sqm,
            down_payment_pct,
            installment_years,
            delivery_year,
            finishing,
            furnished,
            status,
            active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 1)
        `, [
          randomUUID(),
          businessId,
          developmentId || null,
          nameAr || nameEn,
          nameEn || nameAr,
          specs.unitType || 'apartment',
          specs.listingKind || 'sale',
          Number(specs.bedrooms) || null,
          Number(specs.bathrooms) || null,
          Number(specs.areaSqm) || null,
          Number(specs.price) || null,
          Number(specs.pricePerSqm) || null,
          Number(specs.downPaymentPct) || null,
          Number(specs.installmentYears) || null,
          Number(specs.deliveryYear) || null,
          specs.finishing || 'fully_finished',
          specs.furnished ? 1 : 0
        ]);
      } catch (err) {
        console.warn('Units table insert skipped/failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      businessId,
      slug,
      publicUrl: `/${slug}`,
      assetType
    });
  } catch (error: any) {
    console.error('[API universal-builder POST error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
