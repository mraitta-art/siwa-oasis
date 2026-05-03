// Blog Section Components for Forms, Templates, and Mini-Sites

export interface BlogSectionConfig {
  id: string;
  sectionType: 'grid' | 'list' | 'featured' | 'slider';
  columns?: number;
  posts: any[];
  title?: string;
  subtitle?: string;
  showSectionTitle: boolean;
  backgroundColor: string;
  padding: string;
}

// Section 1: Blog Grid Section (for forms/pages)
export function BlogGridSection({ config }: { config: BlogSectionConfig }) {
  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      {config.showSectionTitle && config.title && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{config.title}</h2>
          {config.subtitle && <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{config.subtitle}</p>}
        </div>
      )}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${config.columns || 3}, 1fr)`, 
        gap: '1.5rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {config.posts.map((post: any) => (
          <div key={post.id} style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <img src={post.image} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{post.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>{post.excerpt}</p>
              <button style={{ 
                padding: '0.5rem 1rem', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}>
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Section 2: Blog List Section (for forms)
export function BlogListSection({ config }: { config: BlogSectionConfig }) {
  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      {config.showSectionTitle && config.title && (
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '2rem', maxWidth: '1400px', margin: '0 auto 2rem auto' }}>
          {config.title}
        </h2>
      )}
      <div style={{ 
        display: 'grid', 
        gap: '1.5rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {config.posts.map((post: any) => (
          <div key={post.id} style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '1.5rem', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <img src={post.image} alt={post.title} style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{post.title}</h3>
              <p style={{ color: '#64748b', marginBottom: '1rem', lineHeight: '1.6' }}>{post.excerpt}</p>
              <button style={{ 
                padding: '0.5rem 1rem', 
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)', 
                color: '#0f172a', 
                border: 'none', 
                borderRadius: '6px', 
                fontWeight: 700, 
                cursor: 'pointer'
              }}>
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Section 3: Featured Blog Section
export function BlogFeaturedSection({ config }: { config: BlogSectionConfig }) {
  const featured = config.posts[0];
  const others = config.posts.slice(1, 4);
  
  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {config.showSectionTitle && config.title && (
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>
            {config.title}
          </h2>
        )}
        
        {/* Featured Post */}
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', height: '400px' }}>
          <img src={featured.image} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' 
          }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '3rem', color: '#fff' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              color: '#0f172a'
            }}>
              FEATURED
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '1rem' }}>{featured.title}</h2>
            <p style={{ fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '600px' }}>{featured.excerpt}</p>
            <button style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1.5rem', 
              background: '#fff', 
              color: '#0f172a', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 800, 
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}>
              Read Full Story →
            </button>
          </div>
        </div>
        
        {/* Other Posts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {others.map((post: any) => (
            <div key={post.id} style={{ 
              background: '#fff', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <img src={post.image} alt={post.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{post.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Preset blog sections for mini-sites and forms
export const blogSectionPresets = {
  formInfoSection: {
    sectionType: 'list' as const,
    columns: 1,
    showSectionTitle: true,
    backgroundColor: '#f8fafc',
    padding: '3rem 2rem'
  },
  miniSiteBlog: {
    sectionType: 'grid' as const,
    columns: 3,
    showSectionTitle: true,
    backgroundColor: '#ffffff',
    padding: '4rem 2rem'
  },
  landingPageFeatured: {
    sectionType: 'featured' as const,
    showSectionTitle: true,
    backgroundColor: '#0f172a',
    padding: '4rem 2rem'
  },
  compactGrid: {
    sectionType: 'grid' as const,
    columns: 4,
    showSectionTitle: false,
    backgroundColor: '#ffffff',
    padding: '2rem 1rem'
  }
};
