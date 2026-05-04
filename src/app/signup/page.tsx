'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    businessName: '',
    businessType: ''
  });

  useEffect(() => {
    fetch('/api/jana/types')
      .then(res => res.json())
      .then(data => setTypes(data.filter((t: any) => !t.is_parent))); // Only show children
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/signup/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        // Success! Redirect to login (or auto-login if you have session logic)
        router.push('/login?registered=true');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <header className="signup-header">
          <Link href="/" className="back-link"><i className="fas fa-arrow-left"></i> BACK</Link>
          <div className="logo-section">
             <i className="fas fa-sun gold"></i>
             <h1>SIWA OASIS</h1>
          </div>
          <p>Join the digital heart of the Oasis marketplace.</p>
        </header>

        <form onSubmit={handleSubmit} className="signup-form">
          {step === 1 ? (
            <div className="step-content animate-in">
              <div className="form-group">
                <label>FULL NAME</label>
                <input 
                  type="text" required placeholder="John Doe" 
                  value={formData.displayName} 
                  onChange={e => setFormData({...formData, displayName: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" required placeholder="john@example.com" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>PASSWORD</label>
                <input 
                  type="password" required placeholder="••••••••" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>
              <button type="button" className="btn-next" onClick={() => setStep(2)}>
                NEXT: BUSINESS DETAILS <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          ) : (
            <div className="step-content animate-in">
              <div className="form-group">
                <label>BUSINESS NAME</label>
                <input 
                  type="text" required placeholder="Siwa Paradise Hotel" 
                  value={formData.businessName} 
                  onChange={e => setFormData({...formData, businessName: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>CHOOSE YOUR CATEGORY</label>
                <div className="type-grid">
                  {types.map(t => (
                    <div 
                      key={t.id} 
                      className={`type-card ${formData.businessType === t.id ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, businessType: t.id})}
                    >
                      <i className={t.icon} style={{ color: t.icon_color }}></i>
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="button-row">
                <button type="button" className="btn-back" onClick={() => setStep(1)}>BACK</button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'LAUNCHING...' : 'CREATE MY STUDIO'}
                </button>
              </div>
            </div>
          )}
        </form>

        <footer className="signup-footer">
          Already have an account? <Link href="/login">Login here</Link>
        </footer>
      </div>

      <style jsx>{`
        .signup-page { min-height: 100vh; background: #0a0a0a; display: flex; align-items: center; justify-content: center; padding: 2rem; color: #fff; }
        .signup-card { width: 100%; maxWidth: 500px; background: #111; padding: 3rem; border-radius: 32px; border: 1px solid #222; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
        
        .signup-header { text-align: center; margin-bottom: 3rem; position: relative; }
        .back-link { position: absolute; left: 0; top: 0; color: #666; text-decoration: none; font-weight: 800; font-size: 0.7rem; }
        .logo-section { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
        .logo-section i { font-size: 2rem; }
        .gold { color: #D4AF37; }
        .signup-header h1 { font-size: 1.5rem; font-weight: 900; letter-spacing: 3px; margin: 0; }
        .signup-header p { color: #666; font-size: 0.9rem; }
        
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-size: 0.7rem; font-weight: 900; color: #D4AF37; margin-bottom: 0.75rem; letter-spacing: 1px; }
        .form-group input { width: 100%; padding: 1.25rem; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; color: #fff; outline: none; transition: border-color 0.2s; }
        .form-group input:focus { border-color: #D4AF37; }
        
        .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; max-height: 200px; overflow-y: auto; padding-right: 0.5rem; }
        .type-card { background: #1a1a1a; padding: 1rem; border-radius: 12px; border: 1px solid #333; cursor: pointer; text-align: center; transition: all 0.2s; }
        .type-card i { display: block; font-size: 1.25rem; margin-bottom: 0.5rem; }
        .type-card span { font-size: 0.65rem; font-weight: 800; color: #999; }
        .type-card:hover { border-color: #444; background: #222; }
        .type-card.active { border-color: #D4AF37; background: rgba(212,175,55,0.1); }
        .type-card.active span { color: #fff; }
        
        .btn-next, .btn-submit { width: 100%; padding: 1.25rem; border-radius: 12px; border: none; background: #D4AF37; color: #000; font-weight: 900; cursor: pointer; margin-top: 1rem; }
        .button-row { display: flex; gap: 1rem; margin-top: 1rem; }
        .btn-back { padding: 1.25rem; border-radius: 12px; border: 1px solid #333; background: none; color: #fff; cursor: pointer; }
        .btn-submit { flex: 1; margin-top: 0; }
        
        .signup-footer { text-align: center; margin-top: 2rem; font-size: 0.85rem; color: #666; }
        .signup-footer a { color: #D4AF37; text-decoration: none; font-weight: 800; }
        
        .animate-in { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
