import { NextResponse } from 'next/server';
import { listMarkets } from '@/lib/markets';

// Marketplace metadata changes when a market is launched, which is never
// mid-minute. Cache it like any other public read.
export const revalidate = 60;

/**
 * Public list of live markets. Dark markets are deliberately omitted: their
 * areas are seeded but must not be advertised, linked or crawled until the
 * market row is flipped to active.
 */
export async function GET() {
  const markets = await listMarkets({ activeOnly: true });

  return NextResponse.json({
    markets: markets.map((market) => ({
      slug: market.slug,
      nameAr: market.nameAr,
      nameEn: market.nameEn,
      host: market.host,
      defaultLocale: market.defaultLocale,
      currency: market.currency,
      revenueModel: market.revenueModel,
      themeAccent: market.themeAccent,
    })),
  });
}
