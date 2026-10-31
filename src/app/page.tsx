/**
 * Homepage — the front door of the platform (Server Component).
 *
 * The body is fully CMS-driven: whatever an editor arranges in the website
 * builder (the `main` template's body components) is exactly what renders, in
 * order. The market itself — hero, other markets, category doors, newest
 * listings, featured developers and how-it-works — is expressed as section
 * types (see DynamicHomepageRenderer) rather than fixed JSX, so every block is
 * toggleable and reorderable from the dashboard.
 *
 * Those market sections read from `homeData`, resolved on the server here, so a
 * new market is still a row change rather than a page change and the per-market
 * <h1>, canonicals and bilingual/RTL parity survive intact. When the builder has
 * no body sections yet, a seeded default front door renders instead — the page
 * can no longer collapse to the empty template it once was, without giving up
 * the dashboard's authority over the layout.
 *
 * Caching: the page reads request headers (locale, market), so it renders per
 * request. Middleware gives public HTML a 5 minute shared-cache window, and the
 * database reads behind it are themselves cached for a minute.
 */

import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader, { type NavLink } from '@/components/MarketplaceHeader';
import HomeRibbon, { type RibbonSettings } from '@/components/home/HomeRibbon';
import { getWebsiteTemplate } from '@/lib/cache';
import { optimizeImageUrlsDeep } from '@/lib/image-url';
import { BRAND_MARK_URL, BRAND_LOCKUP_URL } from '@/lib/brand-assets';
import { headers } from 'next/headers';
import {
  DEFAULT_MARKET_SLUG,
  getMarketBySlug,
  getPlatformMarket,
  listCountryCategories,
  listCountryListings,
  listMarketCategories,
  listMarketListings,
  listMarkets,
  marketName,
  pathMarketSlug,
  type Market,
} from '@/lib/markets';
import { listDevelopersByMarket, type MarketDeveloper } from '@/lib/developers';
import type { HomeData } from '@/lib/home-data';
import { marketCopy } from '@/lib/market-copy';
import { pathLocale, type SiteLocale } from '@/lib/site-locale';
import { expandNavTokens, type NavContext } from '@/lib/site-nav';

interface LayoutSection {
  id: string;
  type: string;
  zone?: string;
  props?: Record<string, unknown>;
}

interface SiteSettings extends RibbonSettings {
  bg_color?: string;
  nav_bg_color?: string;
  logo_url?: string;
  logo_height?: number;
  site_name?: string;
  primary_color?: string;
  show_watermark?: boolean;
  carousel_interval?: number;
  footer_tagline?: string;
  footer_copyright?: string;
  header_brand_label?: string;
  header_brand_icon?: string;
  header_background_color?: string;
  header_text_color?: string;
  footer_background_color?: string;
  footer_text_color?: string;
  footer_muted_color?: string;
  show_header?: boolean;
  show_footer?: boolean;
  nav_links_text?: string;
  footer_links_text?: string;
  watermark_text?: string;
  search_headline?: string;
  search_subline?: string;
  services_title?: string;
  services_subtitle?: string;
}

interface FooterLink {
  group: string;
  label: string;
  href: string;
}

/**
 * Fallbacks. The dashboard's `nav_links_text` wins whenever it holds a value,
 * so these only show on a template that has never been edited — and they are
 * deliberately short because the tokens do the work.
 */
const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: 'fa-house' },
  { href: '/siwa', label: 'Directory', icon: 'fa-compass' },
  { href: '/categories', label: 'Categories', icon: 'fa-layer-group' },
  { href: '/be-a-partner', label: 'List your business', icon: 'fa-store' },
];

const DEFAULT_NAV_TEXT = ['Home | /', '{{market}}', '{{categories}}', 'List your business | /be-a-partner'].join('\n');

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { group: 'EXPLORE', label: 'Directory', href: '/siwa' },
  { group: 'EXPLORE', label: 'All categories', href: '/categories' },
  { group: 'PARTNERS', label: 'Vendor portal', href: '/login' },
  { group: 'PARTNERS', label: 'List your business', href: '/signup' },
];

const DEFAULT_FOOTER_TEXT = [
  'EXPLORE | {{market}}',
  'EXPLORE | All categories | /categories',
  'PARTNERS | Vendor portal | /login',
  'PARTNERS | List your business | /signup',
].join('\n');

/**
 * The national door has no single market to name, so an untouched template
 * still reads as Egypt — the three pillars, the plan page and the category
 * doors — instead of falling back to one oasis.
 */
