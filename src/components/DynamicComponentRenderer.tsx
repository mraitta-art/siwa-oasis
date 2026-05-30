import React from 'react';

/**
 * Dynamic Component Renderer
 * Renders any component based on configuration
 * Can be extended with more component types
 */

interface DynamicComponentProps {
  component: any;
}

export default function DynamicComponentRenderer({ component }: DynamicComponentProps) {
  if (!component) return null;

  const { type, props = {} } = component;

  switch (type) {
    case 'hero_carousel':
      // Import dynamically to avoid circular dependencies
      const AdvancedHeroCarousel = require('@/components/AdvancedHeroCarousel').default;
      return (
        <AdvancedHeroCarousel
          carouselName={props.carousel_id || 'main_hero'}
          height={props.height || '85vh'}
          autoPlay={props.autoplay !== false}
        />
      );

    case 'cta_section':
      return (
        <div style={{ padding: '4rem 2rem', background: '#D4AF37', textAlign: 'center', color: '#1a1a2e' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            {props.title || 'Call to Action'}
          </h2>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            {props.description || 'This is a call to action section'}
          </p>
          {props.link && (
            <a
              href={props.link}
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#1a1a2e',
                color: '#D4AF37',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 900
              }}
            >
              {props.link_text || 'Learn More'}
            </a>
          )}
        </div>
      );

    case 'text_section':
      return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {props.title && (
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
              {props.title}
            </h2>
          )}
          {props.content && (
            <div
              dangerouslySetInnerHTML={{ __html: props.content }}
              style={{ lineHeight: 1.8, color: '#64748b' }}
            />
          )}
        </div>
      );

    case 'testimonials':
      return (
        <div style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '3rem', textAlign: 'center' }}>
            {props.title || 'What Our Users Say'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {props.testimonials?.map((t: any, idx: number) => (
              <div key={idx} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <span key={i} style={{ color: '#D4AF37' }}>★</span>
                  ))}
                </div>
                <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{t.text}</p>
                <strong>{t.author}</strong>
                {t.role && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t.role}</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '3rem', textAlign: 'center' }}>
            {props.title || 'Frequently Asked Questions'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {props.faqs?.map((item: any, idx: number) => (
              <details key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
                <summary style={{ fontWeight: 700, cursor: 'pointer' }}>
                  {item.question}
                </summary>
                <div style={{ marginTop: '1rem', color: '#64748b', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ padding: '2rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center', color: '#991b1b' }}>
          ⚠️ Unknown component type: {type}
        </div>
      );
  }
}
