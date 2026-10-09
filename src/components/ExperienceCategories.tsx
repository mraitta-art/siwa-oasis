'use client';

import React, { useState, useEffect } from 'react';
import { BRAND_SECTORS, HOME_BRAND_SECTOR_SLUGS } from '@/lib/brand-sectors';

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

const DEFAULT_CATEGORIES: CategoryItem[] = HOME_BRAND_SECTOR_SLUGS.map((slug, index) => {
  const sector = BRAND_SECTORS[slug];
  return {
    id: slug,
    title: sector.label,
    subtitle: sector.description,
    icon: sector.icon,
    image_url: sector.image_url,
    color: sector.accent,
    link: `/${slug}`,
    is_visible: true,
    display_order: index + 1,
  };
});

interface Props {
  categories?: CategoryItem[];
  title?: string;
  subtitle?: string;
}

export default function ExperienceCategories({ categories, title, subtitle }: Props) {
  const [items, setItems] = useState<CategoryItem[]>(categories || []);
  const [loading, setLoading] = useState(!categories);

  useEffect(() => {
    const mergeBrandCategories = (additional: CategoryItem[]) => {
      const brandIds = new Set(DEFAULT_CATEGORIES.map(category => category.id));
      return [...DEFAULT_CATEGORIES, ...additional.filter(category => !brandIds.has(category.id))];
    };

    if (categories) {
      setItems(mergeBrandCategories(categories));
      setLoading(false);
      return;
    }

    async function fetchCategories() {
      try {
        const res = await fetch('/api/jana/experience-categories?visibleOnly=true');
        if (res.ok) {
          const data = await res.json();
          setItems(mergeBrandCategories(Array.isArray(data) ? data : []));
        } else {
          setItems(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.warn('Failed to load categories from database, using fallback:', error);
        setItems(DEFAULT_CATEGORIES);
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
          {subtitle || 'SIX SIWIFY MARKETPLACES'}
        </span>
        <h2 style={{ color: 'var(--text)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
          {title || 'Explore Siwify'}
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '1.25rem auto 0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Browse six connected hubs for stays, journeys, retreats, local products, investment, and Siwa's community.
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
