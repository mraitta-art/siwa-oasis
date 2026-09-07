'use client';

import Link from 'next/link';

const DEFAULT_DESTINATIONS = [
  { href: '/search/vibe', label: 'Experiences', description: 'Find places and activities by the feeling you want.', icon: 'fa-compass', color: '#0f766e' },
  { href: '/journeys', label: 'Journeys', description: 'Build a complete route from connected local experiences.', icon: 'fa-route', color: '#2563eb' },
  { href: '/offers', label: 'Offers & deals', description: 'Browse offers, packages, and discounts in one marketplace.', icon: 'fa-tags', color: '#b45309' },
  { href: '/investment-opportunities', label: 'Invest in Siwa', description: 'Explore approved investment and sponsorship opportunities.', icon: 'fa-chart-line', color: '#7c3aed' },
];

interface DiscoveryDestination {
  href: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export default function DiscoveryGateway({ eyebrow, title, subtitle, destinations }: { eyebrow?: string; title?: string; subtitle?: string; destinations?: DiscoveryDestination[] }) {
  const items = Array.isArray(destinations) ? destinations : DEFAULT_DESTINATIONS;

  return (
    <section style={{ padding: '5rem 2rem', background: 'var(--bg-alt)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ maxWidth: '680px', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>{eyebrow || 'DISCOVER SIWA'}</div>
          <h2 style={{ margin: '0.5rem 0', color: 'var(--text)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900 }}>{title || 'Start with an experience'}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>{subtitle || 'Explore the oasis by interest, plan a complete journey, discover local deals, or review approved opportunities.'}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {items.map(destination => (
            <Link key={destination.href} href={destination.href} style={{ display: 'flex', flexDirection: 'column', minHeight: '165px', padding: '1.35rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', textDecoration: 'none', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <i className={`fas ${destination.icon}`} style={{ color: destination.color, fontSize: '1.2rem', marginBottom: '1rem' }} />
              <strong style={{ fontSize: '1rem' }}>{destination.label}</strong>
              <span style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>{destination.description}</span>
              <span style={{ marginTop: 'auto', paddingTop: '1rem', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px' }}>EXPLORE <i className="fas fa-arrow-right" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
