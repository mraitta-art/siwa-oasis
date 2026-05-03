import React from 'react';
import { query, queryOne } from '@/lib/db';

export default async function AdminDashboardPage() {
  // Fetch live stats safely from MySQL
  let bizCount = { count: 0 }, vendorCount = { count: 0 }, pendingCount = { count: 0 }, viewsResult = { total: 0 }, typeCount = { count: 0 }, activity: any[] = [];
  
  try {
    const results = await Promise.all([
      query('SELECT COUNT(*) as count FROM businesses').catch(() => [{count: 0}]),
      query('SELECT COUNT(*) as count FROM profiles WHERE role = "vendor" AND active = TRUE').catch(() => [{count: 0}]),
      query('SELECT COUNT(*) as count FROM businesses WHERE vendor_id IS NOT NULL AND approved_by_vendor = FALSE').catch(() => [{count: 0}]),
      query('SELECT COALESCE(SUM(views), 0) as total FROM businesses').catch(() => [{total: 0}]),
      query('SELECT COUNT(*) as count FROM business_types').catch(() => [{count: 0}]),
      query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').catch(() => []),
    ]);
    
    [bizCount] = results[0];
    [vendorCount] = results[1];
    [pendingCount] = results[2];
    [viewsResult] = results[3];
    [typeCount] = results[4];
    activity = results[5];
  } catch (e) {
    console.warn('Stats warning: Some database tables might be missing', e);
  }

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff', padding: '2rem', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h3 style={{ margin: 0, fontWeight: 900, color: '#D4AF37' }}><i className="fas fa-magic"></i> START MASTER ORCHESTRATION</h3>
           <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.85rem' }}>Build your typology, forms, and pages in a single sequential flow.</p>
        </div>
        <a href="/jana/orchestrator" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none', fontWeight: 800 }}>LAUNCH WIZARD</a>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h3 style={{ margin: 0, fontWeight: 900 }}><i className="fas fa-tools"></i> SIMPLE FORM BUILDER</h3>
           <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>Quick and visual form builder - Create fields, sections, and modules easily.</p>
        </div>
        <a href="/jana/form-builder" className="btn" style={{ padding: '0.75rem 2rem', textDecoration: 'none', fontWeight: 800, background: '#fff', color: '#d97706', borderRadius: '0.5rem' }}>OPEN BUILDER</a>
      </div>

      <div className="stats">
        <a href="/jana/types" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat-value">{(typeCount as any)?.count || 0}</div>
          <div className="stat-label">Business Types</div>
        </a>
        <a href="/jana/businesses" className="stat" style={{ textDecoration: 'none' }}>
          <div className="stat-value">{(bizCount as any)?.count || 0}</div>
          <div className="stat-label">Businesses</div>
        </a>
        <a href="/jana/upgrades" className="stat" style={{ textDecoration: 'none', borderLeft: '3px solid #10b981' }}>
          <div className="stat-value">{(pendingCount as any)?.count || 0}</div>
          <div className="stat-label">Pending Approvals</div>
        </a>
        <div className="stat">
          <div className="stat-value">{(viewsResult as any)?.total || 0}</div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      <h4><i className="fas fa-clock"></i> Recent Activity</h4>
      <div style={{ marginTop: '0.75rem' }}>
        {activity.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-inbox" style={{ marginRight: '0.5rem' }}></i> No activity yet
          </p>
        )}
        {(activity as any[]).map((a, i) => (
          <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
            📅 {new Date(a.created_at).toLocaleString()} — {a.message}{' '}
            <span style={{ color: '#9ca3af' }}>({a.user_email})</span>
          </div>
        ))}
      </div>
    </>
  );
}
