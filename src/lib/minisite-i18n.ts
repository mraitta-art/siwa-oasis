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
  get_in_touch: { ar: 'تواصل معنا', en: 'Get in touch' },
  packages_eyebrow: { ar: 'باقات وبرامج وتجارب سياحية', en: 'Packages & itineraries' },
  special_package: { ar: 'باقة مميزة', en: 'Special package' },
  inquire_price: { ar: 'تواصل للسعر', en: 'Inquire' },
  book_deal: { ar: 'احجز العرض', en: 'Book deal' },
  discount: { ar: 'خصم', en: 'off' },
  visitor: { ar: 'زائر', en: 'Visitor' },
  gallery_photo: { ar: 'صورة من المكان', en: 'Gallery photo' },

  // ── The hero ───────────────────────────────────────────────────────────────
  // The hero prints its English captions in a display face set in caps, so these
  // English values are stored the way they are printed; Arabic keeps its natural
  // case because upper-casing has no meaning in that script. A call site that
  // interpolates a section name passes it already cased, which is why the token
  // is written the same way in both columns.
  hero_read_more: { ar: 'اقرأ المزيد', en: 'READ MORE' },
  hero_discover_experience: { ar: 'اكتشف تجربة {section}', en: 'DISCOVER THE {section} EXPERIENCE' },
  hero_explore_section: { ar: 'استكشف {section}', en: 'EXPLORE {section}' },
  hero_discover_more: { ar: 'اكتشف المزيد', en: 'DISCOVER MORE' },
  hero_read_full_story: { ar: 'اقرأ الحكاية كاملة', en: 'READ FULL STORY' },
  hero_marketplace: { ar: 'سوق SIWIFY', en: 'SIWIFY MARKETPLACE' },
  hero_verified_book_direct: { ar: 'موثّق · احجز مباشرة', en: 'VERIFIED · BOOK DIRECT' },
  hero_authentic_experience: { ar: 'تجربة أصيلة', en: 'AUTHENTIC EXPERIENCE' },
  hero_scroll_explore: { ar: 'انزل لاستكشاف {name}', en: 'SCROLL TO EXPLORE {name}' },
  hero_scroll_story: { ar: 'انزل لتصفّح الحكاية', en: 'SCROLL TO EXPLORE STORY' },
  hero_powered_by: { ar: 'على منصة {name}', en: 'POWERED BY {name}' },
  hero_story_dna: { ar: 'تجربة {section} الأصيلة.', en: 'Experience our unique {section} DNA.' },

  // ── Community contributions ────────────────────────────────────────────────
  contrib_count: { ar: '{n} تقييم ونصيحة موثّقة من الزوار', en: '{n} verified reviews & traveler tips' },
  contrib_count_one: { ar: '{n} تقييم ونصيحة موثّقة من الزوار', en: '{n} verified review & traveler tips' },
  contrib_community_line: { ar: 'تجارب موثّقة على SiWiFy.com', en: 'Community verified experiences on SiWiFy.com' },
  contrib_write: { ar: 'اكتب تقييمًا أو نصيحة', en: 'Write a Review / Tip' },
  contrib_cancel: { ar: 'إلغاء الإضافة', en: 'Cancel Contribution' },
  contrib_share_title: { ar: 'شارك تجربتك مع {name}', en: 'Share Your Experience with {name}' },
  contrib_name: { ar: 'الاسم *', en: 'Your Name *' },
  contrib_name_placeholder: { ar: 'مثال: سارة حسن', en: 'e.g. Sarah Jenkins' },
  contrib_origin: { ar: 'نوع المسافر / المدينة', en: 'Traveler Type / Origin' },
  contrib_origin_placeholder: { ar: 'مثال: مسافر منفرد / القاهرة / لندن', en: 'e.g. Solo Explorer / Cairo / London' },
  contrib_rating: { ar: 'التقييم (من ١ إلى ٥ نجوم)', en: 'Rating (1 to 5 Stars)' },
  contrib_rating_5: { ar: '⭐⭐⭐⭐⭐ (٥ - استثنائي)', en: '⭐⭐⭐⭐⭐ (5 - Exceptional)' },
  contrib_rating_4: { ar: '⭐⭐⭐⭐ (٤ - جيد جدًا)', en: '⭐⭐⭐⭐ (4 - Very Good)' },
  contrib_rating_3: { ar: '⭐⭐⭐ (٣ - متوسط)', en: '⭐⭐⭐ (3 - Average)' },
  contrib_rating_2: { ar: '⭐⭐ (٢ - ضعيف)', en: '⭐⭐ (2 - Poor)' },
  contrib_rating_1: { ar: '⭐ (١ - سيئ جدًا)', en: '⭐ (1 - Terrible)' },
  contrib_review_text: { ar: 'تقييمك أو نصيحتك *', en: 'Your Review or Oasis Tip *' },
  contrib_review_placeholder: {
    ar: 'أخبر الزوّار عن إقامتك أو رحلتك أو السائق أو أجمل مكان شاهدته...',
    en: 'Tell other travelers about your stay, safari, driver, or favorite secret spot...',
  },
  contrib_submitting: { ar: 'جارٍ الإرسال...', en: 'Submitting...' },
  contrib_post: { ar: 'نشر المساهمة الموثّقة 🚀', en: 'Post Verified Contribution 🚀' },
  contrib_loading: { ar: 'جارٍ تحميل مشاركات المجتمع...', en: 'Loading community contributions...' },
  contrib_empty_title: { ar: 'كن أول من يشارك تقييمًا!', en: 'Be the First to Contribute a Review!' },
  contrib_empty_body: {
    ar: 'هل أقمت أو تناولت أو تجوّلت مع {name}؟ شارك ملاحظاتك مع مجتمع الواحة.',
    en: 'Have you stayed, dined, or toured with {name}? Share your feedback with the oasis community.',
  },
  contrib_verified_guest: { ar: 'ضيف موثّق', en: 'Verified Guest' },
  contrib_recent: { ar: 'الأحدث', en: 'Recent' },
  contrib_failed: { ar: 'تعذّر إرسال المساهمة.', en: 'Failed to submit contribution.' },
  contrib_network_error: { ar: 'خطأ في الاتصال بالخادم.', en: 'Network error submitting review.' },
} satisfies Record<string, Bilingual>;

