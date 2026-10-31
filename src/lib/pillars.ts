/**
 * The top-level pillars — the platform's main sections — that sit beside the
 * market doors.
 *
 * A market is a place (Siwa, El Alamein, ...); a pillar is an intent that
 * crosses every place — travel, property, movement, or planning a journey that
 * mixes them. They are the site's main navigation, so they live at the bare root
 * (`/tourism`, `/properties`, `/transportation`, `/plan` for Arabic) and under
 * `/en/...` for English, exactly like every other public page.
 *
 * Each pillar is written to stand alone: it owns its page, its copy and its
 * data reads, so a section can be promoted to its own subdomain later without
 * untangling it from the others.
 *
 * This module is deliberately free of `next/headers` and database reads so both
 * the server pillar pages and the client homepage gateway can import it.
 */

import type { SiteLocale } from '@/lib/site-locale';

export type PillarSlug = 'tourism' | 'properties' | 'transportation' | 'plan';

export interface Pillar {
  slug: PillarSlug;
  /** Font Awesome icon, for the gateway card and the page eyebrow. */
  icon: string;
  /** The revenue model this pillar answers, used to filter markets. */
  accent: string;
  /** Bilingual copy; each field keeps the two languages side by side. */
  label: { ar: string; en: string };
  eyebrow: { ar: string; en: string };
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  blurb: { ar: string; en: string };
}

export const PILLARS: Pillar[] = [
  {
    slug: 'tourism',
    icon: 'fa-umbrella-beach',
    accent: '#0ea5e9',
    label: { ar: 'السياحة والسفر', en: 'Tourism & Travel' },
    eyebrow: { ar: 'سياحة', en: 'TOURISM' },
    title: { ar: 'سياحة وسفر في كل أنحاء مصر', en: 'Tourism & travel all over Egypt' },
    subtitle: {
      ar: 'منتجعات، شاليهات، فنادق، مخيمات صحراوية، رحلات ومطاعم موثّقة — تواصل مباشر مع أصحابها بدون وسيط.',
      en: 'Resorts, chalets, hotels, desert camps, tours and restaurants — all verified, booked direct with owners, no middleman.',
    },
    blurb: {
      ar: 'إقامة ورحلات ومطاعم في كل وجهة مصرية.',
      en: 'Stays, trips and dining in every Egyptian destination.',
    },
  },
  {
    slug: 'properties',
    icon: 'fa-building-universal-access',
    accent: '#0F4C81',
    label: { ar: 'العقارات', en: 'Properties' },
    eyebrow: { ar: 'عقارات', en: 'PROPERTIES' },
    title: { ar: 'عقارات ومشاريع سكنية في مصر', en: 'Properties & developments in Egypt' },
    subtitle: {
      ar: 'منتجعات ومشروعات ومكاتب بيع — أسعار، خطط سداد، وطلبات معاينة. زر المشاريع والتقى المطورين مباشرة.',
      en: 'Resorts, developments and sales offices — prices, payment plans and viewing requests. Tour the projects and meet the developers in person.',
    },
    blurb: {
      ar: 'مشروعات ومطورون وطلبات معاينة عقارية.',
      en: 'Developments, builders and property viewing tours.',
    },
  },
  {
    slug: 'transportation',
    icon: 'fa-truck-fast',
    accent: '#b45309',
    label: { ar: 'نقل ولوجستيات', en: 'Transportation & Logistics' },
    eyebrow: { ar: 'نقل', en: 'TRANSPORTATION' },
    title: { ar: 'نقل ولوجستيات في كل أنحاء مصر', en: 'Transportation & logistics all over Egypt' },
    subtitle: {
      ar: 'تحويلات محلية، نقل دفع رباعي للصحراء، تكاتك وتأجير، وشحن بضائع — تواصل مباشر مع أصحاب الخدمة بدون وسيط.',
      en: 'Local transfers, 4x4 desert transport, tuk-tuks and rentals, and freight logistics — booked direct with local operators, no middleman.',
    },
    blurb: {
      ar: 'تنقّلات، شحن ولوجستيات في كل وجهة.',
      en: 'Transfers, freight and logistics in every destination.',
    },
  },
  {
    slug: 'plan',
    icon: 'fa-route',
    accent: '#8b5cf6',
    label: { ar: 'خطّط رحلتك', en: 'Plan Your Journey' },
    eyebrow: { ar: 'خطّط', en: 'PLAN' },
    title: { ar: 'خطّط رحلتك — للاستثمار، للمتعة، أو للاثنين', en: 'Plan your journey — for investment, for pleasure, or both' },
    subtitle: {
      ar: 'اختر نيتك ونحن نجهّز لك المسار: فرصة استثمارية عقاري، رحلة سياحية، أو مزيج يجمع بينهما.',
      en: 'Tell us your intent and we set the route: a property investment, a travel escape, or a mix that does both.',
    },
    blurb: {
      ar: 'للاستثمار، للمتعة، أو للاثنين معًا.',
      en: 'For investment, for pleasure, or both at once.',
    },
  },
];

/** Pillar metadata by slug, or null for anything that is not a pillar. */
export function getPillar(slug: string | null | undefined): Pillar | null {
  if (!slug) return null;
  const wanted = String(slug).trim().toLowerCase();
  return PILLARS.find(p => p.slug === wanted) ?? null;
}

/**
 * The address of a pillar in a given language. Arabic owns the bare path, so
 * only English gains the `/en` prefix — the same rule every public page follows.
 */
export function pillarUrl(slug: PillarSlug, locale: SiteLocale): string {
  return locale === 'en' ? `/en/${slug}` : `/${slug}`;
}

/** Localised label for a pillar. */
export function pillarLabel(pillar: Pillar, locale: SiteLocale): string {
  return locale === 'ar' ? pillar.label.ar : pillar.label.en;
}
