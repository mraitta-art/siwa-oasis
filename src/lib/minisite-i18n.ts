/**
 * minisite-i18n.ts — one bilingual dictionary for the chrome every minisite wears.
 *
 * Arabic is the language of the market, so `ar` is the primary column and the
 * defaults below are written Arabic-first. English is the complete alternate a
 * visitor reaches with the header toggle.
 *
 * Two rules the helpers enforce, because breaking either produces the bug a
 * vendor notices first:
 * - `pick()` prefers the Arabic field only when it actually holds text, and
 *   falls back to the English one. An admin can save an Arabic input empty, and
 *   an empty heading is worse than a translated-looking-English one. This is the
 *   same `name_ar || name` convention the rest of the platform uses.
 * - Defaults come from here, never inline in a renderer. A literal sitting in a
 *   `case 'vendor_gallery'` branch is an English heading on an Arabic page.
 *
 * Client-safe by construction: no `next/headers`, no `@/lib/db`, so both the
 * server route and the client islands can import it.
 */

import type { MinisiteComponentType } from '@/lib/minisite-governance-client';

export type MinisiteLang = 'ar' | 'en';

/** The key the client toggle persists to. One key, shared by every surface. */
export const MINISITE_LANG_KEY = 'minisite_lang';

export interface Bilingual {
  ar: string;
  en: string;
}

/** Arabic when Arabic is asked for and the field holds text, else English. */
export function pick(
  ar: boolean,
  arabicValue: string | null | undefined,
  englishValue: string | null | undefined
): string {
  const en = String(englishValue ?? '').trim();
  const arValue = String(arabicValue ?? '').trim();
  if (ar) return arValue || en;
  return en || arValue;
}

/** A bilingual pair resolved the same way: Arabic first, English as the floor. */
export function text(ar: boolean, pair: Bilingual): string {
  return pair.ar || pair.en;
}

/**
 * Chrome strings for a minisite: the tab bar, the header actions, the language
 * switch, the contact cluster and the footer. Vertical-specific CTA wording
 * lives in MINISITE_VERTICAL_THEMES and is looked up before this map.
 */
