'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PartnerRegistrationFormProps {
  title?: string;
  subtitle?: string;
  hero_title?: string;
  hero_subtitle?: string;
}

export default function PartnerRegistrationForm({
  title,
  subtitle,
  hero_title,
  hero_subtitle,
}: PartnerRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);

  // Form field state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typologyId, setTypologyId] = useState('');

  const displayTitle = hero_title || title || 'Grow Your Business in Siwa Oasis';
  const displaySubtitle = hero_subtitle || subtitle || 'Join the premium marketplace for hotels, restaurants, camps, and tours. Get your own cinematic mini-site and reach thousands of explorers.';

  useEffect(() => {
    fetch('/api/jana/types')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          const arr = Array.isArray(data) ? data : data.types || [];
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
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem', color: 'var(--text, #0f172a)' }}>
      {/* Intro Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '1rem' }}>
          PARTNER ONBOARDING
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.5px' }}>
          {displayTitle}
        </h2>
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
          {displaySubtitle}
        </p>
      </div>

      {/* Benefits grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        {[
          { icon: '🎬', title: 'Cinematic Mini-Sites', text: 'Showcase your business with a high-fidelity, magazine-style page designed for storytelling.' },
          { icon: '🔍', title: 'Premium Discovery', text: 'Appear in advanced search results filtered by atmosphere, vibe, and business attributes.' },
          { icon: '📊', title: 'Self-Management', text: 'Update your menu, photos, packages, and availability anytime through your dedicated vendor dashboard.' },
        ].map((benefit, i) => (
          <div key={i} style={{ background: 'var(--card, #fff)', border: '1px solid var(--border, #e2e8f0)', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>{benefit.icon}</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{benefit.title}</h3>
            <p style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.6, margin: 0, fontSize: '0.9rem' }}>{benefit.text}</p>
          </div>
        ))}
      </div>

      {/* Registration Form Box */}
      <div id="register" style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--card, #fff)', border: '1px solid var(--border, #e2e8f0)', padding: 'clamp(2rem, 5vw, 3.5rem)', borderRadius: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.08)' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem' }}>Welcome to the Oasis!</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your partner account has been created. Our team will review your application and contact you shortly.
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '0.85rem 2rem', background: '#D4AF37', color: '#1a1a2e', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
              Go to Partner Login →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem' }}>Become a Partner</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Start your journey with Siwa Oasis today.</p>
            </div>

            {error && (
              <div style={{ padding: '0.8rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Siwa Moon Lodge"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Business Category</label>
              <select
                required
                value={typologyId}
                onChange={e => setTypologyId(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="">Select your sector / typology</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="manager@siwa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Create Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #D4AF37, #F59E0B)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '0.95rem', fontWeight: 900, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px rgba(212,175,55,0.3)' }}
            >
              {loading ? 'CREATING ACCOUNT...' : 'APPLY AS PARTNER →'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
