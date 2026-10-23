/**
 * Hero Carousel Slide Quota — shared rule helpers.
 *
 * Single source of truth for WHY a slide addition is rejected and HOW to
 * activate it, derived from the governance tier policy system
 * (`subscription_tiers.features` → `maxSlides`, see lib/governance/quota-enforcer.ts).
 *
 * Used by the admin Carousel Manager UI (client) AND the save APIs (server),
 * so the button, the notifier, and the database always speak the same rule.
 */

export interface SlideQuotaInfo {
  /** Effective cap the manager enforces = tier policy maxSlides (defaults to RENDER_CAP). */
  effectiveMax: number;
  /** Raw tier policy value from subscription_tiers.features.maxSlides (null when unset). */
  policyMax: number | null;
  tierId: string;
  tierName: string;
}

/**
 * The live hero (AutomatedMinisiteHero) truncates to `tierFeatures.maxSlides || 10`.
 * When a tier has no explicit maxSlides we hold the same default the renderer uses.
 */
export const SLIDE_RENDER_CAP = 10;

export function resolveSlideQuota(
  tierId: string,
  tierName: string,
  features: Record<string, any> | null | undefined,
): SlideQuotaInfo {
  const raw = Number(features?.maxSlides);
  const policyMax = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
  const effectiveMax = policyMax ?? SLIDE_RENDER_CAP;
  return { effectiveMax, policyMax, tierId, tierName };
}

/** Extract the business id from a `biz_<id>_...` carousel siteId (null for non-minisite targets). */
export function parseBizSiteId(siteId: string): string | null {
  const m = /^biz_(.+?)_(?:hero|tab_.+_hero)$/.exec(siteId || '');
  return m ? m[1] : null;
}

export interface QuotaNotifierCopy {
  headline: string;
  rule: string;
  count: string;
  activateTitle: string;
  activateAdmin: string;
  activateVendor: string;
  note: string;
}

/**
 * Build the "why it was not accepted + how to activate it" message,
 * bilingual (English + Arabic) so it works in both admin themes.
 */
export function buildQuotaCopy(
  info: SlideQuotaInfo,
  currentCount: number,
  proposedTotal: number,
  actionLabel: string,
): QuotaNotifierCopy {
  return {
    headline: `⛔ Slide ${actionLabel} not accepted — tier quota reached / لم يتم قبول الشريحة — وصلت حصة الباقة حدّها`,
    rule: `RULE · The "${info.tierName}" plan allows a maximum of ${info.effectiveMax} hero slide(s) on this target. ` +
      `This rule comes from the tier policy (subscription_tiers → maxSlides) enforced by governance. ` +
      `| قاعدة: باقة «${info.tierName}» تسمح بـ ${info.effectiveMax} شريحة كحدّ أقصى في الهيرو.`,
    count: `Current slides: ${currentCount} · attempted total: ${proposedTotal} | الشرائح الحالية: ${currentCount} · المطلوب: ${proposedTotal}`,
    activateTitle: `TO ACTIVATE IT | لتفعيل الزر:`,
    activateAdmin: `1) As admin: open Tier Manager (jana → Tiers) and raise maxSlides for "${info.tierName}" (${info.policyMax ?? 'not set'} → higher value), ` +
      `or change this business to a higher subscription tier from the Businesses screen, then click Add Slide again. ` +
      `| ١) كمسؤول: افتح «إدارة الباقات» وارفع maxSlides أو غيّر باقة النشاط، ثم أعد المحاولة.`,
    activateVendor: `2) As vendor: upgrade the business subscription plan to unlock more slides ` +
      `(the button activates automatically right after the upgrade). ` +
      `| ٢) كتاجر: رقِّ باقة الاشتراك ليُفتح الزر تلقائياً.`,
    note: `Note: the live hero renders up to ${SLIDE_RENDER_CAP} slides even on top tiers — above that, slides exist but are not displayed. ` +
      `| ملاحظة: الصفحة تعرض حتى ${SLIDE_RENDER_CAP} شرائح كحد أقصى.`,
  };
}
