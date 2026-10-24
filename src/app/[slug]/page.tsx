import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';
import MinisiteBuilderRenderer, { type BusinessContext } from '@/components/MinisiteBuilderRenderer';
import MinisiteQRCode from '@/components/MinisiteQRCode';
import MinisiteTapTracker from '@/components/MinisiteTapTracker';
import MinisiteSectionTabs, { type SectionTabItem } from '@/components/MinisiteSectionTabs';
import type { MinisiteLayout } from '@/lib/minisite-governance-client';
import { MINISITE_LAYOUT_KEY } from '@/lib/minisite-layout';
import { query, queryOne, normalizeCustomData } from '@/lib/db';
import { getBusinessSlugCandidates, getPublicAppUrl } from '@/lib/public-url';
import { resolveSectionNav } from '@/lib/vanity-section-nav';
import { currentLocale, languageAlternates, localeUrl, pathLocale } from '@/lib/site-locale';

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
  return String(value || '').replace(/[^0-9]/g, '');
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
  try {
    if (UUID_RE.test(slug)) {
      return await queryOne<any>(
        `SELECT b.*, t.features AS tier_features
         FROM businesses b
         LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
         WHERE b.id = ? LIMIT 1`,
        [slug]
      );
    }

    const candidates = [...new Set(getBusinessSlugCandidates(slug))];
    if (!candidates.length) return null;

    const slugParts = candidates.map(() => 'b.slug = ?').join(' OR ');
    const nameParts = candidates
      .map(() => 'LOWER(REPLACE(REPLACE(TRIM(b.name), " ", "-"), "_", "-")) = ?')
      .join(' OR ');

    return await queryOne<any>(
      `SELECT b.*, t.features AS tier_features
       FROM businesses b
       LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
       WHERE (${slugParts}) OR (b.custom_domain = ? AND b.custom_domain_verified = 1) OR (${nameParts})
       LIMIT 1`,
      [...candidates, slug, ...candidates]
    );
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
      ? await queryOne<{ name: string }>('SELECT name FROM business_types WHERE id = ?', [business.type_id])
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

    return { layout: publicLayout, storefront, sectionNav };
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
  // `x-siwa-locale` is set by middleware for /ar/... and /en/... URLs; the query
  // parameter and Accept-Language stay as fallbacks for links that predate them.
  return currentLocale(langParam);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = siteBase();

  const business = await findBusiness(slug);
  if (business) {
    const cd = normalizeCustomData(business.custom_data);
    const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
    const typeRow = business.type_id
      ? await queryOne<{ name: string }>('SELECT name FROM business_types WHERE id = ?', [business.type_id]).catch(() => null)
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

    const typeName = displayType(typeRow?.name) || 'Siwa';
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
      `${business.name} — ${typeName} in Siwa Oasis. See photos, services and contact directly on WhatsApp. No commission.`;

    const image = heroImageFor(business, gallery, cd);
    const locale = await currentLocale();
    const ar = locale === 'ar';
    const publicPath = `/${business.slug || slug}`;
    const canonical = localeUrl(base, (await pathLocale()) ?? 'en', publicPath);

    // Indexability gate for prospect pages: no claim, no photo, no copy means
    // there is nothing here worth indexing, and publishing hundreds of those is
    // how a directory teaches Google to ignore the pages that do have content.
    // QR and WhatsApp links keep working either way.
    const isThin = !Number(business.is_claimed) && gallery.length === 0 && description.length < 80;

    const title = ar
      ? `${business.name} — ${typeName} في واحة سيوة | Siwify`
      : `${business.name} · ${typeName} | Siwify`;
    const metaDescription = ar
      ? `${business.name} في واحة سيوة — صور وخدمات وتواصل مباشر عبر واتساب بدون عمولة.`
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
        title: ar ? `${business.name} — ${typeName}` : `${business.name} · ${typeName}`,
        description: metaDescription,
        url: canonical,
        siteName: 'Siwify',
        type: 'website',
        images: [{ url: image, width: 1200, height: 630, alt: business.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: ar ? `${business.name} — ${typeName}` : `${business.name} · ${typeName}`,
        description: metaDescription,
        images: [image],
      },
    };
  }

  const cfg = await loadWebsiteConfig(slug);
  if (cfg) {
    const name = cfg.site_settings?.site_name || slug.replace(/[-_]+/g, ' ');
    return {
      title: `${name} | Siwify`,
      description: String(cfg.site_settings?.site_description || '').slice(0, 158) || `${name} on Siwify.`,
      alternates: { canonical: `${base}/${slug}` },
      openGraph: { title: name, url: `${base}/${slug}`, siteName: 'Siwify', type: 'website' },
    };
  }

  return { title: 'Not found | Siwify', robots: { index: false, follow: true } };
}

