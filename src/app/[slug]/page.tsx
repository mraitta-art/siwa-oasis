import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MinisiteBuilderRenderer, { type BusinessContext } from '@/components/MinisiteBuilderRenderer';
import { MinisiteLangProvider } from '@/components/minisite/MinisiteLang';
import MinisiteQRCode from '@/components/MinisiteQRCode';
import MinisiteTapTracker from '@/components/MinisiteTapTracker';
import MinisiteSectionTabs, { type SectionTabItem } from '@/components/MinisiteSectionTabs';
import type { MinisiteLayout } from '@/lib/minisite-governance-client';
import { normalizePhoneValue } from '@/lib/egypt-phone';
import { MINISITE_LAYOUT_KEY } from '@/lib/minisite-layout';
import { query, queryOne, normalizeCustomData, stripCustomDataSecrets } from '@/lib/db';
import { businessPublicPath, getBusinessSlugCandidates, getPublicAppUrl } from '@/lib/public-url';
import { resolveSectionNav } from '@/lib/vanity-section-nav';
import { languageAlternates, localeUrl, pathLocale } from '@/lib/site-locale';
import { DEFAULT_MARKET_SLUG, getMarketBySlug, marketName, pathMarketSlug } from '@/lib/markets';
import { isMarketSegment } from '@/lib/market-routes';
import { getDevelopmentBySlug, getDevelopmentFacets } from '@/lib/developments';
import { MINISITE_VERTICAL_THEMES, resolveMinisiteVertical } from '@/lib/minisite-verticals';
import { optimizeImageUrlsDeep } from '@/lib/image-url';
import MarketHome from '@/components/MarketHome';
import CompoundPage from '@/components/CompoundPage';
import ZonePage from '@/components/ZonePage';
import { getZone } from '@/lib/zones';
import DeveloperPortfolio from '@/components/development/DeveloperPortfolio';
import { resolveVanityRoot } from '@/lib/vanity-route';

export const dynamic = 'force-dynamic';

/**
 * CANONICAL PUBLIC PAGE: /<slug>
 *
 * This is the URL behind every QR code, promo-kit link, sitemap entry and
 * WhatsApp share, so it must be rendered on the server: crawlers, link-preview
 * bots (WhatsApp, Facebook, X) and slow phones never run the client fetches the
 * old version depended on. Everything below resolves from the database first,
 * then falls back to the admin builder layout, then 404s.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop';

type Lang = 'ar' | 'en';

function siteBase() {
  return getPublicAppUrl().replace(/\/$/, '');
}

function parseJson(value: unknown, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function digits(value: unknown) {
  // Canonicalise the way an Egyptian writes their number (012… / +20 012… / 002…) —
  // wa.me links silently break if the trunk 0 survives.
  return normalizePhoneValue(value);
}

/** Category labels are stored lowercase in the DB ("camps"); Arabic has no case. */
function displayType(name: unknown) {
  const clean = String(name || '').trim();
  if (!clean) return 'Siwa';
  if (/[\u0600-\u06FF]/.test(clean)) return clean;
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Egyptian numbers are stored national (01xxxxxxxxx); wa.me wants 20xxxxxxxxxx. */
function waNumber(raw: string) {
  if (!raw) return '';
  if (raw.startsWith('00')) return raw.slice(2);
  if (raw.startsWith('0')) return `2${raw}`;
  return raw;
}

async function findBusiness(slug: string) {
  // The URL names the market, and a slug is only unique inside one. Without
  // this check /el-alamein/gagal-hotel would serve the Siwa property, because
  // the lookup itself is by slug. A row with no recorded market reads as the
  // default one, so no listing stays reachable from a market that cannot own it.
  const urlMarket = await pathMarketSlug();
  const belongs = (row: any) =>
    !row || !urlMarket || String(row.market_id || DEFAULT_MARKET_SLUG) === urlMarket;

  // Strip credentials from the row itself before anyone sees it. The renderer
  // filters what it displays, but this record is also handed to client
  // components, and their props are serialised into the page.
  const clean = (row: any) => {
    if (row) row.custom_data = stripCustomDataSecrets(row.custom_data);
    return belongs(row) ? row : null;
  };

  try {
    if (UUID_RE.test(slug)) {
      const row = await queryOne<any>(
        `SELECT b.*, t.features AS tier_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         WHERE b.id = ? LIMIT 1`,
        [slug]
      );
      return clean(row);
    }

    const candidates = [...new Set(getBusinessSlugCandidates(slug))];
    if (!candidates.length) return null;

    const slugParts = candidates.map(() => 'b.slug = ?').join(' OR ');
    const nameParts = candidates
      .map(() => 'LOWER(REPLACE(REPLACE(TRIM(b.name), " ", "-"), "_", "-")) = ?')
      .join(' OR ');

    const row = await queryOne<any>(
      `SELECT b.*, t.features AS tier_features
       FROM businesses b
       LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
       WHERE (${slugParts}) OR (b.custom_domain = ? AND b.custom_domain_verified = 1) OR (${nameParts})
       LIMIT 1`,
      [...candidates, slug, ...candidates]
    );
    return clean(row);
  } catch {
    return null;
  }
}

async function loadWebsiteConfig(slug: string) {
  try {
    const row = await queryOne<any>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [MINISITE_LAYOUT_KEY(slug)]
    );
    const cfg = parseJson(row?.config, null);
    const layout = [
      ...(cfg?.header_components || []),
      ...(cfg?.body_components || []),
      ...(cfg?.footer_components || []),
      ...(cfg?.layout || []),
    ];
    return layout.length ? { ...cfg, layout } : null;
  } catch {
    return null;
  }
}

