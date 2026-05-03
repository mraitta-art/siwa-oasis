import React from 'react';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  try {
    const vendors = await query('SELECT p.*, b.name as business_name FROM profiles p LEFT JOIN businesses b ON p.business_id = b.id ORDER BY p.role, p.email');

    return (
      <>
        <div className="card-header">
          <h3><i className="fas fa-users"></i> Vendor Accounts</h3>
          <span className="badge badge-info">{(vendors as any[]).length} users</span>
        </div>
        <table>
          <thead><tr><th>Email</th><th>Role</th><th>Tier</th><th>Business</th><th>Status</th></tr></thead>
          <tbody>
            {(vendors as any[]).map(v => (
              <tr key={v.id}>
                <td><strong>{v.email}</strong><br/><small style={{ color: '#9ca3af' }}>{v.display_name || '—'}</small></td>
                <td><span className="badge badge-info">{v.role}</span></td>
                <td><span className="subscription-badge">{v.subscription_tier}</span></td>
                <td>{v.business_name || <span style={{ color: '#9ca3af' }}>None</span>}</td>
                <td>{v.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="card-header">
          <h3><i className="fas fa-users"></i> Vendor Accounts</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
          <p>Unable to load vendors. Database connection may not be available during build.</p>
          <p>This page will work when the application is running.</p>
        </div>
      </>
    );
  }
}
