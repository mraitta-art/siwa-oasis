import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import Link from 'next/link';

export default async function VendorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const business = user.businessId
    ? await query('SELECT b.*, bt.name as type_name FROM businesses b LEFT JOIN business_types bt ON b.type_id = bt.id WHERE b.id = ?', [user.businessId])
    : [];

  const biz = (business as any[])[0] || null;

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1><i className="fas fa-store" style={{ color: '#D4AF37' }}></i> Vendor Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="subscription-badge">{user.subscriptionTier}</span>
          <Link href="/" className="btn btn-outline btn-sm"><i className="fas fa-home"></i> Home</Link>
        </div>
      </div>

      {biz ? (
        <>
          <div className="card" style={{ borderTop: '4px solid #D4AF37' }}>
            <h3>{biz.name}</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Category: {biz.type_name} · Status: <span className="badge badge-success">{biz.status}</span></p>
            <div className="stats" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat"><div className="stat-value">{biz.views}</div><div className="stat-label">Views</div></div>
              <div className="stat"><div className="stat-value">{biz.subscription_tier}</div><div className="stat-label">Current Tier</div></div>
              <div className="stat"><div className="stat-value">{biz.published ? '✅' : '❌'}</div><div className="stat-label">Published</div></div>
            </div>
          </div>
          <div className="notification-banner">
            <i className="fas fa-info-circle"></i> Edit your business information and manage your listing from here.
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fas fa-store" style={{ fontSize: '3rem', color: '#D4AF37', display: 'block', marginBottom: '1rem' }}></i>
          <h3>No Business Linked</h3>
          <p style={{ color: '#6b7280' }}>Contact an admin to link your account to a business listing.</p>
        </div>
      )}
    </div>
  );
}
