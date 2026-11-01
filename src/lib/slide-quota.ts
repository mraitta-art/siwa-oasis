/**
 * Hero Carousel Slide Quota — shared rule helpers.
 *
 * Single source of truth for WHY a slide addition is rejected and HOW to
 * activate it, derived from the governance tier policy system
 * (`subscription_tiers.features` → `maxSlides`, see lib/governance/quota-enforcer.ts).
 *
 * An admin may raise that cap for ONE business for a LIMITED time. That grant
 * lives in the existing per-business exception column `businesses.admin_overrides`
 * under the `slides` key (same screen/API as section overrides: /admin/section-overrides,
 * /api/jana/admin-overrides) and is resolved at read time against `expires_at`,
 * so an expired grant simply stops counting — nothing has to run on a schedule.
 *
 * Used by the admin Carousel Manager UI (client) AND the save APIs (server)
 * AND the live minisite hero, so the button, the notifier, the renderer, and
 * the database always speak the same rule.
 */

/** A time-boxed admin grant. Always already validated: expired grants never reach this shape. */
export interface SlideGrant {
  /** Hero slides the business may hold per target while the grant is active. */
  maxAllowed: number;
  /** ISO instant after which the grant stops counting. */
  expiresAt: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export interface SlideQuotaInfo {
  /** Effective cap the manager enforces = tier policy, raised by an active exception. */
  effectiveMax: number;
  /** Raw tier policy value from subscription_tiers.features.maxSlides (null when unset). */
  policyMax: number | null;
  tierId: string;
  tierName: string;
  /** Tier cap on its own, before any exception (never null — falls back to SLIDE_RENDER_CAP). */
  tierMax: number;
  /** True while an unexpired admin grant is raising the cap. */
  exceptionActive: boolean;
  exceptionExpiresAt: string | null;
  exceptionBy: string | null;
}

/**
 * The live hero (AutomatedMinisiteHero) truncates to `tierFeatures.maxSlides || 10`.
 * When a tier has no explicit maxSlides we hold the same default the renderer uses.
 */
export const SLIDE_RENDER_CAP = 10;

/**
 * A grant is a hand-typed number, so it is clamped. Above this the admin should
 * raise the tier policy instead, which is the reviewed, permanent route.
 */
export const SLIDE_GRANT_CEILING = 50;

/**
 * Read the slide grant out of `businesses.admin_overrides`.
 * Accepts the raw column (parsed JSON or text, mysql2 does both) or the
 * overrides object itself, and returns null for anything missing, malformed,
 * or already expired — an expired grant must fail closed back to the tier rule.
 */
export function parseSlideGrant(raw: unknown, now: number = Date.now()): SlideGrant | null {
  let overrides: any = raw;
  if (typeof raw === 'string') {
    try { overrides = JSON.parse(raw); } catch { return null; }
  }
  if (!overrides || typeof overrides !== 'object') return null;

  const slides = (overrides as any).slides;
  if (!slides || typeof slides !== 'object') return null;

  const maxAllowed = Number(slides.max_allowed);
  const expiresAt = typeof slides.expires_at === 'string' ? slides.expires_at : '';
  if (!Number.isFinite(maxAllowed) || maxAllowed <= 0 || !expiresAt) return null;

  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= now) return null;

  return {
    maxAllowed: Math.min(Math.floor(maxAllowed), SLIDE_GRANT_CEILING),
    expiresAt: new Date(expiry).toISOString(),
    reason: typeof slides.reason === 'string' ? slides.reason : '',
    grantedBy: typeof slides.granted_by === 'string' ? slides.granted_by : '',
    grantedAt: typeof slides.granted_at === 'string' ? slides.granted_at : '',
  };
}

export function resolveSlideQuota(
  tierId: string,
  tierName: string,
  features: Record<string, any> | null | undefined,
  grant?: SlideGrant | null,
): SlideQuotaInfo {
  const raw = Number(features?.maxSlides);
  const policyMax = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
  const tierMax = policyMax ?? SLIDE_RENDER_CAP;
  // An exception only ever raises the cap, never lowers it, and only while it
  // is unexpired (parseSlideGrant already drops the rest).
  const effectiveMax = grant ? Math.max(tierMax, grant.maxAllowed) : tierMax;
  return {
    effectiveMax,
    policyMax,
    tierId,
    tierName,
    tierMax,
    exceptionActive: !!grant,
    exceptionExpiresAt: grant ? grant.expiresAt : null,
    exceptionBy: grant ? grant.grantedBy : null,
  };
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
  /** Present only while a time-boxed admin exception is raising the cap. */
  exception?: string;
  activateTitle: string;
  activateAdmin: string;
  activateVendor: string;
  note: string;
}

