'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import DynamicHomepageRenderer from '@/components/DynamicHomepageRenderer';

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  type_id?: string;
  subscription_tier?: string;
  phone?: string;
  custom_data?: any;
}

export default function CanonicalVanityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { slug: s } = await params;
        setSlug(s);

        // 1. Try to fetch custom website config
        const [resWebsite, resBiz] = await Promise.all([
          fetch(`/api/jana/website?id=website_${s}`).catch(() => null),
          fetch(`/api/businesses/${s}`).catch(() => null),
        ]);

        let hasCustom = false;
        if (resWebsite && resWebsite.ok) {
          const cfg = await resWebsite.json();
          const parsed = Array.isArray(cfg) ? cfg[0] : cfg;
          if (parsed && (parsed.header_components?.length || parsed.body_components?.length || parsed.layout?.length)) {
            setBuilderConfig(parsed);
            hasCustom = true;
          }
        }

        if (resBiz && resBiz.ok) {
          const b = await resBiz.json();
          if (b && b.id) {
            setBusiness(b);
          }
        } else if (!hasCustom) {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ width: 44, height: 44, border: '4px solid #F1F5F9', borderTop: '4px solid #D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '1rem', color: '#64748B', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px' }}>
          LOADING SIWIFY...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render Builder Layout if available ──
  if (builderConfig) {
    const layout = [
      ...(builderConfig.header_components || []),
      ...(builderConfig.body_components || []),
      ...(builderConfig.footer_components || []),
      ...(builderConfig.layout || []),
    ];
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <MarketplaceHeader
          title={builderConfig.site_settings?.site_name || business?.name || slug}
          accentColor={builderConfig.site_settings?.primary_color || '#D4AF37'}
        />
        <DynamicHomepageRenderer
          layout={layout}
          settings={builderConfig.site_settings || null}
          pageId={slug}
        />
      </div>
    );
  }

  // ── Render Minisite for verified business ──
  if (business) {
    const cd = business.custom_data || {};
    const heroImage = cd.hero_image || cd.basic?.hero_image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1400';
    const tagline = cd.tagline || cd.basic?.tagline || 'تجربة أصيلة في واحة سيوة الساحرة';
    const description = cd.description || cd.basic?.description || `${business.name} هو أحد مقدمي الخدمات والضيافة المعتمدين في واحة سيوة. تواصل مباشرة للحجز والاستفسار.`;
    const whatsapp = cd.whatsapp || cd.basic?.whatsapp || business.phone || '';
    const cleanWa = whatsapp.replace(/[^0-9]/g, '');

    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        fontFamily: "'Noto Sans Arabic', 'Cairo', 'Inter', sans-serif",
        color: '#0F172A',
      }}>
        <MarketplaceHeader title={business.name} accentColor="#D4AF37" />

        {/* Hero Banner */}
        <section style={{
          position: 'relative',
          height: 'clamp(320px, 45vw, 520px)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
        }}>
          <img
            src={heroImage}
            alt={business.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.3) 60%, rgba(15,23,42,0.7) 100%)',
          }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '0 1.5rem',
            maxWidth: '800px',
            color: '#FFFFFF',
          }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid #D4AF37',
              borderRadius: '50px',
              padding: '0.35rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#F5E6AD',
              marginBottom: '1rem',
            }}>
              ✓ نشاط معتمد في سيوة · 0% عمولة
            </div>
            <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {business.name}
            </h1>
            <p style={{ margin: '0 auto 1.5rem', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', opacity: 0.9, maxWidth: '600px' }}>
              {tagline}
            </p>
            {cleanWa && (
              <a
                href={`https://wa.me/${cleanWa.startsWith('00') ? cleanWa.slice(2) : cleanWa.startsWith('01') ? '2' + cleanWa : cleanWa}?text=${encodeURIComponent(`مرحباً ${business.name}، أود الاستفسار عن خدماتكم وحجوزاتكم عبر سيوايفاي.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: '#25D366',
                  color: '#FFFFFF',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
                }}
              >
                <span>💬</span> تواصل واحجز عبر الواتساب مباشرة
              </a>
            )}
          </div>
        </section>

        {/* Content Body */}
        <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{
            background: '#F8FAFC',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
              نبذة عن النشاط والخدمات
            </h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {description}
            </p>
          </div>

          {/* Direct Claim Kicker for Unclaimed Profiles */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              هل أنت صاحب هذا النشاط التجاري؟
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem' }}>
              يمكنك استلام صفحتك وتعديل بياناتها واستقبال حجوزاتك مباشرة مجاناً وبدون عمولات.
            </p>
            <Link
              href={`/vendor/claim?slug=${business.slug}`}
              style={{
                display: 'inline-block',
                background: '#0F172A',
                color: '#FFFFFF',
                padding: '0.65rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
                textDecoration: 'none',
              }}
            >
              استلام وإدارة النشاط ➔
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ── Fallback 404 / Exploration Page ──
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif",
      color: '#0F172A',
    }}>
      <MarketplaceHeader title="Siwify" accentColor="#D4AF37" />
      <div style={{ maxWidth: '600px', margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌴</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.75rem' }}>
          واحة سيوة ترحب بك
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          الصفحة المطلوبة &ldquo;{slug}&rdquo; غير متوفرة حالياً، يمكنك تصفح قطاعات سيوة وخدماتها المعتمدة:
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/siwa-stay" style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🛖 الإقامة والفنادق
          </Link>
          <Link href="/siwa-go" style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🚙 رحلات وسفاري
          </Link>
          <Link href="/siwa-retreats" style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🌿 الاستشفاء والاستجمام
          </Link>
          <Link href="/" style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#0F172A', color: '#FFFFFF', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem' }}>
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
