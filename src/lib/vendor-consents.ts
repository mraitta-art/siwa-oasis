/**
 * Optional, revocable vendor permissions.
 *
 * The participation agreement is mandatory and covers hosting the minisite.
 * These consents are deliberately separate: each one grants a single capability
 * and is recorded with its own version + timestamp so it can be audited and
 * withdrawn without touching the acceptance record itself.
 */

export const VENDOR_CONSENT_VERSION = '2026-10-24-v2';

export type VendorConsentId = 'social_links' | 'google_place_data' | 'content_repost';

export interface VendorConsentDefinition {
  id: VendorConsentId;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
}

export const VENDOR_OPTIONAL_CONSENTS: VendorConsentDefinition[] = [
  {
    id: 'social_links',
    title: 'Social media links',
    titleAr: 'روابط التواصل الاجتماعي',
    body: 'Show my Instagram, Facebook and TikTok profiles on my SiWiFy page. SiWiFy stores the links I provide and does not post to these accounts.',
    bodyAr: 'عرض حساباتي على إنستغرام وفيسبوك وتيك توك في صفحتي على SiWiFy. تحتفظ SiWiFy بالروابط التي أقدّمها ولا تنشر على هذه الحسابات.',
  },
  {
    id: 'google_place_data',
    title: 'Google profile data',
    titleAr: 'بيانات ملف جوجل',
    body: 'Show the public rating, review count, opening hours and photos from my Google Maps business profile on my SiWiFy page. This is read-only public data; SiWiFy does not reply to reviews or post to Google on my behalf.',
    bodyAr: 'عرض التقييم العام وعدد المراجعات وساعات العمل والصور من ملف نشاطي على خرائط جوجل في صفحتي على SiWiFy. هذه بيانات عامة للقراءة فقط، ولا ترد SiWiFy على المراجعات أو تنشر على جوجل نيابة عني.',
  },
  {
    id: 'content_repost',
    title: 'Reshare my public content',
    titleAr: 'إعادة نشر محتواي العام',
    body: 'SiWiFy may reshare the photos, videos and page link that already appear on my public minisite from SiWiFy own social accounts, crediting my business by name. SiWiFy never accesses my private accounts, never posts on my behalf, and stops resharing when I withdraw this. Posts already published are removed on request.',
    bodyAr: 'يجوز لسيوايفاي إعادة نشر الصور والفيديوهات ورابط الصفحة التي تظهر بالفعل على موقعي المصغر العام من خلال حسابات سيوايفاي على منصات التواصل، مع ذكر اسم نشاطي. لا تصل سيوايفاي إلى حساباتي الخاصة ولا تنشر نيابة عني، وتتوقف عن إعادة النشر عند سحب هذا الإذن، وتُزال المنشورات السابقة بناءً على طلبي.',
  },
];

export const VENDOR_OPTIONAL_CONSENT_IDS = VENDOR_OPTIONAL_CONSENTS.map(consent => consent.id);

export interface ConsentRecord {
  granted: boolean;
  version: string;
  at: string;
  via: string;
}

export interface ConsentLedger {
  [key: string]: ConsentRecord;
}

/** Shapes the request payload into the JSON stored on the business record. */
export function buildConsentLedger(
  requested: Record<string, unknown> | undefined,
  via: string,
  at: Date = new Date()
): ConsentLedger {
  const ledger: ConsentLedger = {};
  for (const id of VENDOR_OPTIONAL_CONSENT_IDS) {
    if (!requested || requested[id] !== true) continue;
    ledger[id] = {
      granted: true,
      version: VENDOR_CONSENT_VERSION,
      at: at.toISOString(),
      via,
    };
  }
  return ledger;
}

export function hasConsent(ledger: unknown, id: VendorConsentId): boolean {
  if (!ledger || typeof ledger !== 'object') return false;
  const record = (ledger as Record<string, unknown>)[id];
  return Boolean(record && typeof record === 'object' && (record as ConsentRecord).granted === true);
}

/**
 * Display gate for the public minisite.
 *
 * Businesses created before the consent ledger existed have no record at all.
 * For them we keep the previous behaviour (whatever they already published is
 * shown); once a ledger exists an entry must be explicitly granted.
 */
export function consentAllows(ledger: unknown, id: VendorConsentId): boolean {
  if (!ledger || typeof ledger !== 'object') return true;
  if (Object.keys(ledger as Record<string, unknown>).length === 0) return true;
  return hasConsent(ledger, id);
}

export const VENDOR_SOCIAL_FIELDS = [
  { key: 'instagram_handle', label: 'Instagram', placeholder: '@yourbusiness' },
  { key: 'facebook_link', label: 'Facebook page', placeholder: 'https://facebook.com/yourbusiness' },
  { key: 'tiktok_handle', label: 'TikTok', placeholder: '@yourbusiness' },
] as const;

const SOCIAL_KEY_ALIASES: Record<string, string> = {
  instagram: 'instagram_handle',
  instagram_handle: 'instagram_handle',
  facebook: 'facebook_link',
  facebook_link: 'facebook_link',
  tiktok: 'tiktok_handle',
  tiktok_handle: 'tiktok_handle',
  wechat: 'wechat_id',
  wechat_id: 'wechat_id',
};

/**
 * Keeps only known social keys, trims values and caps their length so a vendor
 * cannot push arbitrary JSON into custom_data through the review endpoint.
 */
export function sanitizeSocialInput(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object') return {};
  const output: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const key = SOCIAL_KEY_ALIASES[rawKey];
    if (!key) continue;
    if (typeof rawValue !== 'string') continue;
    const value = rawValue.trim().slice(0, 200);
    if (!value) continue;
    output[key] = value;
  }
  return output;
}

/**
 * Pulls a Google place id out of anything a vendor is likely to paste:
 * a raw id, a `place_id:` parameter, or a full Maps share link.
 */
export function extractGooglePlaceId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  if (/^ChIJ[A-Za-z0-9_-]{10,}$/.test(value)) return value;

  const explicit = value.match(/place_id[:=](ChIJ[A-Za-z0-9_-]{10,})/i);
  if (explicit) return explicit[1];

  const encoded = value.match(/!1s(ChIJ[A-Za-z0-9_-]{10,})/);
  if (encoded) return encoded[1];

  return null;
}