async function loadMinisite(business: any) {
  try {
    const typeRow = business.type_id
      ? await queryOne<{ name: string; name_ar: string | null }>(
          'SELECT name, name_ar FROM business_types WHERE id = ?',
          [business.type_id]
        )
      : null;

    const published = await queryOne<any>(
      `SELECT layout FROM minisite_vendor_handoffs
       WHERE business_id = ? AND status = 'published'
       ORDER BY revision DESC
       LIMIT 1`,
      [business.id]
    );
    let layout = parseJson(published?.layout, null);

    if (!layout || !Array.isArray(layout.components)) {
      const legacy = await queryOne<any>(
        'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
        [MINISITE_LAYOUT_KEY(business.slug || business.id)]
      );
      layout = parseJson(legacy?.config, null);
    }

    const [gallery, blogs, products] = await Promise.all([
      query<any>(
        `SELECT id, url, caption, is_hero
         FROM vendor_gallery
         WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
         ORDER BY is_hero DESC, id DESC`,
        [business.id]
      ),
      query<any>(
        `SELECT id, title, content, excerpt, featured_image_url AS cover_image
         FROM section_blogs
         WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1
         ORDER BY published_at DESC`,
        [business.id]
      ),
      query<any>(
        `SELECT tp.id, tp.name AS title,
                COALESCE(tp.base_price_usd, tp.base_price_egp) AS price,
                COALESCE(tp.duration_days, tp.duration_hours) AS duration,
                tp.image_url, COALESCE(tcc.name, tp.catalog_cat_id) AS category,
                tp.description, tp.is_featured
         FROM tour_products tp
         LEFT JOIN tour_catalog_categories tcc ON tcc.id = tp.catalog_cat_id
         WHERE (tp.vendor_business_id = ? OR tp.vendor_business_id IS NULL) AND tp.is_active = 1
         ORDER BY tp.is_featured DESC, tp.created_at DESC`,
        [business.id]
      ),
    ]);

    const hasCustomLayout = Array.isArray(layout?.components) && layout.components.length > 0;
    const publicLayout: MinisiteLayout = {
      mode: layout?.mode === 'untied' ? 'untied' : 'replace',
      components: hasCustomLayout
        ? layout.components
        : [
            { id: 'hero_1', type: 'vendor_hero', order: 0, props: {} },
            { id: 'gallery_1', type: 'vendor_gallery', order: 1, props: {} },
            { id: 'services_1', type: 'vendor_services', order: 2, props: {} },
            { id: 'cta_1', type: 'cta_section', order: 3, props: {} },
          ],
      site_settings: layout?.site_settings || {},
    } as MinisiteLayout;

    const storefront: BusinessContext = {
      id: business.id,
      slug: business.slug || business.id,
      name: business.name,
      type_id: String(business.type_id || ''),
      type_name: typeRow?.name || '',
      custom_data: parseJson(business.custom_data),
      gallery: gallery || [],
      blogs: blogs || [],
      tourProducts: products || [],
      vendorPhone: business.vendor_phone || business.phone || '',
    };

    const sectionNav: SectionTabItem[] = await resolveSectionNav(business);

    // Carried beside the storefront rather than inside it: the renderer's
    // contract stays untouched, and only the metadata needs the second name.
    return { layout: publicLayout, storefront, sectionNav, typeNameAr: typeRow?.name_ar || null };
  } catch {
    return null;
  }
}

