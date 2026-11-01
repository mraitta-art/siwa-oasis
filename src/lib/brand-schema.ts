/**
 * The structured-data layer that tells Google what the SiWiFy mark stands for.
 *
 * Two objects ship together on every page from the root layout:
 *
 *   `Organization` — the entity that owns the mark. Carries the logo ImageObject,
 *                     the Arabic + English names, the country served, and the
 *                     five marketplace segments (properties, location, tourism,
 *                     accommodation, investment) as `knowsAbout`. This is the
 *                     record the Knowledge Graph uses to bind the emblem to
 *                     the marketplace idea rather than to a generic logo.
 *
 *   `WebSite`      — the site itself, linked to the organization via `@id`,
 *                     and carrying a `SearchAction` so Google can render a
 *                     sitelinks search box on results.
 *
 * Everything here is a plain object; the layout JSON-stringifies it into a
 * `<script type="application/ld+json">`. No server, no db, safe in either
 * runtime.
 *
 * The `@id` anchors are absolute and stable so a future ImageObject or
 * BreadcrumbList can reference them without duplicating the definition.
 */

import {
  BRAND_CANONICAL_ORIGIN,
  BRAND_DESCRIPTION_AR,
  BRAND_DESCRIPTION_EN,
  BRAND_LOCKUP_ALT_EN,
  BRAND_LOCKUP_ABSOLUTE_URL,
  BRAND_MARK_ALT_EN,
  BRAND_MARK_ABSOLUTE_URL,
  BRAND_MARK_SIZES,
  BRAND_NAME_AR,
  BRAND_NAME_EN,
  BRAND_SEGMENTS,
  BRAND_TAGLINE_AR,
  BRAND_TAGLINE_EN,
} from '@/lib/brand-assets';

const ORG_ID = `${BRAND_CANONICAL_ORIGIN}/#organization`;
const SITE_ID = `${BRAND_CANONICAL_ORIGIN}/#website`;
const LOGO_ID = `${BRAND_CANONICAL_ORIGIN}/#logo`;
const LOCKUP_ID = `${BRAND_CANONICAL_ORIGIN}/#lockup`;

/** The Organization node. */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND_NAME_EN,
    alternateName: [BRAND_NAME_AR, 'Siwify', 'SiWiFy.com', 'سوق سيويفايز'],
    legalName: 'SiWiFy Marketplace',
    url: `${BRAND_CANONICAL_ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: BRAND_MARK_ABSOLUTE_URL,
      contentUrl: BRAND_MARK_ABSOLUTE_URL,
      width: BRAND_MARK_SIZES.mark.width,
      height: BRAND_MARK_SIZES.mark.height,
      caption: BRAND_NAME_EN,
      inLanguage: ['ar-EG', 'en'],
    },
    image: { '@id': LOGO_ID },
    description: BRAND_DESCRIPTION_EN,
    slogan: [
      { '@type': 'CreativeWork', inLanguage: 'en', name: BRAND_TAGLINE_EN },
      { '@type': 'CreativeWork', inLanguage: 'ar-EG', name: BRAND_TAGLINE_AR },
    ],
    // The five verticals Google should associate with the mark. Spelled both
    // in English and Arabic so a mixed-locale crawl resolves the same entity.
    knowsAbout: [
      ...BRAND_SEGMENTS.map(s => `${BRAND_NAME_EN} ${s.en} marketplace in Egypt`),
      ...BRAND_SEGMENTS.map(s => s.ar),
      'Direct booking with verified owners and developers',
      '\u0627\u0644\u062d\u062c\u0632 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639 \u0627\u0644\u0645\u0627\u0644\u0643 \u0648\u0627\u0644\u0645\u0637\u0648\u0631\u064a\u0646 \u0627\u0644\u0645\u0648\u062b\u0642\u064a\u0646',
      'Egypt real estate',
      'Egypt tourism',
      'Egypt accommodation',
      'Siwa Oasis',
    ],
    knowsLanguage: ['ar-EG', 'en'],
    areaServed: [
      { '@type': 'Country', name: 'Egypt', alternateName: '\u0645\u0635\u0631' },
      { '@type': 'AdministrativeArea', name: 'Cairo' },
      { '@type': 'AdministrativeArea', name: 'Giza' },
      { '@type': 'AdministrativeArea', name: 'Matrouh \u2014 North Coast' },
      { '@type': 'AdministrativeArea', name: 'South Sinai \u2014 Sharm El Sheikh' },
      { '@type': 'AdministrativeArea', name: 'Red Sea \u2014 Hurghada' },
      { '@type': 'AdministrativeArea', name: 'New Administrative Capital' },
    ],
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME_EN,
      alternateName: [BRAND_NAME_AR],
      logo: { '@id': LOGO_ID },
      slogan: BRAND_TAGLINE_EN,
    },
    sameAs: [
      'https://www.facebook.com/siwify',
      'https://www.instagram.com/siwify',
      'https://www.linkedin.com/company/siwify',
      'https://www.youtube.com/@siwify',
      'https://www.tiktok.com/@siwify',
      'https://x.com/siwify',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: '+20-2-000-0000',
        areaServed: 'EG',
        availableLanguage: ['ar-EG', 'en'],
        email: 'hello@siwify.com',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'marketplace sellers',
        email: 'vendors@siwify.com',
        availableLanguage: ['ar-EG', 'en'],
      },
    ],
    potentialAction: [
      {
        '@type': 'JoinAction',
        target: `${BRAND_CANONICAL_ORIGIN}/register`,
        description: 'Register a business on the SiWiFy marketplace',
      },
    ],
  };
}

/** The WebSite node — links to the Organization and adds sitelinks search. */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${BRAND_CANONICAL_ORIGIN}/`,
    name: BRAND_NAME_EN,
    alternateName: [BRAND_NAME_AR],
    description: BRAND_DESCRIPTION_EN,
    inLanguage: ['ar-EG', 'en'],
    publisher: { '@id': ORG_ID },
    // Route pattern for the marketplace search. Kept as `q` because the
    // categories page already reads it. If that ever moves, update the target
    // here and the crawler follows without any further change.
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BRAND_CANONICAL_ORIGIN}/categories?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** The `ImageObject` node for the horizontal lockup. Emitted on marketing pages. */
export function buildLockupImageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': LOCKUP_ID,
    url: BRAND_LOCKUP_ABSOLUTE_URL,
    contentUrl: BRAND_LOCKUP_ABSOLUTE_URL,
    caption: BRAND_LOCKUP_ALT_EN,
    inLanguage: ['ar-EG', 'en'],
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    width: BRAND_MARK_SIZES.lockup.width,
    height: BRAND_MARK_SIZES.lockup.height,
    copyrightHolder: { '@id': ORG_ID },
    license: `${BRAND_CANONICAL_ORIGIN}/terms`,
    acquireLicensePage: `${BRAND_CANONICAL_ORIGIN}/brand`,
  };
}