/** Deterministic, locale-free expiry stamp — the same string on server and browser. */
export function formatGrantExpiry(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/**
 * Build the "why it was not accepted + how to activate it" message,
 * bilingual (English + Arabic) so it works in both admin themes.
 * Accepts a partially built info (older call sites reconstruct the quota from
 * state); `tierMax` falls back to `effectiveMax` so the wording stays true.
 */
export function buildQuotaCopy(
  input: Pick<SlideQuotaInfo, 'effectiveMax' | 'policyMax' | 'tierId' | 'tierName'> & Partial<SlideQuotaInfo>,
  currentCount: number,
  proposedTotal: number,
  actionLabel: string,
): QuotaNotifierCopy {
  const info: SlideQuotaInfo = {
    effectiveMax: input.effectiveMax,
    policyMax: input.policyMax,
    tierId: input.tierId,
    tierName: input.tierName,
    tierMax: input.tierMax ?? input.effectiveMax,
    exceptionActive: input.exceptionActive ?? false,
    exceptionExpiresAt: input.exceptionExpiresAt ?? null,
    exceptionBy: input.exceptionBy ?? null,
  };
  const copy: QuotaNotifierCopy = {
    headline: `⛔ Slide ${actionLabel} not accepted — tier quota reached / لم يتم قبول الشريحة — وصلت حصة الباقة حدّها`,
    rule: `RULE · The "${info.tierName}" plan allows a maximum of ${info.tierMax} hero slide(s) on this target. ` +
      `This rule comes from the tier policy (subscription_tiers → maxSlides) enforced by governance. ` +
      `| قاعدة: باقة «${info.tierName}» تسمح بـ ${info.tierMax} شريحة كحدّ أقصى في الهيرو.`,
    count: `Current slides: ${currentCount} · attempted total: ${proposedTotal} | الشرائح الحالية: ${currentCount} · المطلوب: ${proposedTotal}`,
    activateTitle: `TO ACTIVATE IT | لتفعيل الزر:`,
    activateAdmin: `1) As admin: grant a TEMPORARY EXCEPTION right here (slides + 7/14/30 days or a custom date + a reason) — it expires on its own; ` +
      `or make it permanent by opening Tier Manager (jana → Tiers) and raising maxSlides for "${info.tierName}" (${info.policyMax ?? 'not set'} → higher value), ` +
      `or move this business to a higher tier. Then click Add Slide again. ` +
      `| ١) كمسؤول: منح استثناء مؤقت بعدد الشرائح ومدة (٧/١٤/٣٠ يومًا أو تاريخ مخصص) مع سبب، وينتهي تلقائيًا؛ ` +
      `أو اجعله دائمًا برفع maxSlides من «إدارة الباقات» أو ترقية باقة النشاط، ثم أعد المحاولة.`,
    activateVendor: `2) As vendor: upgrade the business subscription plan to unlock more slides ` +
      `(the button activates automatically right after the upgrade). ` +
      `| ٢) كتاجر: رقِّ باقة الاشتراك ليُفتح الزر تلقائياً.`,
    note: `Note: the live hero renders up to ${info.effectiveMax} slides — the display ceiling follows the same rule, ` +
      `so what you save is what visitors see. | ملاحظة: الصفحة تعرض الشرائح وفق الحد نفسه (${info.effectiveMax}).`,
  };

  if (info.exceptionActive) {
    copy.exception =
      `⏳ EXCEPTION ACTIVE · cap raised to ${info.effectiveMax} until ` +
      `${formatGrantExpiry(info.exceptionExpiresAt)}${info.exceptionBy ? ` (granted by ${info.exceptionBy})` : ''}. ` +
      `When that moment passes the ${info.tierMax}-slide tier rule returns automatically and slides above it stop rendering. ` +
      `| استثناء سارٍ: الحدّ ${info.effectiveMax} حتى ${formatGrantExpiry(info.exceptionExpiresAt)}، ثم يعود قاعدة الباقة (${info.tierMax}) تلقائيًا.`;
  }

  return copy;
}
