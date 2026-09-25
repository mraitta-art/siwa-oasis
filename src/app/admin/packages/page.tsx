'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { AdminProvider } from '@/context/AdminContext';
import { LangProvider } from '@/context/LangContext';
import UnifiedMarketplaceCommandCenter from '@/app/jana/packages/page';

export default function AdminPackagesPage() {
  return (
    <AdminProvider>
      <LangProvider>
        <div style={{ background: '#faf8f5', minHeight: '100vh', paddingBottom: '4rem' }}>
          {/* ── TOP BREADCRUMB & CONTROL CENTER SHORTCUT ── */}
          <div style={{ background: '#0f172a', borderBottom: '1px solid rgba(212,175,55,0.25)', padding: '0.75rem 1.5rem' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  href="/admin"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.35)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    textDecoration: 'none',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-arrow-left"></i> CONTROL CENTER
                </Link>
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>/</span>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                  PACKAGE &amp; JOURNEY GOVERNANCE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link
                  href="/packages"
                  target="_blank"
                  style={{
                    background: 'rgba(212,175,55,0.12)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.3)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="fas fa-external-link-alt"></i> LIVE PORTAL
                </Link>
                <Link
                  href="/package-studio"
                  style={{
                    background: '#D4AF37',
                    color: '#0f172a',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 12px rgba(212,175,55,0.25)'
                  }}
                >
                  <i className="fas fa-paint-brush"></i> PACKAGE STUDIO
                </Link>
              </div>
            </div>
          </div>

          {/* ── UNIFIED COMMAND CENTER & MULTI-VENDOR MATRIX ── */}
          <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Package Governance...</div>}>
            <UnifiedMarketplaceCommandCenter />
          </Suspense>
        </div>
      </LangProvider>
    </AdminProvider>
  );
}
