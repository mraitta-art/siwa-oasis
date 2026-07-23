import Link from 'next/link';

const workstreams = [
  {
    title: 'Business Types',
    description: 'Create the business categories and structure that drive the whole experience.',
    href: '/jana/types',
    accent: '#8b5cf6',
  },
  {
    title: 'Section Architect',
    description: 'Define reusable sections, fields, and data containers from one place.',
    href: '/jana/sections',
    accent: '#0f766e',
  },
  {
    title: 'Forms & Fields',
    description: 'Build forms for onboarding, collection, and business data entry.',
    href: '/jana/business-forms',
    accent: '#ea580c',
  },
  {
    title: 'Component Library',
    description: 'Manage reusable components for sidebars, galleries, carousels and more.',
    href: '/jana/component-library',
    accent: '#2563eb',
  },
  {
    title: 'Website Builder',
    description: 'Assemble pages and publish the public-facing experience.',
    href: '/jana/website',
    accent: '#db2777',
  },
  {
    title: 'Fast-Track Studio',
    description: 'Create businesses quickly and move from setup to live minisite.',
    href: '/jana/fast-track',
    accent: '#059669',
  },
];

const steps = [
  'Define the business type',
  'Create or update the section schema',
  'Build the fields and form logic',
  'Add or manage components',
  'Assemble the page flow',
  'Publish and launch the experience',
];

export default function UnifiedBuilderPage() {
  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', color: '#fff', padding: '1.75rem', borderRadius: '20px', boxShadow: '0 18px 45px rgba(15,23,42,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.24em', fontWeight: 900, color: '#fbbf24', marginBottom: '0.5rem' }}>
              UNIFIED BUILDER WORKSPACE
            </div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>One place to design, build, and publish</h2>
            <p style={{ margin: '0.6rem 0 0', maxWidth: '720px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              This workspace consolidates the main builder actions so you can move from structure to content to launch without bouncing between multiple screens.
            </p>
          </div>
          <Link
            href="/jana/orchestrator"
            style={{ textDecoration: 'none', background: '#fbbf24', color: '#111827', padding: '0.8rem 1.1rem', borderRadius: '999px', fontWeight: 800 }}
          >
            Open Guided Flow
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {workstreams.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            style={{ textDecoration: 'none', background: '#fff', borderRadius: '16px', padding: '1.1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${item.accent}15`, color: item.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              ✦
            </div>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{item.title}</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55 }}>{item.description}</p>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.2fr 0.8fr' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.2rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Recommended flow</h3>
          <ol style={{ margin: 0, paddingLeft: '1.1rem', color: '#334155', display: 'grid', gap: '0.55rem' }}>
            {steps.map((step, index) => (
              <li key={step} style={{ lineHeight: 1.6 }}>
                <span style={{ fontWeight: 800, color: '#0f766e' }}>{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.2rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Centralized actions</h3>
          <p style={{ margin: '0 0 0.75rem', color: '#64748b', lineHeight: 1.6 }}>
            Use this hub as your single control center for schema, forms, components, and public pages.
          </p>
          <Link href="/jana/sections" style={{ display: 'inline-block', textDecoration: 'none', color: '#2563eb', fontWeight: 700 }}>
            Start with sections →
          </Link>
        </div>
      </div>
    </div>
  );
}
