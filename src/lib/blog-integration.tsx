// Enhanced Blog Integration System - User-Friendly Blog Components
// This file provides easy-to-use blog components with multiple layout options
// eslint-disable-next-line @typescript-eslint/no-explicit-any

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================

export interface BlogPost {
  id: number | string;
  title: string;
  slug?: string;
  excerpt: string;
  content?: string;
  featured_image?: string;
  image?: string;
  category_name?: string;
  category_slug?: string;
  author_name?: string;
  created_at?: string;
  published_at?: string;
  views?: number;
  reading_time?: number;
  tags?: any[];
}

export interface BlogSectionConfig {
  // Basic Settings
  id: string;
  layout: 'grid' | 'list' | 'featured' | 'masonry' | 'carousel' | 'minimal';
  
  // Display Options
  showImage: boolean;
  showTitle: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showCategory: boolean;
  showReadMore: boolean;
  showSectionTitle: boolean;
  
  // Layout Settings
  columns: 1 | 2 | 3 | 4;
  postCount: number;
  gap: number;
  
  // Styling
  cardStyle: 'basic' | 'elevated' | 'outlined' | 'gradient';
  imageHeight: number;
  borderRadius: number;
  
  // Section Styling
  title?: string;
  subtitle?: string;
  backgroundColor: string;
  textColor: string;
  padding: string;
  
  // Data
  posts: BlogPost[];
  loadFromAPI?: boolean;
  apiEndpoint?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch blog posts from API
 */
export async function fetchBlogPosts(limit: number = 12, endpoint: string = '/api/blog'): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${endpoint}?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return data.posts || [];
    }
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
  }
  return [];
}

/**
 * Get image URL from post (handles both image and featured_image fields)
 */
export function getPostImage(post: BlogPost, fallback: string = '/placeholder-blog.jpg'): string {
  return post.featured_image || post.image || fallback;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================================================
// BLOG CARD COMPONENTS
// ============================================================================

// Basic Blog Card
function BlogCardBasic({ post, config }: { post: BlogPost; config: BlogSectionConfig }) {
  const imageUrl = getPostImage(post);
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: `${config.borderRadius}px`,
      overflow: 'hidden',
      boxShadow: config.cardStyle === 'elevated' ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      border: config.cardStyle === 'outlined' ? '2px solid #e2e8f0' : 'none',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = config.cardStyle === 'elevated' ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)';
    }}>
      {config.showImage && (
        <img 
          src={imageUrl} 
          alt={post.title} 
          style={{ 
            width: '100%', 
            height: `${config.imageHeight}px`, 
            objectFit: 'cover' 
          }} 
        />
      )}
      <div style={{ padding: '1.25rem' }}>
        {config.showCategory && post.category_name && (
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem'
          }}>
            {post.category_name}
          </span>
        )}
        {config.showTitle && (
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem', 
            color: '#0f172a',
            lineHeight: '1.4'
          }}>
            {post.title}
          </h3>
        )}
        {config.showExcerpt && post.excerpt && (
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#64748b', 
            marginBottom: '1rem', 
            lineHeight: '1.6' 
          }}>
            {post.excerpt.substring(0, 120)}...
          </p>
        )}
        {(config.showAuthor || config.showDate) && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            fontSize: '0.8rem', 
            color: '#94a3b8',
            marginBottom: config.showReadMore ? '1rem' : '0'
          }}>
            {config.showAuthor && post.author_name && <span>✍️ {post.author_name}</span>}
            {config.showDate && post.created_at && <span>📅 {formatDate(post.created_at)}</span>}
          </div>
        )}
        {config.showReadMore && (
          <button style={{ 
            padding: '0.5rem 1rem', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 700, 
            cursor: 'pointer',
            fontSize: '0.85rem',
            width: '100%'
          }}>
            Read More →
          </button>
        )}
      </div>
    </div>
  );
}