const PLATFORM_NAV_TEXT: Record<'ar' | 'en', string> = {
  ar: [
    'الرئيسية | /',
    'السياحة | /tourism',
    'العقارات | /properties',
    'النقل واللوجستيات | /transportation',
    'خطّط رحلتك | /plan',
    'كل التصنيفات | /categories',
  ].join('\n'),
  en: [
    'Home | /en',
    'Tourism | /en/tourism',
    'Properties | /en/properties',
    'Transportation | /en/transportation',
    'Plan a trip | /en/plan',
    'All categories | /en/categories',
  ].join('\n'),
};

const PLATFORM_FOOTER_TEXT: Record<'ar' | 'en', string> = {
  ar: [
    'استكشف | السياحة | /tourism',
    'استكشف | العقارات | /properties',
    'استكشف | النقل واللوجستيات | /transportation',
    'استكشف | خطّط رحلتك | /plan',
    'استكشف | كل التصنيفات | /categories',
    'شركاؤنا | بوابة الشركاء | /login',
    'شركاؤنا | أضف نشاطك | /signup',
  ].join('\n'),
  en: [
    'EXPLORE | Tourism | /en/tourism',
    'EXPLORE | Properties | /en/properties',
    'EXPLORE | Transportation | /en/transportation',
    'EXPLORE | Plan a trip | /en/plan',
    'EXPLORE | All categories | /en/categories',
    'PARTNERS | Vendor portal | /en/login',
    'PARTNERS | List your business | /en/signup',
  ].join('\n'),
};

/**
 * The front-door body used when the editor has not arranged one yet. Every item
 * is a real CMS section type, so the dashboard can add, remove, reorder or
 * replace any of them — this only decides what an untouched template shows, and
 * it can never render empty. The partner band carries market-aware copy that the
 * generic partner_cta cannot compute on its own.
 */
function defaultHomeLayout(opts: { ar: boolean; name: string }): LayoutSection[] {
  const partnerTitle = opts.ar ? `أصحاب الأنشطة في مصر؟` : `Own a business in Egypt?`;
  const partnerSubtitle = opts.ar
    ? 'صفحة كاملة بنطاقك أو رابط خاص، بالعربية والإنجليزية، بدون عمولة على الحجوزات.'
    : 'A full page on your own link, in Arabic and English, with no commission on bookings.';
  return [
    { id: 'fd-hero', type: 'egypt_hero' },
    { id: 'fd-pillars', type: 'pillar_gateway' },
    { id: 'fd-destinations', type: 'egypt_destinations' },
    { id: 'fd-services', type: 'services_categories' },
    { id: 'fd-listings', type: 'market_listings' },
    { id: 'fd-developers', type: 'featured_developers' },
    { id: 'fd-how', type: 'how_it_works' },
    { id: 'fd-partner', type: 'partner_cta', props: { title: partnerTitle, subtitle: partnerSubtitle } },
  ];
}

function parseLinks(value: string | undefined, defaults: string): string[] {
  return (value === undefined ? defaults : value).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function isSafeLink(href: string) {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#') || /^https:\/\//i.test(href);
}

function getNavLinks(settings: SiteSettings | null, ctx: NavContext): NavLink[] {
  const fallback = settings?.nav_links_text ?? (ctx.platform ? PLATFORM_NAV_TEXT[ctx.locale === 'en' ? 'en' : 'ar'] : DEFAULT_NAV_TEXT);
  const lines = parseLinks(expandNavTokens(fallback, ctx), DEFAULT_NAV_LINKS.map(link => `${link.label} | ${link.href}`).join('\n'));
  return lines.flatMap(line => {
    const [label, ...hrefParts] = line.split('|').map(part => part.trim());
    const href = hrefParts.join('|');
    const defaultIcon = DEFAULT_NAV_LINKS.find(link => link.href === href)?.icon;
    return label && href && isSafeLink(href) ? [{ label, href, icon: defaultIcon }] : [];
  });
}

function getFooterLinks(settings: SiteSettings | null, ctx: NavContext): FooterLink[] {
  const fallback = settings?.footer_links_text ?? (ctx.platform ? PLATFORM_FOOTER_TEXT[ctx.locale === 'en' ? 'en' : 'ar'] : DEFAULT_FOOTER_TEXT);
  const lines = parseLinks(expandNavTokens(fallback, ctx), DEFAULT_FOOTER_LINKS.map(link => `${link.group} | ${link.label} | ${link.href}`).join('\n'));
  return lines.flatMap(line => {
    const [group, label, ...hrefParts] = line.split('|').map(part => part.trim());
    const href = hrefParts.join('|');
    return group && label && href && isSafeLink(href) ? [{ group, label, href }] : [];
  });
}

// ── Luminance helper — determines if a hex color is "light" ──────────────────
function isLight(hex: string | undefined): boolean {
  if (!hex) return true;
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140;
  } catch { return true; }
}

