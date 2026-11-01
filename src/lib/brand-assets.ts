/**
 * Single source of truth for SiWiFy platform artwork.
 *
 * Every file referenced here is produced from the master lockup by
 * `node scripts/generate-brand-assets.js`, so replacing the master artwork
 * regenerates the tab icon, PWA icons, OG card and in-app marks in one pass.
 *
 * The metadata in this file is also what the search engines read when the
 * brand mark appears in Google Image Search, in Knowledge Graph panels, and
 * in Rich Results cards. Every alt string names the marketplace, the country,
 * and the five verticals (properties, location, tourism, accommodation,
 * investment) so the mark is unambiguously bound to SiWiFy-as-Egypt-marketplace
 * rather than a generic logo image.
 */

/** Cache-buster appended to every asset URL — bump when the master artwork changes. */
const V = 'v=siwify-gold-2026';

export const BRAND_ACCENT = '#D4AF37';
/** Second-tier accent used in the loader sweep and the CTA cluster. */
export const BRAND_ACCENT_WARM = '#F59E0B';

/**
 * Canonical origin. Kept in sync with `metadataBase` in `app/layout.tsx` so
 * the JSON-LD `@id` anchors and the absolute image URLs agree with the
 * OpenGraph block.
 */
export const BRAND_CANONICAL_ORIGIN = 'https://siwify.com';

/** Emblem only, transparent background — header, minisite anchor, loaders. */
export const BRAND_MARK_URL = `/brand/siwify-emblem-128.png?${V}`;
/** Absolute form for JSON-LD, OpenGraph and Twitter cards. */
export const BRAND_MARK_ABSOLUTE_URL = `${BRAND_CANONICAL_ORIGIN}${BRAND_MARK_URL}`;

/** Emblem + "SiWiFy.com" wordmark, transparent background — footers, emails. */
export const BRAND_LOCKUP_URL = `/brand/siwify-lockup.png?${V}`;
export const BRAND_LOCKUP_ABSOLUTE_URL = `${BRAND_CANONICAL_ORIGIN}${BRAND_LOCKUP_URL}`;

/** 1200x630 social / Rich Results card. */
export const BRAND_OG_IMAGE_URL = `/brand/og-image.png?${V}`;
export const BRAND_OG_IMAGE_ABSOLUTE_URL = `${BRAND_CANONICAL_ORIGIN}${BRAND_OG_IMAGE_URL}`;

/** Solid 512px app icon (PWA, msapplication tile). */
export const BRAND_ICON_512_URL = `/icons/icon-512x512.png?${V}`;
export const BRAND_ICON_512_ABSOLUTE_URL = `${BRAND_CANONICAL_ORIGIN}${BRAND_ICON_512_URL}`;

/**
 * Explicit intrinsic sizes on every mark so `next/image` (or a plain `<img>`)
 * can reserve the correct layout slot and the brand never causes a CLS hit on
 * first paint. The bytes on disk match these figures; if the master artwork is
 * regenerated at a different size, update this map and bump the cache-buster.
 */
export const BRAND_MARK_SIZES = {
  /** The 128px emblem served at `/brand/siwify-emblem-128.png`. */
  mark: { width: 128, height: 128 },
  /** Full-resolution emblem for og + high-DPI surfaces. */
  emblem: { width: 512, height: 512 },
  /** Horizontal lockup (emblem + wordmark). */
  lockup: { width: 1200, height: 360 },
  /** Social card. */
  og: { width: 1200, height: 630 },
} as const;

/**
 * Professional bilingual descriptors. These strings are what a crawler, an
 * accessibility reader, and a Google Image Search snippet see when the mark
 * travels without the page's own context.
 *
 * The English form leads with the marketplace identity, then the country,
 * then the five verticals the user hand-picked so Google's entity panel has
 * the exact wording it wants to bind to the image. Arabic leads the same way,
 * in the correct register for the local market.
 */
export const BRAND_NAME_EN = 'SiWiFy';
export const BRAND_NAME_AR = 'سيويفايز';
export const BRAND_LEGAL_NAME = 'SiWiFy Marketplace';

export const BRAND_TAGLINE_EN =
  'Egypt\u2019s marketplace for properties, locations, tourism, accommodation and investment';
export const BRAND_TAGLINE_AR =
  '\u0633\u0648\u0642 \u0645\u0635\u0631 \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631';

export const BRAND_MARK_ALT_EN =
  'SiWiFy emblem \u2014 Egypt\u2019s marketplace for properties, locations, tourism, accommodation and investment';
