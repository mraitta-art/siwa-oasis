'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MinisiteQRCode from '@/components/MinisiteQRCode';
import { VENDOR_SERVICE_CATALOG, featureIsEnabled } from '@/lib/vendor-services';

export default function VendorServicesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/story')
      .then(response => response.json())
      .then(data => setBusiness(data?.business || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', color: '#64748b' }}>Loading your services...</div>;
  if (!business) return <div style={{ padding: '3rem', color: '#b91c1c' }}>Business services are unavailable for this account.</div>;

  const features = business.tier_features || {};
  const serviceState = (service: typeof VENDOR_SERVICE_CATALOG[number]) =>
    featureIsEnabled(features, service.featureKeys) || service.key === 'qr' ? 'Included' : 'Upgrade required';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: '#92702a', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Account & Services</div>
          <h1 style={{ margin: '0.35rem 0', fontSize: '2rem', fontWeight: 900 }}>Your plan and services</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Everything connected to {business.name}, organized in one place.</p>
        </div>
        <Link href={business.slug ? `/${business.slug}` : '/vendor/minisite'} target="_blank" style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'none' }}>View minisite <i className="fas fa-external-link-alt" /></Link>
      </div>

      <section style={{ background: '#0f172a', color: '#fff', borderRadius: '18px', padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: '#f0c842', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>Current plan</div>
          <h2 style={{ margin: '0.35rem 0', fontSize: '1.5rem' }}>{business.tier || business.subscription_tier || 'Free / Heritage'}</h2>
          <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Minisite: {business.is_published || business.published ? 'Published' : 'Pending approval'}</div>
        </div>
        <Link href="/vendor/upgrade" style={{ alignSelf: 'center', background: '#f0c842', color: '#1a1000', padding: '0.7rem 1rem', borderRadius: '10px', fontWeight: 900, textDecoration: 'none' }}>Explore upgrades</Link>
        <Link href="/vendor/templates" style={{ alignSelf: 'center', color: '#f0c842', fontWeight: 800, textDecoration: 'none' }}>Choose a template</Link>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {VENDOR_SERVICE_CATALOG.map(service => {
          const included = serviceState(service) === 'Included';
          return (
            <article key={service.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{service.label}</h3>
                <span style={{ color: included ? '#15803d' : '#b45309', fontSize: '0.65rem', fontWeight: 900 }}>{serviceState(service)}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{service.description}</p>
            </article>
          );
        })}
      </div>

      <section style={{ background: '#f1f5f9', borderRadius: '18px', padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <MinisiteQRCode businessName={business.name} businessId={business.id} targetUrl={`${window.location.origin}/${business.slug || business.id}`} />
      </section>
    </div>
  );
}