// Horizontal Blog Card (for list layout)
function BlogCardHorizontal({ post, config }: { post: BlogPost; config: BlogSectionConfig }) {
  const imageUrl = getPostImage(post);
  
  return (
    <div style={{
      display: 'flex',
      gap: '1.5rem',
      background: '#fff',
      borderRadius: `${config.borderRadius}px`,
      padding: '1.5rem',
      boxShadow: config.cardStyle === 'elevated' ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      border: config.cardStyle === 'outlined' ? '2px solid #e2e8f0' : 'none',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.boxShadow = config.cardStyle === 'elevated' ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)';
    }}>
      {config.showImage && (
        <img 
          src={imageUrl} 
          alt={post.title} 
          style={{ 
            width: '240px', 
            height: '180px', 
            objectFit: 'cover', 
            borderRadius: '8px',
            flexShrink: 0
          }} 
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {config.showCategory && post.category_name && (
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            width: 'fit-content'
          }}>
            {post.category_name}
          </span>
        )}
        {config.showTitle && (
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem', 
            color: '#0f172a',
            lineHeight: '1.4'
          }}>
            {post.title}
          </h3>
        )}
        {config.showExcerpt && post.excerpt && (
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#64748b', 
            marginBottom: '1rem', 
            lineHeight: '1.6' 
          }}>
            {post.excerpt.substring(0, 150)}...
          </p>
        )}
        {(config.showAuthor || config.showDate) && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            fontSize: '0.85rem', 
            color: '#94a3b8',
            marginBottom: config.showReadMore ? '1rem' : '0'
          }}>
            {config.showAuthor && post.author_name && <span>✍️ {post.author_name}</span>}
            {config.showDate && post.created_at && <span>📅 {formatDate(post.created_at)}</span>}
            {post.reading_time && <span>⏱️ {post.reading_time} min</span>}
          </div>
        )}
        {config.showReadMore && (
          <button style={{ 
            padding: '0.6rem 1.5rem', 
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)', 
            color: '#0f172a', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 700, 
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: 'fit-content'
          }}>
            Read More →
          </button>
        )}
      </div>
    </div>
  );
}

// Featured Blog Card
function BlogCardFeatured({ post }: { post: BlogPost }) {
  const imageUrl = getPostImage(post);
  
  return (
    <div style={{ 
      position: 'relative', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      height: '450px' 
    }}>
      <img 
        src={imageUrl} 
        alt={post.title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        padding: '3rem', 
        color: '#fff' 
      }}>
        {post.category_name && (
          <span style={{ 
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            fontSize: '0.85rem', 
            fontWeight: 700,
            color: '#0f172a',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            {post.category_name}
          </span>
        )}
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 900, 
          marginBottom: '1rem',
          lineHeight: '1.2'
        }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            maxWidth: '700px',
            lineHeight: '1.6',
            opacity: 0.95
          }}>
            {post.excerpt.substring(0, 200)}...
          </p>
        )}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
          {post.author_name && <span>✍️ {post.author_name}</span>}
          {post.created_at && <span>📅 {formatDate(post.created_at)}</span>}
          {post.reading_time && <span>⏱️ {post.reading_time} min read</span>}
        </div>
        <button style={{ 
          padding: '0.75rem 2rem', 
          background: '#fff', 
          color: '#0f172a', 
          border: 'none', 
          borderRadius: '8px', 
          fontWeight: 800, 
          cursor: 'pointer',
          fontSize: '1rem'
        }}>
          Read Full Story →
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN BLOG SECTION COMPONENTS
// ============================================================================

