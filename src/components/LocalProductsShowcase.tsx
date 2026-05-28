'use client';

import React from 'react';
import MasterCard from './MasterCard';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  imageUrl: string;
  origin: string;
  story?: string;
  link?: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'date-1',
    name: 'Siwan Organic Siwi Dates',
    category: 'Organic Gastronomy',
    price: '180 EGP / kg',
    description: 'Hand-picked organic honey dates, naturally sundried in traditional palm baskets in the heart of ancient orchards.',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=600',
    origin: 'Aghurmi Date Groves',
    story: 'Harvested under solar-aligned calendars utilizing ancestral water irrigation paths first mapped during the Roman era.',
    link: '/search/vibe?q=date-1',
  },
  {
    id: 'oil-1',
    name: 'Cold-Pressed Extra Virgin Olive Oil',
    category: 'Organic Gastronomy',
    price: '320 EGP / 500ml',
    description: 'Premium liquid gold extracted using local stone presses. Unfiltered, rich in anti-oxidants, and packed with desert minerals.',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600',
    origin: 'Cleopatra Orchard cooperative',
    story: 'Pressed within 4 hours of dawn harvesting to maintain a perfect 0.2% acidity index.',
    link: '/search/vibe?q=oil-1',
  },
  {
    id: 'salt-1',
    name: 'Therapeutic Crystalline Salt Lamp',
    category: 'Artisan Crafts',
    price: '450 EGP',
    description: 'Carved by hand from pure rock salt blocks extracted from the high-mineral therapeutic depths of the Salt Lakes.',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600',
    origin: 'Salt Cave Craft Guild',
    story: 'Known to emit healthy negative ions when warmed, purifying the air and encouraging deep meditative breathing.',
    link: '/search/vibe?q=salt-1',
  },
];

interface Props {
  products?: ProductItem[];
}

export default function LocalProductsShowcase({ products }: Props) {
  const items = products && products.length > 0 ? products : DEFAULT_PRODUCTS;

  return (
    <div style={{ padding: '6rem 0', background: '#0a0f1d', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>
              LOCAL MARKETPLACE
            </span>
            <h2 style={{ color: '#fff', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 900, margin: 0 }}>
              Featured Local Products
            </h2>
          </div>
          <button
            onClick={() => window.location.href = '/search/vibe?category=crafts'}
            style={{ background: 'none', border: 'none', color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '1px' }}
          >
            BROWSE MARKETPLACE <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {items.map(p => (
            <MasterCard
              key={p.id}
              title={p.name}
              description={p.description}
              image={p.imageUrl}
              tag={`${p.category.toUpperCase()} • ${p.origin.toUpperCase()}`}
              onCardClick={() => window.location.href = p.link || `/search/vibe?q=${p.id}`}
              links={[
                {
                  label: `Acquire: ${p.price}`,
                  icon: 'fa-shopping-bag',
                  onClick: () => window.location.href = p.link || `/search/vibe?q=${p.id}`,
                },
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
