'use client';

/**
 * SectionAggregationPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal page component used by all 10 main-site section pages.
 *
 * Behaviour:
 *  1. Tries to load an admin-configured builder layout via website_configs.
 *     If found → renders DynamicHomepageRenderer (admin layout wins).
 *  2. If no admin layout → automatically fetches and renders all vendors
 *     who have live data in this section's primary DB table.
 *  3. Vendor cards link directly to /{slug}#{sectionId} on their minisite.
 *  4. Fully responsive (mobile-first, clamp sizing, CSS grid).
 *  5. Search + type filter — live client-side search + optional server refetch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

// ── Types ────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_image: string | null;
  is_trusted: boolean | number;
  type_name: string | null;
  vendor_whatsapp: string | null;
  vendor_phone: string | null;
  item_count: number;
  section_image: string | null;
  min_price: number | null;
  max_price: number | null;
  max_discount: number | null;
}

interface SectionMeta {
  label: string;
  emoji: string;
  color: string;
  mainSiteUrl: string;
}

interface BridgeMeta {
  label: string;
  mainSiteMirror: { url: string; label: string; icon: string; color: string };
  adminContentPath: string;
  vendorContentPath?: string;
}

interface SectionAggregationPageProps {
  /** Canonical section ID, e.g. "sec_5_experiences" */
  sectionId: string;
  /** Website config key for admin builder override, e.g. "website_packages" */
  pageConfigId: string;
  /** Human-readable page name for meta/SEO */
  pageLabel: string;
  /** Short SEO description shown in hero sub-heading */
  description: string;
  /** Hero accent colour (fallback if section meta not loaded) */
  accentColor?: string;
  /** CTA label shown on each vendor card */
  ctaLabel?: string;
  /** If true, show a "Be a Partner" registration CTA in empty state */
  showPartnerCta?: boolean;
  /** Optional extra content rendered above the vendor grid */
  topContent?: React.ReactNode;
  /**
   * When true, skips the builder config fetch and renders only the vendor grid.
   * Use when SectionAggregationPage is embedded inside another layout that
   * already handled the builder config check (e.g. CategorySearchPage).
   */
  skipBuilderFetch?: boolean;
}


// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(min: number | null, max: number | null, currency = 'EGP'): string {
  if (!min && !max) return '';
  if (min && max && min !== max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  return `${currency} ${(min || max || 0).toLocaleString()}`;
}

function getWhatsAppLink(phone: string | null): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9+]/g, '');
  return clean ? `https://wa.me/${clean}` : null;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '180px', background: '#e2e8f0' }} />
      <div style={{ padding: '1rem' }}>
        <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem', width: '60%' }} />
        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', width: '40%' }} />
        <div style={{ height: '36px', background: '#f1f5f9', borderRadius: '8px', marginTop: '1rem' }} />
      </div>
    </div>
  );
}

