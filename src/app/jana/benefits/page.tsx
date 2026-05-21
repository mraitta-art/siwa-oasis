'use client';

import React from 'react';
import Link from 'next/link';

export default function SubscriptionBenefits() {
  const plans = [
    {
      name: 'HERITAGE (FREE)',
      price: '$0',
      tagline: 'Preserve your legacy on the platform.',
      features: [
        { text: '8-Chapter DNA Structure', active: true },
        { text: 'Verified Business Registry', active: true },
        { text: 'Standard Mobile Dashboard', active: true },
        { text: '2MB Image Quota', active: true },
        { text: 'Standard Minisite Theme', active: true },
        { text: 'Global Discovery Carousel', active: false },
        { text: 'Kiosk / Lobby Demo Mode', active: false },
        { text: 'Leads & Enquiries CRM', active: false },
        { text: 'Investment Marketplace', active: false },
        { text: 'Priority AI Storytelling', active: false },
      ]
    },
    {
      name: 'PREMIUM PARTNER',
      price: '$49',
      tagline: 'Scale your business with cinematic power.',
      highlight: true,
      features: [
        { text: '8-Chapter DNA Structure', active: true },
        { text: 'Verified Business Registry', active: true },
        { text: 'Advanced Mobile Command Center', active: true },
        { text: '10MB High-Res Image Quota', active: true },
        { text: 'White-Label Custom Domain', active: true },
        { text: 'Global Discovery Carousel (Front Row)', active: true },
        { text: 'Kiosk / Lobby Demo Mode (HD)', active: true },
        { text: 'Leads & Enquiries CRM', active: true },
        { text: 'Investment Marketplace Access', active: true },
        { text: 'Global Search Integration', active: true },
      ]
    }
  ];

  return (
    <div style={{ background: '#0a0f1d', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '4rem 2rem' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '5px', marginBottom: '1.5rem' }}>THE SIWA TODAY ADVANTAGE</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-2px' }}>Elevate Your Business DNA</h1>
        <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', opacity: 0.6, lineHeight: 1.8 }}>
          Join the elite collection of Siwa Oasis businesses. From lobby cinematic demos to global marketing automation, unlock the tools designed for the next generation of heritage hospitality.
        </p>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ 
            background: plan.highlight ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
            borderRadius: '40px', padding: '3.5rem', border: plan.highlight ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden', boxShadow: plan.highlight ? '0 30px 60px -12px rgba(212,175,55,0.15)' : 'none'
          }}>
            {plan.highlight && (
              <div style={{ position: 'absolute', top: '2rem', right: '-2.5rem', background: '#D4AF37', color: '#0a0f1d', padding: '0.5rem 4rem', fontSize: '0.7rem', fontWeight: 900, transform: 'rotate(45deg)' }}>
                MOST POPULAR
              </div>
            )}

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: plan.highlight ? '#D4AF37' : '#fff', marginBottom: '0.5rem' }}>{plan.name}</h2>
            <div style={{ fontSize: '0.9rem', opacity: 0.5, marginBottom: '2.5rem' }}>{plan.tagline}</div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '3rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900 }}>{plan.price}</span>
              <span style={{ fontSize: '1rem', opacity: 0.4 }}>/ month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3.5rem' }}>
              {plan.features.map(f => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: f.active ? 1 : 0.3 }}>
                  <i className={`fas ${f.active ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ color: f.active ? '#D4AF37' : '#475569' }}></i>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button style={{ 
              width: '100%', padding: '1.25rem', borderRadius: '16px', 
              background: plan.highlight ? '#D4AF37' : 'rgba(255,255,255,0.05)', 
              color: plan.highlight ? '#0a0f1d' : '#fff', border: 'none', 
              fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s'
            }}>
              {plan.highlight ? 'UPGRADE TO PARTNER' : 'CURRENT PLAN'}
            </button>
          </div>
        ))}
      </div>

      {/* DETAILED BENEFIT SHOWCASE */}
      <section style={{ marginTop: '10rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '5rem' }}>The Premium Experience</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem' }}>
          
          <div>
             <div style={{ width: '70px', height: '70px', background: '#D4AF3720', color: '#D4AF37', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.5rem' }}>
                <i className="fas fa-desktop"></i>
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Lobby Kiosk Mode</h3>
             <p style={{ fontSize: '0.9rem', opacity: 0.5, lineHeight: 1.6 }}>Run your minisite on any Smart TV. It becomes an automated, high-definition cinematic loop of your services.</p>
          </div>

          <div>
             <div style={{ width: '70px', height: '70px', background: '#D4AF3720', color: '#D4AF37', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.5rem' }}>
                <i className="fas fa-bullhorn"></i>
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Front Row Discovery</h3>
             <p style={{ fontSize: '0.9rem', opacity: 0.5, lineHeight: 1.6 }}>Your best photos are automatically featured on the Siwa.Today homepage carousel, seen by thousands of global explorers.</p>
          </div>

          <div>
             <div style={{ width: '70px', height: '70px', background: '#D4AF3720', color: '#D4AF37', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.5rem' }}>
                <i className="fas fa-handshake"></i>
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Marketplace Intelligence</h3>
             <p style={{ fontSize: '0.9rem', opacity: 0.5, lineHeight: 1.6 }}>Receive verified booking leads and investment enquiries directly in your private Mobile Command Center.</p>
          </div>

        </div>
      </section>

      <footer style={{ marginTop: '10rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4rem' }}>
         <Link href="/jana/fast-track" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}>BACK TO DASHBOARD</Link>
      </footer>
    </div>
  );
}
