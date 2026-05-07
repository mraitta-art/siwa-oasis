'use client';

import React from 'react';
import Link from 'next/link';

interface HeritageCardProps {
  item: any;
  priority?: boolean;
}

/**
 * HERITAGE CARD — The Gold Standard of Siwa Oasis Listings.
 * Displays "Admin Checked" architectural data and DNA tags.
 */
export default function HeritageCard({ item, priority = false }: HeritageCardProps) {
  const name = item.name || item.title || 'Siwa Boutique';
  const customData = typeof item.custom_data === 'string' ? JSON.parse(item.custom_data) : (item.custom_data || {});

  // Extract DNA fields with fallbacks
  const era = customData.era || 'Traditional';
  const material = customData.material || 'Kershef';
  const vibe = customData.vibe || 'Peaceful';
  const summary = item.description || customData.story || customData.summary || 'A curated narrative through the architectural heritage of the Siwa Oasis.';

  // Dynamic Image Logic
  const _gallerySection = customData ? (Object.values(customData) as any[]).find((v: any) => v && v.section_gallery) : null;
  const image = item.mediaUrl || (_gallerySection ? _gallerySection.section_gallery?.[0]?.url : null) || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62';
  const slug = item.slug || item.id;

  return (
    <Link href={`/${slug}`} style={{ textDecoration: 'none' }} className="heritage-card-link">
      <div className="heritage-card" style={{
        transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Media Container */}
        <div className="card-media-container" style={{
          height: 'clamp(350px, 40vw, 500px)',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '40px',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.15)',
          background: '#f8fafc'
        }}>
          <img
            src={image}
            alt={name}
            className="card-image"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.2s ease' }}
            loading={priority ? "eager" : "lazy"}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,29,0.5), transparent)' }}></div>

          {/* ADMIN CHECK BADGE (The "Admin Verified" Signature) */}
          <div className="admin-badge" style={{
            position: 'absolute', top: 30, left: 30,
            background: '#D4AF37', color: '#0a0f1d',
            padding: '0.6rem 1.2rem', borderRadius: '50px',
            fontSize: '0.55rem', fontWeight: 900, letterSpacing: '2px',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 10px 20px rgba(212,175,55,0.3)',
            zIndex: 2
          }}>
            <i className="fas fa-check-circle"></i>
            ADMIN VERIFIED
          </div>

          {/* DNA PILLS ON IMAGE */}
          <div className="dna-pills" style={{ position: 'absolute', bottom: 30, left: 30, right: 30, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', zIndex: 2 }}>
            {[era, material].map((tag, idx) => (
              <span key={idx} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.4rem 1rem', borderRadius: '30px',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="card-content" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) 0.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>{vibe.toUpperCase()} EXPERIENCE</span>
            <div style={{ flexGrow: 1, height: '1px', background: '#f1f5f9' }}></div>
          </div>

          <h3 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 900, color: '#0a0f1d',
            marginBottom: '1rem',
            letterSpacing: '-1.5px',
            lineHeight: 1.1
          }}>
            {name}
          </h3>

          <p style={{
            color: '#64748b', fontSize: '1.05rem', lineHeight: 1.7,
            maxWidth: '100%', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: '2rem'
          }}>
            {summary}
          </p>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: '0.8rem' }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0a0f1d' }}>SIWA OASIS</span>
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <i className="fas fa-arrow-right arrow-icon" style={{ fontSize: '1.1rem', color: '#D4AF37', transition: 'transform 0.3s ease' }}></i>
          </div>
        </div>

        {/* SCOPED STYLES */}
        <style jsx>{`
          .heritage-card:hover .card-image {
            transform: scale(1.05);
          }
          .heritage-card:hover {
            transform: translateY(-10px);
          }
          .heritage-card:hover .arrow-icon {
            transform: translateX(10px);
          }
        `}</style>
      </div>
    </Link>
  );
}