// ── Dynamically generate :root CSS overrides from settings ───────────────────
/**
 * These values end up inside a <style> block, which React cannot escape for us.
 * Dashboard colours are hex or rgb() in practice, so anything else falls back
 * rather than being pasted into the stylesheet.
 */
function safeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{3,8}$/i.test(trimmed) || /^rgba?\([0-9.,\s%]+\)$/i.test(trimmed) || /^[a-z]{3,20}$/i.test(trimmed)
    ? trimmed
    : fallback;
}

function buildThemeCSS(s: SiteSettings | null): string {
  const bg  = safeColor(s?.bg_color, '#f7f5f2');
  const pri = safeColor(s?.primary_color, '#475569');
  const nav = safeColor(s?.nav_bg_color, '#ffffff');
  const light = isLight(bg);

  if (light) {
    return `:root {
      --bg: ${bg};
      --bg-alt: #ffffff;
      --card: #ffffff;
      --text: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.05);
      --shadow-md: 0 6px 20px rgba(15,23,42,0.06);
      --shadow-lg: 0 12px 30px rgba(15,23,42,0.08);
    }`;
  } else {
    return `:root {
      --bg: ${bg};
      --bg-alt: #ffffff;
      --card: rgba(255,255,255,0.96);
      --text: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --border: rgba(15,23,42,0.08);
      --border-light: rgba(15,23,42,0.05);
      --gold: ${pri};
      --gold-hover: ${pri}cc;
      --dark: ${nav};
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.06);
      --shadow-md: 0 6px 20px rgba(15,23,42,0.08);
      --shadow-lg: 0 12px 30px rgba(15,23,42,0.12);
    }`;
  }
}

/**
 * The market this front door speaks for, and whether it is the national
 * platform door. The bare apex (siwify.com, www, localhost, Vercel previews)
 * presents Egypt as a whole and aggregates every live market; only a dedicated
 * market subdomain opens a single market. This unties the root from Siwa
 * without a migration, while /siwa and friends stay their own market doors.
 */