// ── Vendor Card ───────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  sectionId,
  accentColor,
  ctaLabel,
}: {
  vendor: Vendor;
  sectionId: string;
  accentColor: string;
  ctaLabel: string;
}) {
  const isTrusted = Boolean(vendor.is_trusted);
  const coverSrc  = vendor.section_image || vendor.cover_image ||
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600&auto=format&fit=crop';
  const waLink    = getWhatsAppLink(vendor.vendor_whatsapp || vendor.vendor_phone);
  const price     = formatPrice(vendor.min_price, vendor.max_price);

  return (
    <article
      style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        border: isTrusted ? `1.5px solid ${accentColor}33` : '1.5px solid transparent',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)';
      }}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#e2e8f0' }}>
        <img
          src={coverSrc}
          alt={vendor.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?q=80&w=600&auto=format&fit=crop'; }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />

        {/* Trusted badge */}
        {isTrusted && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            background: accentColor, color: '#fff',
            fontSize: '0.58rem', fontWeight: 900, letterSpacing: '1px',
            padding: '3px 8px', borderRadius: '20px',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <i className="fas fa-check-circle" style={{ fontSize: '0.6rem' }} />
            TRUSTED
          </div>
        )}

        {/* Item count badge */}
        {vendor.item_count > 0 && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
            padding: '3px 8px', borderRadius: '20px',
          }}>
            {vendor.item_count} {vendor.item_count === 1 ? 'item' : 'items'}
          </div>
        )}

        {/* Logo */}
        {vendor.logo_url && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '12px',
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#fff', overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src={vendor.logo_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              loading="lazy"
            />
          </div>
        )}

        {/* Discount badge */}
        {vendor.max_discount && vendor.max_discount > 0 && (
          <div style={{
            position: 'absolute', bottom: '10px', right: '12px',
            background: '#dc2626', color: '#fff',
            fontSize: '0.7rem', fontWeight: 900,
            padding: '3px 8px', borderRadius: '20px',
          }}>
            -{vendor.max_discount}% OFF
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontWeight: 800, fontSize: 'clamp(0.85rem, 1.5vw, 1rem)', color: '#1e293b', lineHeight: 1.3 }}>
          {vendor.name}
        </div>

        {vendor.type_name && (
          <div style={{
            fontSize: '0.65rem', fontWeight: 700, color: accentColor,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {vendor.type_name}
          </div>
        )}

        {price && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            From {price}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href={`/${vendor.slug}#${sectionId}`}
            style={{
              flex: 1, minWidth: '80px',
              background: accentColor, color: '#fff',
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.72rem',
              textAlign: 'center', textDecoration: 'none',
              display: 'block',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            {ctaLabel}
          </Link>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Direct WhatsApp — 0% commission"
              style={{
                background: '#25D366', color: '#fff',
                padding: '0.5rem 0.65rem', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.72rem',
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <i className="fab fa-whatsapp" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SectionAggregationPage({
  sectionId,
  pageConfigId,
  pageLabel,
  description,
  accentColor = '#D4AF37',
  ctaLabel,
  showPartnerCta = true,
  topContent,
  skipBuilderFetch = false,
}: SectionAggregationPageProps) {

  const [builderConfig, setBuilderConfig]   = useState<any>(null);
  const [vendors, setVendors]               = useState<Vendor[]>([]);
  const [sectionMeta, setSectionMeta]       = useState<SectionMeta | null>(null);
  const [bridgeMeta, setBridgeMeta]         = useState<BridgeMeta | null>(null);
  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading]               = useState(!skipBuilderFetch);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [totalVendors, setTotalVendors]     = useState(0);

  const resolvedAccent = sectionMeta?.color || accentColor;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // 1. Try to load admin builder config (skipped when embedded)
  useEffect(() => {
    if (skipBuilderFetch) return;
    fetch(`/api/jana/website?id=${pageConfigId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const config = Array.isArray(data) ? data[0] : data;
        const layout = [
          ...(config?.header_components || []),
          ...(config?.body_components   || []),
          ...(config?.footer_components || []),
        ];
        if (layout.length > 0) setBuilderConfig({ ...config, layout });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageConfigId, skipBuilderFetch]);



  // 2. Fetch aggregated vendor data
  const fetchVendors = useCallback((q: string) => {
    setVendorsLoading(true);
    const url = `/api/section-vendors?section=${sectionId}${q ? `&search=${encodeURIComponent(q)}` : ''}`;
    fetch(url)
      .then(r => r.ok ? r.json() : { vendors: [] })
      .then(data => {
        setVendors(data.vendors || []);
        setTotalVendors(data.total || (data.vendors || []).length);
        if (data.sectionMeta) setSectionMeta(data.sectionMeta);
        if (data.bridge) setBridgeMeta(data.bridge);
      })
      .catch(() => setVendors([]))
      .finally(() => setVendorsLoading(false));
  }, [sectionId]);

  useEffect(() => { fetchVendors(''); }, [fetchVendors]);
  useEffect(() => { fetchVendors(debouncedSearch); }, [debouncedSearch, fetchVendors]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070B12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2.5px solid ${accentColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Admin builder layout overrides ───────────────────────────────────────────
  if (builderConfig) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
        <DynamicHomepageRenderer
          layout={builderConfig.layout}
          settings={builderConfig.site_settings || null}
          pageId={pageConfigId}
        />
        {/* Section vendor grid appended below builder layout */}
        <VendorGrid
          vendors={vendors}
          sectionId={sectionId}
          sectionMeta={sectionMeta}
          bridgeMeta={bridgeMeta}
          accentColor={resolvedAccent}
          ctaLabel={ctaLabel || `View ${pageLabel}`}
          search={search}
          onSearch={setSearch}
          loading={vendorsLoading}
          totalVendors={totalVendors}
          showPartnerCta={showPartnerCta}
          embedded
        />
      </div>
    );
  }

  // ── Full auto-aggregation page ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        color: '#fff',
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 3rem)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Accent glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 80vw)', height: '200px',
          background: resolvedAccent,
          opacity: 0.07, borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            marginBottom: '0.75rem',
            lineHeight: 1,
          }}>
            {sectionMeta?.emoji || '🌐'}
          </div>

          <div style={{
            fontSize: '0.7rem', fontWeight: 900, color: resolvedAccent,
            letterSpacing: '3px', textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            {sectionMeta?.label || pageLabel}
          </div>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900, marginBottom: '1rem',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {pageLabel}
          </h1>

          <p style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)',
            opacity: 0.75, maxWidth: '600px', margin: '0 auto 2rem',
            lineHeight: 1.7,
          }}>
            {description}
          </p>

          {/* Stats strip */}
          {totalVendors > 0 && (
            <div style={{
              display: 'inline-flex', gap: '2rem', alignItems: 'center',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
              padding: '0.65rem 1.5rem', borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)',
            }}>
              <span><strong style={{ color: resolvedAccent, fontWeight: 900 }}>{totalVendors}</strong> &nbsp;partners</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>0% commission</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span>Direct WhatsApp booking</span>
            </div>
          )}
        </div>
      </section>

      {topContent}

      {/* ── Vendor Grid ─────────────────────────────────────────────────────── */}
      <VendorGrid
        vendors={vendors}
        sectionId={sectionId}
        sectionMeta={sectionMeta}
        bridgeMeta={bridgeMeta}
        accentColor={resolvedAccent}
        ctaLabel={ctaLabel || `View ${pageLabel}`}
        search={search}
        onSearch={setSearch}
        loading={vendorsLoading}
        totalVendors={totalVendors}
        showPartnerCta={showPartnerCta}
        embedded={false}
      />
    </div>
  );
}

// ── Vendor Grid Sub-Component ─────────────────────────────────────────────────

function VendorGrid({
  vendors,
  sectionId,
  sectionMeta,
  bridgeMeta,
  accentColor,
  ctaLabel,
  search,
  onSearch,
  loading,
  totalVendors,
  showPartnerCta,
  embedded,
}: {
  vendors: Vendor[];
  sectionId: string;
  sectionMeta: SectionMeta | null;
  bridgeMeta: BridgeMeta | null;
  accentColor: string;
  ctaLabel: string;
  search: string;
  onSearch: (v: string) => void;
  loading: boolean;
  totalVendors: number;
  showPartnerCta: boolean;
  embedded: boolean;
}) {
  return (
    <section style={{
      maxWidth: '1320px', margin: '0 auto',
      padding: 'clamp(2rem, 4vw, 3.5rem) clamp(1rem, 3vw, 2rem)',
    }}>

      {/* ── Section header + search ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1rem',
        alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem',
      }}>
        <div>
          {embedded && (
            <div style={{
              fontSize: '0.65rem', fontWeight: 900, color: accentColor,
              letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.3rem',
            }}>
              {sectionMeta?.emoji} {sectionMeta?.label}
            </div>
          )}
          <div style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: '#1e293b' }}>
            {loading
              ? 'Loading partners…'
              : `${totalVendors} ${totalVendors === 1 ? 'Partner' : 'Partners'} Found`}
          </div>
          {bridgeMeta && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Main site: &nbsp;
              <a
                href={bridgeMeta.mainSiteMirror.url}
                style={{ color: accentColor, textDecoration: 'underline', fontWeight: 700 }}
              >
                {bridgeMeta.mainSiteMirror.label}
              </a>
            </div>
          )}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', flexShrink: 0, minWidth: 'min(280px, 100%)' }}>
          <i className="fas fa-search" style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem', pointerEvents: 'none',
          }} />
          <input
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search partners…"
            style={{
              paddingLeft: '2.2rem', paddingRight: '1rem',
              paddingTop: '0.6rem', paddingBottom: '0.6rem',
              borderRadius: '50px', border: '2px solid #e2e8f0',
              fontSize: '0.85rem', outline: 'none', width: '100%',
              boxSizing: 'border-box', background: '#fff',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = accentColor; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }}
          />
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 'clamp(1rem, 2vw, 1.5rem)',
        }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : vendors.length === 0 ? (
        /* Empty state */
        <div style={{
          textAlign: 'center', padding: 'clamp(3rem, 8vw, 6rem) 1rem',
          background: '#fff', borderRadius: '20px',
          border: '2px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{sectionMeta?.emoji || '🏔️'}</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', marginBottom: '0.5rem' }}>
            {search ? 'No results found' : 'No partners yet'}
          </div>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            {search
              ? `No partners match "${search}" in this section. Try a broader search.`
              : `This section doesn't have any registered partners yet. Be the first to join!`}
          </p>
          {search ? (
            <button
              onClick={() => onSearch('')}
              style={{
                background: accentColor, color: '#fff',
                padding: '0.75rem 2rem', borderRadius: '50px',
                fontWeight: 700, border: 'none', cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Clear Search
            </button>
          ) : showPartnerCta ? (
            <a
              href="/be-a-partner"
              style={{
                display: 'inline-block',
                background: accentColor, color: '#fff',
                padding: '0.75rem 2rem', borderRadius: '50px',
                fontWeight: 700, textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Become a Partner →
            </a>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
            animation: 'fadeUp 0.4s ease both',
          }}
        >
          {vendors.map(v => (
            <VendorCard
              key={v.id}
              vendor={v}
              sectionId={sectionId}
              accentColor={accentColor}
              ctaLabel={ctaLabel}
            />
          ))}
        </div>
      )}

      {/* ── Partner CTA strip ───────────────────────────────────────────────── */}
      {showPartnerCta && vendors.length > 0 && (
        <div style={{
          marginTop: 'clamp(2.5rem, 5vw, 4rem)',
          padding: 'clamp(2rem, 4vw, 3rem)',
          background: `linear-gradient(135deg, #0f172a, #1e293b)`,
          borderRadius: '20px',
          display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
          alignItems: 'center', justifyContent: 'space-between',
          color: '#fff',
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '0.35rem' }}>
              Want to be listed here?
            </div>
            <p style={{ opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>
              Join our platform and get your own cinematic mini-site with direct WhatsApp bookings.
            </p>
          </div>
          <a
            href="/be-a-partner"
            style={{
              background: accentColor, color: '#fff',
              padding: '0.85rem 2rem', borderRadius: '50px',
              fontWeight: 800, textDecoration: 'none',
              fontSize: '0.9rem', flexShrink: 0,
              boxShadow: `0 6px 20px ${accentColor}55`,
            }}
          >
            Join as Partner →
          </a>
        </div>
      )}
    </section>
  );
}
