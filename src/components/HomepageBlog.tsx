'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category_name: string;
  created_at: string;
  reading_time: number;
}

export default function HomepageBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/blog?limit=3');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-spinner fa-spin"></i></div>;
  if (posts.length === 0) return null;

  return (
    <div style={{ padding: '4rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h6 style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.7rem', margin: '0 0 0.5rem 0' }}>Stories from the Oasis</h6>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Latest Articles</h2>
        </div>
        <Link href="/blog" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem' }}>VIEW ALL POSTS →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', textDecoration: 'none', color: 'inherit', transition: 'transform 0.3s' }}>
            <div style={{ height: '200px', position: 'relative' }}>
              <img src={post.featured_image || 'https://images.unsplash.com/photo-1540979388789-6ece48a17499?q=80&w=800'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(15,23,42,0.8)', padding: '0.4rem 0.8rem', borderRadius: '50px', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 900 }}>{post.category_name}</div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#fff', margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 800 }}>{post.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{post.excerpt?.substring(0, 100)}...</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span>{post.reading_time} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
