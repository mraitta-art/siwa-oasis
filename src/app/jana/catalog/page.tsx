'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CatalogData {
  products: Array<{ id: string; name: string; business_name?: string; status?: string; approval_status?: string; item_count?: number; component_count?: number }>;
  promotions: Array<{ id: string; name: string; business_name?: string; status?: string; approval_status?: string }>;
  discounts: Array<{ id: string; product_name?: string; business_name?: string; status?: string; approval_status?: string }>;
}

export default function CatalogPage() {
  const [data, setData] = useState<CatalogData>({ products: [], promotions: [], discounts: [] });
  const [loading, setLoading] = useState(true);

  async function loadCatalog() {
    setLoading(true);
    try {
      const response = await fetch('/api/jana/catalog');
      if (response.ok) setData(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCatalog(); }, []);

  async function updateStatus(entity: string, id: string, action: string) {
    const response = await fetch('/api/jana/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, id, action }),
    });
    if (response.ok) loadCatalog();
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', color: '#0f172a' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Link href="/jana" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>BACK TO JANA</Link>
        <header style={{ margin: '1rem 0 2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.18em' }}>UNIFIED CATALOG</p>
            <h1 style={{ margin: '0.35rem 0', fontSize: '2rem' }}>Tours, Packages, Offers &amp; Discounts</h1>
            <p style={{ margin: 0, color: '#64748b' }}>One admin workspace for vendor submissions, original products, composition, approval, and publishing.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Link href="/jana/tour-builder" style={{ padding: '0.7rem 1rem', background: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>Build Tour</Link>
            <Link href="/admin/journey-requests" style={{ padding: '0.7rem 1rem', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: '0.75rem' }}>Visitor Journeys</Link>
          </div>
        </header>

        {loading ? <p>Loading catalog...</p> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Canonical products ({data.products.length})</h2>
              {data.products.map(product => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '0.8rem 0', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  <div><strong>{product.name}</strong><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{product.business_name || 'Admin product'} · {product.item_count || 0} itinerary items · {product.component_count || 0} components</div></div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><span style={{ fontSize: '0.7rem', color: '#64748b' }}>{product.approval_status || product.status || 'draft'}</span><button onClick={() => updateStatus('product', product.id, 'approve')} style={{ border: 0, borderRadius: 6, padding: '0.45rem 0.7rem', background: '#dcfce7', color: '#166534', fontWeight: 800, cursor: 'pointer' }}>Approve</button><button onClick={() => updateStatus('product', product.id, 'publish')} style={{ border: 0, borderRadius: 6, padding: '0.45rem 0.7rem', background: '#fef3c7', color: '#92400e', fontWeight: 800, cursor: 'pointer' }}>Publish</button></div>
                </div>
              ))}
            </section>
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Offers and discount rules</h2>
              {[...data.promotions.map(item => ({ ...item, type: 'Offer', entity: 'promotion' })), ...data.discounts.map(item => ({ ...item, name: item.product_name || 'Product discount', type: 'Discount', entity: 'discount' }))].map(item => (
                <div key={`${item.entity}-${item.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '0.8rem 0', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}><div><strong>{item.name}</strong><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.type} · {item.business_name || 'Admin rule'}</div></div><div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}><span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.approval_status || item.status || 'draft'}</span><button onClick={() => updateStatus(item.entity, item.id, 'approve')} style={{ border: 0, borderRadius: 6, padding: '0.45rem 0.7rem', background: '#dcfce7', color: '#166534', fontWeight: 800, cursor: 'pointer' }}>Approve</button><button onClick={() => updateStatus(item.entity, item.id, 'publish')} style={{ border: 0, borderRadius: 6, padding: '0.45rem 0.7rem', background: '#fef3c7', color: '#92400e', fontWeight: 800, cursor: 'pointer' }}>Publish</button></div></div>
              ))}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
