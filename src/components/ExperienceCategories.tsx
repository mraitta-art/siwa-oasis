'use client';

import React, { useState, useEffect } from 'react';

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image_url: string;
  color: string;
  link: string;
  is_visible: boolean;
  display_order: number;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'wellness',
    title: 'WELLNESS & HEALING',
    subtitle: 'Float in salt lakes, immerse in natural springs, and experience therapeutic desert sand baths.',
    icon: 'fa-spa',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    color: '#10B981',
    link: '/search/vibe?category=wellness',
    is_visible: true,
    display_order: 1,
  },
  {
    id: 'slow-food',
    title: 'AGRICULTURE & SLOW FOOD',
    subtitle: 'Taste organic date orchards, ancestral olive presses, and traditional Siwan gastronomy.',
    icon: 'fa-seedling',
    image_url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800',
    color: '#f59e0b',
    link: '/search/vibe?category=food',
    is_visible: true,
    display_order: 2,
  },
  {
    id: 'crafts',
    title: 'ARTISAN CRAFTS & TRADES',
    subtitle: 'Explore rock salt lamps, hand-embroidered textiles, and clay pottery crafted across generations.',
    icon: 'fa-store',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    color: '#ef4444',
    link: '/search/vibe?category=crafts',
    is_visible: true,
    display_order: 3,
  },
  {
    id: 'safaris',
    title: 'ECO-SAFARIS & RETREATS',
    subtitle: 'Nomadic camping in the Great Sand Sea, eco-lodges of Kershef, and spiritual stargazing.',
    icon: 'fa-campground',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    color: '#8b5cf6',
    link: '/search/vibe?category=adventure',
    is_visible: true,
    display_order: 4,
  },
];

interface Props {
  categories?: CategoryItem[];
  title?: string;
  subtitle?: string;
}

export default function ExperienceCategories({ categories, title, subtitle }: Props) {
  const [items, setItems] = useState<CategoryItem[]>(categories || DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(!categories);

  useEffect(() => {
    if (categories) return; // Use passed-in categories if provided

    async function fetchCategories() {
      try {
        const res = await fetch('/api/jana/experience-categories?visibleOnly=true');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setItems(data);
          }
        }
      } catch (error) {
        console.warn('Failed to load categories from database, using fallback:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [categories]);

  return (
    <div style={{ padding: '6rem 0', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span style={{ color: 'var(--gold)', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
          {subtitle || 'THE PILLARS OF SIWA'}
        </span>
        <h2 style={{ color: 'var(--text)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
          {title || 'Discover the Living Spirit'}
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '1.25rem auto 0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Journey through ancient agricultural traditions, therapeutic thermal waters, unique kershef architectures, and local marketplace trades.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', padding: '0 1rem' }}>
        {items.map((cat) => (
          <div
            key={cat.id}
            onClick={() => window.location.href = cat.link}
            style={{ position: 'relative', height: '420px', borderRadius: '30px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
              const img = e.currentTarget.querySelector('img') as HTMLImageElement;
              if (img) img.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              const img = e.currentTarget.querySelector('img') as HTMLImageElement;
              if (img) img.style.transform = 'scale(1)';
            }}
          >
            <img src={cat.image_url} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,15,29,0.95) 100%)', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, fontSize: '1.1rem', zIndex: 2 }}>
              <i className={`fas ${cat.icon}`}></i>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', zIndex: 2 }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>{cat.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>{cat.subtitle}</p>
              <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                EXPLORE ECOSYSTEM <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