/** One chrome string, in the language the minisite is showing. */
export function label(key: keyof typeof MINISITE_I18N, ar: boolean): string {
  const pair = MINISITE_I18N[key];
  return ar ? pair.ar : pair.en;
}

/**
 * A chrome string with the blanks filled in. Split-and-join rather than a
 * regular expression, because an interpolated value may itself contain a `$`
 * sequence that `String.replace` would silently interpret.
 */
export function labelWith(
  key: keyof typeof MINISITE_I18N,
  ar: boolean,
  tokens: Record<string, string | number>
): string {
  return Object.entries(tokens).reduce(
    (acc, [name, value]) => acc.split(`{${name}}`).join(String(value)),
    label(key, ar)
  );
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
 * The placeholder content a component shows when a business has none of its own.
 * These were English sentences living inside the renderer, which put an English
 * FAQ on an Arabic page; they are bilingual now and read through `label()`-style
 * resolution at the call site.
 */
export const MINISITE_DEFAULT_FAQS: Array<{ q: Bilingual; a: Bilingual }> = [
  {
    q: { ar: 'ما أفضل طريقة للوصول إلى المكان؟', en: 'What is the best way to get here?' },
    a: {
      ar: 'يصل الزوار بسيارة خاصة أو بالحافلة العامة، ويمكن ترتيب لقاء من نقطة الوصول.',
      en: 'Guests arrive by private car or public bus, and a pickup can be arranged on request.',
    },
  },
  {
    q: { ar: 'هل الحجز المسبق مطلوب؟', en: 'Are reservations required in advance?' },
    a: {
      ar: 'يُنصح بالحجز المسبق، خصوصًا في موسم الشتاء حين تمتلئ الأماكن بسرعة.',
      en: 'Advance booking is strongly recommended during the high season.',
    },
  },
];

export const MINISITE_DEFAULT_TESTIMONIALS: Array<{ name: Bilingual; text: Bilingual }> = [
  {
    name: { ar: 'سارة م.', en: 'Sarah M.' },
    text: {
      ar: 'تجربة استثنائية في هدوء المكان وجماله الذي لا يمحوه الزمن.',
      en: 'An exceptional experience immersed in the silence and timeless beauty of the place.',
    },
  },
  {
    name: { ar: 'طارق إ.', en: 'Tarek E.' },
    text: {
      ar: 'عمارة أصيلة وضيافة دافئة تليق بتراث المكان وأهله.',
      en: 'Authentic architecture and warm hospitality that truly honors the heritage of the place.',
    },
  },
];

/**
 * The same written form for both scripts of a placeholder row: the Arabic page
 * gets the Arabic wording, the English page gets the English one.
 */
export function bilingualPair(ar: boolean, pair: Bilingual): string {
  return ar ? pair.ar : pair.en;
}

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
