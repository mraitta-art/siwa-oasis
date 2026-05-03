'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BeAPartnerPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Registration logic will go here
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1a1a2e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '6rem 2rem', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Grow Your Business in <span style={{ color: '#D4AF37' }}>Siwa Oasis</span>
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Join the premium marketplace for hotels, restaurants, and tours. Get your own cinematic mini-site and reach thousands of explorers.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#register" style={{ 
            background: '#D4AF37', color: '#1a1a2e', padding: '1rem 2.5rem', 
            borderRadius: '50px', fontWeight: 800, textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(212, 175, 55, 0.3)'
          }}>GET STARTED</a>
          <a href="/" style={{ 
            background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '1rem 2.5rem', 
            borderRadius: '50px', fontWeight: 700, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>LEARN MORE</a>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎬</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Cinematic Mini-Sites</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Showcase your business with a high-fidelity, magazine-style page designed for storytelling.</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Premium Discovery</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Appear in advanced search results filtered by atmosphere, vibe, and specific business attributes.</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Self-Management</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Update your menu, photos, and availability anytime through your dedicated vendor dashboard.</p>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" style={{ padding: '5rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>Welcome to the Oasis!</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Your partner account has been created. Our team will review your application and contact you shortly.</p>
              <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%' }}>GO TO LOGIN</button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 900, marginBottom: '0.5rem', fontSize: '2rem' }}>Become a Partner</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Start your journey with Siwa Oasis today.</p>
              
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>BUSINESS NAME</label>
                  <input type="text" placeholder="e.g. Desert Rose Eco Lodge" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} required />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>EMAIL ADDRESS</label>
                  <input type="email" placeholder="contact@yourbusiness.com" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} required />
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>PASSWORD</label>
                  <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} required />
                </div>
                
                <button type="submit" style={{ 
                  width: '100%', background: '#1a1a2e', color: '#fff', padding: '1.25rem', 
                  borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer',
                  transition: 'transform 0.2s'
                }} disabled={loading}>
                  {loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
