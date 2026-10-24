/**
 * Single source of truth for SiWiFy platform artwork.
 *
 * Every file referenced here is produced from the master lockup by
 * `node scripts/generate-brand-assets.js`, so replacing the master artwork
 * regenerates the tab icon, PWA icons, OG card and in-app marks in one pass.
 */

/** Cache-buster appended to every asset URL — bump when the master artwork changes. */
const V = 'v=siwify-gold-2026';

export const BRAND_ACCENT = '#D4AF37';

/** Emblem only, transparent background — header, minisite anchor, loaders. */
export const BRAND_MARK_URL = `/brand/siwify-emblem-128.png?${V}`;

/** Emblem + "SiWiFy.com" wordmark, transparent background — footers, emails. */
export const BRAND_LOCKUP_URL = `/brand/siwify-lockup.png?${V}`;

/** 1200x630 social / Rich Results card. */
export const BRAND_OG_IMAGE_URL = `/brand/og-image.png?${V}`;

/** Solid 512px app icon (PWA, msapplication tile). */
export const BRAND_ICON_512_URL = `/icons/icon-512x512.png?${V}`;
