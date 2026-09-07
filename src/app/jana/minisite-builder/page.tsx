'use client';

import Link from 'next/link';

const tools = [
  { href: '/jana/page-builder/templates', icon: 'fa-layer-group', title: 'Minisite Templates', text: 'Create and manage reusable minisite layouts for business types.' },
  { href: '/jana/business-forms', icon: 'fa-file-signature', title: 'Forms and Sections', text: 'Choose parent, child, or business data and configure inherited sections.' },
  { href: '/jana/content', icon: 'fa-photo-film', title: 'Business Content', text: 'Fill section data, galleries, section stories, and publication settings.' },
  { href: '/jana/hero-carousel', icon: 'fa-images', title: 'Minisite Carousel', text: 'Manage slides, featured images, captions, and carousel order.' },
  { href: '/jana/orchestrator', icon: 'fa-magic', title: 'Create a Business', text: 'Create a business and automatically generate its minisite from its type and template.' },
];

export default function MinisiteBuilderEntry() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>MINISITE BUILDING</div>
        <h1 style={{ margin: '0.4rem 0', fontSize: '2.2rem', color: '#0f172a' }}>Build Business Minisites</h1>
        <p style={{ maxWidth: 720, color: '#64748b', lineHeight: 1.6 }}>Create a reusable template once, assign inherited sections, add business content, and publish each business minisite automatically.</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {tools.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ display: 'block', padding: '1.3rem', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#0f172a', textDecoration: 'none' }}>
            <i className={`fas ${tool.icon}`} style={{ color: '#D4AF37', fontSize: '1.3rem' }} />
            <h2 style={{ margin: '0.8rem 0 0.35rem', fontSize: '1rem' }}>{tool.title}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{tool.text}</p>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.2rem', borderRadius: 10, background: '#fffbeb', border: '1px solid #f5d77a', color: '#78350f', fontSize: '0.85rem' }}>
        Flow: <strong>Type and sections</strong> {'->'} <strong>Template</strong> {'->'} <strong>Business content</strong> {'->'} <strong>Carousel and blog</strong> {'->'} <strong>/{'{business-slug}'}</strong>
      </div>
    </main>
  );
}
