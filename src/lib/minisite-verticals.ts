/**
 * Minisite verticals — the two characteristic "skins" a business minisite wears.
 *
 * A business is either a tourism experience (a hotel, a tour operator, a dining
 * venue) or a property offering (a compound, a sales office, a developer). The
 * same renderer, VanityBusinessClient, answers both, so this module carries the
 * presentation contract for each: which accent paints the chrome, which sections
 * a visitor should meet first, and which calls-to-action the header offers.
 *
 * This file is deliberately free of `next/headers`, `@/lib/db` and
 * `@/lib/developments`. Everything it reads (the revenue model, the type id,
 * whether a development is linked) is handed in as a plain value, so the client
 * component can import it without dragging server code into the browser bundle.
 * The property data itself is resolved on the server in
 * `minisite-verticals.server.ts`; this file only declares its shape.
 */

import type { PaymentPlan, UnitSummary } from '@/lib/developments';

export type MinisiteVertical = 'tourism' | 'properties';

/** Header action the theme offers. Each maps to a localized label below. */
export type CtaKey = 'call' | 'whatsapp_book' | 'plan_trip' | 'viewing' | 'developer';

/**
 * The server-resolved property facts a Properties minisite reuses from the
 * compound path (units, plans, comparison, tours). `null` when a property
 * business has no linked development, in which case only the navy skin shows.
 */
export interface PropertyBundle {
  developmentId: string;
  /** Localized name for the tours module and headings. */
  nameAr: string;
  nameEn: string;
  /** Towns/villages carry no project facts; the flags mirror CompoundPage. */
  place: boolean;
  facilities: string[];
  plans: PaymentPlan[];
  bestPlan: PaymentPlan | null;
  cheapest: UnitSummary | null;
  calcSeed: {
    price: number;
    downPaymentPct: number;
    installmentYears: number;
    frequency: PaymentPlan['frequency'];
  } | null;
  currency: string;
  hasFacts: boolean;
  dataVerifiedAt: string | null;
  /** Locale-prefixed compare link, e.g. `/compare/projects?ids=a,b,c`. */
  compareHref: string;
  /** Empty string when the project has no slugifiable developer. */
  developerSlug: string;
  /** Available units for the UnitsBoard. */
  units: UnitSummary[];
  /** Development names prefilling the site-visit chooser. */
  projects: string[];
}

export interface VerticalTheme {
  /** Primary accent; painted into the hero, active tabs, badges, toggles. */
  accent: string;
  /** A lighter tint of the accent for backgrounds and borders. */
  accentSoft: string;
  /** Ink color to sit on an accent-tinted surface. */
  accentInk: string;
  /** Canonical section ids, most-emphasised first; unknown ids append last. */
  sectionPriority: string[];
  /** Header CTA cluster, in the order they should appear. */
  ctas: CtaKey[];
  labels: { ar: Record<string, string>; en: Record<string, string> };
}

/**
 * Which skin a business wears. Precedence, highest first:
 *   1. An explicit admin override stored at `custom_data.minisite_vertical`.
 *   2. A property signal — a realestate revenue model, a linked development, or
 *      a type id that names a compound/developer/sales office/unit.
 *   3. Tourism, the default.
 *
 * Kept pure (strings in, one value out) so both the server route and the client
 * resolver can call it without touching the database.
 */
export function resolveMinisiteVertical(input: {
  override?: string | null;
  typeId?: string | null;
  hasDevelopment?: boolean | null;
  marketRevenueModel?: string | null;
}): MinisiteVertical {
  const override = String(input.override ?? '').trim().toLowerCase();
  if (override === 'properties') return 'properties';
  if (override === 'tourism') return 'tourism';

  const typeId = String(input.typeId ?? '').toLowerCase();
  const isPropertyType = /compound|development|real.?estate|property|properties|broker|sales.?office|developer|unit/i.test(
    typeId
  );

  if (
    String(input.marketRevenueModel ?? '').toLowerCase() === 'realestate_lead' ||
    input.hasDevelopment ||
    isPropertyType
  ) {
    return 'properties';
  }
  return 'tourism';
}

