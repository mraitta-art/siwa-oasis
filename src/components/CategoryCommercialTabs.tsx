'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface CommercialItem {
  id: string;
  title: string;
  kind: 'package' | 'offer' | 'discount';
  businessName: string;
  businessSlug?: string | null;
  description?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  discount?: string | null;
  validUntil?: string | null;
  code?: string | null;
}

const CATEGORY_TYPES: Record<string, string> = {
  transportation: 'logistics',
  restaurant: 'food',
  food: 'food',
  activity: 'adventure',
  accommodation: 'accommodation',
};

export default function CategoryCommercialTabs({ category }: { category: string }) {
  const [items, setItems] = useState<CommercialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'package' | 'offer' | 'discount'>('all');

  useEffect(() => {
    let mounted = true;
    const type = CATEGORY_TYPES[category] || category;

    async function load() {
      try {
        const [offersResponse, discountsResponse] = await Promise.all([
          fetch(`/api/discovery/offers?type=${encodeURIComponent(type)}&limit=60`),
          fetch(`/api/discovery/discounts?type=${encodeURIComponent(type)}&limit=60`),
        ]);
        const offersData = await offersResponse.json().catch(() => ({}));
        const discountsData = await discountsResponse.json().catch(() => ({}));
        const offers = Array.isArray(offersData?.offers) ? offersData.offers : [];
        const discounts = Array.isArray(discountsData?.items) ? discountsData.items : Array.isArray(discountsData?.discounts) ? discountsData.discounts : [];

        const mapped: CommercialItem[] = [
          ...offers.map((item: any) => ({
            id: `${item.business_id || item.id}-${item.product_id || item.promotion_id || item.id}`,
            title: item.title || item.offer_title || item.package_name || 'Special offer',
            kind: item.type === 'package' || item.type === 'experience_package' || item.source?.startsWith('package_') || item.source === 'experience_packages_db' ? 'package' : 'offer',
            businessName: item.business_name || 'Siwa business',
            businessSlug: item.business_slug || null,
            description: item.description || item.offer_description || null,
            price: item.price ? Number(item.price) : null,
            originalPrice: item.original_price ? Number(item.original_price) : null,
            discount: item.discount || null,
            validUntil: item.valid_until || null,
            code: item.promo_code || null,
          })),
          ...discounts.map((item: any) => ({
            id: `${item.business_id || item.id}-discount-${item.discount_id || item.slot || item.id}`,
            title: item.discount_name || 'Special discount',
            kind: 'discount',
            businessName: item.business_name || 'Siwa business',
            businessSlug: item.business_slug || null,
            description: item.description || item.discount_description || null,
            discount: item.discount_value ? `${item.discount_value}${item.discount_type === 'percent' ? '%' : ''}` : null,
            validUntil: item.valid_until || null,
            code: item.promo_code || null,
          })),
        ];
        if (mounted) setItems(mapped);
      } catch (error) {
        console.error('Failed to load category commercial items', error);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [category]);

  const visibleItems = useMemo(
    () => activeTab === 'all' ? items : items.filter(item => item.kind === activeTab),
    [activeTab, items],
  );

  const counts = useMemo(() => ({
    all: items.length,
    package: items.filter(item => item.kind === 'package').length,
    offer: items.filter(item => item.kind === 'offer').length,
    discount: items.filter(item => item.kind === 'discount').length,
  }), [items]);

  const tabs = [
    { id: 'all' as const, label: 'All deals' },
    { id: 'package' as const, label: 'Packages' },
    { id: 'offer' as const, label: 'Offers' },
    { id: 'discount' as const, label: 'Discounts' },
  ];

  return (
    <section style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#a16207', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>Business deals</div>
          <h2 style={{ margin: '0.35rem 0 0', color: '#0f172a', fontSize: '1.7rem', fontWeight: 900 }}>Packages, offers & discounts</h2>
        </div>
        <a href="/offers" style={{ color: '#a16207', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textDecoration: 'none', textTransform: 'uppercase' }}>Browse marketplace</a>
      </div>

      <div role="tablist" aria-label="Business deals" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.75rem 0.85rem', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #D4AF37' : '2px solid transparent', background: 'transparent', color: activeTab === tab.id ? '#a16207' : '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, whiteSpace: 'nowrap' }}
          >
            {tab.label} ({counts[tab.id]})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '2rem', color: '#64748b', textAlign: 'center' }}>Loading business deals...</div>
      ) : visibleItems.length === 0 ? (
        <div style={{ padding: '2.5rem', border: '1px dashed #cbd5e1', borderRadius: '18px', color: '#64748b', textAlign: 'center' }}>
          No {activeTab === 'all' ? 'packages, offers, or discounts' : `${activeTab}s`} are published for this category yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {visibleItems.map(item => (
            <article key={item.id} style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.1rem', minHeight: '210px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.8rem' }}>
                <span style={{ color: '#a16207', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.kind}</span>
                {(item.discount || item.price) && <strong style={{ color: '#166534', fontSize: '0.8rem' }}>{item.discount || `$${item.price}`}</strong>}
              </div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 900 }}>{item.title}</h3>
              <div style={{ marginTop: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>{item.businessName}</div>
              <p style={{ flex: 1, margin: '0.8rem 0', color: '#475569', fontSize: '0.8rem', lineHeight: 1.55 }}>{item.description || 'Available from this business.'}</p>
              {item.validUntil && <div style={{ marginBottom: '0.75rem', color: '#64748b', fontSize: '0.68rem' }}>Valid until {new Date(item.validUntil).toLocaleDateString('en-US')}</div>}
              <a href={item.businessSlug ? `/p/${item.businessSlug}` : '/offers'} style={{ display: 'block', padding: '0.65rem 0.8rem', borderRadius: '10px', background: '#0f172a', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.8px', textTransform: 'uppercase' }}>View business</a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
