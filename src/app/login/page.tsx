'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminRequired, setAdminRequired] = useState(false);
  const [vendorRequired, setVendorRequired] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/vendor');
  const [isArabic, setIsArabic] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errParam = searchParams.get('error');
    const redirectParam = searchParams.get('redirect');
    if (errParam === 'admin_required') setAdminRequired(true);
    if (errParam === 'vendor_required') setVendorRequired(true);
    if (redirectParam) setRedirectTo(decodeURIComponent(redirectParam));
  }, [searchParams]);

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
      if (!res.ok) {
        setError(data.error || (isArabic ? 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.' : 'Login failed'));
        setLoading(false);
        return;
      }

      const role = data.user.role;
      if (['super_admin', 'content_admin', 'sales_manager'].includes(role)) {
        router.push(redirectTo.startsWith('/') ? redirectTo : '/admin');
      } else if (role === 'support_agent') {
        router.push('/jana');
      } else if (role === 'salesman') {
        router.push('/salesman');
      } else if (role === 'vendor') {
        router.push(redirectTo.startsWith('/') ? redirectTo : '/vendor');
      } else {
        router.push('/');
      }
    } catch {
      setError(isArabic ? 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' : 'Network error. Is the dev server running?');
      setLoading(false);
    }
  }

  const quickFill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const DEV_ACCOUNTS = [
    { label: isArabic ? 'حساب بائع (سيوة)' : 'Vendor Account', email: 'vendor@siwa.com', color: '#dc2626' },
    { label: isArabic ? 'مدير النظام' : 'Super Admin', email: 'super@siwa.com', color: '#7c3aed' },
    { label: isArabic ? 'مدير المحتوى' : 'Content Admin', email: 'content@siwa.com', color: '#0369a1' },
    { label: isArabic ? 'مدير المبيعات' : 'Sales Manager', email: 'salesmanager@siwa.com', color: '#16a34a' },
    { label: isArabic ? 'مندوب مبيعات' : 'Salesman', email: 'salesman@siwa.com', color: '#d97706' },
  ];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: isArabic ? "'Cairo', 'Segoe UI', system-ui, sans-serif" : "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 460, padding: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', position: 'relative' }}>

          {/* Lang toggle in top corner */}
          <div style={{ position: 'absolute', top: '1.25rem', left: isArabic ? '1.25rem' : 'auto', right: isArabic ? 'auto' : '1.25rem' }}>
            <button
              onClick={() => setIsArabic(!isArabic)}
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#92702a',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isArabic ? 'English' : 'عربي'}
            </button>
          </div>

          {/* Vendor-required banner */}
          {vendorRequired && (
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.3)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🏪</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>
                  {isArabic ? 'يلزم تسجيل دخول حساب البائع' : 'Vendor access required'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.1rem' }}>
                  {isArabic ? 'يرجى تسجيل الدخول بحساب بائع للوصول إلى لوحة الإدارة والأقسام.' : 'Please sign in with a vendor account to access the dashboard.'}
                </div>
              </div>
            </div>
          )}

          {/* Admin-required banner */}
          {adminRequired && (
            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>
                  {isArabic ? 'صلاحيات الإدارة مطلوبة' : 'Admin access required'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.1rem' }}>
                  {isArabic ? 'يرجى تسجيل الدخول بحساب مسؤول للمتابعة.' : 'Please sign in with an admin account to continue.'}
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {isArabic ? 'منصة سيوة سيوَفاي' : 'SIWA OASIS'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
              {isArabic ? 'تسجيل الدخول الموحد' : 'Secure Sign In'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vendor@siwa.com"
                required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', direction: 'ltr' }}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', direction: 'ltr' }}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> {isArabic ? 'جاري تسجيل الدخول...' : 'Signing in…'}</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> {isArabic ? 'دخول' : 'Sign In'}</>
              )}
            </button>
          </form>

          {/* Dev Quick Login — only in development */}
          {process.env.NODE_ENV !== 'production' && (
            <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1.5px dashed #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
                ⚡ {isArabic ? 'دخول تجريبي سريع للمطورين' : 'Dev Quick Login'} — Password: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>password123</code>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {DEV_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    onClick={() => quickFill(acc.email, 'password123')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.85rem', border: `1.5px solid ${acc.color}20`, borderRadius: '8px', background: `${acc.color}08`, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: acc.color, transition: 'all 0.15s', textAlign: isArabic ? 'right' : 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${acc.color}18`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${acc.color}08`; }}
                  >
                    <i className="fas fa-user-circle" style={{ fontSize: '1rem' }}></i>
                    <span style={{ flex: 1 }}>{acc.label}</span>
                    <code style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 400, direction: 'ltr' }}>{acc.email}</code>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#D4AF37', animation: 'spin 1s linear infinite' }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px' }}>LOADING SECURE PORTAL...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
