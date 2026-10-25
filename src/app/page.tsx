/**
 * Homepage — the front door of the platform (Server Component).
 *
 * This page used to be nothing: the body came from the dashboard template and
 * that template's component list is empty, so the whole site's front door was a
 * header, a footer and 618 characters of text with no <h1>. Everything a visitor
 * could click took them to a Siwa-named sector hub that had no listings.
 *
 * It now renders the market itself. Markets, categories and listings are read
 * from the database on every request, so opening El Alamein or Ras El Hekma is a
 * row change and not a page change. The dashboard keeps its slot below: anything
 * an editor adds to the website template still renders, it just no longer has to
 * carry the front door on its own.
 *
 * Caching: the page reads request headers (locale), so it renders per request.
 * Middleware gives public HTML a 5 minute shared-cache window, and the database
 * reads behind it are themselves cached for a minute.
 */

import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MarketplaceHeader, { type NavLink } from '@/components/MarketplaceHeader';
import { getWebsiteTemplate } from '@/lib/cache';
import { optimizeImageUrlsDeep } from '@/lib/image-url';
import { BRAND_MARK_URL, BRAND_LOCKUP_URL } from '@/lib/brand-assets';
import {
  DEFAULT_MARKET_SLUG,
  getMarketBySlug,
  listMarketCategories,
  listMarketListings,
  listMarkets,
  marketName,
  pathMarketSlug,
  type Market,
} from '@/lib/markets';
import { marketCopy } from '@/lib/market-copy';
import { pathLocale, type SiteLocale } from '@/lib/site-locale';
import { expandNavTokens, type NavContext } from '@/lib/site-nav';

interface LayoutSection {
  id: string;
  type: string;
  zone?: string;
  props?: Record<string, unknown>;
}

