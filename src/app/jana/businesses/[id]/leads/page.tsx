'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function VendorLeadsInbox() {
  const { id } = useParams();
  const [leads, setLeads] = useState([
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', phone: '+44 7700 900000', chapter: 'Experiences', date: '10 mins ago', status: 'new', message: 'Interested in the sunset desert safari for 4 people.' },
    { id: 2, name: 'Sara Miller', email: 'sara.m@web.de', phone: '+49 123 456789', chapter: 'Investment', date: '2 hours ago', status: 'pending', message: 'Would like to know more about the heritage palm grove investment opportunities.' },
    { id: 3, name: 'Karim Ahmed', email: 'karim@siwa.eg', phone: '+20 123 4567', chapter: 'Cuisine', date: 'Yesterday', status: 'completed', message: 'Booking a table for 10 people for tonight.' },
  ]);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* MOBILE HEADER */}
      <header style={{ padding: '2rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href={`/jana/businesses/${id}/mobile`} style={{ color: '#fff', textDecoration: 'none', width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-chevron-left"></i>
        </Link>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>LEADS CRM</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Verified Enquiries</h1>
        </div>
      </header>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', overflowX: 'auto' }}>
        <button style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 900, fontSize: '0.7rem' }}>NEW ({leads.filter(l => l.status === 'new').length})</button>
        <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 900, fontSize: '0.7rem' }}>PENDING</button>
        <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 900, fontSize: '0.7rem' }}>COMPLETED</button>
      </div>

      {/* LEADS LIST */}
      <div style={{ padding: '0 1.5rem 10rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leads.map(lead => (
            <div key={lead.id} style={{ 
              background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '24px', 
              border: lead.status === 'new' ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
              position: 'relative'
            }}>
              {lead.status === 'new' && (
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '10px', height: '10px', background: '#D4AF37', borderRadius: '50%' }}></div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px' }}>SOURCE: {lead.chapter.toUpperCase()}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>{lead.date}</span>
              </div>

              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 0.5rem' }}>{lead.name}</h2>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.6, marginBottom: '1.5rem' }}>"{lead.message}"</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <a href={`tel:${lead.phone}`} style={{ 
                  background: '#1e293b', color: '#fff', textDecoration: 'none', 
                  padding: '0.8rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}>
                  <i className="fas fa-phone-alt" style={{ color: '#D4AF37' }}></i> CALL
                </a>
                <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '')}`} style={{ 
                  background: '#25D366', color: '#fff', textDecoration: 'none', 
                  padding: '0.8rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}>
                  <i className="fab fa-whatsapp"></i> W.APP
                </a>
                <button style={{ 
                  background: '#09B83E', color: '#fff', border: 'none',
                  padding: '0.8rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}>
                  <i className="fab fa-weixin"></i> WECHAT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE NAV BAR (LEADS ACTIVE) */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px',
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', 
        justifyContent: 'space-around', alignItems: 'center', zIndex: 1000
      }}>
        <Link href={`/jana/businesses/${id}/mobile`} style={{ color: '#94a3b8', textAlign: 'center', textDecoration: 'none' }}>
          <i className="fas fa-home" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>HOME</div>
        </Link>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>
          <i className="fas fa-chart-line" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>INSIGHTS</div>
        </div>
        <div style={{ color: '#D4AF37', textAlign: 'center' }}>
          <i className="fas fa-comment-alt" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>LEADS</div>
        </div>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>
          <i className="fas fa-cog" style={{ fontSize: '1.2rem' }}></i>
          <div style={{ fontSize: '0.5rem', fontWeight: 900, marginTop: '4px' }}>SETTINGS</div>
        </div>
      </div>

    </div>
  );
}
