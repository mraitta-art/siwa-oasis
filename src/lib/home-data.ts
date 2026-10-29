/**
 * The data the homepage front door renders with.
 *
 * page.tsx is a server component that resolves the active market and reads
 * markets / categories / listings / developers from the database, then passes
 * this one object into the (client) DynamicHomepageRenderer. The market-aware
 * home sections read from here instead of fetching their own APIs, which keeps
 * SSR, the per-market <h1> and the bilingual/RTL parity the hardcoded page had.
 */

import type { Market, MarketCategoryFacet, MarketListing } from '@/lib/markets';
import type { MarketDeveloper } from '@/lib/developers';
import type { SiteLocale } from '@/lib/site-locale';

export interface HomeData {
  market: Market;
  locale: SiteLocale;
  ar: boolean;
  /** Market name in the page language. */
  name: string;
  /** Market name in the other language (shown as a quiet subline). */
  otherName: string;
  /** Resolved accent colour for the market. */
  accent: string;
  /** Localised base path for the market, e.g. `/siwa` or `/ar/siwa`. */
  base: string;
  /** Total live listings across the market's categories. */
  inventory: number;
  /** One line explaining what the market is for (marketCopy). */
  copy: string;
  markets: Market[];
  /** Every market, live or seeded-dark, for the Egypt destinations band. */
  allMarkets: Market[];
  categories: MarketCategoryFacet[];
  listings: MarketListing[];
  developers: MarketDeveloper[];
  /** The "How it works" steps, already localised to a [title, body] pair. */
  steps: [string, string][];
}
