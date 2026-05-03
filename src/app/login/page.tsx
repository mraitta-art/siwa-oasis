'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }

      // Route based on role
      const role = data.user.role;
      if (['super_admin', 'content_admin', 'sales_manager', 'support_agent'].includes(role)) {
        router.push('/admin');
      } else if (role === 'salesman') {
        router.push('/salesman');
      } else if (role === 'vendor') {
        router.push('/vendor');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a2e' }}>
              <i className="fas fa-sun" style={{ color: '#D4AF37', marginRight: '0.5rem' }}></i>
              SIWA OASIS
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="super@siwa.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="super123" required />
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</> : <><i className="fas fa-sign-in-alt"></i> Sign In</>}
            </button>
          </form>

          {process.env.NODE_ENV !== 'production' && (
            <div className="policy-indicator" style={{ marginTop: '1.5rem' }}>
              <i className="fas fa-users"></i> <strong>Demo Accounts:</strong><br/>
              • super@siwa.com / super123 (Super Admin)<br/>
              • content@siwa.com / content123 (Content Admin)<br/>
              • salesmanager@siwa.com / sales123 (Sales Manager)<br/>
              • salesman@siwa.com / salesman123 (Salesman)<br/>
              • vendor@siwa.com / vendor123 (Vendor)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