function heroImageFor(business: any, gallery: any[], cd: any) {
  const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
  return (
    gallery?.[0]?.url ||
    identity.cover_image ||
    identity.hero_image ||
    identity.cover_image_url ||
    cd?.cover_image ||
    cd?.hero_image ||
    FALLBACK_COVER
  );
}

async function resolveLang(langParam?: string): Promise<Lang> {
  // `x-siwa-locale` is set by middleware for /en/... URLs (Arabic owns the bare
  // path). The query parameter stays as a fallback for a link that slipped past
  // the redirect, but Accept-Language no longer picks the language: the address
  // does, so the document's lang/dir and its content can never disagree.
  const fromPath = await pathLocale();
  if (fromPath) return fromPath;
  return langParam === 'en' ? 'en' : 'ar';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = siteBase();

  // A market front door is not a business page: it answers with the market's own
  // title, canonical and hreflang instead of a business lookup that cannot match.
  // A market created since the last deploy is absent from the static segment
  // list, so the registry decides as well.
  if (isMarketSegment(slug) || (await getMarketBySlug(slug))) {
    const market = await getMarketBySlug(slug);
    if (!market || !market.active) {
      return { title: 'Not found | Siwify', robots: { index: false, follow: false } };
    }
    const locale = (await pathLocale()) ?? 'ar';
    const publicPath = `/${market.slug}`;
    const canonical = localeUrl(base, locale, publicPath);
    const label = marketName(market, locale);
    return {
      title: `${label} | Siwify`,
      alternates: { canonical, languages: languageAlternates(base, publicPath) },
      openGraph: { title: label, url: canonical, siteName: 'Siwify', type: 'website' },
    };
  }

  const business = await findBusiness(slug);
  if (business) {
    const cd = normalizeCustomData(business.custom_data);
    const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
    const typeRow = business.type_id
      ? await queryOne<{ name: string; name_ar: string | null }>(
          'SELECT name, name_ar FROM business_types WHERE id = ?',
          [business.type_id]
        ).catch(() => null)
      : null;

    let gallery: any[] = [];
    try {
      gallery = await query<any>(
        `SELECT url FROM vendor_gallery
         WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
         ORDER BY is_hero DESC, id DESC LIMIT 1`,
        [business.id]
      );
    } catch {
      gallery = [];
    }

    const locale = (await pathLocale()) ?? 'ar';
    const ar = locale === 'ar';
    // The Arabic page prints the Arabic typology and the Arabic name. `||` and
    // not `??`: an admin can save the Arabic field empty, and a blank chip is
    // worse than an English one.
    const typeName = displayType(ar ? typeRow?.name_ar || typeRow?.name : typeRow?.name) || 'Egypt';
    const businessName = String((ar ? (business as any).name_ar || business.name : business.name) || business.name);
    const description =
      String(
        identity.tagline ||
          cd?.tagline ||
          identity.description ||
          cd?.description ||
          ''
      )
        .replace(/<[^>]*>/g, ' ')
        .trim()
        .slice(0, 158) ||
      `${businessName} — ${typeName}, listed on Siwify, Egypt's marketplace for properties & tourism. See photos, services and contact directly on WhatsApp. No commission.`;

    const image = heroImageFor(business, gallery, cd);
    const marketSlug = String((business as any).market_id || (await pathMarketSlug()) || DEFAULT_MARKET_SLUG);
    // The address follows the listing's own choice: `url_style = 'root'` answers at
    // /villa-name (what every QR code already prints), 'market' at /hurghada/villa.
    // Both resolve either way — this only decides which one a crawler keeps.
    const publicPath = businessPublicPath(business, marketSlug);
    const canonical = localeUrl(base, locale, publicPath);

    // Indexability gate for prospect pages: no claim, no photo, no copy means
    // there is nothing here worth indexing, and publishing hundreds of those is
    // how a directory teaches Google to ignore the pages that do have content.
    // QR and WhatsApp links keep working either way.
    const isThin = !Number(business.is_claimed) && gallery.length === 0 && description.length < 80;

    const title = ar
      ? `${businessName} — ${typeName} في مصر | Siwify`
      : `${businessName} · ${typeName} in Egypt | Siwify`;
    const metaDescription = ar
      ? `${businessName} في مصر — صور وخدمات وتواصل مباشر عبر واتساب بدون عمولة.`
      : description;

    return {
      title,
      description: metaDescription,
      alternates: {
        canonical,
        languages: languageAlternates(base, publicPath),
      },
      robots: isThin ? { index: false, follow: true } : { index: true, follow: true },
      openGraph: {
        title: `${businessName} · ${typeName}`,
        description: metaDescription,
        url: canonical,
        siteName: 'Siwify',
        type: 'website',
        locale: ar ? 'ar_EG' : 'en_US',
        alternateLocale: ar ? ['en_US'] : ['ar_EG'],
        images: [{ url: image, width: 1200, height: 630, alt: businessName }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${businessName} · ${typeName}`,
        description: metaDescription,
        images: [image],
      },
    };
  }

  // A compound answers at /{market}/{compound}. It is not a listing, so the
  // business lookup above cannot match it; and it is resolved after the business
  // and CMS branches, so no address that works today can change owner.
  const compoundMarket = await pathMarketSlug();
  if (compoundMarket) {
    const compound = await getDevelopmentBySlug(compoundMarket, slug);
    if (compound) {
      const market = await getMarketBySlug(compoundMarket);
      const locale = (await pathLocale()) ?? 'ar';
      const ar = locale === 'ar';
      const label = ar ? compound.nameAr || compound.nameEn : compound.nameEn || compound.nameAr;
      const facets = await getDevelopmentFacets(compound.id);
      const hasSupply = facets.some((facet) => facet.listings > 0);
      const publicPath = `/${compoundMarket}/${compound.slug}`;
      const canonical = localeUrl(base, locale, publicPath);
      // The classifier reaches the search result too: calling a town a project
      // is the sentence a visitor would notice first.
      const kindWordAr =
        { compound: 'مشروع', town: 'بلدة', village: 'قرية', resort: 'منتجع' }[compound.kind] || 'مكان';
      const kindWordEn =
        { compound: 'a project', town: 'a town', village: 'a village', resort: 'a resort' }[compound.kind] ||
        'a place';
      return {
        title: `${label} | Siwify`,
        description: ar
          ? `${label} — ${kindWordAr} في ${market ? market.nameAr : compoundMarket}، مع كل الوحدات والأنشطة المتاحة بداخله.`
          : `${label} — ${kindWordEn} in ${market ? market.nameEn : compoundMarket}, with every unit and business inside it.`,
        alternates: { canonical, languages: languageAlternates(base, publicPath) },
        // Same thin-content rule as a listing: a compound with nothing published
        // inside it is a directory page with no directory.
        robots: hasSupply ? { index: true, follow: true } : { index: false, follow: true },
        openGraph: { title: label, url: canonical, siteName: 'Siwify', type: 'website' },
      };
    }
  }

  const cfg = await loadWebsiteConfig(slug);
  if (cfg) {
    const name = cfg.site_settings?.site_name || slug.replace(/[-_]+/g, ' ');
    const locale = (await pathLocale()) ?? 'ar';
    return {
      title: `${name} | Siwify`,
      description: String(cfg.site_settings?.site_description || '').slice(0, 158) || `${name} on Siwify.`,
      alternates: {
        canonical: localeUrl(base, locale, `/${slug}`),
        languages: languageAlternates(base, `/${slug}`),
      },
      openGraph: {
        title: name,
        url: localeUrl(base, locale, `/${slug}`),
        siteName: 'Siwify',
        type: 'website',
        locale: locale === 'ar' ? 'ar_EG' : 'en_US',
        alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_EG'],
      },
    };
  }

  // A zone answers at /{market}/{zone}. Resolved after every branch the page
  // resolves, so metadata and markup can never disagree about who owns a slug.
  const zoneMarket = await pathMarketSlug();
  if (zoneMarket) {
    const zone = await getZone(zoneMarket, slug);
    if (zone) {
      const market = await getMarketBySlug(zoneMarket);
      const locale = (await pathLocale()) ?? 'ar';
      const ar = locale === 'ar';
      const label = ar ? zone.nameAr || zone.nameEn : zone.nameEn || zone.nameAr;
      const publicPath = `/${zoneMarket}/${zone.slug}`;
      const canonical = localeUrl(base, locale, publicPath);
      return {
        title: `${label} | Siwify`,
        description: ar
          ? `${label} — الأنشطة والخدمات المنشورة في هذه المنطقة.`
          : `${label} — the businesses and services published in this area.`,
        alternates: { canonical, languages: languageAlternates(base, publicPath) },
        // Same thin-content rule as a listing or a compound: a place with nothing
        // published in it is a directory page with no directory.
        robots: zone.listings > 0 ? { index: true, follow: true } : { index: false, follow: true },
        openGraph: { title: label, url: canonical, siteName: 'Siwify', type: 'website' },
      };
    }
  }

  // A root vanity (an admin-chosen siwify.com/{slug}) resolves last, and only
  // for a market-less URL, so it can claim an address nothing else wanted but
  // can never pull one out from under a page that already answers here today.
  if (!(await pathMarketSlug())) {
    const vanity = await resolveVanityRoot(slug);
    if (vanity) {
      const locale = (await pathLocale()) ?? 'ar';
      const ar = locale === 'ar';
      const label =
        vanity.kind === 'development'
          ? ar
            ? vanity.development.nameAr || vanity.development.nameEn
            : vanity.development.nameEn || vanity.development.nameAr
          : ar
            ? vanity.developer.nameAr || vanity.developer.name
            : vanity.developer.name;
      const publicPath = `/${slug}`;
      const canonical = localeUrl(base, locale, publicPath);
      return {
        title: `${label} | Siwify`,
        description: ar ? `${label} على Siwify.` : `${label} on Siwify.`,
        alternates: { canonical, languages: languageAlternates(base, publicPath) },
        robots: { index: true, follow: true },
        openGraph: { title: label, url: canonical, siteName: 'Siwify', type: 'website' },
      };
    }
  }

  return { title: 'Not found | Siwify', robots: { index: false, follow: true } };
}

function BusinessJsonLd({
  business,
  name,
  typeName,
  image,
  description,
}: {
  business: any;
  /** Localised display name; the other language rides along as alternateName. */
  name?: string;
  typeName: string;
  image: string;
  description: string;
}) {
  const cd = normalizeCustomData(business.custom_data);
  const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
  const phone = digits(business.vendor_phone || business.phone || identity.whatsapp || identity.phone);
  const sameAs = [
    business.google_profile_url,
    cd?.google_profile_url,
    identity.google_profile_url,
    identity.google_maps_url,
    identity.facebook,
    identity.instagram,
  ].filter((entry: unknown) => typeof entry === 'string' && entry.startsWith('http'));

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: name || business.name,
    url: `${siteBase()}${businessPublicPath(business)}`,
    description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Siwa',
      addressRegion: 'Matrouh',
      addressCountry: 'EG',
    },
  };
  if (image && image.startsWith('http')) data.image = [image];
  // The unused name is still declared, so a search engine sees both spellings.
  const alternate = (name && name !== business.name ? business.name : business.name_ar) as string | null;
  if (alternate && alternate !== (name || business.name)) data.alternateName = alternate;
  if (phone) data.telephone = phone.startsWith('00') ? `+${phone.slice(2)}` : `+20${phone.replace(/^0/, '')}`;
  if (typeName) data.additionalType = typeName;
  if (sameAs.length) data.sameAs = [...new Set(sameAs)];

  // `<` is escaped so vendor-supplied text can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

// Owner prompts ("claim this page" strips and cards) no longer render on the
// public minisite. Onboarding reaches owners through the WhatsApp links we send
// (/vendor/claim?slug=…), and instructions/ads live only in the private
// dashboard — customers see the business, not its back office.

function BilingualLanding({ business, lang, initialSlug }: { business: any; lang: Lang; initialSlug: string }) {
  const ar = lang === 'ar';
  const cd = normalizeCustomData(business.custom_data);
  const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
  const cover = heroImageFor(business, [], cd);
  const name = business.name || initialSlug;
  const tagline =
    identity.tagline || cd?.tagline || (ar ? 'تجربة أصيلة على سيوِيفاي' : 'An authentic experience, listed on Siwify');
  const description =
    identity.description ||
    cd?.description ||
    (ar
      ? `${name} أحد مقدّمي الخدمات على سيوِيفاي. تواصل مباشرة للحجز والاستفسار.`
      : `${name} is a listed provider on Siwify, Egypt's marketplace. Contact directly to book or ask anything.`);
  const rawPhone = digits(business.vendor_phone || business.phone || identity.whatsapp || identity.phone);
  const wa = waNumber(rawPhone);
  const waText = encodeURIComponent(
    ar
      ? `مرحباً ${name}، وجدت صفحتكم على سيوايفاي وأود الاستفسار عن خدماتكم.`
      : `Hello ${name}, I found your page on Siwify and would like to ask about your services.`
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        fontFamily: "'Noto Sans Arabic', 'Cairo', 'Inter', sans-serif",
        color: '#0F172A',
        direction: ar ? 'rtl' : 'ltr',
      }}
    >
      <MinisiteTapTracker slug={business.slug || initialSlug} />
      <MarketplaceHeader title={name} accentColor="#D4AF37" />
      <MinisiteSectionTabs slug={business.slug || initialSlug} items={[]} />

      <section
        style={{
          position: 'relative',
          height: 'clamp(320px, 45vw, 520px)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
        }}
      >
        <img
          src={cover}
          alt={name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.3) 60%, rgba(15,23,42,0.7) 100%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem', maxWidth: 800, color: '#FFFFFF' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid #D4AF37',
              borderRadius: 50,
              padding: '0.35rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#F5E6AD',
              marginBottom: '1rem',
            }}
          >
            {ar ? '✓ نشاط في سيوة · 0% عمولة' : 'Verified in Siwa · 0% commission'}
          </div>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900 }}>
            {name}
          </h1>
          <p style={{ margin: '0 auto 1.5rem', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', opacity: 0.9, maxWidth: 600 }}>
            {tagline}
          </p>
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: '#25D366',
                color: '#FFFFFF',
                padding: '0.85rem 1.75rem',
                borderRadius: 50,
                fontWeight: 900,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
              }}
            >
              {ar ? 'تواصل واحجز عبر واتساب' : 'Message on WhatsApp'}
            </a>
          )}
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 900 }}>
            {ar ? 'نبذة عن النشاط' : 'About this business'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <Link
            href={ar ? `/en/${initialSlug}` : `/${initialSlug}`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              color: '#0F172A',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {ar ? 'English' : 'العربية'}
          </Link>
          <Link
            href="/categories"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#0F172A',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {ar ? 'تصفح كل القطاعات' : 'Browse all categories'}
          </Link>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
            {ar ? 'صفحة رسمية على منصة SiWiFy' : 'An official SiWiFy page'}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            {ar
              ? 'احجز مباشرة عبر واتساب — بدون وسيط وبدون عمولات.'
              : 'Book directly on WhatsApp — no middleman, no commission.'}
          </p>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
        <MinisiteQRCode
          businessName={name}
          targetUrl={`${siteBase()}${businessPublicPath(business)}`}
          businessId={business.id}
          src="qr"
        />
      </div>
    </div>
  );
}

