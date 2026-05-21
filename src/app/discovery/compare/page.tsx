'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * 🏛️ SIWA DNA COMPARISON MATRIX
 * A state-of-the-art interface for side-by-side business intelligence.
 */
export default function ComparisonMatrix() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bizRes, secRes] = await Promise.all([
          fetch('/api/jana/businesses'),
          fetch('/api/jana/sections')
        ]);
        const bizData = await bizRes.json();
        const secData = await secRes.json();
        
        setBusinesses(bizData);
        setSections(secData.sort((a: any, b: any) => a.display_order - b.display_order));
        
        if (bizData.length >= 2) {
          setLeftId(bizData[0].id);
          setRightId(bizData[1].id);
        }
      } catch (e) {
        console.error("Comparison load error", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const leftBiz = businesses.find(b => b.id === leftId);
  const rightBiz = businesses.find(b => b.id === rightId);

  const renderSectionCompare = (section: any) => {
    const leftData = leftBiz?.custom_data?.[section.id] || {};
    const rightData = rightBiz?.custom_data?.[section.id] || {};
    
    // Extract notable fields (excluding gallery/blog for compact view)
    const getNotableFields = (data: any) => {
      return Object.entries(data).filter(([k]) => !['section_gallery', 'section_blog', 'section_news', 'initialized', 'feature_on_main'].includes(k));
    };

    const leftFields = getNotableFields(leftData);
    const rightFields = getNotableFields(rightData);
    const allFieldNames = Array.from(new Set([...leftFields.map(([k]) => k), ...rightFields.map(([k]) => k)]));

    return (
      <div key={section.id} className="compare-row animate-in">
        <div className="section-header-cell">
           <i className={`fas ${section.icon}`} style={{ color: '#D4AF37', marginBottom: '0.5rem', fontSize: '1.2rem' }}></i>
           <div className="section-name">{section.name.toUpperCase()}</div>
        </div>
        
        <div className="data-cell left">
           <div className="narrative-teaser">{leftData.section_news || 'No narrative teaser provided.'}</div>
           <div className="fields-grid">
              {leftFields.map(([k, v]) => (
                <div key={k} className="field-item">
                  <span className="field-label">{k.replace(/_/g, ' ')}:</span>
                  <span className="field-value">{String(v)}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="data-cell right">
           <div className="narrative-teaser">{rightData.section_news || 'No narrative teaser provided.'}</div>
           <div className="fields-grid">
              {rightFields.map(([k, v]) => (
                <div key={k} className="field-item">
                  <span className="field-label">{k.replace(/_/g, ' ')}:</span>
                  <span className="field-value">{String(v)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="matrix-loader">ARCHITECTING COMPARISON...</div>;

  return (
    <div className="matrix-page">
      <div className="matrix-nav">
        <div className="container">
          <Link href="/" className="nav-logo">SIWA.<span style={{ color: '#D4AF37' }}>TODAY</span></Link>
          <div className="nav-title">DNA COMPARISON MATRIX</div>
          <Link href="/discovery/search" className="btn-back">BACK TO DISCOVERY</Link>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem' }}>
        
        {/* SELECTORS */}
        <div className="selectors-grid">
           <div className="selector-card">
              <label>ENTITY ONE</label>
              <select value={leftId} onChange={e => setLeftId(e.target.value)}>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
           </div>
           <div className="vs-badge">VS</div>
           <div className="selector-card">
              <label>ENTITY TWO</label>
              <select value={rightId} onChange={e => setRightId(e.target.value)}>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
           </div>
        </div>

        {/* HERO COMPARISON */}
        <div className="hero-compare">
           <div className="hero-box left">
              {leftBiz?.custom_data?.sec_1_identity?.section_gallery?.[0]?.url && (
                <img src={leftBiz.custom_data.sec_1_identity.section_gallery[0].url} alt="Hero Left" />
              )}
              <div className="hero-overlay">
                 <div className="biz-type">{leftBiz?.type_name}</div>
                 <h2 className="biz-name">{leftBiz?.name}</h2>
                 <div className="flags">
                    {leftBiz?.is_recommended === 1 && <span className="flag rec"><i className="fas fa-thumbs-up"></i> RECOMMENDED</span>}
                    {leftBiz?.is_trusted === 1 && <span className="flag trust"><i className="fas fa-check-shield"></i> TRUSTED</span>}
                 </div>
              </div>
           </div>
           <div className="hero-box right">
              {rightBiz?.custom_data?.sec_1_identity?.section_gallery?.[0]?.url && (
                <img src={rightBiz.custom_data.sec_1_identity.section_gallery[0].url} alt="Hero Right" />
              )}
              <div className="hero-overlay">
                 <div className="biz-type">{rightBiz?.type_name}</div>
                 <h2 className="biz-name">{rightBiz?.name}</h2>
                 <div className="flags">
                    {rightBiz?.is_recommended === 1 && <span className="flag rec"><i className="fas fa-thumbs-up"></i> RECOMMENDED</span>}
                    {rightBiz?.is_trusted === 1 && <span className="flag trust"><i className="fas fa-check-shield"></i> TRUSTED</span>}
                 </div>
              </div>
           </div>
        </div>

        {/* DATA MATRIX */}
        <div className="matrix-table">
           {sections.map(renderSectionCompare)}
        </div>

      </div>

      <style jsx>{`
        .matrix-page { background: #0a0f1d; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; padding-bottom: 10rem; }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
        
        .matrix-nav { background: rgba(15,23,42,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1.5rem 0; position: sticky; top: 0; z-index: 100; }
        .matrix-nav .container { display: flex; justify-content: space-between; align-items: center; }
        .nav-logo { font-weight: 900; letter-spacing: 4px; text-decoration: none; color: #fff; }
        .nav-title { font-weight: 900; font-size: 0.7rem; letter-spacing: 3px; color: rgba(255,255,255,0.4); }
        .btn-back { color: #D4AF37; font-weight: 800; font-size: 0.7rem; text-decoration: none; border: 1px solid #D4AF37; padding: 0.5rem 1rem; borderRadius: 4px; }

        .selectors-grid { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 2rem; margin-bottom: 2rem; align-items: center; }
        .selector-card { background: rgba(255,255,255,0.02); padding: 1.5rem; borderRadius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .selector-card label { display: block; font-size: 0.6rem; font-weight: 900; color: #D4AF37; letter-spacing: 2px; margin-bottom: 0.5rem; }
        .selector-card select { width: 100%; background: transparent; border: none; color: #fff; font-size: 1.2rem; font-weight: 900; outline: none; cursor: pointer; }
        .vs-badge { background: #D4AF37; color: #000; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; box-shadow: 0 0 30px rgba(212,175,55,0.4); }

        .hero-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 4rem; }
        .hero-box { height: 400px; border-radius: 32px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .hero-box img { width: 100%; height: 100%; object-fit: cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.9), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 2.5rem; }
        .biz-type { color: #D4AF37; font-weight: 900; font-size: 0.65rem; letter-spacing: 2px; margin-bottom: 0.5rem; }
        .biz-name { font-size: 2rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .flags { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .flag { font-size: 0.55rem; fontWeight: 900; padding: 4px 10px; borderRadius: 4px; display: flex; alignItems: center; gap: 5px; }
        .flag.rec { background: #22c55e; color: #fff; }
        .flag.trust { background: #3b82f6; color: #fff; }

        .matrix-table { display: flex; flex-direction: column; gap: 1rem; }
        .compare-row { display: grid; grid-template-columns: 200px 1fr 1fr; gap: 2rem; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 24px; padding: 2rem; transition: all 0.3s; }
        .compare-row:hover { background: rgba(255,255,255,0.02); border-color: rgba(212,175,55,0.2); }
        
        .section-header-cell { display: flex; flex-direction: column; justify-content: center; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 1rem; }
        .section-name { font-weight: 900; font-size: 0.65rem; letter-spacing: 2px; color: rgba(255,255,255,0.5); }
        
        .data-cell { padding: 0 1rem; }
        .narrative-teaser { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 1.5rem; font-style: italic; }
        .fields-grid { display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
        .field-item { display: flex; justify-content: space-between; font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px; }
        .field-label { color: #94a3b8; text-transform: capitalize; }
        .field-value { font-weight: 700; color: #D4AF37; }

        .matrix-loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; letter-spacing: 5px; color: #D4AF37; background: #0a0f1d; }
      `}</style>
    </div>
  );
}
