'use client';

import React from 'react';
import Link from 'next/link';

export default function VendorPartnerCTA({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div style={{ padding: '6rem 0', background: 'var(--bg)', borderTop: '1px solid var(--border-light)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{
          position: 'relative',
          borderRadius: '40px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255, 183, 0, 0.08) 0%, var(--bg-alt) 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: 'clamp(2.5rem, 8vw, 5rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '3rem'
        }}>
          {/* Visual absolute glows */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            left: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,183,0,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Text Area */}
          <div style={{ flex: '1 1 500px', zIndex: 2 }}>
            <span style={{ 
              color: 'var(--gold)', 
              fontWeight: 900, 
              letterSpacing: '4px', 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              display: 'block', 
              marginBottom: '1rem' 
            }}>
              {subtitle || 'COMMUNITY DIRECTORY GOVERNANCE'}
            </span>
            <h3 style={{ 
              color: 'var(--text)', 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 900, 
              margin: '0 0 1.25rem 0',
              lineHeight: 1.15
            }}>
              {title || 'Empower the Siwan Cooperative'}
            </h3>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1rem', 
              lineHeight: 1.7, 
              margin: 0,
              maxWidth: '650px' 
            }}>
              Are you a local farmer harvesting organic dates, a salt therapy specialist, a family guild of hand-embroidery, or a certified ecological tour guide? Register your services on our authenticated, community-governed directory to expand the Living Spirit of Siwa.
            </p>
          </div>

          {/* Buttons Area */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', zIndex: 2, alignItems: 'center' }}>
            <Link 
              href="/be-a-partner" 
              style={{
                padding: '1.25rem 2.5rem',
                background: 'var(--gold)',
                color: 'var(--dark)',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: '1px',
                boxShadow: '0 15px 30px rgba(255, 183, 0, 0.2)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              REGISTER COOPERATIVE
            </Link>

            <Link 
              href="/investment" 
              style={{
                padding: '1.25rem 2.25rem',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '1px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--bg-alt)';
                e.currentTarget.style.borderColor = 'var(--gold)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--card)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              HERITAGE STATUTES
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