export const MINISITE_VERTICAL_THEMES: Record<MinisiteVertical, VerticalTheme> = {
  tourism: {
    // Oasis emerald — the travel pillar's own hue, warm and experience-led.
    accent: '#0F766E',
    accentSoft: 'rgba(15,118,110,0.12)',
    accentInk: '#0F766E',
    sectionPriority: [
      'sec_1_identity',
      'sec_2_ambience',
      'sec_5_experiences',
      'sec_4_gastronomy',
      'sec_8_connector',
      'sec_9_marketplace_catalog',
      'sec_10_testimonials_faqs',
      'sec_3_facilities',
    ],
    ctas: ['whatsapp_book', 'plan_trip', 'call'],
    labels: {
      ar: {
        whatsapp_book: 'احجز على واتساب',
        plan_trip: 'خطّط رحلتك',
        call: 'اتصل',
        whatsapp: 'واتساب',
      },
      en: {
        whatsapp_book: 'Book on WhatsApp',
        plan_trip: 'Plan your trip',
        call: 'Call',
        whatsapp: 'WhatsApp',
      },
    },
  },
  properties: {
    // The deep navy the Properties pillar already uses across the platform.
    accent: '#0F4C81',
    accentSoft: 'rgba(15,76,129,0.12)',
    accentInk: '#0F4C81',
    // Gastronomy and the marketplace are de-emphasised for a property offering.
    sectionPriority: [
      'sec_1_identity',
      'sec_3_facilities',
      'sec_7_investment',
      'sec_2_ambience',
      'sec_10_testimonials_faqs',
      'sec_8_connector',
    ],
    ctas: ['viewing', 'developer', 'call'],
    labels: {
      ar: {
        viewing: 'احجز معاينة',
        developer: 'تحدث إلى المطوّر',
        call: 'اتصل',
        whatsapp: 'واتساب',
        available_units: 'الوحدات المتاحة',
        payment_plans: 'خطط السداد',
        compare: 'قارن هذا المشروع',
        developer_portfolio: 'كل مشروعات المطوّر',
        tours: 'اطلب جولة عقارية',
        facilities: 'المرافق',
        verified: 'تم التحقق من الأسعار في',
        down: 'مقدمة',
        years: 'تقسيط',
        calc: 'احسب قسطك',
      },
      en: {
        viewing: 'Request a viewing',
        developer: 'Talk to the developer',
        call: 'Call',
        whatsapp: 'WhatsApp',
        available_units: 'Available units',
        payment_plans: 'Payment plans',
        compare: 'Compare this project',
        developer_portfolio: 'All developer projects',
        tours: 'Request a site visit',
        facilities: 'Facilities',
        verified: 'Prices verified on',
        down: 'down',
        years: 'instalment',
        calc: 'Work out your instalment',
      },
    },
  },
};

/**
 * Order the tabs the minisite shows by the theme's emphasis.
 *
 * Stable and lossless: a section whose canonical id is listed moves to that
 * slot, everything else keeps the order it arrived in and trails after the
 * priority block. No active section is ever dropped — the theme only changes
 * which one a visitor meets first.
 */
export function orderActiveSections<T extends { id: string }>(sections: T[], theme: VerticalTheme): T[] {
  // Give every section a sortable key: its slot in the priority list when
  // listed, otherwise a number behind the whole list that still encodes where
  // it arrived, so unranked sections trail in their incoming order rather than
  // collapsing into each other (which `Infinity - Infinity` would do).
  const base = theme.sectionPriority.length;
  return sections
    .map((section, position) => {
      const index = theme.sectionPriority.indexOf(section.id);
      return { section, key: index === -1 ? base + position : index };
    })
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.section);
}
