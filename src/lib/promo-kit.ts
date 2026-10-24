/**
 * Copy-ready promo kit for the mutual visibility pledge.
 *
 * Nobody can write an Instagram or TikTok bio for the vendor, so the next best
 * thing is to remove every excuse: exact text in both languages, inside the
 * platform's character limit, plus a deep link that opens the right edit screen.
 *
 * Google is different — the profile field holds a URL and is verified by
 * reading it back through the Places API.
 */

export type PromoPlatform = 'instagram' | 'facebook' | 'tiktok' | 'google';
export type PromoLanguage = 'en' | 'ar';

export interface PromoKitItem {
  platform: PromoPlatform;
  label: string;
  field: 'bio' | 'website';
  limit: number | null;
  value: string;
  deepLink: string;
  note: string;
}

const DEEP_LINKS: Record<PromoPlatform, string> = {
  instagram: 'https://www.instagram.com/accounts/edit/',
  facebook: 'https://business.facebook.com/latest/settings/pages',
  tiktok: 'https://www.tiktok.com/setting',
  google: 'https://business.google.com/locations',
};

const LIMITS: Record<'instagram' | 'facebook' | 'tiktok', number> = {
  instagram: 150,
  facebook: 255,
  tiktok: 80,
};

/** Shortens the headline so the URL always fits inside the platform limit. */
function fit(headline: string, url: string, limit: number): string {
  const separator = ' · ';
  const room = limit - url.length - separator.length;
  if (room <= 4) return url.slice(0, limit);
  const trimmed = headline.length <= room ? headline : `${headline.slice(0, Math.max(1, room - 1)).trimEnd()}…`;
  return `${trimmed}${separator}${url}`;
}

export function buildPromoKit(options: {
  businessName: string;
  minisiteUrl: string;
  language?: PromoLanguage;
}): PromoKitItem[] {
  const name = String(options.businessName || 'Siwa business').trim();
  const url = String(options.minisiteUrl || '').trim();
  const language = options.language || 'en';
  if (!url) return [];

  const headline = language === 'ar' ? `${name} · سيوة` : `${name} · Siwa Oasis`;
  const instagramText = fit(headline, url, LIMITS.instagram);
  const tiktokText = fit(headline, url, LIMITS.tiktok);
  const facebookText = language === 'ar'
    ? fit(`${name} · سيوة · احجز مباشرة عبر SiWiFy`, url, LIMITS.facebook)
    : fit(`${name} · Siwa Oasis · Book direct on SiWiFy`, url, LIMITS.facebook);

  return [
    {
      platform: 'google',
      label: language === 'ar' ? 'ملف جوجل (حقل الموقع)' : 'Google profile (Website field)',
      field: 'website',
      limit: null,
      value: url,
      deepLink: DEEP_LINKS.google,
      note: language === 'ar'
        ? 'الموقع ← تعديل الملف ← حقل «الموقع الإلكتروني». استخدم رابط الموقع الرسمي للنشاط.'
        : 'Edit profile → Website. Use it as the business website field; this is the one we verify automatically.',
    },
    {
      platform: 'instagram',
      label: language === 'ar' ? 'إنستغرام (البايو)' : 'Instagram (Bio)',
      field: 'bio',
      limit: LIMITS.instagram,
      value: instagramText,
      deepLink: DEEP_LINKS.instagram,
      note: language === 'ar'
        ? 'تعديل الملف الشخصي ← البايو ← الصق النص (الحد 150 حرفًا).'
        : 'Edit profile → Bio → paste (150 characters max).',
    },
    {
      platform: 'facebook',
      label: language === 'ar' ? 'فيسبوك (نبذة الصفحة)' : 'Facebook (Page intro)',
      field: 'bio',
      limit: LIMITS.facebook,
      value: facebookText,
      deepLink: DEEP_LINKS.facebook,
      note: language === 'ar'
        ? 'إعدادات الصفحة ← معلومات الصفحة ← النبذة، وأضف الرابط أيضًا في حقل الموقع.'
        : 'Page settings → Page info → Intro, and add the same URL to the Website field.',
    },
    {
      platform: 'tiktok',
      label: language === 'ar' ? 'تيك توك (البايو)' : 'TikTok (Bio)',
      field: 'bio',
      limit: LIMITS.tiktok,
      value: tiktokText,
      deepLink: DEEP_LINKS.tiktok,
      note: language === 'ar'
        ? 'تعديل الملف ← البايو ← الصق النص (الحد 80 حرفًا).'
        : 'Edit profile → Bio → paste (80 characters max).',
    },
  ];
}
