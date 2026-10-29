import { headers } from 'next/headers';

/**
 * Site locale for public pages.
 *
 * Arabic is the language of the market, so it owns the bare address: `/`,
 * `/siwa`, `/categories` are Arabic. English is the explicit alternate and
 * lives under `/en/...`. The legacy `/ar/...` prefix is retired and 308-redirects
 * to the bare path, so every Arabic URL already indexed survives the move.
 *
 * Middleware rewrites `/en/...` to the canonical route and passes the locale in
 * a request header, which keeps one route tree while giving every language a
 * real, linkable, crawlable address.
 *
 * Only the path decides the language. `Accept-Language` deliberately does not:
 * public HTML is now served from a CDN cache keyed by URL, so a response that
 * changed per visitor would be handed to the next one.
 */
export type SiteLocale = 'ar' | 'en';

export const SITE_LOCALES: SiteLocale[] = ['ar', 'en'];

/** The language a URL with no prefix speaks. */
export const DEFAULT_LOCALE: SiteLocale = 'ar';

/**
 * Which language the URL itself declares, or null when it declares none.
 * Canonical and hreflang must follow the address, not the Accept-Language
 * header: a visitor negotiated into Arabic at /siwa-stay still has one URL, and
 * a canonical pointing at /ar/siwa-stay would hand that page away.
 */
export async function pathLocale(): Promise<SiteLocale | null> {
  try {
    const v = (await headers()).get('x-siwa-locale');
    return v === 'ar' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

export function localeUrl(base: string, locale: SiteLocale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  // Arabic is the bare path; English carries the /en prefix.
  return locale === 'en' ? `${base}/en${clean}` : `${base}${clean}`;
}

/** hreflang cluster for a page that exists in both languages. */
export function languageAlternates(base: string, path: string) {
  return {
    ar: localeUrl(base, 'ar', path),
    en: localeUrl(base, 'en', path),
    // Egypt-first: the default destination is the Arabic (bare) address.
    'x-default': localeUrl(base, 'ar', path),
  };
}
