import React from 'react';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';

/**
 * Strip dangerous HTML tags/attributes to mitigate XSS.
 * Works in both server and browser environments.
 */
function sanitizeHtml(html: string): string {
  // Remove script/style/iframe/object/embed/form elements and their content
  let clean = html.replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button)[\s\S]*?<\/\1>/gi, '');
  // Remove self-closing dangerous tags
  clean = clean.replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button)\b[^>]*\/?>/gi, '');
  // Remove event handler attributes (onclick, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Remove javascript: protocol in href/src attributes
  clean = clean.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');
  return clean;
}

/**
 * Dynamic Component Renderer
 * Renders component based on configuration
 * Can be extended with more component types
 */

interface DynamicComponentProps {
  component: any;
}

function ServiceCatalog({ props, label }: { props: any; label?: string }) {
  const items = Array.isArray(props.items) ? props.items : props.title ? [props] : [];
  if (items.length === 0) return null;

  return (
    <section style={{ padding: '3rem 1.5rem', background: '#f8fafc' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#a16207', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Vendor services</div>
          <h2 style={{ margin: '0.35rem 0 0', color: '#0f172a', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900 }}>{props.title || label || 'Services & Facilities'}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {items.map((item: any, index: number) => {
            const price = item.price !== undefined && item.price !== '' ? `${item.currency || 'EGP'} ${item.price}` : '';
            return (
              <article key={`${item.title || 'service'}-${index}`} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '220px', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#fff' }}>
                {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', color: '#a16207', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <span>{item.category || 'Service'}</span>
                    {price && <span>{price}</span>}
                  </div>
                  <h3 style={{ margin: '0.45rem 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: 900 }}>{item.title}</h3>
                  <p style={{ flex: 1, margin: 0, color: '#475569', fontSize: '0.8rem', lineHeight: 1.55 }}>{item.description}</p>
                  {(item.duration || item.capacity || item.availability || item.price_unit) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.8rem', color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>
                      {[item.duration, item.capacity, item.availability, item.price_unit].filter(Boolean).map((detail: string) => <span key={detail} style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', background: '#f1f5f9' }}>{detail}</span>)}
                    </div>
                  )}
                  {item.request_url && <a href={item.request_url} style={{ marginTop: '0.9rem', color: '#166534', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none', textTransform: 'uppercase' }}>Request service →</a>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function DynamicComponentRenderer({ component }: DynamicComponentProps) {
  if (!component) return null;

  const { type, props = {}, label } = component;
  const resolvedTitle = props.title || props.custom_title || label || type?.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()) || 'Section Component';

  switch (type) {
    case 'service_catalog':
      return <ServiceCatalog props={props} label={resolvedTitle} />;

    case 'hero_carousel':
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
            {props.title || props.custom_title || label || 'Call to Action'}
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
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            {props.title || props.custom_title || label || 'Section Content'}
          </h2>
          {props.content && (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.content) }}
              style={{ lineHeight: 1.8, color: '#64748b' }}
            />
          )}
        </div>
      );

    case 'testimonials':
      return (
        <div style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '3rem', textAlign: 'center' }}>
            {props.title || props.custom_title || label || 'What Our Users Say'}
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
            {props.title || props.custom_title || label || 'Frequently Asked Questions'}
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
