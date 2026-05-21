'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Blueprint {
  id: string;
  name: string;
  color: string;
  hidden_sections: string[];
  hidden_fields: string[];
  validated_at: string;
  version: string;
}

interface Typology {
  id: string;
  name: string;
  blueprint: Blueprint | null;
  business_count: number;
}

export default function BlueprintDashboard() {
  const [typologies, setTypologies] = useState<Typology[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTypologies();
  }, []);

  const fetchTypologies = async () => {
    try {
      const res = await fetch('/api/jana/types');
      const data = await res.json();
      setTypologies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (t: Typology) => {
    if (!t.blueprint) return '#ef4444'; // Error
    return '#10b981'; // Success
  };

  const totalVendors = typologies.reduce((acc, t) => acc + (t.business_count || 0), 0);
  const capacityLimit = 1000;
  const isNearLimit = totalVendors > (capacityLimit * 0.9);

  return (
    <div className="admin-container" style={{ padding: '3rem', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      
      {/* 🚨 ADMINISTRATIVE HEALTH MONITOR */}
      {isNearLimit && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', 
          padding: '1.5rem', borderRadius: '24px', marginBottom: '3rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ef4444' }}>INFRASTRUCTURE CAPACITY WARNING</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 600 }}>
                Platform is at {Math.round((totalVendors/capacityLimit)*100)}% capacity ({totalVendors} / {capacityLimit} Vendors). 
                Upgrade server cluster to prevent latency.
              </div>
            </div>
          </div>
          <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}>
            SCALE INFRASTRUCTURE
          </button>
        </div>
      )}

      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '4px', marginBottom: '1rem' }}>GOVERNANCE COMMAND CENTER</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Global Blueprint Status</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{typologies.length}</div>
           <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8' }}>ACTIVE MASTER BLUEPRINTS</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
        {typologies.map((t) => (
          <div key={t.id} style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: `1px solid ${t.blueprint?.color || 'rgba(255,255,255,0.1)'}`, 
            borderRadius: '24px', 
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glow */}
            <div style={{ 
              position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
              background: t.blueprint?.color || '#fff', filter: 'blur(80px)', opacity: 0.1, pointerEvents: 'none' 
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getStatusColor(t) }}></div>
                 <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{t.name.toUpperCase()}</h2>
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8' }}>
                v{t.blueprint?.version || '0.0.0'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.5rem' }}>ACTIVE CHAPTERS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{8 - (t.blueprint?.hidden_sections?.length || 0)} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/ 8</span></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.5rem' }}>POPULATION</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t.business_count || 0} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>UNITS</span></div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
               <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', marginBottom: '1rem', letterSpacing: '1px' }}>BLUEPRINT ARCHITECTURE</div>
               <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['IDENTITY','VIBE','AMENITIES','CUISINE','PROGRAMS','ECOLOGY','INVEST','OFFERS'].map((ch, idx) => {
                    const isHidden = t.blueprint?.hidden_sections?.some(hid => hid.includes(String(idx + 1)));
                    return (
                      <div key={ch} style={{ 
                        fontSize: '0.5rem', fontWeight: 900, padding: '4px 8px', borderRadius: '4px',
                        background: isHidden ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isHidden ? '#ef4444' : '#10b981',
                        border: isHidden ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)'
                      }}>
                        {ch}
                      </div>
                    );
                  })}
               </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: t.blueprint?.color || '#fff', color: '#000', border: 'none', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
                SYNC ALL UNITS
              </button>
              <button style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
                EDIT BLUEPRINT
              </button>
            </div>

            {t.blueprint?.validated_at && (
              <div style={{ marginTop: '1.5rem', fontSize: '0.55rem', color: '#475569', textAlign: 'center', fontStyle: 'italic' }}>
                Last Validated: {new Date(t.blueprint.validated_at).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