function BusinessJsonLd({
  business,
  typeName,
  image,
  description,
}: {
  business: any;
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
    name: business.name,
    url: `${siteBase()}/${business.slug || business.id}`,
    description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Siwa',
      addressRegion: 'Matrouh',
      addressCountry: 'EG',
    },
  };
  if (image && image.startsWith('http')) data.image = [image];
  if (phone) data.telephone = phone.startsWith('00') ? `+${phone.slice(2)}` : `+20${phone.replace(/^0/, '')}`;
  if (typeName) data.additionalType = typeName;
  if (sameAs.length) data.sameAs = [...new Set(sameAs)];

  // `<` is escaped so vendor-supplied text can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

function ClaimStrip({ business, lang }: { business: any; lang: Lang }) {
  const ar = lang === 'ar';
  return (
    <div
      style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        gap: '0.9rem',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        fontFamily: "'Cairo', 'Noto Sans Arabic', 'Inter', sans-serif",
        fontSize: '0.8rem',
      }}
    >
      <span style={{ opacity: 0.85, fontWeight: 700 }}>
        {ar ? 'هل أنت صاحب هذا النشاط؟' : 'Is this your business?'}
      </span>
      <Link
        href={`/vendor/claim?slug=${encodeURIComponent(business.slug || business.id)}`}
        style={{
          background: '#D4AF37',
          color: '#0F172A',
          fontWeight: 900,
          padding: '0.4rem 1rem',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        {ar ? 'استلم الصفحة مجاناً' : 'Claim this page — free'}
      </Link>
    </div>
  );
}

function BilingualLanding({ business, lang, initialSlug }: { business: any; lang: Lang; initialSlug: string }) {
  const ar = lang === 'ar';
  const cd = normalizeCustomData(business.custom_data);
  const identity = { ...(cd?.business_info || {}), ...(cd?.sec_1_identity || {}), ...(cd?.basic || {}) };
  const cover = heroImageFor(business, [], cd);
  const name = business.name || initialSlug;
  const tagline =
    identity.tagline || cd?.tagline || (ar ? 'تجربة أصيلة في واحة سيوة' : 'An authentic experience in Siwa Oasis');
  const description =
    identity.description ||
    cd?.description ||
    (ar
      ? `${name} أحد مقدمي الخدمات في واحة سيوة. تواصل مباشرة للحجز والاستفسار.`
      : `${name} is a listed provider in Siwa Oasis. Contact directly to book or ask anything.`);
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
            href={ar ? `/${initialSlug}` : `/ar/${initialSlug}`}
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
            border: '1.5px dashed #CBD5E1',
            borderRadius: 16,
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
            {ar ? 'هل أنت صاحب هذا النشاط التجاري؟' : 'Do you own this business?'}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem' }}>
            {ar
              ? 'استلم صفحتك، عدّل بياناتك، واستقبل حجوزاتك مباشرة — مجاناً وبدون عمولات.'
              : 'Claim the page, edit your details and receive bookings directly — free, no commission.'}
          </p>
          <Link
            href={`/vendor/claim?slug=${encodeURIComponent(business.slug || initialSlug)}`}
            style={{
              display: 'inline-block',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '0.65rem 1.5rem',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: '0.82rem',
              textDecoration: 'none',
            }}
          >
            {ar ? 'استلام وإدارة النشاط' : 'Claim and manage'}
          </Link>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
        <MinisiteQRCode
          businessName={name}
          slug={business.slug || initialSlug}
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
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const lang = await resolveLang(langParam);

  const business = await findBusiness(slug);

  if (business) {
    const cd = normalizeCustomData(business.custom_data);
    const mini = await loadMinisite(business);

    if (mini) {
      const typeName = displayType(mini.storefront.type_name);
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
        `${business.name} — ${typeName} in Siwa Oasis.`;
      const image = heroImageFor(business, mini.storefront.gallery, cd);
      const publicSlug = business.slug || slug;
      // An /ar address should render Arabic chrome, not only an Arabic title.
      const layout =
        lang === 'ar'
          ? { ...mini.layout, site_settings: { ...((mini.layout as any)?.site_settings || {}), lang: 'ar' } }
          : mini.layout;

      return (
        <>
          <BusinessJsonLd business={business} typeName={typeName} image={image} description={description} />
          {!Number(business.is_claimed) && <ClaimStrip business={business} lang={lang} />}
          <MinisiteTapTracker slug={publicSlug} />
          <MinisiteSectionTabs slug={publicSlug} items={mini.sectionNav} />
          <MinisiteBuilderRenderer
            layout={layout}
            business={mini.storefront}
            showQRCode
          />
        </>
      );
    }

    return (
      <>
        <BusinessJsonLd
          business={business}
          typeName=""
          image={heroImageFor(business, [], cd)}
          description={`${business.name} — Siwa Oasis`}
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

  // Unknown slug: a real 404 (the old version answered 200 with an exploration
  // page, which trains search engines to keep a dead URL alive).
  notFound();
}
