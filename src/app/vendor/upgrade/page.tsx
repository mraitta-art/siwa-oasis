import Link from 'next/link';

export default function VendorUpgradePage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ color: '#92702a', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>PLAN & SERVICES</div>
      <h1 style={{ margin: '0.35rem 0 0.75rem', fontSize: '2rem', fontWeight: 900 }}>Request an upgrade</h1>
      <p style={{ color: '#64748b', lineHeight: 1.7 }}>Choose the services your business needs and contact the Siwify team. An admin will confirm availability, pricing, and activation.</p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <Link href="/vendor/services" style={{ padding: '0.75rem 1rem', background: '#0f172a', color: '#fff', borderRadius: '10px', fontWeight: 800, textDecoration: 'none' }}>Review current services</Link>
        <Link href="/vendor/verification" style={{ padding: '0.75rem 1rem', background: '#f0c842', color: '#1a1000', borderRadius: '10px', fontWeight: 800, textDecoration: 'none' }}>Open vendor support</Link>
      </div>
    </div>
  );
}
