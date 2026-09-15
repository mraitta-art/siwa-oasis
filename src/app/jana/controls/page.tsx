'use client';

import Link from 'next/link';

const sectionControlCards = [
  {
    title: 'Unified Section Architect',
    description: 'Create and edit sections, field groups, assignments, and public visibility rules from one canonical screen.',
    href: '/jana/sections',
    accent: '#0f766e',
    icon: 'fa-table-cells',
  },
  {
    title: 'Business Forms & Intake',
    description: 'Review onboarding submissions and create new business intake forms. Schema management lives in the Unified Section Architect.',
    href: '/jana/business-forms',
    accent: '#ea580c',
    icon: 'fa-file-alt',
  },
  {
    title: 'Business Types & Typologies',
    description: 'Define categories, parent/child assignments, and which sections belong to each typology.',
    href: '/jana/types',
    accent: '#8b5cf6',
    icon: 'fa-folder-tree',
  },
];

const componentControlCards = [
  {
    title: 'Component Library',
    description: 'Manage reusable components and their configuration for the live site and minisites.',
    href: '/jana/component-library',
    accent: '#2563eb',
    icon: 'fa-puzzle-piece',
  },
  {
    title: 'Runtime Component Registry',
    description: 'Control the active runtime component registry used by the website renderer.',
    href: '/jana/components',
    accent: '#0ea5e9',
    icon: 'fa-cubes',
  },
  {
    title: 'Cards & Layout Blocks',
    description: 'Configure card layouts and reusable layout building blocks that feed the site UI.',
    href: '/jana/cards',
    accent: '#db2777',
    icon: 'fa-id-card',
  },
];

export default function UnifiedControlsPage() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          color: '#fff',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 18px 45px rgba(15,23,42,0.2)',
        }}
      >
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.22em', fontWeight: 900, color: '#fbbf24', marginBottom: '0.5rem' }}>
          UNIFIED CONTROLS CENTER
        </div>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>Section and component controls are now centralized</h2>
        <p style={{ margin: '0.7rem 0 0', maxWidth: '820px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}>
          Use the Unified Section Architect as the single operating point for section definitions, fields, curation policies, and typology assignments. Intake and business review remain in Business Forms &amp; Intake.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', fontWeight: 900, color: '#0f766e', marginBottom: '0.75rem' }}>
            SECTION CONTROLS
          </div>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {sectionControlCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  background: '#f8fafc',
                  color: '#0f172a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: `${card.accent}18`,
                      color: card.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    <i className={`fas ${card.icon}`} style={{ fontSize: '0.9rem' }}></i>
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>{card.title}</strong>
                </div>
                <div style={{ color: '#475569', lineHeight: 1.55, fontSize: '0.82rem' }}>{card.description}</div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', fontWeight: 900, color: '#2563eb', marginBottom: '0.75rem' }}>
            COMPONENT CONTROLS
          </div>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {componentControlCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  background: '#f8fafc',
                  color: '#0f172a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: `${card.accent}18`,
                      color: card.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    <i className={`fas ${card.icon}`} style={{ fontSize: '0.9rem' }}></i>
                  </div>
                  <strong style={{ fontSize: '0.95rem' }}>{card.title}</strong>
                </div>
                <div style={{ color: '#475569', lineHeight: 1.55, fontSize: '0.82rem' }}>{card.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
