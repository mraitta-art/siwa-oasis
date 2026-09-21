'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_CONTENT = {
  hero_title:         'Grow Your Business in Siwa Oasis',
  hero_subtitle:      'Join the premium marketplace for hotels, restaurants, and tours. Get your own cinematic mini-site and reach thousands of explorers.',
  benefit1_icon:      '🎬',
  benefit1_title:     'Cinematic Mini-Sites',
  benefit1_text:      'Showcase your business with a high-fidelity, magazine-style page designed for storytelling.',
  benefit2_icon:      '🔍',
  benefit2_title:     'Premium Discovery',
  benefit2_text:      'Appear in advanced search results filtered by atmosphere, vibe, and specific business attributes.',
  benefit3_icon:      '📊',
  benefit3_title:     'Self-Management',
  benefit3_text:      'Update your menu, photos, and availability anytime through your dedicated vendor dashboard.',
  form_title:         'Become a Partner',
  form_subtitle:      'Start your journey with Siwa Oasis today.',
  cta_primary:        'GET STARTED',
  success_title:      'Welcome to the Oasis!',
  success_message:    'Your partner account has been created. Our team will review your application and contact you shortly.',
};

export default function BeAPartnerPage() {
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [content, setContent]   = useState(DEFAULT_CONTENT);
  const [types, setTypes]       = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  // Form field state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [typologyId, setTypologyId]     = useState('');

  useEffect(() => {
    // Load editable copy from CMS
    fetch('/api/jana/website?id=website_be-a-partner')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const config = Array.isArray(data) ? data[0] : data;
          if (config?.site_settings) {
            setContent({ ...DEFAULT_CONTENT, ...config.site_settings });
          }
        }
      })
      .catch(() => {});

    // Load business types for the dropdown
    fetch('/api/jana/types')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const arr = Array.isArray(data) ? data : (data.types || []);
          setTypes(arr.map((t: any) => ({ id: String(t.id), name: t.name || t.label || t.id })));
        }
      })
      .catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, email, password, typologyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1a1a2e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          {content.hero_title.split('Siwa Oasis').map((part, i, arr) =>
            i < arr.length - 1
              ? <React.Fragment key={i}>{part}<span style={{ color: '#D4AF37' }}>Siwa Oasis</span></React.Fragment>
              : <React.Fragment key={i}>{part}</React.Fragment>
          )}
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          {content.hero_subtitle}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#register" style={{ background: '#D4AF37', color: '#1a1a2e', padding: '1rem 2.5rem', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 25px rgba(212,175,55,0.3)' }}>
            {content.cta_primary}
          </a>
          <a href="/" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '1rem 2.5rem', borderRadius: '50px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
            LEARN MORE
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          {[
            { icon: content.benefit1_icon, title: content.benefit1_title, text: content.benefit1_text },
            { icon: content.benefit2_icon, title: content.benefit2_title, text: content.benefit2_text },
            { icon: content.benefit3_icon, title: content.benefit3_title, text: content.benefit3_text },
          ].map((b, i) => (
            <div key={i}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{b.icon}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{b.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>{content.success_title}</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>{content.success_message}</p>
              <button onClick={() => router.push('/login')} style={{ width: '100%', background: '#1a1a2e', color: '#fff', padding: '1.25rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                GO TO LOGIN
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 900, marginBottom: '0.5rem', fontSize: '2rem' }}>{content.form_title}</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>{content.form_subtitle}</p>

              {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.875rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>BUSINESS NAME</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Desert Rose Eco Lodge"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@yourbusiness.com"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                    minLength={8}
                    required
                  />
                </div>

                {types.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>BUSINESS TYPE</label>
                    <select
                      value={typologyId}
                      onChange={e => setTypologyId(e.target.value)}
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                      required
                    >
                      <option value="">Select your business type…</option>
                      {types.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {types.length === 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>BUSINESS TYPE</label>
                    <input
                      type="text"
                      value={typologyId}
                      onChange={e => setTypologyId(e.target.value)}
                      placeholder="e.g. hotel, restaurant, tour"
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', background: loading ? '#94a3b8' : '#1a1a2e', color: '#fff', padding: '1.25rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {loading ? 'PROCESSING…' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Admin hint */}
      <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
        Admin: edit this page copy at{' '}
        <a href="/admin/homepage-editor/website_be-a-partner" style={{ textDecoration: 'underline' }}>/admin/homepage-editor/website_be-a-partner</a>
      </div>
    </div>
  );
}
