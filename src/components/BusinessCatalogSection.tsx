'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface CatalogItem {
  id: string;
  title: string;
  type: 'package' | 'offer' | 'discount';
  businessName: string;
  businessSlug?: string | null;
  description?: string | null;
  image?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  discountValue?: string | null;
  discountType?: string | null;
  validUntil?: string | null;
  couponCode?: string | null;
}

export default function BusinessCatalogSection({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [offersRes, discountsRes] = await Promise.all([
          fetch(`/api/discovery/offers?business=${encodeURIComponent(businessId)}&limit=12`),
          fetch(`/api/discovery/discounts?business=${encodeURIComponent(businessId)}&limit=12`),
        ]);

        const [offersData, discountsData] = await Promise.all([
          offersRes.json().catch(() => ({ offers: [] })),
          discountsRes.json().catch(() => ({ items: [] })),
        ]);

        const offers = Array.isArray(offersData?.offers) ? offersData.offers : [];
        const discounts = Array.isArray(discountsData?.items) ? discountsData.items : Array.isArray(discountsData?.discounts) ? discountsData.discounts : [];

        const mapped: CatalogItem[] = [
          ...offers.map((item: any) => ({
            id: `${item.business_id || item.id}-offer-${item.product_id || item.promotion_id || item.id}`,
            title: item.title || item.offer_title || item.package_name || 'Special offer',
            type: (item.type === 'package' || item.type === 'experience_package' || item.source?.startsWith('package_') || item.source === 'experience_packages_db') ? 'package' : 'offer',
            businessName: item.business_name || businessName,
            businessSlug: item.business_slug || null,
            description: item.description || item.offer_description || null,
            image: item.image || item.offer_image || null,
            price: item.price ? Number(item.price) : null,
            originalPrice: item.original_price ? Number(item.original_price) : null,
            discountValue: item.discount || null,
            discountType: item.discount_type || null,
            validUntil: item.valid_until || null,
            couponCode: item.promo_code || null,
          })),
          ...discounts.map((item: any) => ({
            id: `${item.business_id || item.id}-discount-${item.discount_id || item.slot || item.id}`,
            title: item.discount_name || item.title || 'Special discount',
            type: 'discount',
            businessName: item.business_name || businessName,
            businessSlug: item.business_slug || null,
            description: item.description || item.discount_description || null,
            image: item.business_logo || null,
            price: null,
            originalPrice: null,
            discountValue: item.discount_value || null,
            discountType: item.discount_type || null,
            validUntil: item.valid_until || null,
            couponCode: item.promo_code || null,
          })),
        ];

        if (isMounted) {
          setItems(mapped.slice(0, 9));
        }
      } catch (error) {
        console.error('Failed to load business catalog', error);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [businessId, businessName]);

  const grouped = useMemo(() => ({
    package: items.filter((item) => item.type === 'package'),
    offer: items.filter((item) => item.type === 'offer'),
    discount: items.filter((item) => item.type === 'discount'),
  }), [items]);

  const hasAny = grouped.package.length + grouped.offer.length + grouped.discount.length > 0;

  if (!hasAny && loading) {
    return (
      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Business Catalog
        </div>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading packages, offers and discounts…</div>
      </div>
    );
  }

  if (!hasAny) return null;

  const renderCard = (item: CatalogItem) => (
    <div key={item.id} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <span style={{ display: 'inline-block', borderRadius: '999px', padding: '0.32rem 0.7rem', background: item.type === 'package' ? '#fef3c7' : item.type === 'offer' ? '#dcfce7' : '#e0f2fe', color: '#1e293b', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {item.type}
        </span>
        {item.discountValue && (
          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.28rem 0.55rem' }}>
            {item.discountValue}
          </span>
        )}
      </div>

      {item.image ? (
        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '0.9rem', height: '130px' }}>
          <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: '130px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fafaf9, #f4f4f5)', color: '#b45309', fontSize: '2rem', fontWeight: 900, marginBottom: '0.9rem' }}>
          {item.type === 'package' ? '📦' : item.type === 'offer' ? '🎁' : '💰'}
        </div>
      )}

      <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 900, lineHeight: 1.3, color: '#0f172a' }}>{item.title}</h4>
      <p style={{ margin: '0 0 0.8rem', color: '#475569', fontSize: '0.8rem', lineHeight: 1.6, minHeight: '42px' }}>
        {item.description || 'Exclusive offer available for this business.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        {item.price ? (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800, textTransform: 'uppercase' }}>From</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>${item.price}</div>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Offer available</div>
        )}

        {item.validUntil && (
          <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'right' }}>
            <div style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Valid</div>
            <div>{new Date(item.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        )}
      </div>

      {item.couponCode && (
        <div style={{ marginBottom: '0.9rem', border: '1px dashed rgba(212,175,55,0.6)', borderRadius: '10px', background: '#fffbeb', padding: '0.55rem 0.7rem', fontSize: '0.7rem', fontWeight: 900, color: '#b45309', textAlign: 'center' }}>
          Code: {item.couponCode}
        </div>
      )}

      <Link
        href={item.businessSlug ? `/p/${item.businessSlug}` : '/offers'}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.7rem 0.9rem', borderRadius: '12px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', fontSize: '0.74rem', fontWeight: 900, textDecoration: 'none', letterSpacing: '0.8px', textTransform: 'uppercase' }}
      >
        View details
      </Link>
    </div>
  );

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', letterSpacing: '2px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Business offers</div>
          <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>Packages, offers & discounts</h3>
        </div>
        <Link href="/offers" style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#D4AF37', textDecoration: 'none' }}>
          Browse all
        </Link>
      </div>

      {grouped.package.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '1.5px', fontWeight: 900, color: '#b45309', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Packages</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {grouped.package.map(renderCard)}
          </div>
        </div>
      )}

      {grouped.offer.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '1.5px', fontWeight: 900, color: '#166534', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Offers</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {grouped.offer.map(renderCard)}
          </div>
        </div>
      )}

      {grouped.discount.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '1.5px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Discounts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {grouped.discount.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
}
