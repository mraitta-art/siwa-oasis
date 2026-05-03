'use client';

import React from 'react';
import Link from 'next/link';

export default function DiagnosticPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        <i className="fas fa-stethoscope" style={{ color: '#D4AF37', marginRight: '0.5rem' }}></i>
        Diagnostic Tools
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Link href="/admin/diagnostic/components" style={{ textDecoration: 'none' }}>
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              <i className="fas fa-cube" style={{ color: '#D4AF37', marginRight: '0.5rem' }}></i>
              Component Diagnostics
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              Analyze and troubleshoot component rendering issues
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
