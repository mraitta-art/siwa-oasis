import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * /api/accommodation-vendors
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns rich accommodation vendor data for the AccommodationExplorer.
 * Reads live businesses from DB — same businesses that appear in sec_3_facilities.
 *
 * Strategy:
 *   1. Fetch businesses whose type_name or type_id suggests accommodation
 *      (hotel, camp, lodge, resort, retreat, villa, ecolodge, glamping, chalet, etc.)
 *   2. If that yields 0 results → return ALL businesses with a slug (same as
 *      section-vendors default) so the page always shows live data.
 *   3. Extract accommodation-specific fields from custom_data JSON.
 *
 * Query params:
 *   ?limit=40  (max 80, default 40)
 *   ?search=taziry  (optional text search)
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

    // Build keyword condition for accommodation types
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

      const get = (field: string) => accData[field] ?? identity[field] ?? cd[field];

      // Accommodation filter fields
      const setting_location = get('setting_location') || null;
      const vibe_tags: string[] = (() => {
        const v = get('vibe_tags');
        if (Array.isArray(v)) return v;
        if (typeof v === 'string' && v) return v.split(',').map((s: string) => s.trim()).filter(Boolean);
        return [];
      })();
      const accommodation_type = get('accommodation_type') || mapTypeToAccType(b.type_name || b.type_id || '') || null;
      const view_type = get('view_type') || null;
      const has_pool = Boolean(get('has_pool'));

      // Pricing
      const rawPrice = get('price');
      const price = rawPrice ? Number(rawPrice) : undefined;
      const price_on_request = Boolean(get('price_on_request'));
      const price_unit = get('price_unit') || 'night';
      const currency = get('currency') || 'EGP';

      // Links
      const minisite_url = get('minisite_url') || identity.website || null;
      const minisite_label = get('minisite_label') || null;
      const direct_discount_note = get('direct_discount_note') || null;
      const external_check_url = get('external_check_url') || get('booking_com_url') || (cd.comparison_links || {}).booking_com_url || null;
      const external_check_label = get('external_check_label') || (external_check_url ? 'Check on Booking.com ↗' : null);

      // Ratings
      const rating = get('rating') ? Number(get('rating')) : null;
      const reviews_count = get('reviews_count') ? Number(get('reviews_count')) : null;
      const location_name = get('location_name') || identity.address || 'Siwa Oasis';

      // Visuals
      const cover = get('cover_image') || identity.cover_image || b.cover_image || null;
      const gallery_images: string[] = (() => {
        const g = get('gallery_images');
        if (Array.isArray(g) && g.length > 0) return g;
        const candidates = [cover, get('photo_1'), get('photo_2'), get('photo_3'), identity.photo_1, identity.photo_2].filter(Boolean) as string[];
        return candidates.length > 0 ? candidates : [];
      })();

      // Description
      const desc_en = get('description') || get('desc_en') || identity.description || '';
      const desc_ar = get('desc_ar') || identity.description_ar || '';

      // Comparison links
      const booking_com_url = (cd.comparison_links || {}).booking_com_url || get('booking_com_url') || null;
      const tripadvisor_url = (cd.comparison_links || {}).tripadvisor_url || get('tripadvisor_url') || null;

      // Room options
      const options = (() => {
        const o = get('options') || get('room_types');
        if (Array.isArray(o)) return o;
        return [];
      })();

      return {
        id: `db_${b.id}`,
        sector: 'accommodation' as const,
        kind: 'direct' as const,
        business_id: String(b.id),
        business_name: b.name,
        business_slug: b.slug,
        business_phone: b.vendor_phone || null,
        whatsapp_number: b.vendor_whatsapp || b.vendor_phone || null,

        title_en: get('title_en') || get('title') || b.name,
        title_ar: get('title_ar') || b.name,
        desc_en: desc_en || `Experience the authentic charm of ${b.name} in Siwa Oasis.`,
        desc_ar,

        image: cover || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        logo_url: identity.business_logo || identity.logo || b.logo_url || null,
        gallery_images,
        is_trusted: Boolean(b.is_trusted),
        badge_en: Boolean(b.is_trusted) ? 'Verified Partner' : undefined,

        price,
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
        has_pool,
        check_in_time: get('check_in_time') || null,
        check_out_time: get('check_out_time') || null,

        comparison_links: {
          booking_com_url: booking_com_url || undefined,
          tripadvisor_url: tripadvisor_url || undefined,
        },

        options,
      };
    });

    // Collect unique filter values present in the actual data
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
    console.error('[accommodation-vendors GET]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

/** Map type_name/type_id strings to accommodation_type values */
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