// 1. Grid Layout
export function BlogGridSection({ config }: { config: BlogSectionConfig }) {
  const [posts, setPosts] = useState<BlogPost[]>(config.posts || []);
  const [loading, setLoading] = useState(config.loadFromAPI && !config.posts?.length);

  useEffect(() => {
    if (config.loadFromAPI) {
      fetchBlogPosts(config.postCount, config.apiEndpoint).then(fetchedPosts => {
        setPosts(fetchedPosts);
        setLoading(false);
      });
    }
  }, [config.loadFromAPI, config.postCount, config.apiEndpoint]);

  if (loading) {
    return (
      <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: '#64748b' }}>Loading posts...</p>
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return null;
  }

  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      {config.showSectionTitle && config.title && (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: config.textColor || '#0f172a',
            marginBottom: config.subtitle ? '0.5rem' : '0'
          }}>
            {config.title}
          </h2>
          {config.subtitle && (
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#64748b'
            }}>
              {config.subtitle}
            </p>
          )}
        </div>
      )}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${config.columns}, 1fr)`, 
        gap: `${config.gap}px`,
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {posts.slice(0, config.postCount).map(post => (
          <BlogCardBasic key={post.id} post={post} config={config} />
        ))}
      </div>
    </section>
  );
}

// 2. List Layout
export function BlogListSection({ config }: { config: BlogSectionConfig }) {
  const [posts, setPosts] = useState<BlogPost[]>(config.posts || []);
  const [loading, setLoading] = useState(config.loadFromAPI && !config.posts?.length);

  useEffect(() => {
    if (config.loadFromAPI) {
      fetchBlogPosts(config.postCount, config.apiEndpoint).then(fetchedPosts => {
        setPosts(fetchedPosts);
        setLoading(false);
      });
    }
  }, [config.loadFromAPI, config.postCount, config.apiEndpoint]);

  if (loading) {
    return (
      <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: '#64748b' }}>Loading posts...</p>
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return null;
  }

  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      {config.showSectionTitle && config.title && (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: config.textColor || '#0f172a',
            marginBottom: config.subtitle ? '0.5rem' : '0'
          }}>
            {config.title}
          </h2>
          {config.subtitle && (
            <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
              {config.subtitle}
            </p>
          )}
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: `${config.gap}px`,
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {posts.slice(0, config.postCount).map(post => (
          <BlogCardHorizontal key={post.id} post={post} config={config} />
        ))}
      </div>
    </section>
  );
}

// 3. Featured Layout
export function BlogFeaturedSection({ config }: { config: BlogSectionConfig }) {
  const [posts, setPosts] = useState<BlogPost[]>(config.posts || []);
  const [loading, setLoading] = useState(config.loadFromAPI && !config.posts?.length);

  useEffect(() => {
    if (config.loadFromAPI) {
      fetchBlogPosts(config.postCount, config.apiEndpoint).then(fetchedPosts => {
        setPosts(fetchedPosts);
        setLoading(false);
      });
    }
  }, [config.loadFromAPI, config.postCount, config.apiEndpoint]);

  if (loading) {
    return (
      <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: '#64748b' }}>Loading posts...</p>
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return null;
  }

  const featured = posts[0];
  const others = posts.slice(1, config.postCount);

  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {config.showSectionTitle && config.title && (
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: '#fff', 
            marginBottom: '2rem', 
            textAlign: 'center' 
          }}>
            {config.title}
          </h2>
        )}
        
        {/* Featured Post */}
        <BlogCardFeatured post={featured} />
        
        {/* Other Posts Grid */}
        {others.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: `${config.gap}px`,
            marginTop: '2rem'
          }}>
            {others.map(post => (
              <BlogCardBasic 
                key={post.id} 
                post={post} 
                config={{
                  ...config,
                  showAuthor: false,
                  showDate: true,
                  showCategory: false,
                  imageHeight: 180
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 4. Minimal Layout (Text-focused)
export function BlogMinimalSection({ config }: { config: BlogSectionConfig }) {
  const [posts, setPosts] = useState<BlogPost[]>(config.posts || []);
  const [loading, setLoading] = useState(config.loadFromAPI && !config.posts?.length);

  useEffect(() => {
    if (config.loadFromAPI) {
      fetchBlogPosts(config.postCount, config.apiEndpoint).then(fetchedPosts => {
        setPosts(fetchedPosts);
        setLoading(false);
      });
    }
  }, [config.loadFromAPI, config.postCount, config.apiEndpoint]);

  if (loading) {
    return (
      <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: '#64748b' }}>Loading posts...</p>
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return null;
  }

  return (
    <section style={{ backgroundColor: config.backgroundColor, padding: config.padding }}>
      {config.showSectionTitle && config.title && (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            color: config.textColor || '#0f172a',
            marginBottom: config.subtitle ? '0.5rem' : '0'
          }}>
            {config.title}
          </h2>
          {config.subtitle && (
            <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
              {config.subtitle}
            </p>
          )}
        </div>
      )}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${config.columns}, 1fr)`, 
        gap: `${config.gap}px`,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {posts.slice(0, config.postCount).map(post => (
          <div key={post.id} style={{ padding: '1.5rem' }}>
            {config.showCategory && post.category_name && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {post.category_name}
              </span>
            )}
            {config.showTitle && (
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 700, 
                marginBottom: '0.75rem', 
                color: '#0f172a',
                lineHeight: '1.4'
              }}>
                {post.title}
              </h3>
            )}
            {config.showExcerpt && post.excerpt && (
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#64748b', 
                marginBottom: '1rem', 
                lineHeight: '1.6' 
              }}>
                {post.excerpt.substring(0, 150)}...
              </p>
            )}
            {config.showDate && post.created_at && (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {formatDate(post.created_at)}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// PRESET CONFIGURATIONS - Ready to use!
// ============================================================================

export const blogPresets = {
  // For Forms - Help & Resources
  formHelp: {
    layout: 'list' as const,
    columns: 1 as const,
    showImage: true,
    showTitle: true,
    showExcerpt: true,
    showAuthor: false,
    showDate: false,
    showCategory: false,
    showReadMore: true,
    showSectionTitle: true,
    postCount: 3,
    gap: 24,
    cardStyle: 'basic' as const,
    imageHeight: 150,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    padding: '3rem 2rem'
  },

  // For Mini-Sites - Standard Blog
  miniSiteStandard: {
    layout: 'grid' as const,
    columns: 3 as const,
    showImage: true,
    showTitle: true,
    showExcerpt: true,
    showAuthor: false,
    showDate: true,
    showCategory: true,
    showReadMore: true,
    showSectionTitle: true,
    postCount: 6,
    gap: 24,
    cardStyle: 'elevated' as const,
    imageHeight: 200,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    padding: '4rem 2rem'
  },

  // For Landing Pages - Featured Hero
  landingFeatured: {
    layout: 'featured' as const,
    columns: 3 as const,
    showImage: true,
    showTitle: true,
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showCategory: true,
    showReadMore: true,
    showSectionTitle: true,
    postCount: 4,
    gap: 24,
    cardStyle: 'elevated' as const,
    imageHeight: 200,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    padding: '5rem 2rem'
  },

  // Compact Grid - Sidebar or Footer
  compactGrid: {
    layout: 'grid' as const,
    columns: 4 as const,
    showImage: true,
    showTitle: true,
    showExcerpt: false,
    showAuthor: false,
    showDate: false,
    showCategory: false,
    showReadMore: false,
    showSectionTitle: false,
    postCount: 8,
    gap: 16,
    cardStyle: 'basic' as const,
    imageHeight: 150,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    padding: '2rem 1rem'
  },

  // Minimal - Text-focused
  minimalText: {
    layout: 'minimal' as const,
    columns: 2 as const,
    showImage: false,
    showTitle: true,
    showExcerpt: true,
    showAuthor: false,
    showDate: true,
    showCategory: true,
    showReadMore: false,
    showSectionTitle: true,
    postCount: 6,
    gap: 32,
    cardStyle: 'basic' as const,
    imageHeight: 0,
    borderRadius: 0,
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    padding: '4rem 2rem'
  },

  // Magazine Style
  magazineStyle: {
    layout: 'grid' as const,
    columns: 3 as const,
    showImage: true,
    showTitle: true,
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showCategory: true,
    showReadMore: true,
    showSectionTitle: true,
    postCount: 9,
    gap: 28,
    cardStyle: 'outlined' as const,
    imageHeight: 220,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    padding: '4rem 2rem'
  }
};

// ============================================================================
// EASY BLOG INTEGRATION HELPER
// ============================================================================

/**
 * EasyBlogSection - One-line blog integration
 * Just specify the preset name and posts (or use API)
 */
export function EasyBlogSection({ 
  preset, 
  posts = [],
  title,
  subtitle,
  loadFromAPI = false,
  postCount
}: { 
  preset: keyof typeof blogPresets; 
  posts?: BlogPost[];
  title?: string;
  subtitle?: string;
  loadFromAPI?: boolean;
  postCount?: number;
}) {
  const presetConfig = blogPresets[preset];
  
  const config: BlogSectionConfig = {
    id: `blog-${preset}-${Date.now()}`,
    ...presetConfig,
    posts,
    title: title || presetConfig.showSectionTitle ? 'Latest Articles' : undefined,
    subtitle,
    loadFromAPI,
    postCount: postCount || presetConfig.postCount
  };

  switch (presetConfig.layout) {
    case 'grid':
      return <BlogGridSection config={config} />;
    case 'list':
      return <BlogListSection config={config} />;
    case 'featured':
      return <BlogFeaturedSection config={config} />;
    case 'minimal':
      return <BlogMinimalSection config={config} />;
    default:
      return <BlogGridSection config={config} />;
  }
}
