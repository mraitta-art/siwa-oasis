'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';

export default function MinisiteBuilderEntry() {
  const { isRTL } = useLang();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jana/businesses')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setBusinesses(Array.isArray(data) ? data : []);
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  const steps = [
    {
      num: '01',
      title: isRTL ? 'مخطط الأقسام والأنواع' : 'Category Blueprint & Sections',
      desc: isRTL ? 'تحديد الأقسام والحقول لكل تصنيف نشاط.' : 'Define inherited core sections and field schema per business category.',
      href: '/jana/business-forms',
      icon: 'fa-file-signature',
      tag: isRTL ? 'الخطوة الأولى' : 'Step 1: Schema',
      color: '#ea580c'
    },
    {
      num: '02',
      title: isRTL ? 'قوالب التصميم' : 'Minisite Layout Templates',
      desc: isRTL ? 'تصميم الهيكل والترتيب البصري للأقسام والمكونات.' : 'Design visual layout structures, section ordering, and headers.',
      href: '/jana/page-builder/templates',
      icon: 'fa-layer-group',
      tag: isRTL ? 'الخطوة الثانية' : 'Step 2: Templates',
      color: '#8b5cf6'
    },
    {
      num: '03',
      title: isRTL ? 'إنشاء وتوليد النشاط' : 'Onboard & Generate Minisite',
      desc: isRTL ? 'معالج متكامل لتسجيل نشاط جديد وتوليد موقعه فورياً.' : '5-step wizard to onboard a business and auto-generate its live URL.',
      href: '/jana/orchestrator',
      icon: 'fa-magic',
      tag: isRTL ? 'الخطوة الثالثة' : 'Step 3: Generator',
      color: '#D4AF37'
    },
    {
      num: '04',
      title: isRTL ? 'المحتوى والشرائح الديناميكية' : 'Content & Dynamic Carousels',
      desc: isRTL ? 'إدارة محتوى الأقسام، الصور، المدونات، وشرائح العرض.' : 'Populate section stories, galleries, and custom cinematic hero carousels.',
      href: '/jana/hero-carousel?targetScope=minisite',
      icon: 'fa-images',
      tag: isRTL ? 'الخطوة الرابعة' : 'Step 4: Media & CMS',
      color: '#10b981'
    }
  ];

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem', textAlign: isRTL ? 'right' : 'left' }}>
      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 900, letterSpacing: isRTL ? 0 : '2px', textTransform: 'uppercase' }}>
          {isRTL ? 'منظومة المواقع المصغرة' : 'VENDOR MINISITE STUDIO'}
        </div>
        <h1 style={{ margin: '0.4rem 0 0.6rem', fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
          {isRTL ? 'مركز بناء وإدارة المواقع المصغرة' : 'Business Minisite Builder & Hub'}
        </h1>
        <p style={{ maxWidth: 750, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
          {isRTL 
            ? 'خطوات واضحة ومتسلسلة: حدد الأقسام لكل نوع نشاط، صمم القالب، انشر النشاط، ثم خصص المحتوى وشرائح العرض الديناميكية.'
            : 'A unified 4-step pipeline: configure typology section blueprints, design layout templates, onboard businesses, and manage custom content and dynamic hero carousels.'}
        </p>
      </header>

      {/* 4-Step Pipeline Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {steps.map(step => (
          <Link 
            key={step.href} 
            href={step.href} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              padding: '1.5rem', 
              border: '1px solid #e2e8f0', 
              borderRadius: 16, 
              background: '#ffffff', 
              color: '#0f172a', 
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: step.color }} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: step.color, background: `${step.color}15`, padding: '3px 8px', borderRadius: '6px' }}>
                  {step.tag}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#cbd5e1' }}>{step.num}</span>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${step.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color, marginBottom: '1rem' }}>
                <i className={`fas ${step.icon}`} style={{ fontSize: '1.1rem' }} />
              </div>
              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{step.title}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: step.color }}>
              <span>{isRTL ? 'افتح الأداة' : 'Open Tool'}</span>
              <i className={`fas ${isRTL ? 'fa-arrow-left' : 'fa-arrow-right'}`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Access to Existing Businesses */}
      <section style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
              {isRTL ? 'الأنشطة التجارية الحالية' : 'Live Vendor Minisites'}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              {isRTL ? 'تعديل المحتوى، الصور، وشرائح العرض مباشرة لكل نشاط.' : 'Direct shortcuts to customize content, carousels, or preview live minisites.'}
            </p>
          </div>
          <Link 
            href="/jana/orchestrator" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.55rem 1rem', 
              background: '#0f172a', 
              color: '#ffffff', 
              borderRadius: '10px', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              textDecoration: 'none' 
            }}
          >
            <i className="fas fa-plus" /> {isRTL ? 'نشاط تجاري جديد' : 'New Business'}
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} /> Loading businesses...
          </div>
        ) : businesses.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            No businesses found. Click "New Business" to create one.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {businesses.map((biz: any) => {
              const liveUrl = biz.slug ? `/${biz.slug}` : `/business/${biz.id}`;
              return (
                <div 
                  key={biz.id} 
                  style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 14, 
                    padding: '1rem 1.15rem', 
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                        {biz.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 700 }}>{biz.type_name || 'Business'}</span>
                        <span>•</span>
                        <span>{liveUrl}</span>
                      </div>
                    </div>
                    <a 
                      href={liveUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#2563eb', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        textDecoration: 'none',
                        background: '#eff6ff',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      <i className="fas fa-external-link-alt" />
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                    <Link
                      href={`/jana/hero-carousel?targetScope=minisite&businessId=${biz.id}`}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fas fa-images" style={{ color: '#d97706' }} /> Carousel
                    </Link>
                    <Link
                      href={`/jana/content`}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fas fa-photo-film" style={{ color: '#2563eb' }} /> Content
                    </Link>
                    <Link
                      href={`/jana/businesses/${biz.id}/edit`}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <i className="fas fa-cog" style={{ color: '#64748b' }} /> Settings
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
