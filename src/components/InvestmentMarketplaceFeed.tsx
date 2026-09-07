'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InvestmentMarketplaceFeed({ title, subtitle }: { title?: string; subtitle?: string }) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const res = await fetch('/api/discovery/investments?limit=12');
        if (res.ok) {
          const data = await res.json();
          setOpportunities(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (e) {
        console.error("Investment Feed Load Failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gold)' }}><i className="fas fa-circle-notch fa-spin fa-2x"></i></div>;

  return (
    <div style={{ padding: '4rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '3px', marginBottom: '1rem' }}>{subtitle || 'HERITAGE CAPITAL'}</div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{title || 'Investment Opportunities'}</h2>
        </div>
        <Link href="/investment-opportunities" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', borderBottom: '1px solid var(--gold)' }}>VIEW ALL OPPORTUNITIES</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {opportunities.map(biz => {
          const type = biz.opportunity_type || 'Equity Partner';
          
          return (
            <div key={biz.id} style={{ 
              background: 'var(--card)', borderRadius: '30px', overflow: 'hidden', 
              border: '1px solid var(--border)', transition: 'all 0.3s',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ height: '220px', position: 'relative' }}>
                <img 
                  src={biz.business_logo || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'var(--gold)', color: 'var(--dark)', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900 }}>
                  {String(type || 'Investment').toUpperCase()}
                </div>
              </div>

              <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-light)', letterSpacing: '2px', marginBottom: '0.5rem' }}>{String(biz.type_name || 'Business').toUpperCase()}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', marginBottom: '1rem' }}>{biz.business_name}</h3>
                
                <div style={{ background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.5rem' }}>INVESTMENT OBJECTIVE</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, opacity: 0.8 }}>{biz.opportunity_title}</div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                  <Link href={`/business/${biz.business_id}`} style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900 }}>VIEW CASE</Link>
                  <Link href={`/business/${biz.business_id}#investment-opportunity`} style={{ flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '12px', background: 'var(--gold)', color: 'var(--dark)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 900 }}>REQUEST DATA</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
