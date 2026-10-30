import type { SiteLocale } from '@/lib/site-locale';

/**
 * The navbar and footer are edited in the dashboard as plain "Label | href"
 * lines. That was fine while the site had one market and a fixed list of sector
 * pages; the links that matter now are rows (markets, categories with live
 * supply) and they change without a deploy.
 *
 * So a line may be nothing but a token, and it expands into one line per row.
 * A grouped line ("GROUP | {{token}}") keeps its group on every row it expands
 * into. Everything else is passed through untouched, which keeps the editor in
 * charge of order, wording and the links it wants to pin.
 *
 *   {{markets}}             one line per live market
 *   {{market}}              the market being viewed
 *   {{categories}}          one line per category that has supply in that market
 *   EXPLORE | {{market}}    the same, inside the EXPLORE footer group
 */

export interface NavMarket {
  slug: string;
  name: string;
}

export interface NavCategory {
  id: string;
  name: string;
  listings: number;
}

export interface NavContext {
  locale: SiteLocale;
  market: NavMarket | null;
  markets: NavMarket[];
  categories: NavCategory[];
  /** On the national platform door, `{{market}}` has no single door to open. */
  platform?: boolean;
}

export const NAV_TOKENS = ['{{markets}}', '{{market}}', '{{categories}}'] as const;

function localized(locale: SiteLocale, path: string): string {
  return locale === 'en' ? `/en${path}` : path;
}

function marketPath(locale: SiteLocale, slug: string): string {
  return localized(locale, `/${slug}`);
}

export function expandNavTokens(text: string, ctx: NavContext): string {
  const { locale, market, markets, categories } = ctx;

  const expand = (token: string): string[] => {
    switch (token) {
      case '{{markets}}':
        return markets.map((m) => `${m.name} | ${marketPath(locale, m.slug)}`);
      case '{{market}}':
        return market ? [`${market.name} | ${marketPath(locale, market.slug)}`] : [];
      case '{{categories}}':
        return market
          ? categories.map(
              (c) =>
                `${c.name} | ${marketPath(locale, market.slug)}?category=${encodeURIComponent(c.id)}`
            )
          : [];
      default:
        return [];
    }
  };

  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmed = line.trim();
      if ((NAV_TOKENS as readonly string[]).includes(trimmed)) return expand(trimmed);

      // "EXPLORE | {{market}}" — a token at the end of a grouped footer line.
      const grouped = trimmed.match(/^([^|]+)\|\s*(\{\{[a-z]+\}\})$/);
      if (grouped) {
        const group = grouped[1].trim();
        return expand(grouped[2]).map((entry) => `${group} | ${entry}`);
      }

      return [line];
    })
    .join('\n');
}