async function currentMarket(): Promise<{ market: Market; locale: SiteLocale; platform: boolean }> {
  const host = (await headers()).get('host') || '';
  const [locale, requested] = await Promise.all([pathLocale(), pathMarketSlug()]);
  const resolvedLocale: SiteLocale = locale ?? 'ar';

  const clean = host.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '').replace(/\/.*$/, '');
  const isApex =
    clean === 'siwify.com' ||
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '' ||
    /\.vercel\.app$/.test(clean);
  if (isApex) return { market: getPlatformMarket(), locale: resolvedLocale, platform: true };

  const wanted = (await getMarketBySlug(requested ?? DEFAULT_MARKET_SLUG))
    ?? (await getMarketBySlug(DEFAULT_MARKET_SLUG));
  // A dark market has no front door. Falling back keeps the root reachable
  // instead of 404-ing the site's own homepage.
  const market: Market = wanted && wanted.active ? wanted : (await getMarketBySlug(DEFAULT_MARKET_SLUG))!;
  return { market, locale: resolvedLocale, platform: false };
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await currentMarket();
  const ar = locale === 'ar';
  const path = ar ? '/' : '/en';
  // The platform root speaks for Egypt, not one oasis — this is the primary
  // signal that unties siwify.com from "Siwa" in search. Individual market
  // doors (/siwa, /el-alamein, ...) keep their own localised titles.
  const title = ar
    ? 'Siwify — سوق العقارات والسياحة في مصر'
    : 'Siwify — Egypt\u2019s marketplace for properties & tourism';
  const description = ar
    ? 'منتجعات، شاليهات، فنادق، مخيمات صحراوية ورحلات موثّقة في كل أنحاء مصر. تواصل مباشر مع الملاك بدون وسيط.'
    : 'Verified resorts, chalets, hotels, desert camps and tours all over Egypt. Egypt\u2019s marketplace for properties and tourism — book direct with owners, no middleman.';

  return {
    title,
    description,
    alternates: {
      canonical: `https://siwify.com${path}`,
      languages: {
        ar: 'https://siwify.com',
        en: 'https://siwify.com/en',
        'x-default': 'https://siwify.com',
      },
    },
    openGraph: { title, description, url: `https://siwify.com${path}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/**
 * Server Component — data is fetched during SSR, no client waterfall.
 */
export default async function Home() {
  // Fetch from the cached layer (in-memory TTL cache + React cache deduplication)
  const config = await getWebsiteTemplate('main');

  // Render-time delivery optimisation: Cloudinary URLs pick up f_auto/q_auto/w_1600
  // here, so stored content and the admin editors keep the original URL.
  const template = optimizeImageUrlsDeep(config);

  const settings: SiteSettings | null = template?.site_settings || null;

  const { market, locale, platform } = await currentMarket();
  const ar = locale === 'ar';

  const activeSlugs = (await listMarkets({ activeOnly: true })).map((m) => m.slug);
  const [markets, allMarkets, categories, listings, developerGroups] = await Promise.all([
    listMarkets({ activeOnly: true }),
    listMarkets({ activeOnly: false }),
    platform ? listCountryCategories(activeSlugs, 8) : listMarketCategories(market.slug, 8),
    platform ? listCountryListings(activeSlugs, { limit: 6 }) : listMarketListings(market.slug, { limit: 6 }),
    platform
      ? Promise.all(activeSlugs.map((s) => listDevelopersByMarket(s)))
      : listDevelopersByMarket(market.slug).then((d) => [d]),
  ]);

  // The national door folds every live market into one Egypt view: developers
  // are de-duplicated by id and their project counts summed across markets.
  const developers: MarketDeveloper[] = platform
    ? (() => {
        const byId = new Map<string, MarketDeveloper>();
        for (const group of developerGroups) {
          for (const dev of group) {
            const prev = byId.get(dev.id);
            if (prev) prev.projects += dev.projects;
            else byId.set(dev.id, { ...dev });
          }
        }
        return [...byId.values()].sort((a, b) => b.projects - a.projects);
      })()
    : developerGroups[0];

  const name = marketName(market, locale);
  const otherName = marketName(market, ar ? 'en' : 'ar');
  const accent = market.themeAccent || '#D4AF37';
  // A market door scopes its links under `/{market}`; the national door has no
  // such path, so it links flat (listings) and through /categories (shelves).
  const base = platform ? (ar ? '' : '/en') : (ar ? `/${market.slug}` : `/en/${market.slug}`);
  const inventory = categories.reduce((sum, c) => sum + c.listings, 0);

  const navContext: NavContext = {
    locale,
    platform,
    market: platform ? null : { slug: market.slug, name },
    markets: markets.map(m => ({ slug: m.slug, name: marketName(m, locale) })),
    categories: categories.map(c => ({ id: c.id, name: ar ? c.nameAr || c.name : c.name, listings: c.listings })),
  };

  const themeCSS = buildThemeCSS(settings);
  const primary  = settings?.primary_color || '#FFB700';
  const footerLinks = getFooterLinks(settings, navContext);
  const footerGroups = Array.from(new Set(footerLinks.map(link => link.group)));
  const footerTagline = settings?.footer_tagline === undefined
    ? 'A marketplace for verified local businesses. Independent owners, direct contact, no middleman.'
    : settings.footer_tagline;
  const footerCopyright = settings?.footer_copyright === undefined
    ? 'SIWIFY • ALL RIGHTS RESERVED.'
    : settings.footer_copyright;

  const steps: [string, string][] = ar
    ? [
        ['أنشئ موقعك المصغّر', 'سجّل نشاطك وأضف الصور والأسعار في دقائق.'],
        ['انشر', 'صفحتك تصبح جزءًا من دليل السوق، بلغتين.'],
        ['استقبل التواصل', 'الزائر يراسلك على واتساب مباشرة.'],
      ]
    : [
        ['Create your minisite', 'Register the business and add photos and prices in minutes.'],
        ['Publish', 'Your page joins the market directory, in both languages.'],
        ['Get contacted', 'Visitors reach you on WhatsApp, not through us.'],
      ];

  // The single data object the market-aware front-door sections read from. They
  // render inside the (client) builder tree, so passing it here — instead of
  // each section fetching its own API — keeps SSR/SEO and avoids waterfalls.
  const homeData: HomeData = {
    market,
    locale,
    ar,
    name,
    otherName,
    accent,
    base,
    inventory,
    copy: marketCopy(market, locale),
    markets,
    allMarkets,
    categories,
    listings,
    developers,
    steps,
    platform,
  };

  // Fully CMS-driven body: the editor's layout wins whenever it has one; the
  // seeded default front door only covers an untouched (or cleared) template.
  const rawBody: LayoutSection[] = template?.body_components?.length
    ? template.body_components
    : defaultHomeLayout({ ar, name });

  // The three pillars are the site's primary navigation, so the gateway is
  // surfaced on the front door even on a hand-built layout that predates it.
  // Injected once, straight after the hero, and never duplicated if the editor
  // has already placed it themselves.
  const bodyLayout: LayoutSection[] = rawBody.some(s => s?.type === 'pillar_gateway')
    ? rawBody
    : (() => {
        const heroIdx = rawBody.findIndex(s => s?.type === 'egypt_hero' || s?.type === 'market_hero' || s?.type === 'hero_carousel');
        const gateway: LayoutSection = { id: 'pillar-gateway', type: 'pillar_gateway' };
        return heroIdx === -1
          ? [gateway, ...rawBody]
          : [...rawBody.slice(0, heroIdx + 1), gateway, ...rawBody.slice(heroIdx + 1)];
      })();

  const layout: LayoutSection[] = [
    ...(template?.header_components || []),
    ...bodyLayout,
    ...(template?.footer_components || []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Dynamic theme injection — overrides :root CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* 🎗️ TOP ANNOUNCEMENT RIBBON — dashboard-controlled, points at services */}
      <HomeRibbon settings={settings} ar={ar} />

      {/* 🏛️ ELITE RESPONSIVE NAVIGATION */}
      {settings?.show_header !== false && (
        <MarketplaceHeader
          title={settings?.site_name || 'SiWiFy'}
          accentColor={primary}
          activePath="/"
          navLinks={getNavLinks(settings, navContext)}
          brandLabel={settings?.header_brand_label ?? 'SIWIFY'}
          brandIcon={settings?.header_brand_icon === undefined ? 'fa-sun' : settings.header_brand_icon}
          backgroundColor={settings?.header_background_color || 'rgba(8, 14, 10, 0.94)'}
          textColor={settings?.header_text_color || 'rgba(248, 250, 252, 0.88)'}
          brandImage={settings?.logo_url || BRAND_MARK_URL}
          logoHeight={settings?.logo_height || 34}
        />
      )}

      {/* ── BODY — driven entirely by the CMS layout, with homeData for market blocks */}
      <DynamicHomepageRenderer layout={layout} settings={settings} pageId="main" homeData={homeData} />

      {/* GLOBAL WATERMARK */}
      {settings?.show_watermark !== false && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, pointerEvents: 'none', opacity: 0.18, filter: 'grayscale(100%) brightness(100%)' }}>
          <div style={{ fontWeight: 900, letterSpacing: '5px', fontSize: '0.6rem', color: '#cbd5e1' }}>{settings?.watermark_text || 'SIWIFY'}</div>
        </div>
      )}

      {settings?.show_footer !== false && <footer style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', padding: '4rem 1.25rem 3rem', marginTop: '3rem', background: settings?.footer_background_color || '#ffffff', color: settings?.footer_text_color || '#0f172a' }}>
         <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
            <div>
               <img
                 src={settings?.logo_url || BRAND_LOCKUP_URL}
                 alt={settings?.site_name || 'SiWiFy.com'}
                 style={{
                   height: settings?.logo_url ? `${(settings.logo_height || 40) * 1.2}px` : '88px',
                   width: 'auto',
                   marginBottom: '1.25rem',
                   objectFit: 'contain',
                 }}
               />
               {footerTagline && <p style={{ color: settings?.footer_muted_color || '#475569', fontSize: '0.82rem', maxWidth: '300px', lineHeight: 1.8 }}>{footerTagline}</p>}
            </div>

            {footerGroups.map(group => <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
               <span style={{ fontSize: '0.64rem', fontWeight: 900, color: primary, letterSpacing: '3px', marginBottom: '0.35rem' }}>{group}</span>
               {footerLinks.filter(link => link.group === group).map(link => <Link key={`${link.label}:${link.href}`} href={link.href} style={{ color: settings?.footer_muted_color || '#334155', textDecoration: 'none', fontSize: '0.85rem' }}>{link.label}</Link>)}
            </div>)}
         </div>

         <div style={{ marginTop: '3.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(15, 23, 42, 0.08)', textAlign: 'center', opacity: 0.8, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '2px', color: '#64748b' }}>
            © {new Date().getFullYear()} {footerCopyright}
         </div>
      </footer>}
    </div>
  );
}