export const MINISITE_I18N = {
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  sections: { ar: 'الأقسام', en: 'Sections' },
  home: { ar: 'الرئيسية', en: 'Home' },
  trusted: { ar: 'موثّق', en: 'Trusted' },
  verified: { ar: 'تم التحقق', en: 'Verified' },
  locked: { ar: 'متاح ضمن العضوية', en: 'Available with membership' },
  open_menu: { ar: 'فتح الأقسام', en: 'Open sections' },
  close_menu: { ar: 'إغلاق', en: 'Close' },
  share: { ar: 'مشاركة', en: 'Share' },
  share_site: { ar: 'مشاركة الموقع', en: 'Share site' },
  call_direct: { ar: 'اتصال مباشر', en: 'Call direct' },
  link_copied_clipboard: { ar: 'تم نسخ الرابط', en: 'Link copied to clipboard!' },
  copy_link: { ar: 'نسخ الرابط', en: 'Copy link' },
  link_copied: { ar: 'تم نسخ الرابط', en: 'Link copied' },
  call: { ar: 'اتصل', en: 'Call' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  contact_host: { ar: 'تواصل مع صاحب النشاط', en: 'Contact the host' },
  direct_whatsapp: { ar: 'حجز مباشر على واتساب', en: 'Direct WhatsApp' },
  view_all: { ar: 'شاهد الكل', en: 'View all' },
  read_more: { ar: 'اقرأ المزيد', en: 'Read more' },
  coming_soon: { ar: 'قريبًا', en: 'Coming soon' },
  gallery: { ar: 'الصور', en: 'Gallery' },
  book_now: { ar: 'احجز الآن', en: 'Book now' },
  en: { ar: 'English', en: 'English' },
  ar: { ar: 'عربي', en: 'عربي' },
  powered_by: { ar: 'على منصة', en: 'listed on' },
  platform_footer_tagline: { ar: 'سوق العقارات والسياحة في مصر', en: 'Egypt\'s properties & tourism marketplace' },
  all_rights: { ar: 'كل الحقوق محفوظة', en: 'All rights reserved' },
  list_your_business: { ar: 'أضف نشاطك', en: 'List your business' },
  authentic_experience: { ar: 'تجربة أصيلة', en: 'Authentic experience' },
  scroll_explore: { ar: 'انزل لاستكشاف', en: 'Scroll to explore' },
  nearby: { ar: 'بالقرب منك', en: 'Nearby' },
  on_the_map: { ar: 'على الخريطة', en: 'On the map' },
  reviews: { ar: 'تقييمات الزوار', en: 'Visitor reviews' },
  scan_to_open: { ar: 'امسح الرمز لفتح الصفحة', en: 'Scan to open this page' },
} satisfies Record<string, Bilingual>;

/** One chrome string, in the language the minisite is showing. */
export function label(key: keyof typeof MINISITE_I18N, ar: boolean): string {
  const pair = MINISITE_I18N[key];
  return ar ? pair.ar : pair.en;
}

/**
 * Section defaults for the builder's component types. The admin can override
 * any of these through `props.title` / `props.title_ar`, and the renderer
 * consults the Arabic override before falling back to this table.
 */
export const MINISITE_COMPONENT_DEFAULTS: Partial<
  Record<MinisiteComponentType, { title: Bilingual; subtitle?: Bilingual; description?: Bilingual; content?: Bilingual; buttonText?: Bilingual }>
> = {
  vendor_hero: {
    title: { ar: 'أهلاً بكم في رحابنا', en: 'Welcome to Our Sanctuary' },
  },
  vendor_gallery: {
    title: { ar: 'مساحات ولقطات من المكان', en: 'Visual Spaces & Highlights' },
    subtitle: { ar: 'الأجواء الحقيقية كما تُنقل من الواحة.', en: 'Authentic atmosphere captured from the oasis.' },
  },
  vendor_services: {
    title: { ar: 'الخدمات والمرافق الأساسية', en: 'Core Amenities & Services' },
    subtitle: { ar: 'بعناية على ضيافة الصحراء التقليدية.', en: 'Crafted with traditional desert hospitality.' },
  },
  vendor_packages: {
    title: { ar: 'باقات وتجارب الرحلات', en: 'Curated Packages & Itineraries' },
    subtitle: {
      ar: 'باقات سياحية ورحلات مخصصة مع إمكانية الحجز المباشر',
      en: 'Turnkey travel packages, desert safaris, and curated journeys',
    },
  },
  vendor_blog: {
    title: { ar: 'حكايات وأخبار من الصحراء', en: 'Stories & Desert Dispatch' },
  },
  vendor_carousel: {
    title: { ar: 'جولة بالصور', en: 'Photo Journey' },
  },
  text_section: {
    title: { ar: 'حكايتنا وتراثنا', en: 'Our Desert Heritage' },
    content: {
      ar: 'حكاية كُتبت لزوّار هذا المكان — أصالة المكان وناسه وتفاصيله.',
      en: 'Custom narrative crafted for visitors of this establishment.',
    },
  },
  cta_section: {
    title: { ar: 'جاهز لتجربة المكان معنا؟', en: 'Ready to Experience It With Us?' },
    description: {
      ar: 'تواصل مباشرة لتنظيم إقامتك أو رحلتك أو حجزك.',
      en: 'Reach out directly to arrange your stay, journey, or reservation.',
    },
    buttonText: { ar: 'حجز مباشر على واتساب', en: 'Direct WhatsApp' },
  },
  faq: {
    title: { ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions' },
  },
  testimonials: {
    title: { ar: 'شهادات الزوار', en: 'Guest Endorsements' },
  },
  auctions_feed: {
    title: { ar: 'المزادات والمناقصات', en: 'Auctions & Tenders' },
  },
};

/**
 * The default wording for one field of one component type, in the language the
 * minisite is showing. Returns '' for a type with no declared default so the
 * caller can keep its own fallback.
 */
export function componentDefault(
  type: MinisiteComponentType,
  field: 'title' | 'subtitle' | 'description' | 'content' | 'buttonText',
  ar: boolean
): string {
  const pair = MINISITE_COMPONENT_DEFAULTS[type]?.[field];
  if (!pair) return '';
  return ar ? pair.ar : pair.en;
}
