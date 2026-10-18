import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CANONICAL_ACCOMMODATION_PRESETS } from '@/lib/accommodation-template-registry';

export const dynamic = 'force-dynamic';

/**
 * /api/accommodation-vendors
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns accommodation vendor data for AccommodationExplorer.
 * 
 * CORE PRINCIPLE:
 *  - Every accommodation automatically inherits the Master Template (Level 4: Luxury Estate)
 *    as its DEFAULT baseline.
 *  - Any vendor-specific custom_data overrides the default values.
 *  - If a vendor specifies an explicit tier (e.g. standard_camp, basic_listing),
 *    it gracefully degrades to that tier's preset baseline.
 */

const ACCOMMODATION_TYPE_KEYWORDS = [
  'hotel', 'camp', 'lodge', 'resort', 'retreat', 'villa', 'ecolodge',
  'glamping', 'chalet', 'sanctuary', 'accommodation', 'stay', 'inn',
  'hostel', 'guesthouse', 'bungalow', 'suite', 'apartment',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search  = (searchParams.get('search') || '').trim();
    const limit   = Math.min(parseInt(searchParams.get('limit') || '40', 10), 80);

    const keywordConditions = ACCOMMODATION_TYPE_KEYWORDS.map(() => 'LOWER(bt.name) LIKE ?').join(' OR ');
    const keywordArgs = ACCOMMODATION_TYPE_KEYWORDS.map(k => `%${k}%`);

    let whereClause = `b.slug IS NOT NULL AND (${keywordConditions})`;
    let args: any[] = [...keywordArgs];

    if (search) {
      whereClause += ` AND (LOWER(b.name) LIKE ? OR LOWER(bt.name) LIKE ?)`;
      args.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    args.push(limit);

    let rows = await query<any>(
      `SELECT b.*, bt.name AS type_name, bt.id AS type_id
       FROM businesses b
       LEFT JOIN business_types bt ON LOWER(b.type_id) = LOWER(bt.id)
       WHERE ${whereClause}
       ORDER BY b.is_trusted DESC, b.name ASC
       LIMIT ?`,
      args
    ).catch(() => [] as any[]);

    // Fallback: if no accommodation-specific businesses found, return ALL businesses
    if (rows.length === 0) {
      const fallbackArgs: any[] = [];
      let fallbackWhere = 'b.slug IS NOT NULL';
      if (search) {
        fallbackWhere += ` AND (LOWER(b.name) LIKE ? OR LOWER(bt.name) LIKE ?)`;
        fallbackArgs.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
      }
      fallbackArgs.push(limit);

      rows = await query<any>(
        `SELECT b.*, bt.name AS type_name, bt.id AS type_id
         FROM businesses b
         LEFT JOIN business_types bt ON LOWER(b.type_id) = LOWER(bt.id)
         WHERE ${fallbackWhere}
         ORDER BY b.is_trusted DESC, b.name ASC
         LIMIT ?`,
        fallbackArgs
      ).catch(() => [] as any[]);
    }

    // Default baseline is the Level 4 Luxury Estate master template
    const masterBaseline = CANONICAL_ACCOMMODATION_PRESETS.luxury_estate;

    // Map DB rows to rich accommodation card objects
    const allItems = (rows || []).map((b: any) => {
      let cd: Record<string, any> = {};
      try {
        cd = typeof b.custom_data === 'string' ? JSON.parse(b.custom_data) : (b.custom_data || {});
      } catch { cd = {}; }

      // Identity data from various custom_data namespaces
      const identity = {
        ...(cd.basic || {}),
        ...(cd.sec_1_identity || {}),
        ...(cd.business_info || {}),
      };

      // Accommodation-specific data
      const accData = {
        ...(cd.accommodation || {}),
        ...(cd.sec_3_facilities || {}),
        ...(cd.facilities || {}),
      };

      // Determine active tier baseline: default to 'luxury_estate' unless degraded
      const activeTier = accData.template_tier || cd.template_tier || 'luxury_estate';
      const baseline = (CANONICAL_ACCOMMODATION_PRESETS as any)[activeTier] || masterBaseline;

      // Cascading getter: Vendor overrides > Identity > Default Master Template Baseline
      const get = (field: string) => accData[field] ?? identity[field] ?? cd[field] ?? baseline[field];

      // Accommodation filter fields
      const setting_location = get('setting_location') || 'on_lake_and_pool';
      const vibe_tags: string[] = (() => {
        const v = get('vibe_tags');
        if (Array.isArray(v) && v.length > 0) return v;
        if (typeof v === 'string' && v) return v.split(',').map((s: string) => s.trim()).filter(Boolean);
        return baseline.vibe_tags || ['lake_silence', 'desert_stars'];
      })();
      const accommodation_type = get('accommodation_type') || mapTypeToAccType(b.type_name || b.type_id || '') || baseline.accommodation_type || 'ecolodge';
      const view_type = get('view_type') || baseline.view_type;
      const building_material = get('building_material') || baseline.building_material;
      const has_pool = get('has_pool') !== undefined ? Boolean(get('has_pool')) : Boolean(baseline.has_pool);
      const hot_spring = get('hot_spring') !== undefined ? Boolean(get('hot_spring')) : Boolean(baseline.hot_spring);

      // Pricing
      const rawPrice = get('price');
      const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : baseline.price;
      const price_on_request = Boolean(get('price_on_request'));
      const price_unit = get('price_unit') || baseline.price_unit || 'night';
      const currency = get('currency') || baseline.currency || 'EGP';
      const original_price = get('original_price') ? Number(get('original_price')) : baseline.original_price;

      // Links & Minisite
      const minisite_url = get('minisite_url') || identity.website || `/${b.slug}#sec_3_facilities`;
      const minisite_label = get('minisite_label') || (minisite_url.startsWith('http') ? 'More About ↗' : 'Visit Minisite ↗');
      const direct_discount_note = get('direct_discount_note') || baseline.direct_discount_note;
      const external_check_url = get('external_check_url') || get('booking_com_url') || (cd.comparison_links || {}).booking_com_url || baseline.external_check_url || null;
      const external_check_label = get('external_check_label') || baseline.external_check_label || (external_check_url ? 'Check on Booking.com ↗' : null);

      // Ratings
      const rating = get('rating') ? Number(get('rating')) : (baseline.rating || 4.9);
      const reviews_count = get('reviews_count') ? Number(get('reviews_count')) : (baseline.reviews_count || 56);
      const location_name = get('location_name') || identity.address || 'Siwa Oasis';

      // Visuals
      const cover = get('cover_image') || identity.cover_image || b.cover_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
      const gallery_images: string[] = (() => {
        const g = get('gallery_images');
        if (Array.isArray(g) && g.length > 0) return g;
        const candidates = [cover, get('photo_1'), get('photo_2'), get('photo_3'), identity.photo_1, identity.photo_2].filter(Boolean) as string[];
        return candidates.length > 0 ? candidates : [
          cover,
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80'
        ];
      })();

      // Description
      const desc_en = get('desc_en') || get('description') || identity.description || `Experience authentic desert tranquility and sanctuary living at ${b.name} in Siwa Oasis.`;
      const desc_ar = get('desc_ar') || identity.description_ar || '';

      // Hot Offer Perks
      const hot_offer = get('hot_offer') || (get('hot_offer_title') ? {
        title: get('hot_offer_title'),
        perk_description: get('hot_offer_perk'),
        badge_label: get('hot_offer_badge'),
        discount_percentage: get('hot_offer_discount'),
      } : (baseline.hot_offer_title ? {
        title: baseline.hot_offer_title,
        perk_description: baseline.hot_offer_perk,
        badge_label: baseline.hot_offer_badge,
        discount_percentage: baseline.hot_offer_discount,
      } : undefined));

      // Comparison links
      const booking_com_url = (cd.comparison_links || {}).booking_com_url || get('booking_com_url') || null;
      const tripadvisor_url = (cd.comparison_links || {}).tripadvisor_url || get('tripadvisor_url') || null;

      // Room options
      const options = (() => {
        const o = get('options') || get('room_types');
        if (Array.isArray(o) && o.length > 0) return o;
        return [
          { id: 'opt_suite', name_en: 'Kershef Mudbrick Suite', name_ar: 'جناح الكرشيف الأصيل', multiplier: 1.0, capacity: '2 Guests' },
          { id: 'opt_chalet', name_en: 'Palm Grove Waterfront Chalet', name_ar: 'شاليه الواحة بإطلالة البحيرة', multiplier: 1.4, capacity: '3 Guests' },
        ];
      })();

      return {
        id: `db_${b.id}`,
        sector: 'accommodation' as const,
        kind: 'direct' as const,
        business_id: String(b.id),
        business_name: b.name,
        business_slug: b.slug,
        business_phone: b.vendor_phone || null,
        whatsapp_number: b.vendor_whatsapp || b.vendor_phone || '201001234567',

        title_en: get('title_en') || get('title') || b.name,
        title_ar: get('title_ar') || b.name,
        desc_en,
        desc_ar,

        image: cover,
        logo_url: identity.business_logo || identity.logo || b.logo_url || null,
        gallery_images,
        is_trusted: b.is_trusted !== undefined ? Boolean(b.is_trusted) : true,
        badge_en: b.is_trusted ? 'Verified Sanctuary' : undefined,

        price,
        original_price,
        price_unit,
        currency,
        price_on_request,
        direct_discount_note,
        external_check_url,
        external_check_label,

        minisite_url,
        minisite_label,

        rating,
        reviews_count,
        location_name,
        type_name: b.type_name || null,
        type_id: b.type_id || null,

        setting_location,
        vibe_tags,
        accommodation_type,
        view_type,
        building_material,
        has_pool,
        hot_spring,
        check_in_time: get('check_in_time') || baseline.check_in_time || '14:00',
        check_out_time: get('check_out_time') || baseline.check_out_time || '11:00',

        hot_offer,
        comparison_links: {
          booking_com_url: booking_com_url || undefined,
          tripadvisor_url: tripadvisor_url || undefined,
          ota_name: external_check_label ? 'Booking.com' : undefined,
        },

        options,
        template_tier: activeTier,
      };
    });

    // Collect unique filter values present across all data
    const allSettings = [...new Set(allItems.map(i => i.setting_location).filter(Boolean) as string[])];
    const allVibes    = [...new Set(allItems.flatMap(i => i.vibe_tags))];
    const allTypes    = [...new Set(allItems.map(i => i.accommodation_type).filter(Boolean) as string[])];

    return NextResponse.json({
      items: allItems,
      total: allItems.length,
      all_total: allItems.length,
      available_settings: allSettings,
      available_vibes: allVibes,
      available_types: allTypes,
    });

  } catch (error: any) {
    console.error('[accommodation-vendors GET error]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

function mapTypeToAccType(typeStr: string): string | null {
  const t = typeStr.toLowerCase();
  if (t.includes('villa')) return 'villa';
  if (t.includes('glamping') || t.includes('tent') || t.includes('dome')) return 'glamping';
  if (t.includes('camp')) return 'glamping';
  if (t.includes('chalet') || t.includes('salt')) return 'salt_chalet';
  if (t.includes('heritage') || t.includes('suite') || t.includes('mudbrick')) return 'heritage_suite';
  if (t.includes('hotel') || t.includes('lodge') || t.includes('eco') || t.includes('resort') || t.includes('retreat')) return 'ecolodge';
  return null;
}
