import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import Link from 'next/link';

export default async function SalesmanDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const businesses = await query('SELECT b.*, bt.name as type_name FROM businesses b LEFT JOIN business_types bt ON b.type_id = bt.id ORDER BY b.created_at DESC LIMIT 20');
  const leads = (businesses as any[]).filter(b => !b.vendor_id);
  const total = (businesses as any[]).length;

  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1><i className="fas fa-briefcase" style={{ color: '#D4AF37' }}></i> Salesman Dashboard</h1>
        <Link href="/" className="btn btn-outline btn-sm"><i className="fas fa-home"></i> Home</Link>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat"><div className="stat-value">{total}</div><div className="stat-label">Total Businesses</div></div>
        <div className="stat"><div className="stat-value">{leads.length}</div><div className="stat-label">Open Leads</div></div>
        <div className="stat"><div className="stat-value">{total - leads.length}</div><div className="stat-label">Converted</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><i className="fas fa-list"></i> Recent Businesses</h3>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Vendor</th></tr></thead>
          <tbody>
            {(businesses as any[]).map(b => (
              <tr key={b.id}>
                <td><strong>{b.name}</strong></td>
                <td>{b.type_name}</td>
                <td><span className="badge badge-info">{b.status}</span></td>
                <td>{b.vendor_id ? '✅ Assigned' : <span className="badge badge-warning">Lead</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