/**
 * The full JSON-LD bundle for the root layout. Wrapped in `@graph` so Google
 * can resolve the internal `@id` references (organization ↔ website ↔ logo)
 * in one script tag rather than three, which keeps the head small and the
 * crawl efficient.
 *
 * Includes a `BreadcrumbList` seed for the marketplace verticals so the search
 * result can render "Egyptian Properties › Tourism › Accommodation › Investment"
 * under the site name.
 */
export function buildBrandGraphJsonLd() {
  const org = buildOrganizationJsonLd();
  const site = buildWebSiteJsonLd();
  const lockup = buildLockupImageJsonLd();
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${BRAND_CANONICAL_ORIGIN}/#breadcrumbs`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'SiWiFy \u2014 Egypt\u2019s Marketplace',
        item: `${BRAND_CANONICAL_ORIGIN}/`,
      },
      ...BRAND_SEGMENTS.map((s, idx) => ({
        '@type': 'ListItem' as const,
        position: idx + 2,
        name: s.en.charAt(0).toUpperCase() + s.en.slice(1),
        item: `${BRAND_CANONICAL_ORIGIN}/categories?vertical=${s.key}`,
      })),
    ],
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [org, site, lockup, breadcrumb],
  };
}

/**
 * The `<link rel="preload">` targets for the brand layer. The layout renders
 * each as a real `<link>` so the browser fetches the emblem in parallel with
 * the CSS instead of waiting for the header component to hydrate — that is
 * what stops the brand mark from appearing after a visible pop-in on first
 * paint.
 */
export function brandPreloadLinks() {
  return [
    { rel: 'preload', as: 'image', type: 'image/png', href: BRAND_MARK_ABSOLUTE_URL, fetchPriority: 'high' },
    { rel: 'preconnect', href: BRAND_CANONICAL_ORIGIN },
    { rel: 'canonical', href: `${BRAND_CANONICAL_ORIGIN}/` },
  ] as const;
}

/**
 * Alternate-language link hints. Arabic owns the bare path so Google treats
 * it as the primary listing, and `/en` is the English clone. Kept short so
 * the layout stays readable; individual routes still set their own
 * `alternates.capabilities` when they need a per-page variant.
 */
export function brandAlternates() {
  return {
    canonical: `${BRAND_CANONICAL_ORIGIN}/`,
    languages: {
      'ar-EG': `${BRAND_CANONICAL_ORIGIN}/`,
      en: `${BRAND_CANONICAL_ORIGIN}/en`,
      'ar': `${BRAND_CANONICAL_ORIGIN}/`,
    },
  };
}

/**
 * A bilingual `og:locale` array. The English tag is placed first because
 * Google's Image Search + Knowledge Graph index uses `en` as the fallback
 * caption language, and the Arabic tag follows so Facebook / Twitter resolve
 * the correct script for the Egyptian audience.
 */
export const BRAND_OG_LOCALES = ['en_US', 'ar_AR', 'ar_EG'] as const;
