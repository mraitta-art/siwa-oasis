import React from 'react';
import { query } from '@/lib/db';

export default async function AuditLogPage() {
  let logs: any[] = [];
  let tableMissing = false;

  try {
    logs = await query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
  } catch (e) {
    tableMissing = true;
    // Use console.log (not warn/error) to avoid stderr output that causes cPanel build failures
    console.log('AuditLog: table might be missing — will show UI fallback');
  }

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-history"></i> System Audit Log</h3>
        {!tableMissing && <span className="badge badge-info">{logs.length} entries</span>}
      </div>
      <div>
        {tableMissing ? (
           <div style={{ textAlign: 'center', padding: '3rem', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
              <p><b>Audit Log Table Missing</b></p>
              <p style={{ fontSize: '0.8rem' }}>Please execute the <code>audit_log</code> definition in your MySQL database.</p>
           </div>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
            No audit entries yet
          </p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="audit-row">
              <span className="audit-time">{new Date(log.created_at).toLocaleString()}</span>
              <span className="audit-user">{log.user_email || 'system'}</span>
              <span style={{ flex: 1 }}><strong>{log.action}</strong> — {log.details}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
