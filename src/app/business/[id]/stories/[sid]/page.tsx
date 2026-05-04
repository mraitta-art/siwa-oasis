'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StoryPage() {
  const params = useParams();
  const id = params.id as string;
  const sid = params.sid as string;

  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState<any>(null);
  const [sectionName, setSectionName] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`/api/businesses/${id}`),
          fetch(`/api/jana/sections`)
        ]);
        
        const business = await bRes.json();
        const sections = await sRes.json();
        
        setBiz(business);
        const data = business.custom_data || {};
        setSectionData(data[sid] || {});
        
        const sInfo = sections.find((s: any) => s.id === sid);
        setSectionName(sInfo?.name || sid.replace('_', ' ').toUpperCase());
      } catch (e) {
        console.error('Failed to load story:', e);
      }
      setLoading(false);
    }
    loadData();
  }, [id, sid]);

  if (loading) return (
    <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <i className="fas fa-feather fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
    </div>
  );

  if (!biz || !sectionData) return <div style={{ textAlign: 'center', padding: '5rem' }}>Story not found.</div>;

  const content = sectionData.section_blog || sectionData.mini_blog || '';
  const gallery = Array.isArray(sectionData.section_gallery) ? sectionData.section_gallery : [];
  const firstPhoto = gallery[0] ? (typeof gallery[0] === 'object' ? gallery[0].url : gallery[0]) : null;

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Cinematic Header */}
      <header style={{ height: '70vh', position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
        {firstPhoto && (
          <img 
            src={firstPhoto} 
            alt={sectionName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #fff 100%)' }}></div>
        
        <div style={{ position: 'absolute', bottom: '4rem', left: '0', right: '0', padding: '0 2rem' }}>
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href={`/business/${id}`} style={{ textDecoration: 'none', color: '#D4AF37', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <i className="fas fa-arrow-left"></i> BACK TO {biz.name.toUpperCase()}
            </Link>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1e293b', margin: '0 0 1rem', letterSpacing: '-1px', lineHeight: 1.1 }}>
              {sectionName}
            </h1>
            <div style={{ height: '4px', width: '60px', background: '#D4AF37' }}></div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main style={{ padding: '4rem 2rem' }}>
        <article className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div 
            className="rich-content" 
            dangerouslySetInnerHTML={{ __html: content }} 
            style={{ fontSize: '1.25rem', color: '#334155', lineHeight: 1.9, marginBottom: '4rem' }}
          />

          {/* Expanded Gallery */}
          {gallery.length > 1 && (
            <div style={{ marginTop: '5rem' }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '2rem', color: '#1e293b' }}>Visual Journey</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {gallery.slice(1).map((item: any, i: number) => {
                   const imgUrl = typeof item === 'object' ? item.url : item;
                   const caption = typeof item === 'object' ? item.caption : '';
                   return (
                     <div key={i} style={{ borderRadius: '20px', overflow: 'hidden' }}>
                       <img src={imgUrl} alt={caption} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
                       {caption && <p style={{ padding: '1rem 0', fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>{caption}</p>}
                     </div>
                   );
                })}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer style={{ background: '#f8fafc', padding: '5rem 0', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ opacity: 0.5, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '2rem' }}>A STORY BY {biz.name.toUpperCase()}</div>
        <Link href={`/business/${id}`} className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '50px' }}>RETURN TO PROFILE</Link>
      </footer>
    </div>
  );
}
