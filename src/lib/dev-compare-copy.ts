/**
 * The words under the comparison table.
 *
 * Copy lives here rather than in the components for one reason: a cell that has
 * no figure still has to say *why*, and "غير موثّق" is a claim about our own data
 * that must read identically in the table, the tooltip and the disclaimer band.
 *
 * Arabic is the bare value and English the alternate, matching the minisite
 * layer: `ar` is what a visitor sees by default, `en` is what `/en/…` and the
 * toggle fall back to. Nothing here guesses at a project's wording — every pair
 * describes *our* page, never the thing being sold.
 */

import type { Bilingual } from '@/lib/minisite-i18n';

export const DEV_COMPARE_COPY = {
  // The honesty vocabulary. `undocumented` is the one word a null cell becomes.
  undocumented: { ar: 'غير موثّق', en: 'Not documented' },
  completeness: { ar: 'اكتمال البيانات', en: 'Data completeness' },
  relativeNote: {
    ar: 'التقييم نسبي بين المشاريع المختارة في هذه المقارنة فقط',
    en: 'The score is relative to the projects selected in this comparison only',
  },
  noDataForSelection: { ar: 'لا توجد بيانات مطابقة لاختيارك', en: 'No data matches your selection' },
  priceDisclaimer: {
    ar: 'الأسعار مؤشّرة بسعر المتر وليست عرضاً للبيع، وتُعرض دائمًا مع تاريخ الالتقاط ومصدره.',
    en: 'Prices are indicative price-per-square-metre figures, not an offer to sell, and are always shown with the date and source they were captured from.',
  },
  totalExcludesUndocumented: {
    ar: 'لا يشمل بنودًا غير موثّقة — الرقم هو الحد الأدنى وليس الفاتورة',
    en: 'Excludes items we have no document for — this is a floor, not the bill',
  },

  // Money lines.
  totalAtContract: { ar: 'الإجمالي عند التعاقد', en: 'Total at contract' },
  deliveryPayment: { ar: 'دفعة الاستلام', en: 'Delivery payment' },
  earlyDiscount: { ar: 'خصم السداد المبكر', en: 'Early-payment discount' },
  lastUpdated: { ar: 'آخر تحديث', en: 'Last updated' },

  // Source badges, which name who said the number.
  badgeDeveloper: { ar: 'قائمة أسعار المطوّر', en: 'Developer price list' },
  badgeMarket: { ar: 'منصة عقارية', en: 'Marketplace listing' },
  badgeNews: { ar: 'خبر منشور', en: 'News report' },
  badgeVerified: { ar: 'تم التحقق منه', en: 'Verified' },

  // Location and contract surfaces.
  approxLocation: { ar: 'الموقع تقريبي', en: 'Location is approximate' },
  openInMaps: { ar: 'افتح في الخرائط', en: 'Open in Maps' },
  officialSite: { ar: 'الموقع الرسمي للمطوّر', en: "Developer's official site" },
  ourPage: { ar: 'صفحتنا عن المشروع', en: 'Our project page' },
  termsLink: { ar: 'شروط التعاقد', en: 'Contract terms' },
  askBeforeSigning: { ar: 'اسأل المطور قبل التعاقد', en: 'Ask the developer before signing' },
  requestCorrection: { ar: 'اطلب تصحيحًا', en: 'Request a correction' },

  // Table controls.
  finishingMixed: { ar: 'التشطيبات غير موحّدة بين الوحدات', en: 'Finishing is mixed across units' },
  bestInRow: { ar: 'الأفضل في هذه المقارنة', en: 'Best in this comparison' },
  diffOnly: { ar: 'الفروقات فقط', en: 'Differences only' },
  addToCompare: { ar: 'أضف إلى المقارنة', en: 'Add to compare' },
} satisfies Record<string, Bilingual>;

export type DevCopyKey = keyof typeof DEV_COMPARE_COPY;

/** One chrome string, in the language the comparison page is showing. */
export function devCopy(key: DevCopyKey, ar: boolean): string {
  const pair = DEV_COMPARE_COPY[key];
  return ar ? pair.ar : pair.en;
}

/**
 * A source badge. `source_type` is free text in the database because a portal
 * renames itself, so an unknown type is printed as typed rather than dropped.
 */
const SOURCE_BADGES: Record<string, DevCopyKey> = {
  DEVELOPER_PRICE_LIST: 'badgeDeveloper',
  PORTAL_LISTING: 'badgeMarket',
  NEWS: 'badgeNews',
};

export function sourceBadgeLabel(sourceType: string, ar: boolean): string {
  const key = SOURCE_BADGES[String(sourceType).trim()];
  return key ? devCopy(key, ar) : String(sourceType).trim();
}

/**
 * Unit types, the same way `unit-terms.ts` treats finishing: a suggestion list
 * for the picker, and anything a project actually typed wins on display.
 */
export const UNIT_TYPE_OPTIONS = [
  { id: 'apartment', en: 'Apartment', ar: 'شقة' },
  { id: 'studio', en: 'Studio', ar: 'استوديو' },
  { id: 'duplex', en: 'Duplex', ar: 'دوبلكس' },
  { id: 'penthouse', en: 'Penthouse', ar: 'بنتهاوس' },
  { id: 'townhouse', en: 'Townhouse', ar: 'تاون هاوس' },
  { id: 'twin_house', en: 'Twin house', ar: 'توين هاوس' },
  { id: 'villa', en: 'Villa', ar: 'فيلا' },
  { id: 'standalone_villa', en: 'Standalone villa', ar: 'فيلا مستقلة' },
  { id: 'country_villa', en: 'Country villa', ar: 'فيلا كونتري' },
  { id: 'chalet', en: 'Chalet', ar: 'شاليه' },
  { id: 'office', en: 'Office', ar: 'مكتب' },
  { id: 'retail', en: 'Retail', ar: 'محل تجاري' },
] as const;

/**
 * A unit type in the language showing, falling back to the stored text.
 *
 * The fallback is deliberate: `unit_offers.unit_type` is VARCHAR because
 * projects name their own grades, and a comparison page that hid an offer it
 * could not pronounce would quietly remove a project from the table.
 */
export function unitTypeLabel(value: string | null | undefined, ar: boolean): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const known = UNIT_TYPE_OPTIONS.find((option) => option.id === text);
  return known ? known[ar ? 'ar' : 'en'] : text;
}

/**
 * Finishing labels are re-exported, not restated.
 *
 * `unit-terms.ts` already owns that vocabulary and the admin forms already write
 * it; a second copy here would be a second answer to the same question, and the
 * two would drift the first time a grade was renamed.
 */
export { UNIT_FINISHING_OPTIONS, finishingLabel } from '@/lib/unit-terms';
