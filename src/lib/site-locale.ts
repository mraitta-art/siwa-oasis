import { headers } from 'next/headers';

/**
 * Site locale for public pages.
 *
 * Arabic used to be an invisible `?lang=ar` parameter, so no search engine ever
 * saw a second-language URL. Middleware now rewrites `/ar/...` and `/en/...` to
 * the canonical route and passes the locale in a request header, which keeps
 * one route tree while giving every language a real, linkable, crawlable address.
 *
 * Only the path decides the language. `Accept-Language` deliberately does not:
 * public HTML is now served from a CDN cache keyed by URL, so a response that
 * changed per visitor would be handed to the next one.
 */
export type SiteLocale = 'en' | 'ar';

export const SITE_LOCALES: SiteLocale[] = ['en', 'ar'];

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
  return locale === 'ar' ? `${base}/ar${clean}` : `${base}${clean}`;
}

/** hreflang cluster for a page that exists in both languages. */
export function languageAlternates(base: string, path: string) {
  return {
    en: localeUrl(base, 'en', path),
    ar: localeUrl(base, 'ar', path),
    'x-default': localeUrl(base, 'en', path),
  };
}
