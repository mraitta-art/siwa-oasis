import { NextResponse } from 'next/server';
import { listMarkets } from '@/lib/markets';

export const revalidate = 300;

/**
 * The market slugs that may act as a URL prefix.
 *
 * Middleware runs on the edge with no database driver, so it cannot read the
 * `markets` table itself. It calls this once per cache window and keeps the
 * answer in memory; the static `MARKET_SEGMENTS` list stays as the fast path
 * and as the fallback when this endpoint is unreachable.
 *
 * Only slugs are published. Hosts, launch notes and display names of dark
 * markets stay on the dashboard side.
 */
export async function GET() {
  const markets = await listMarkets({ activeOnly: false });
  return NextResponse.json(
    { segments: markets.map((market) => market.slug) },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
