'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DynamicMobileVendorDashboard() {
  const { id } = useParams();
  const [business, setBusiness] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`/api/jana/businesses?id=${id}`),
          fetch('/api/jana/sections')
        ]);
        const bData = await bRes.json();
        const sData = await sRes.json();
        
        // Find the specific business
        const biz = Array.isArray(bData) ? bData.find((b: any) => b.id === id) : bData;
        setBusiness(biz);
        setSections(sData);
      } catch (e) {
        console.error("Dashboard Load Failed", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
      <i className="fas fa-circle-notch fa-spin fa-2x"></i>
    </div>
  );

  if (!business) return (
    <div style={{ background: '#0f172a', height: '100vh', padding: '2rem', textAlign: 'center', color: '#fff' }}>
      <h2>ACCESS DENIED</h2>
      <p style={{ opacity: 0.6 }}>This dashboard is private to the business owner.</p>
      <Link href="/" style={{ color: '#D4AF37' }}>Return to Home</Link>
    </div>
  );

  const tier = business.subscription_tier || 'free';
  const data = business.custom_data || {};
  
  // Calculate completion based on active sections in the blueprint
  const blueprint = business.blueprint || {};
  const activeSectionIds = Object.keys(blueprint.sections || {});
  
  const chapters = activeSectionIds.map(sid => {
    const section = sections.find(s => s.id === sid);
    const secData = data[sid] || {};
    const hasData = Object.keys(secData).length > 0;
    
    return {
      id: sid,
      name: section?.name || sid,
      icon: section?.icon || 'fa-layer-group',
      progress: hasData ? 100 : 0,
      color: sid.includes('identity') ? '#D4AF37' : (sid.includes('vibe') ? '#8b5cf6' : '#3b82f6')
    };
  });

  const completion = Math.round((chapters.filter(c => c.progress === 100).length / chapters.length) * 100) || 0;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '1.5rem', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 🔒 PRIVACY LOCK HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <i className="fas fa-shield-alt" style={{ color: '#D4AF37', fontSize: '0.7rem' }}></i>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>PRIVATE COMMAND CENTER</div>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{(business.name || '').toUpperCase()}</h1>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#D4AF37', marginTop: '0.2rem' }}>
            {tier.toUpperCase()} TIER ARCHITECTURE
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '15px', border: '2px solid rgba(255,255,255,0.1)', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#D4AF37' }}>
            <i className="fas fa-building"></i>
          </div>
          <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#22c55e', width: 15, height: 15, borderRadius: '50%', border: '2px solid #0f172a' }}></div>
        </div>
      </header>

      {/* 🧬 CORE DNA ORCHESTRATOR (Edit Info) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem' }}>IDENTITY GOVERNANCE</div>
        <Link href={`/jana/businesses/${id}/orchestrate`} style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <i className="fas fa-edit"></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>Edit Business DNA</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Name, Tel, Socials & Gallery</div>
              </div>
            </div>
            <i className="fas fa-chevron-right" style={{ color: 'rgba(255,255,255,0.2)' }}></i>
          </div>
        </Link>
      </div>

      {/* 🏛️ PLATFORM INTELLIGENCE FEED (Admin Messages) */}
      <div style={{ background: 'rgba(212,175,55,0.05)', padding: '1.5rem', borderRadius: '24px', border: '1px dashed rgba(212,175,55,0.2)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <i className="fas fa-bullhorn" style={{ color: '#D4AF37', fontSize: '0.8rem' }}></i>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>MESSAGE FROM SIWA TODAY</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>
          Welcome to your new digital home! Your Heritage DNA is now live. Explore your dashboard to manage leads and optimize your cinematic gallery.
        </div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '1rem', fontWeight: 600 }}>Received 5 mins ago</div>
      </div>

      {/* QUICK STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <Link href={`/jana/businesses/${id}/leads`} style={{ textDecoration: 'none' }}>
          <div style={{ background: 'rgba(212,175,55,0.1)', padding: '1.25rem', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4AF37' }}>{leadsCount}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>NEW LEADS</div>
          </div>
        </Link>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Live</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>SYNC STATUS</div>
        </div>
      </div>

      {/* MASTER BLUEPRINT PROGRESS */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, margin: 0 }}>BLUEPRINT DNA</h2>
            <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{business.typology || 'Standard'} Template</div>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37' }}>{completion}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${completion}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #F59E0B)', borderRadius: '10px' }}></div>
        </div>
      </section>

      {/* DYNAMIC CHAPTER LIST (BASED ON MASTER BLUEPRINT) */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px', opacity: 0.5 }}>MANAGEMENT SLOTS</h2>
          <div style={{ fontSize: '0.6rem', background: '#D4AF3720', color: '#D4AF37', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>{chapters.length} ACTIVE</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {chapters.map(chapter => (
            <Link key={chapter.id} href={`/jana/businesses/${id}/orchestrate`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '22px', 
                border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '1.25rem',
                transition: 'transform 0.2s'
              }}>
                <div style={{ 
                  width: '50px', height: '50px', borderRadius: '14px', background: `${chapter.color}15`, 
                  color: chapter.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                }}>
                  <i className={`fas ${chapter.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>{chapter.name.toUpperCase()}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: chapter.progress === 100 ? '#22c55e' : '#94a3b8' }}>
                    {chapter.progress === 100 ? '✓ SYNCHRONIZED' : '○ PENDING DATA'}
                  </div>
                </div>
                <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem', opacity: 0.2 }}></i>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TIER-GATED ACTIONS */}
      {tier === 'free' && (
        <Link href="/jana/benefits" style={{ textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #D4AF37, #B45309)', padding: '1.5rem', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>UPGRADE TO PREMIUM</div>
              <div style={{ fontSize: '0.65rem', color: '#0f172a', fontWeight: 700, opacity: 0.8 }}>Unlock Marketplace & Leads CRM</div>
            </div>
            <i className="fas fa-crown" style={{ fontSize: '1.5rem', color: '#0f172a30' }}></i>
          </div>
        </Link>
      )}

      {/* MOBILE NAV BAR */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px',
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', 
        justifyContent: 'space-around', alignItems: 'center', zIndex: 1000
      }}>
        <div style={{ color: '#D4AF37', textAlign: 'center' }}>
          <i className="fas fa-home" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>HOME</div>
        </div>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>
          <i className="fas fa-chart-line" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>INSIGHTS</div>
        </div>
        <Link href={`/jana/businesses/${id}/leads`} style={{ color: '#94a3b8', textAlign: 'center', textDecoration: 'none' }}>
          <i className="fas fa-comment-alt" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>LEADS</div>
        </Link>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>
          <i className="fas fa-cog" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>SETTINGS</div>
        </div>
      </div>

      <div style={{ height: '100px' }}></div>
    </div>
  );
}