export const BRAND_MARK_ALT_AR =
  '\u0634\u0639\u0627\u0631 \u0633\u064a\u0648\u064a\u0641\u0627\u064a \u2014 \u0633\u0648\u0642 \u0645\u0635\u0631 \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631';

export const BRAND_LOCKUP_ALT_EN =
  'SiWiFy lockup \u2014 emblem and wordmark for the Egyptian properties, tourism, accommodation, location and investment marketplace';
export const BRAND_LOCKUP_ALT_AR =
  '\u0634\u0639\u0627\u0631 \u0633\u064a\u0648\u064a\u0641\u0627\u064a \u0645\u0639 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062a\u062c\u0627\u0631\u064a \u2014 \u0633\u0648\u0642 \u0645\u0635\u0631 \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631';

/**
 * The five marketplace segments Google should associate with the brand.
 * Reused verbatim in the JSON-LD `knowsAbout` array and in the OG description,
 * so the strings shown in search results and the strings inside the structured
 * data are exactly the same. Change a segment here and the whole surface
 * follows.
 */
export const BRAND_SEGMENTS: ReadonlyArray<{ en: string; ar: string; key: string }> = Object.freeze([
  { key: 'properties',     en: 'properties',     ar: '\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a' },
  { key: 'location',       en: 'locations',      ar: '\u0627\u0644\u0645\u0648\u0627\u0642\u0639' },
  { key: 'tourism',        en: 'tourism',        ar: '\u0627\u0644\u0633\u064a\u0627\u062d\u0629' },
  { key: 'accommodation',  en: 'accommodation',  ar: '\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a' },
  { key: 'investment',     en: 'investment',     ar: '\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631' },
]);

/** A one-line English list joined for the meta description. */
export const BRAND_SEGMENTS_EN_LIST = BRAND_SEGMENTS.map(s => s.en).join(', ');
/** The Arabic equivalent, kept in the same order. */
export const BRAND_SEGMENTS_AR_LIST = BRAND_SEGMENTS.map(s => s.ar).join(' \u060C ');

/**
 * The canonical page title. Delivered as a template so route-level pages can
 * wrap their own heading inside it without retyping the brand clause.
 *
 *   template: '%s | SiWiFy \u2014 Egypt\u2019s … Marketplace'
 */
export const BRAND_TITLE_SUFFIX = 'SiWiFy \u2014 Egypt\u2019s Properties, Tourism, Accommodation, Location & Investment Marketplace';
export const BRAND_TITLE_DEFAULT = BRAND_TITLE_SUFFIX;
export const BRAND_TITLE_AR_SUFFIX = '\u0633\u064a\u0648\u064a\u0641\u0627\u064a \u2014 \u0633\u0648\u0642 \u0645\u0635\u0631 \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631';

/**
 * Full-bleed meta description. Both scripts carry the same facts (five
 * segments + direct-owner booking + verified sellers) because a mixed-locale
 * crawl should never see the English claim without the Arabic version to
 * back it up.
 */
export const BRAND_DESCRIPTION_EN =
  'SiWiFy is Egypt\u2019s integrated marketplace for properties, locations, tourism, accommodation and investment. Book direct with verified developers, hotels, camps and hosts across Cairo, the North Coast, Siwa, Sharm, Hurghada and every Egyptian governorate \u2014 no middleman.';
export const BRAND_DESCRIPTION_AR =
  '\u0633\u064a\u0648\u064a\u0641\u0627\u064a \u0647\u0648 \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0645\u0635\u0631\u064a \u0627\u0644\u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631. \u0627\u062d\u062c\u0632 \u0645\u0628\u0627\u0634\u0631\u0629\u064b\u0645\u0639 \u0627\u0644\u0645\u0637\u0648\u0631\u064a\u0646 \u0648\u0627\u0644\u0641\u0646\u0627\u062f\u0642 \u0648\u0627\u0644\u0645\u0639\u0633\u0643\u0631\u0627\u062a \u0648\u0627\u0644\u0645\u0636\u064a\u0641\u064a\u0646 \u0627\u0644\u0645\u0648\u062b\u0642\u064a\u0646 \u0641\u064a \u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0648\u0627\u0644\u0633\u0627\u062d\u0644 \u0627\u0644\u0634\u0645\u0627\u0644\u064a \u0648\u0633\u064a\u0648\u0629 \u0648\u0634\u0631\u0645 \u0627\u0644\u0634\u064a\u062e \u0648\u0627\u0644\u063a\u0631\u0642\u0629 \u0648\u0643\u0644 \u0645\u062d\u0627\u0641\u0638\u0627\u062a \u0645\u0635\u0631 \u2014 \u0628\u062f\u0648\u0646 \u0648\u0633\u064a\u0637.';
