import { NextRequest, NextResponse } from 'next/server';
import { queryStrict } from '@/lib/db';
import { getMarketBySlug, MARKET_TYPE_SCOPE_SQL, resolveSignupMarket } from '@/lib/markets';

/**
 * PUBLIC Business Types API — for vendor signup only.
 * No authentication required.
 * Returns the active types a single marketplace offers (parents + children).
 *
 * A category tagged with another market is left out: a developer standing in
 * Siwa must not be shown "Sea-view apartment" and then be rejected at submit,
 * and an El Alamein registration must not have to scroll past 84 Siwan
 * typologies. A category with no tag is shared and stays visible everywhere.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const invitedTypeId = params.get('typeId') || params.get('typeid') || null;
    // `?market=all` is the admin escape hatch: an outreach desk filtering a
    // platform-wide audience needs every typology, not one market's tree.
    const wantsAll = params.get('market') === 'all';
    const market = wantsAll ? null : await resolveSignupMarket({
      market: params.get('market'),
      typeId: invitedTypeId,
      host: request.headers.get('host'),
    });
    const marketRow = market ? await getMarketBySlug(market) : null;
    const scope = market
      ? { sql: `AND ${MARKET_TYPE_SCOPE_SQL}`, params: [market] }
      : { sql: '', params: [] as string[] };

    let types: any[];
    // `name_ar` exists on `business_types`, but `description_ar` does not: an
    // earlier draft asked for both and the ER_BAD_FIELD_ERROR made the whole
    // Arabic read fall back to the no-Arabic tier, so every category came back
    // with a null Arabic name. Ask only for the Arabic column that exists and
    // guard it on its own, so a deployment without `name_ar` still degrades
    // gracefully instead of losing the names too.
    try {
      // queryStrict (not query) on purpose: the lenient helper swallows
      // ER_BAD_FIELD_ERROR in development and returns [], which would make this
      // route serve an empty category list instead of reaching the fallback below.
      types = await queryStrict(
        `SELECT id, name, name_ar, icon, icon_color, description, is_parent, parent_id, market_id
         FROM business_types
         WHERE active = TRUE ${scope.sql}
         ORDER BY is_parent DESC, sort_order ASC, name ASC`,
        scope.params
      ) as any[];
    } catch {
      // A database old enough to have no `name_ar` cannot show Arabic names, and
      // one with no `market_id` cannot be scoped by market. Neither is worth an
      // empty picker: an unscoped English list still lets a vendor register, so
      // fail open and let the write path reject a cross-market category instead.
      try {
        types = await queryStrict(
          `SELECT id, name, icon, icon_color, description, is_parent, parent_id, market_id
           FROM business_types
           WHERE active = TRUE ${scope.sql}
           ORDER BY is_parent DESC, sort_order ASC, name ASC`,
          scope.params
        ) as any[];
      } catch {
        types = await queryStrict(
          `SELECT id, name, icon, icon_color, description, is_parent, parent_id
           FROM business_types
           WHERE active = TRUE
           ORDER BY is_parent DESC, sort_order ASC, name ASC`
        ) as any[];
      }
    }

    // Parse JSON icon_color if needed and return clean shape
    const clean = (types as any[]).map((t) => ({
      id:          t.id,
      name:        t.name,
      name_ar:     t.name_ar || null,
      icon:        t.icon        || 'fas fa-building',
      icon_color:  t.icon_color  || '#D4AF37',
      description: t.description || '',
      is_parent:   !!t.is_parent,
      parent_id:   t.parent_id  || null,
      market_id:   t.market_id  || null,
    }));

    return NextResponse.json({
      market: market || 'all',
      market_name: marketRow?.nameEn || market || 'All markets',
      market_name_ar: marketRow?.nameAr || null,
      types: clean,
    });
  } catch (error: any) {
    console.error('[signup/types] Error:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