interface SiteSettings {
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

function parseLinks(value: string | undefined, defaults: string): string[] {
  return (value === undefined ? defaults : value).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function isSafeLink(href: string) {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#') || /^https:\/\//i.test(href);
}

function getNavLinks(settings: SiteSettings | null, ctx: NavContext): NavLink[] {
  const fallback = settings?.nav_links_text ?? DEFAULT_NAV_TEXT;
  const lines = parseLinks(expandNavTokens(fallback, ctx), DEFAULT_NAV_LINKS.map(link => `${link.label} | ${link.href}`).join('\n'));
  return lines.flatMap(line => {
    const [label, ...hrefParts] = line.split('|').map(part => part.trim());
    const href = hrefParts.join('|');
    const defaultIcon = DEFAULT_NAV_LINKS.find(link => link.href === href)?.icon;
    return label && href && isSafeLink(href) ? [{ label, href, icon: defaultIcon }] : [];
  });
}

function getFooterLinks(settings: SiteSettings | null, ctx: NavContext): FooterLink[] {
  const fallback = settings?.footer_links_text ?? DEFAULT_FOOTER_TEXT;
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

/** The market this front door speaks for. */
async function currentMarket(): Promise<{ market: Market; locale: SiteLocale }> {
  const [locale, requested] = await Promise.all([pathLocale(), pathMarketSlug()]);
  const resolvedLocale: SiteLocale = locale ?? 'en';
  const wanted = (await getMarketBySlug(requested ?? DEFAULT_MARKET_SLUG))
    ?? (await getMarketBySlug(DEFAULT_MARKET_SLUG));
  // A dark market has no front door. Falling back keeps the root reachable
  // instead of 404-ing the site's own homepage.
  const market: Market = wanted && wanted.active ? wanted : (await getMarketBySlug(DEFAULT_MARKET_SLUG))!;
  return { market, locale: resolvedLocale };
}

export async function generateMetadata(): Promise<Metadata> {
  const { market, locale } = await currentMarket();
  const name = marketName(market, locale);
  const path = locale === 'ar' ? '/ar' : '/';
  const title = locale === 'ar'
    ? `${name} — دليل الأنشطة الموثّقة | Siwify`
    : `${name} — verified local businesses, direct | Siwify`;
  const description = marketCopy(market, locale);

  return {
    title,
    description,
    alternates: {
      canonical: `https://siwify.com${path}`,
      languages: {
        en: 'https://siwify.com',
        ar: 'https://siwify.com/ar',
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

  const layout: LayoutSection[] = [
    ...(template?.header_components || []),
    ...(template?.body_components || []),
    ...(template?.footer_components || []),
  ];

  const { market, locale } = await currentMarket();
  const ar = locale === 'ar';

  const [markets, categories, listings] = await Promise.all([
    listMarkets({ activeOnly: true }),
    listMarketCategories(market.slug, 8),
    listMarketListings(market.slug, { limit: 6 }),
  ]);

  const name = marketName(market, locale);
  const otherName = marketName(market, ar ? 'en' : 'ar');
  const accent = market.themeAccent || '#D4AF37';
  const base = ar ? `/ar/${market.slug}` : `/${market.slug}`;
  const inventory = categories.reduce((sum, c) => sum + c.listings, 0);

  const navContext: NavContext = {
    locale,
    market: { slug: market.slug, name },
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

  const steps = ar
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Dynamic theme injection — overrides :root CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

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

      {/* ── HERO — the market, not a slideshow ───────────────────────────── */}
      <section
        dir={ar ? 'rtl' : 'ltr'}
        style={{
          background: `linear-gradient(135deg, #0F172A 0%, #1B2436 55%, ${accent}2E 100%)`,
          color: '#FFFFFF',
          borderBottom: `1px solid ${accent}44`,
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '3.25rem 1.5rem 2.75rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '4px', fontWeight: 900, color: accent }}>
            {ar ? 'سوق' : 'MARKETPLACE'} · {market.currency}
          </div>

          <h1 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.12 }}>
            {name}
          </h1>
          <div style={{ opacity: 0.45, fontSize: '0.95rem', marginBottom: '1rem' }}>{otherName}</div>

          <p style={{ margin: 0, maxWidth: 620, fontSize: '1rem', lineHeight: 1.8, opacity: 0.82 }}>
            {marketCopy(market, locale)}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1.6rem' }}>
            <Link
              href={base}
              style={{
                background: accent,
                color: '#0F172A',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '0.8rem 1.3rem',
                borderRadius: 10,
              }}
            >
              {ar ? `تصفّح ${inventory} نشاطًا →` : `Browse ${inventory} ${inventory === 1 ? 'business' : 'businesses'} →`}
            </Link>
            <Link
              href={ar ? '/ar/be-a-partner' : '/be-a-partner'}
              style={{
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '0.8rem 1.3rem',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              {ar ? 'أضف نشاطك مجانًا' : 'List your business — free'}
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', marginTop: '2.2rem', fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>
            <span>{inventory} {ar ? 'نشاط منشور' : 'live listings'}</span>
            <span>{categories.length} {ar ? 'تصنيف' : 'categories'}</span>
            <span>{ar ? 'الدفع بالجنيه' : `Priced in ${market.currency}`}</span>
          </div>
        </div>
      </section>

      {/* ── OTHER MARKETS — only when there is more than one ─────────────── */}
      {markets.length > 1 && (
        <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.5rem 1.5rem 0' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '0.68rem', letterSpacing: '3px', fontWeight: 900, color: 'var(--text-light)' }}>
            {ar ? 'أسواق أخرى' : 'OTHER MARKETS'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {markets.filter(m => m.slug !== market.slug).map(m => (
              <Link
                key={m.slug}
                href={ar ? `/ar/${m.slug}` : `/${m.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '1rem 1.1rem',
                  fontWeight: 800,
                }}
              >
                {marketName(m, locale)}
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.2rem' }}>
                  {m.currency}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CATEGORY DOORS — built from live supply ──────────────────────── */}
      <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text)' }}>
            {ar ? 'تصفّح حسب التصنيف' : 'Browse by category'}
          </h2>
          <Link href={base} style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none' }}>
            {ar ? 'الكل →' : 'All →'}
          </Link>
        </div>

        {categories.length === 0 ? (
          <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: '1.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {ar ? 'لا توجد أنشطة منشورة بعد.' : 'No businesses published yet.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
            {categories.map(c => (
              <Link
                key={c.id}
                href={`${base}?category=${encodeURIComponent(c.id)}`}
                style={{
                  textDecoration: 'none',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '1.1rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {ar ? c.nameAr || c.name : c.name}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0F172A', background: accent, borderRadius: 999, padding: '0.15rem 0.5rem' }}>
                  {c.listings}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── NEWEST LISTINGS ──────────────────────────────────────────────── */}
      {listings.length > 0 && (
        <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text)' }}>
            {ar ? `أحدث الأنشطة في ${name}` : `Newest in ${name}`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {listings.map(listing => (
              <Link
                key={listing.id}
                href={`${base}/${listing.slug}`}
                style={{
                  textDecoration: 'none',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  color: 'var(--text)',
                }}
              >
                <div
                  style={{
                    height: 132,
                    background: listing.coverImage
                      ? `url(${listing.coverImage}) center/cover`
                      : `linear-gradient(135deg, ${accent}55, #0F172A)`,
                  }}
                />
                <div style={{ padding: '0.9rem 1rem 1.05rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#8a6d16' }}>
                      {listing.typeName || (ar ? 'نشاط' : 'Business')}
                    </span>
                    {listing.isTrusted && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(34,197,94,0.15)', color: '#15803d', padding: '1px 6px', borderRadius: 999 }}>
                        {ar ? 'موثّق' : 'VERIFIED'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.4 }}>{listing.name}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', fontWeight: 800, color: '#8a6d16' }}>
                    {ar ? 'افتح الموقع ←' : 'Open minisite →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text)' }}>
          {ar ? 'كيف يعمل' : 'How it works'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {steps.map(([title, body], index) => (
            <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.15rem 1.2rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#8a6d16', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                0{index + 1}
              </div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.35rem' }}>{title}</div>
              <div style={{ fontSize: '0.84rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNER BAND ─────────────────────────────────────────────────── */}
      <section dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1120, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>
        <div
          style={{
            background: `linear-gradient(120deg, ${accent}22, var(--card) 70%)`,
            border: `1px solid ${accent}55`,
            borderRadius: 16,
            padding: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
              {ar ? 'أصحاب الأنشطة في ' + name : `Own a business in ${name}?`}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: 560, lineHeight: 1.7 }}>
              {ar
                ? 'صفحة كاملة بنطاقك أو رابط خاص، بالعربية والإنجليزية، بدون عمولة على الحجوزات.'
                : 'A full page on your own link, in Arabic and English, with no commission on bookings.'}
            </div>
          </div>
          <Link
            href={ar ? '/ar/be-a-partner' : '/be-a-partner'}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.84rem',
              padding: '0.8rem 1.35rem',
              borderRadius: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {ar ? 'ابدأ الآن' : 'Get started'}
          </Link>
        </div>
      </section>

      {/* 🔮 DASHBOARD SECTIONS — editors can still append their own blocks */}
      {layout.length > 0 ? (
        <DynamicHomepageRenderer layout={layout} settings={settings} pageId="main" />
      ) : null}

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
