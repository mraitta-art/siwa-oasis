'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InvestmentMarketplaceFeed({ title, subtitle }: { title?: string; subtitle?: string }) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const res = await fetch('/api/jana/businesses?type=investment');
        const data = await res.json();
        // Filter: Only Premium vendors with an active Investment chapter
        const active = data.filter((b: any) => 
          b.subscription_tier !== 'free' && 
          b.custom_data?.sec_7_investment?.initialized !== false
        );
        setOpportunities(active);
      } catch (e) {
        console.error("Investment Feed Load Failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#D4AF37' }}><i className="fas fa-circle-notch fa-spin fa-2x"></i></div>;

  return (
    <div style={{ padding: '4rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px', marginBottom: '1rem' }}>{subtitle || 'HERITAGE CAPITAL'}</div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>{title || 'Investment Opportunities'}</h2>
        </div>
        <Link href="/investment" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', borderBottom: '1px solid #D4AF37' }}>VIEW ALL OPPORTUNITIES</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {opportunities.map(biz => {
          const investData = biz.custom_data?.sec_7_investment || {};
          const goal = investData.investment_goal || 'Expansion';
          const type = investData.opportunity_type || 'Equity Partner';
          
          return (
            <div key={biz.id} style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: '30px', overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ height: '220px', position: 'relative' }}>
                <img 
                  src={biz.custom_data?.sec_1_identity?.hero_image || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: '#D4AF37', color: '#0f172a', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900 }}>
                  {type.toUpperCase()}
                </div>
              </div>

              <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '0.5rem' }}>{(biz.type_name || 'Business').toUpperCase()}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>{biz.name}</h3>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D4AF37', marginBottom: '0.5rem' }}>INVESTMENT OBJECTIVE</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, opacity: 0.8 }}>{goal}</div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                  <Link href={`/p/${biz.slug}`} style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900 }}>VIEW CASE</Link>
                  <Link href={`/p/${biz.slug}#sec_7_investment`} style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '12px', background: '#D4AF37', color: '#0f172a', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900 }}>REQUEST DATA</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
