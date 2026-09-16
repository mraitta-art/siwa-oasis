'use client';

import type { CSSProperties } from 'react';
import AdvancedHeroCarousel from './AdvancedHeroCarousel';

interface CategoryPageHeroProps {
  category: string;
  label: string;
  title: string;
  accent: string;
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&q=85&w=1800',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=85&w=1800',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=85&w=1800',
];

export default function CategoryPageHero({ category, label, title, accent }: CategoryPageHeroProps) {
  const slides = HERO_IMAGES.map((mediaUrl, index) => ({
    id: `${category}-hero-${index}`,
    type: 'image' as const,
    mediaUrl,
    title: index === 0 ? title : `${label} in Siwa, your way`,
    subtitle: index === 0 ? `Find a better way to explore ${label.toLowerCase()} in the oasis.` : 'Compare trusted local experiences in one compact search.',
    overlayOpacity: 0.48,
    animation: index === 1 ? 'zoom' as const : 'kenburns' as const,
    titleColor: '#fff',
    ctaText: 'Start exploring',
    ctaLink: '#category-search',
    ctaType: 'custom' as const,
  }));

  return (
    <div className="category-hero-shell" style={{ '--category-accent': accent } as CSSProperties}>
      <AdvancedHeroCarousel
        slides={slides}
        height="clamp(310px, 46vw, 540px)"
        autoPlayInterval={6500}
        visualSettings={{ titleSize: 3.2, subtitleSize: 1, titleColor: '#fff', primaryFont: 'var(--font-heading)' }}
      />
    </div>
  );
}