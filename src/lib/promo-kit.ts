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

/**
 * Adds the attribution tag the tap beacon already understands
 * (`/slug?tap=whatsapp&src=ig`). Every link we hand the vendor is tagged, so the
 * platform that actually delivered a visitor is measurable without a schema change.
 */
export function tagMinisiteUrl(url: string, src: string): string {
  const base = String(url || '').trim();
  const tag = String(src || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24);
  if (!base || !tag) return base;
  try {
    const parsed = new URL(base);
    parsed.searchParams.set('src', tag);
    return parsed.toString();
  } catch {
    return `${base}${base.includes('?') ? '&' : '?'}src=${tag}`;
  }
}

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
  // One tag per destination: without it every channel looks identical in the numbers.
  const tagged = {
    google: tagMinisiteUrl(url, 'google'),
    instagram: tagMinisiteUrl(url, 'ig'),
    facebook: tagMinisiteUrl(url, 'fb'),
    tiktok: tagMinisiteUrl(url, 'tt'),
  };
  const instagramText = fit(headline, tagged.instagram, LIMITS.instagram);
  const tiktokText = fit(headline, tagged.tiktok, LIMITS.tiktok);
  const facebookText = language === 'ar'
    ? fit(`${name} · سيوة · احجز مباشرة عبر SiWiFy`, tagged.facebook, LIMITS.facebook)
    : fit(`${name} · Siwa Oasis · Book direct on SiWiFy`, tagged.facebook, LIMITS.facebook);

  return [
    {
      platform: 'google',
      label: language === 'ar' ? 'ملف جوجل (حقل الموقع)' : 'Google profile (Website field)',
      field: 'website',
      limit: null,
      value: tagged.google,
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

export interface PromoShareCaption {
  id: 'post' | 'story' | 'status' | 'reply';
  label: string;
  labelAr: string;
  place: string;
  text: string;
  tag: string;
}

/**
 * Captions the vendor can paste without writing anything.
 *
 * These are not bios — they are posts, stories, WhatsApp statuses and the reply
 * a captain sends when a tourist asks "how much?". Each carries its own `src`
 * tag so the scoreboard can say which surface produced the visit.
 */
export function buildShareKit(options: {
  businessName: string;
  minisiteUrl: string;
  language?: PromoLanguage;
}): PromoShareCaption[] {
  const name = String(options.businessName || '').trim();
  const url = String(options.minisiteUrl || '').trim();
  const language = options.language || 'en';
  if (!url) return [];

  const ar = language === 'ar';
  const postUrl = tagMinisiteUrl(url, 'post');
  const storyUrl = tagMinisiteUrl(url, 'story');
  const statusUrl = tagMinisiteUrl(url, 'status');
  const replyUrl = tagMinisiteUrl(url, 'wa');

  return [
    {
      id: 'post',
      label: 'Instagram / Facebook post',
      labelAr: 'منشور إنستغرام / فيسبوك',
      place: ar ? 'كنبت أو تعليق المنشور' : 'Post caption, or first comment',
      tag: 'post',
      text: ar
        ? `${name} — في قلب سيوة.\nالخدمات والأسعار ورقم الواتساب في صفحتنا:\n${postUrl}\n\n#سيوة #واحة_سيوة #Siwa #SiwaOasis`
        : `${name} — in the heart of Siwa.\nServices, prices and our WhatsApp in one page:\n${postUrl}\n\n#Siwa #SiwaOasis #Egypt`,
    },
    {
      id: 'story',
      label: 'Story sticker / text',
      labelAr: 'استوري (نص أو ستيكر)',
      place: ar ? 'نص الاستوري أو رابط الستيكر' : 'Story text, or the link sticker',
      tag: 'story',
      text: ar
        ? `${name} · سيوة\nاحجز من هنا ← ${storyUrl}`
        : `${name} · Siwa\nBook here → ${storyUrl}`,
    },
    {
      id: 'status',
      label: 'WhatsApp status',
      labelAr: 'حالة واتساب',
      place: ar ? 'حالة واتساب (تظهر لكل جهات الاتصال)' : 'WhatsApp status (all contacts see it)',
      tag: 'status',
      text: ar
        ? `${name} في سيوة — الخدمات والأسعار في الصفحة:\n${statusUrl}`
        : `${name} in Siwa — services and prices on one page:\n${statusUrl}`,
    },
    {
      id: 'reply',
      label: 'Reply to a tourist',
      labelAr: 'رد على سائح',
      place: ar ? 'الصقه عندما يسأل أحد عن السعر' : 'Paste it when someone asks about prices',
      tag: 'wa',
      text: ar
        ? `أهلاً بك في سيوة. كل الخدمات والأسعار في صفحتي، ويمكنك الحجز مباشرة من هنا:\n${replyUrl}`
        : `Welcome to Siwa. All services and prices are on my page, and you can book directly here:\n${replyUrl}`,
    },
  ];
}
