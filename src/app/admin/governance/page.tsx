'use client';

import React from 'react';
import Link from 'next/link';

/**
 * GOVERNANCE DASHBOARD (Foundation Architect)
 * The nerve center for marketplace structure and data principles.
 */
export default function GovernanceDashboard() {
  const pillars = [
    {
      id: 'typology',
      title: 'Typology Architect',
      description: 'Define the hierarchy of business types, from parents to specialized children.',
      icon: 'fa-folder-tree',
      path: '/admin/types',
      color: '#8b5cf6',
      status: 'Core'
    },
    {
      id: 'sections',
      title: 'Data Sections',
      description: 'Manage reusable data containers that group fields (e.g., "Nature DNA", "Contact").',
      icon: 'fa-columns',
      path: '/admin/sections',
      color: '#10b981',
      status: 'Modular'
    },
    {
      id: 'forms',
      title: 'Form Architect',
      description: 'Design dynamic onboarding forms by assigning fields to sections and types.',
      icon: 'fa-list-check',
      path: '/admin/form-builder',
      color: '#f59e0b',
      status: 'Active'
    },
    {
      id: 'principles',
      title: 'Field Principles',
      description: 'Configure core data types and field definitions available in the library.',
      icon: 'fa-cubes',
      path: '/admin/governance/fields',
      color: '#D4AF37',
      status: 'Standard'
    }
  ];

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2.25rem', color: '#1e293b', marginBottom: '0.5rem' }}>
          Foundation <span style={{ color: '#D4AF37' }}>Architect</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          The governance layer controls how data is structured, inherited, and validated across the entire Oasis.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {pillars.map(pillar => (
          <Link href={pillar.path} key={pillar.id} style={{ textDecoration: 'none' }}>
            <div className="card h-full hover-lift" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, fontSize: '8rem' 
              }}>
                <i className={`fas ${pillar.icon}`}></i>
              </div>
              
              <div style={{ 
                width: '60px', height: '60px', background: `${pillar.color}15`, 
                color: pillar.color, borderRadius: '16px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                marginBottom: '2rem'
              }}>
                <i className={`fas ${pillar.icon}`}></i>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: '#1e293b' }}>{pillar.title}</h3>
                <span style={{ 
                  fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', 
                  borderRadius: '4px', background: '#f1f5f9', color: '#64748b' 
                }}>{pillar.status}</span>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {pillar.description}
              </p>

              <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: pillar.color }}>
                CONFIGURE MODULE <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* PIPELINE OVERVIEW */}
      <section style={{ marginTop: '5rem', background: '#fff', padding: '3rem', borderRadius: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontWeight: 900, marginBottom: '2.5rem', textAlign: 'center' }}>Data Lifecycle Pipeline</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          {[
            { step: '01', label: 'Blueprints', sub: 'Types & Sections' },
            { step: '02', label: 'Forms', sub: 'Field Mapping' },
            { step: '03', label: 'Onboarding', sub: 'Data Capture' },
            { step: '04', label: 'Registry', sub: 'Curation' },
            { step: '05', label: 'Publication', sub: 'Minisites' }
          ].map((item, i, arr) => (
            <React.Fragment key={item.step}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', fontWeight: 900, fontSize: '0.8rem'
                }}>{item.step}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{item.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ opacity: 0.2, flex: 0.5, textAlign: 'center' }}>
                  <i className="fas fa-chevron-right"></i>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
