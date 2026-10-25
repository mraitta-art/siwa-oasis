import { NextRequest, NextResponse } from 'next/server';
import { getMarketBySlug, getMarketForHost } from '@/lib/markets';
import {
  listDevelopments,
  getDevelopmentBySlug,
  getDevelopmentFacets,
  listDevelopmentListings,
  listUnits,
} from '@/lib/developments';

/**
 * Developments for one market.
 *
 *   GET /api/developments               -> compounds in the host's market
 *   GET /api/developments?market=elalamein -> compounds in a named market
 *   GET /api/developments?slug=hacienda-bay -> one compound, with its category
 *                                              tabs, its listings and its units
 *
 * A dark market answers 404: its rows are seeded but not published.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestedMarket = params.get('market');

  const market = requestedMarket
    ? await getMarketBySlug(requestedMarket)
    : await getMarketForHost(request.headers.get('host'));

  if (!market || !market.active) {
    return NextResponse.json({ error: 'market_not_found' }, { status: 404 });
  }

  const slug = params.get('slug');

  if (!slug) {
    const developments = await listDevelopments(market.slug);
    return NextResponse.json({ market: market.slug, developments });
  }

  const development = await getDevelopmentBySlug(market.slug, slug);
  if (!development) {
    return NextResponse.json({ error: 'development_not_found' }, { status: 404 });
  }

  const [facets, listings, units] = await Promise.all([
    getDevelopmentFacets(development.id),
    listDevelopmentListings(development.id, {
      parentTypeId: params.get('category'),
      limit: Number(params.get('limit')) || undefined,
    }),
    listUnits({ developmentId: development.id, limit: Number(params.get('limit')) || undefined }),
  ]);

  return NextResponse.json({
    market: market.slug,
    development,
    facets,
    listings,
    units,
  });
}
