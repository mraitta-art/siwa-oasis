'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category_name: string | null;
  created_at: string | null;
  reading_time: number;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

type BlogLayout = 'grid' | 'list' | 'featured' | 'masonry' | 'minimal';

export default function HomepageBlog({ title, subtitle, maxPosts, blogLayout = 'grid', pagePath = '/' }: { title?: string; subtitle?: string; maxPosts?: number; blogLayout?: BlogLayout; pagePath?: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({
          limit: String(maxPosts || 3),
          location: pagePath,
        });
        const res = await fetch(`/api/blog?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [maxPosts, pagePath]);

  if (loading) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-spinner fa-spin"></i></div>;
  if (posts.length === 0) return null;

  const layout = ['grid', 'list', 'featured', 'masonry', 'minimal'].includes(blogLayout)
    ? blogLayout
    : 'grid';

  return (
    <div style={{ padding: '4rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h6 style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.7rem', margin: '0 0 0.5rem 0' }}>{subtitle || 'Stories from the Oasis'}</h6>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{title || 'Latest Articles'}</h2>
        </div>
        <Link href="/blog" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem' }}>VIEW ALL POSTS →</Link>
      </div>

      <div style={{
        display: layout === 'masonry' ? 'block' : 'grid',
        gridTemplateColumns: layout === 'list' || layout === 'minimal'
          ? 'minmax(0, 1fr)'
          : 'repeat(auto-fit, minmax(280px, 1fr))',
        columnWidth: layout === 'masonry' ? '280px' : undefined,
        columnGap: layout === 'masonry' ? '1.5rem' : undefined,
        gap: '1.5rem',
      }}>
        {posts.map((post, index) => {
          const featured = layout === 'featured' && index === 0;
          return (
          <Link key={post.id} href={`/blog/${post.slug}`} style={{
            display: layout === 'list' ? 'flex' : layout === 'masonry' ? 'inline-block' : 'block',
            width: layout === 'masonry' ? '100%' : undefined,
            breakInside: layout === 'masonry' ? 'avoid' : undefined,
            gridColumn: featured ? '1 / -1' : undefined,
            marginBottom: layout === 'masonry' ? '1.5rem' : undefined,
            background: layout === 'minimal' ? 'transparent' : 'rgba(255,255,255,0.03)',
            borderRadius: layout === 'minimal' ? 0 : '24px',
            border: layout === 'minimal' ? 'none' : '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.3s',
          }}>
            <div style={{
              height: layout === 'list' ? '100%' : featured ? '320px' : '200px',
              minHeight: layout === 'list' ? '180px' : undefined,
              flex: layout === 'list' ? '0 0 240px' : undefined,
              position: 'relative',
            }}>
              <img src={post.featured_image || 'https://images.unsplash.com/photo-1540979388789-6ece48a17499?q=80&w=800'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(15,23,42,0.8)', padding: '0.4rem 0.8rem', borderRadius: '50px', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 900 }}>{post.category_name}</div>
            </div>
            <div style={{ padding: layout === 'minimal' ? '1rem 0' : featured ? '2rem' : '1.5rem', flex: 1 }}>
              <h3 style={{ color: '#fff', margin: '0 0 0.75rem 0', fontSize: featured ? '1.6rem' : '1.25rem', fontWeight: 800 }}>{post.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{post.excerpt?.substring(0, 100)}...</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{formatDate(post.created_at)}</span>
                <span>{post.reading_time} min read</span>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
