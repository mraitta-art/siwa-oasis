'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StoryPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category_name: string;
  created_at: string;
  reading_time: number;
}

export default function StorytellingSection({ title, subtitle }: { title?: string; subtitle?: string }) {
  const [posts, setPosts] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);

  // High-Fidelity Static Fallback Data
  const fallbackStories: StoryPost[] = [
    {
      id: 101,
      title: 'The Secrets of Kershef: Ancestral Salt Architecture',
      slug: 'secrets-of-kershef',
      excerpt: 'Discover how ancient Siwans blended raw salt rocks and mud clay to erect structures that naturally cool in scorching heat and keep warmth in winter chills.',
      featured_image: 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=800',
      category_name: 'Heritage & Culture',
      created_at: '2026-05-15T00:00:00Z',
      reading_time: 6
    },
    {
      id: 102,
      title: 'Harvesting Liquid Gold: The Stone Mills of Cleopatra',
      slug: 'harvesting-liquid-gold',
      excerpt: 'Step inside the traditional cold stone olive presses operating without electricity, harvesting clean extra virgin oils rich in desert minerals.',
      featured_image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800',
      category_name: 'Agriculture & Food',
      created_at: '2026-05-10T00:00:00Z',
      reading_time: 4
    }
  ];

  useEffect(() => {
    async function loadStories() {
      try {
        const res = await fetch('/api/blog?limit=2');
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            setPosts(data.posts);
          } else {
            setPosts(fallbackStories);
          }
        } else {
          setPosts(fallbackStories);
        }
      } catch (e) {
        console.error('Stories loading failed, applying fallbacks:', e);
        setPosts(fallbackStories);
      }
      setLoading(false);
    }
    loadStories();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
      </div>
    );
  }

  return (
    <div style={{ padding: '6rem 0', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <span style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
            {subtitle || 'HERITAGE CHRONICLES'}
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 900, margin: 0 }}>
            {title || 'Living Oral Traditions & Stories'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.90rem', marginTop: '1.25rem', maxWidth: '600px', margin: '1.25rem auto 0 auto', lineHeight: 1.6 }}>
            Immerse yourself in authentic Siwan legends, architectural records, healing water studies, and slow agriculture diaries documented by community elders.
          </p>
        </div>

        {/* Stories Grid (Cinematic Panels) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
          {posts.map(post => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`} 
              style={{ 
                display: 'block',
                background: 'rgba(255,255,255,0.01)', 
                borderRadius: '35px', 
                border: '1px solid rgba(255,255,255,0.05)', 
                overflow: 'hidden', 
                textDecoration: 'none', 
                color: 'inherit',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Cover Image */}
              <div style={{ height: '260px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.6s ease'
                  }} 
                />
                
                {/* Category Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: '1.25rem', 
                  left: '1.25rem', 
                  background: 'rgba(15,23,42,0.85)', 
                  backdropFilter: 'blur(10px)',
                  padding: '0.5rem 1rem', 
                  borderRadius: '50px', 
                  color: '#D4AF37', 
                  fontSize: '0.65rem', 
                  fontWeight: 900,
                  letterSpacing: '1px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                  {post.category_name.toUpperCase()}
                </div>
              </div>

              {/* Text Area */}
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '1rem' }}>
                  <span>{new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</span>
                  <span>{post.reading_time} MIN READ</span>
                </div>

                <h3 style={{ 
                  color: '#fff', 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.35rem', 
                  fontWeight: 900,
                  lineHeight: 1.3
                }}>
                  {post.title}
                </h3>
                
                <p style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: '0.85rem', 
                  lineHeight: 1.7, 
                  marginBottom: '2rem' 
                }}>
                  {post.excerpt}
                </p>

                <span style={{ 
                  color: '#D4AF37', 
                  fontSize: '0.8rem', 
                  fontWeight: 800, 
                  letterSpacing: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  READ CHRONICLE <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
