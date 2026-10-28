/**
 * Market-opportunity rollups.
 *
 * The investor question one level above a project: "compare El Alamein against
 * Siwa as a place to put money." This turns the same developments + units the
 * project comparison already reads into one number set per market — supply,
 * entry price, price per m², handover horizon.
 *
 * WHAT THIS HONESTLY IS: a snapshot of currently-listed supply. It reports what
 * is on the platform today, grouped per market; it is INDICATIVE, not a
 * statistical index, and thinner markets will look thinner here. It deliberately
 * makes no claim about appreciation, because we store no price history — the
 * trend question needs a snapshots table this does not pretend to be.
 */

import { query } from '@/lib/db';
import { listMarkets, type Market } from '@/lib/markets';

export interface MarketOpportunity {
  marketId: string;
  name: string;
  nameAr: string | null;
  currency: string;
  /** Active developer projects (compound/resort) in the market. */
  projectCount: number;
  /** Active for-sale units behind those projects. */
  saleUnits: number;
  /** Lowest asking price among priced sale units — the entry point. */
  entryPrice: number | null;
  avgPrice: number | null;
  avgPricePerSqm: number | null;
  minPricePerSqm: number | null;
  /** Mean advertised handover year across active projects. */
  avgHandover: number | null;
}

const PROJECT_KINDS = "('compound', 'resort')";

function num(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function unitMetrics(marketId: string): Promise<Pick<MarketOpportunity, 'saleUnits' | 'entryPrice' | 'avgPrice' | 'avgPricePerSqm' | 'minPricePerSqm'>> {
  const empty = { saleUnits: 0, entryPrice: null, avgPrice: null, avgPricePerSqm: null, minPricePerSqm: null };
  try {
    const rows = await query(
      `SELECT
         COUNT(*) AS sale_units,
         MIN(CASE WHEN price > 0 THEN price END) AS entry_price,
         AVG(CASE WHEN price > 0 THEN price END) AS avg_price,
         AVG(CASE WHEN price_per_sqm > 0 THEN price_per_sqm END) AS avg_ppsm,
         MIN(CASE WHEN price_per_sqm > 0 THEN price_per_sqm END) AS min_ppsm
       FROM units
       WHERE active = 1 AND market_id = ? AND listing_kind = 'sale'`,
      [marketId]
    );
    const row = (rows || [])[0] || {};
    return {
      saleUnits: Number(row.sale_units || 0),
      entryPrice: num(row.entry_price),
      avgPrice: num(row.avg_price),
      avgPricePerSqm: num(row.avg_ppsm),
      minPricePerSqm: num(row.min_ppsm),
    };
  } catch {
    return empty;
  }
}

async function projectMetrics(marketId: string): Promise<Pick<MarketOpportunity, 'projectCount' | 'avgHandover'>> {
  try {
    const rows = await query(
      `SELECT COUNT(*) AS projects, AVG(delivery_year) AS avg_handover
       FROM developments
       WHERE active = 1 AND market_id = ? AND kind IN ${PROJECT_KINDS}`,
      [marketId]
    );
    const row = (rows || [])[0] || {};
    const handover = num(row.avg_handover);
    return { projectCount: Number(row.projects || 0), avgHandover: handover === null ? null : Math.round(handover) };
  } catch {
    return { projectCount: 0, avgHandover: null };
  }
}

/** Full opportunity for one market, or null if the market is unknown. */
export async function getMarketOpportunity(marketId: string): Promise<MarketOpportunity | null> {
  const markets = await listMarkets({ activeOnly: false });
  const market = markets.find((m) => m.slug === marketId);
  if (!market) return null;
  return buildOpportunity(market);
}

async function buildOpportunity(market: Market): Promise<MarketOpportunity> {
  const [units, projects] = await Promise.all([unitMetrics(market.slug), projectMetrics(market.slug)]);
  return {
    marketId: market.slug,
    name: market.nameEn,
    nameAr: market.nameAr,
    currency: market.currency || 'EGP',
    projectCount: projects.projectCount,
    avgHandover: projects.avgHandover,
    saleUnits: units.saleUnits,
    entryPrice: units.entryPrice,
    avgPrice: units.avgPrice,
    avgPricePerSqm: units.avgPricePerSqm,
    minPricePerSqm: units.minPricePerSqm,
  };
}

/**
 * Opportunity for several markets at once, in the order requested, so the
 * columns a buyer picked stay in the order they picked them. Unknown ids drop
 * out; `max` bounds the comparison width the same way the project table does.
 */
export async function compareMarketOpportunities(
  marketIds: string[],
  max = 4
): Promise<MarketOpportunity[]> {
  const clean = [...new Set(marketIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, max);
  if (clean.length === 0) return [];
  const markets = await listMarkets({ activeOnly: false });
  const bySlug = new Map(markets.map((m) => [m.slug, m]));
  const chosen = clean.map((id) => bySlug.get(id)).filter((m): m is Market => Boolean(m));
  return Promise.all(chosen.map(buildOpportunity));
}
