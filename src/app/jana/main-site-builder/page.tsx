'use client';

import Link from 'next/link';

const tools = [
  { href: '/jana/website?page=main', icon: 'fa-palette', title: 'Visual Page Builder', text: 'Arrange header, body, and footer components for the homepage and custom pages.' },
  { href: '/jana/pages', icon: 'fa-copy', title: 'Pages Manager', text: 'Create, rename, delete, and open main-site pages for editing.' },
  { href: '/jana/hero-carousel', icon: 'fa-images', title: 'Global Carousel', text: 'Create homepage slides with media, captions, CTAs, and ordering.' },
  { href: '/jana/component-library', icon: 'fa-puzzle-piece', title: 'Component Library', text: 'Manage reusable components available to the main website builder.' },
  { href: '/jana/search-engines', icon: 'fa-search', title: 'Search and Discovery', text: 'Configure search engines, filters, and discovery page content.' },
  { href: '/jana/blog', icon: 'fa-newspaper', title: 'Blog Suite', text: 'Manage public articles, templates, layouts, and blog widgets.' },
];

export default function MainSiteBuilderEntry() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px' }}>MAIN SITE BUILDING</div>
        <h1 style={{ margin: '0.4rem 0', fontSize: '2.2rem', color: '#0f172a' }}>Build the Main Website</h1>
        <p style={{ maxWidth: 720, color: '#64748b', lineHeight: 1.6 }}>Compose the global homepage and public pages from shared components, carousels, search, services, journeys, blog, and discovery features.</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {tools.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ display: 'block', padding: '1.3rem', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#0f172a', textDecoration: 'none' }}>
            <i className={`fas ${tool.icon}`} style={{ color: '#7c3aed', fontSize: '1.3rem' }} />
            <h2 style={{ margin: '0.8rem 0 0.35rem', fontSize: '1rem' }}>{tool.title}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{tool.text}</p>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.2rem', borderRadius: 10, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#4c1d95', fontSize: '0.85rem' }}>
        Flow: <strong>Page</strong> {'->'} <strong>Components</strong> {'->'} <strong>Carousel, search, blog, or sections</strong> {'->'} <strong>Save and preview</strong> {'->'} <strong>/p/{'{page-slug}'}</strong>
      </div>
    </main>
  );
}
