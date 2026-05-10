'use client';
import React from 'react';
import Link from 'next/link';

interface FeaturedVibeProps {
  vibe?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function FeaturedVibe({ 
  vibe = 'Salt Lakes', 
  title = 'The Turquoise Miracles', 
  description = 'Float in the high-salinity crystal waters of Siwa. A therapeutic and spiritual journey into the heart of the desert.',
  imageUrl = 'https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=2000',
  ctaText = 'DISCOVER THE VIBE',
  ctaLink = '/search/vibe?vibe=Spiritual'
}: FeaturedVibeProps) {
  return (
    <div style={{ 
      position: 'relative', 
      height: '70vh', 
      minHeight: '500px', 
      borderRadius: '40px', 
      overflow: 'hidden', 
      margin: '2rem 0',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
    }}>
      <img 
        src={imageUrl} 
        alt={title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(to right, rgba(15,23,42,0.9), transparent)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: 'clamp(2rem, 10vw, 6rem)' 
      }}>
        <div style={{ maxWidth: '600px' }}>
          <span style={{ 
            color: '#D4AF37', 
            fontWeight: 900, 
            letterSpacing: '5px', 
            textTransform: 'uppercase', 
            fontSize: '0.8rem',
            display: 'block',
            marginBottom: '1rem'
          }}>FEATURED VIBE: {vibe}</span>
          <h2 style={{ 
            color: '#fff', 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 900, 
            lineHeight: 1.1,
            marginBottom: '1.5rem'
          }}>{title}</h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: '1.1rem', 
            lineHeight: 1.6, 
            marginBottom: '2.5rem' 
          }}>{description}</p>
          <Link href={ctaLink} style={{ 
            display: 'inline-block', 
            padding: '1.25rem 3rem', 
            background: '#D4AF37', 
            color: '#1a1a2e', 
            textDecoration: 'none', 
            borderRadius: '50px', 
            fontWeight: 900,
            fontSize: '0.9rem',
            letterSpacing: '2px',
            transition: 'transform 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