export default async function CanonicalVanityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { lang: langParam, category } = await searchParams;

  // /{market} is the market's front door. The route tree is flat, so the slug
  // decides: a market segment renders the market, anything else is a listing.
  // A market created since the last deploy is resolved from the registry.
  if (isMarketSegment(slug) || (await getMarketBySlug(slug))) {
    return <MarketHome marketSlug={slug} category={category} />;
  }

  const lang = await resolveLang(langParam);

  const business = await findBusiness(slug);

  if (business) {
    const cd = normalizeCustomData(business.custom_data);
    const mini = optimizeImageUrlsDeep(await loadMinisite(business));

    if (mini) {
      // The Arabic address prints the Arabic typology and the Arabic name, with
      // the English ones behind them so a page can never render blank.
      const arabic = lang === 'ar';
      const typeName = displayType(
        arabic ? mini.typeNameAr || mini.storefront.type_name : mini.storefront.type_name
      );
      // One name for the whole page: the structured data, the share card and the
      // hero all print the same language.
      const businessName = String(
        (arabic ? business.name_ar || business.name : business.name) || business.name
      );
      // The hero prints `business.name`, so the Arabic address hands it the
      // Arabic one instead of an English title over Arabic chrome.
      const storefront = arabic
        ? {
            ...mini.storefront,
            name: business.name_ar || mini.storefront.name,
            // Carried so the hero badge prints the Arabic typology too.
            type_name_ar: mini.typeNameAr,
          }
        : mini.storefront;
      const description =
        String(
          cd?.tagline ||
            cd?.business_info?.tagline ||
            cd?.basic?.tagline ||
            cd?.description ||
            cd?.business_info?.description ||
            ''
        )
          .replace(/<[^>]*>/g, ' ')
          .trim()
          .slice(0, 158) ||
        `${storefront.name} — ${typeName}, listed on Siwify, Egypt.`;
      const image = heroImageFor(business, mini.storefront.gallery, cd);
      const publicSlug = business.slug || slug;
      // Tabs follow the address, not the browser: an /ar page gets Arabic labels
      // while the hrefs stay locale-free, since the shell adds the prefix.
      const sectionNav: SectionTabItem[] = arabic
        ? mini.sectionNav.map((item) => ({ ...item, label: item.labelAr || item.label }))
        : mini.sectionNav;
      // An /ar address should render Arabic chrome, not only an Arabic title.
      //
      // The same vertical skin the sectional minisite wears is applied here so
      // the landing page a QR code opens is not generic-gold while its tabs are
      // themed. The builder body derives its whole palette from
      // site_settings.primary_color, so one override repaints hero, cards and
      // buttons; the section navigator takes the accent as a prop.
      const pageMarket = String((business as any).market_id || (await pathMarketSlug()) || DEFAULT_MARKET_SLUG);
      const verticalMarket = await getMarketBySlug(pageMarket).catch(() => null);
      const vertical = resolveMinisiteVertical({
        override: cd?.minisite_vertical,
        typeId: business.type_id,
        hasDevelopment: Boolean((business as any).development_id),
        marketRevenueModel: verticalMarket?.revenueModel,
      });
      const verticalAccent = MINISITE_VERTICAL_THEMES[vertical].accent;
      const themedLayout = {
        ...mini.layout,
        site_settings: {
          ...((mini.layout as any)?.site_settings || {}),
          ...(arabic ? { lang: 'ar' } : {}),
          primary_color: verticalAccent,
        },
      };

      return (
        <>
          <BusinessJsonLd business={business} name={businessName} typeName={typeName} image={image} description={description} />
          <MinisiteTapTracker slug={publicSlug} />
          <MinisiteSectionTabs slug={publicSlug} items={sectionNav} lang={lang} accent={verticalAccent} />
          {/* One language owner for the whole minisite: the address seeds it, the
              header toggle moves it, and every surface below reads the answer. */}
          <MinisiteLangProvider initialLang={lang}>
            <MinisiteBuilderRenderer
              layout={themedLayout}
              business={storefront}
              showQRCode
            />
          </MinisiteLangProvider>
        </>
      );
    }

    return (
      <>
        <BusinessJsonLd
          business={business}
          typeName=""
          image={heroImageFor(business, [], cd)}
          description={`${business.name} — Siwify marketplace`}
        />
        <BilingualLanding business={business} lang={lang} initialSlug={slug} />
      </>
    );
  }

  const cfg = await loadWebsiteConfig(slug);
  if (cfg) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <MarketplaceHeader
          title={cfg.site_settings?.site_name || slug}
          accentColor={cfg.site_settings?.primary_color || '#D4AF37'}
        />
        <DynamicHomepageRenderer
          layout={cfg.layout}
          settings={cfg.site_settings || null}
          pageId={slug}
        />
      </div>
    );
  }

  // A compound is resolved last, after the listing and CMS branches, so no URL
  // that resolves today can change hands tomorrow.
  const compoundSlug = await pathMarketSlug();
  if (compoundSlug) {
    const compound = await getDevelopmentBySlug(compoundSlug, slug);
    if (compound) {
      // The path decides the language; when it declares none the page falls back
      // to the site default, which is now Arabic (the bare path is Arabic).
      const compoundLang = (await pathLocale()) ?? lang;
      return <CompoundPage compound={optimizeImageUrlsDeep(compound)} marketSlug={compoundSlug} lang={compoundLang} />;
    }
  }

  // A zone answers at /{market}/{zone}, after the compound and for the same
  // reason: a place may only win an address nothing else wanted.
  const zoneMarket = await pathMarketSlug();
  if (zoneMarket) {
    const zone = await getZone(zoneMarket, slug);
    if (zone) {
      const zoneLang = (await pathLocale()) ?? lang;
      return <ZonePage zone={zone} marketSlug={zoneMarket} lang={zoneLang} />;
    }
  }

  // A root vanity (an admin-chosen siwify.com/{slug}) renders last, after the
  // compound and zone branches, and only for a market-less URL — the same order
  // generateMetadata resolves in, so markup and metadata never disagree about who
  // owns the address. A flag can claim an empty address, never a taken one.
  if (!(await pathMarketSlug())) {
    const vanity = await resolveVanityRoot(slug);
    if (vanity) {
      const vanityLang = (await pathLocale()) ?? lang;
      const ar = vanityLang === 'ar';
      if (vanity.kind === 'development') {
        // A root pin publishes the project on its own merit. If its market is
        // still dark, tell the page so it never links back to a closed door.
        const vanityMarket = await getMarketBySlug(vanity.development.marketId);
        return (
          <CompoundPage
            compound={optimizeImageUrlsDeep(vanity.development)}
            marketSlug={vanity.development.marketId}
            lang={vanityLang}
            marketOpen={Boolean(vanityMarket?.active)}
          />
        );
      }
      return <DeveloperPortfolio slug={vanity.developer.slug} ar={ar} />;
    }
  }

  // Unknown slug: a real 404 (the old version answered 200 with an exploration
  // page, which trains search engines to keep a dead URL alive).
  notFound();
}
