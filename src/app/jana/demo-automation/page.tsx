'use client';

import React, { useState } from 'react';
import AutomatedMinisiteHero from '@/components/AutomatedMinisiteHero';

/**
 * DEMO: Automated Minisite Generation
 * This page simulates the "Instant Site" created once a vendor completes
 * their Governance Form (Step 7).
 */
export default function AutomationDemoPage() {
  const [tier, setTier] = useState<'free' | 'vip'>('vip');

  // 1. Mock the "Final Registry Data" received after form completion
  const mockBusinessData = {
    name: "Siwa Oasis Eco-Lodge",
    logo: null,
    customData: {
      basic_info: {
        section_news: "Voted #1 Sustainable Stay in Siwa 2024. Come experience the harmony of nature.",
        section_gallery: [
          { url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000", caption: "Our cinematic main entrance at dusk." },
          { url: "https://images.unsplash.com/photo-1505881502353-a1986add373c?q=80&w=2000", caption: "Authentic mud-brick architecture meeting modern luxury." }
        ]
      },
      location_dna: {
        physical_address: "Cleopatra Bath Road, Siwa, Egypt",
        section_news: "Hidden deep within the palm groves, our location offers total privacy and serenity.",
        section_gallery: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000"]
      },
      rooms_module: {
        section_news: "All suites now feature authentic Berber textiles and natural salt-rock lamps.",
        section_gallery: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000"]
      },
      adventure_tours: {
        section_news: "Exclusive night safaris to the Great Sand Sea are now bookable at the reception.",
        section_gallery: ["https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=2000"]
      }
    }
  };

  // 2. Define features for the demo
  const tierFeatures = {
    free: { hero_automation: false },
    vip: { hero_automation: true }
  };

  // 3. Mock the "Active Sections" selected by the Admin in Step 2
  const activeSections = [
    { id: 'basic_info', name: 'Identity' },
    { id: 'location_dna', name: 'Location' },
    { id: 'rooms_module', name: 'Living Spaces' },
    { id: 'adventure_tours', name: 'Exploration' }
  ];

  return (
    <main style={{ background: '#0f172a', minHeight: '100vh' }}>
      {/* 🟢 THE RESULT: AUTOMATED HERO GENERATED FROM FORM DATA */}
      <AutomatedMinisiteHero
        businessName={mockBusinessData.name}
        businessLogo={mockBusinessData.logo as any}
        customData={mockBusinessData.customData}
        activeSections={activeSections}
        tierFeatures={tierFeatures[tier]}
        settings={{
          primaryColor: '#D4AF37',
          height: '100vh'
        }}
      />

      {/* AUTOMATION FEEDBACK OVERLAY (FOR DEMO) */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.95)',
        padding: '2rem',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setTier('free')}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: tier === 'free' ? '#1e293b' : '#fff', color: tier === 'free' ? '#fff' : '#1e293b', fontWeight: 700, cursor: 'pointer' }}
          >FREE TIER</button>
          <button 
            onClick={() => setTier('vip')}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #D4AF37', background: tier === 'vip' ? '#1e293b' : '#fff', color: tier === 'vip' ? '#fff' : '#1e293b', fontWeight: 700, cursor: 'pointer' }}
          >VIP TIER</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27ae60', animation: 'pulse 1.5s infinite' }} />
          <strong style={{ fontSize: '0.8rem', color: '#1e293b', letterSpacing: '1px' }}>AUTOMATION LIVE</strong>
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 900 }}>Instant Minisite Active</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
          This Hero Carousel was <strong>zero-effort</strong>. It automatically extracted the Mini-Blogs and Photos from the 4 sections above.
        </p>
        
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
          <label style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>DATA SOURCE MAPPING</label>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Slide 1: Basic Info</span>
            <span style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Slide 2: Location DNA</span>
            <span style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Slide 3: Rooms Module</span>
            <span style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Slide 4: Adventure Tours</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
