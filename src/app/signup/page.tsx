'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface BizType {
  id: string;
  name: string;
  icon: string;
  icon_color: string;
  description: string;
  is_parent: boolean;
  parent_id: string | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
}

/* ─────────────────────────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────────────────────────── */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'] as const;
  return { score, label: levels[score], color: colors[score] };
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function VendorSignup() {
  const router = useRouter();

  /* ── step state ─────────────────────── */
  const [step, setStep] = useState<1 | 2 | 3>(1);   // 1=Account 2=Category/Child 3=Business

  /* ── form data ──────────────────────── */
  const [displayName, setDisplayName] = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);

  /* ── type selection ──────────────────── */
  const [allTypes,    setAllTypes]    = useState<BizType[]>([]);
  const [parentId,    setParentId]    = useState<string | null>(null);   // selected parent
  const [childId,     setChildId]     = useState<string | null>(null);   // selected child type

  /* ── business selection ─────────────── */
  const [businesses,  setBusinesses]  = useState<Business[]>([]);
  const [businessId,  setBusinessId]  = useState<string>('');
  const [busLoading,  setBusLoading]  = useState(false);

  /* ── submission ─────────────────────── */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [fieldErr,  setFieldErr]  = useState<Record<string, string>>({});

  /* ── load types once ─────────────────── */
  useEffect(() => {
    fetch('/api/signup/types')
      .then(r => r.json())
      .then((data: BizType[]) => {
        if (Array.isArray(data)) setAllTypes(data);
      })
      .catch(() => {/* silent */});
  }, []);

  /* derived lists */
  const parents  = allTypes.filter(t => t.is_parent);
  const children = parentId
    ? allTypes.filter(t => !t.is_parent && t.parent_id === parentId)
    : allTypes.filter(t => !t.is_parent);

  /* ── load businesses when child type chosen ── */
  useEffect(() => {
    if (!childId) { setBusinesses([]); setBusinessId(''); return; }
    setBusLoading(true);
    setBusinesses([]);
    setBusinessId('');
    fetch(`/api/signup/vendor?type_id=${childId}`)
      .then(r => r.json())
      .then((data: Business[]) => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => setBusinesses([]))
      .finally(() => setBusLoading(false));
  }, [childId]);

  /* ── step 1 validation ───────────────── */
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Full name is required';
    if (!email.trim())       errs.email       = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address';
    if (!password)           errs.password    = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── step 2 validation ───────────────── */
  const validateStep2 = () => {
    if (!childId) {
      setError('Please select a business category');
      return false;
    }
    setError('');
    return true;
  };

  /* ── navigation ──────────────────────── */
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setError('');
    setStep(prev => (prev + 1) as 1|2|3);
  };

  const prevStep = () => setStep(prev => (prev - 1) as 1|2|3);

  /* ── submit ──────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) { setError('Please select your business'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/signup/vendor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email, password, displayName,
          businessId,
          businessType: childId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);
  const selectedChild   = allTypes.find(t => t.id === childId);
  const selectedParent  = allTypes.find(t => t.id === parentId);
  const selectedBiz     = businesses.find(b => b.id === businessId);

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="signup-root">

      {/* ── Animated background ── */}
      <div className="signup-bg">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
      </div>

      <div className="signup-wrap">

        {/* ─── Header ─── */}
        <div className="signup-top">
          <Link href="/" className="back-btn">
            <i className="fas fa-arrow-left" /> Back
          </Link>
          <div className="brand">
            <i className="fas fa-sun brand-icon" />
            <span>SIWA OASIS</span>
          </div>
          <Link href="/login" className="login-link">
            Sign in <i className="fas fa-arrow-right" />
          </Link>
        </div>

        {/* ─── Card ─── */}
        <div className="signup-card">

          {/* Progress Bar */}
          <div className="progress-wrap">
            {([1,2,3] as const).map(n => (
              <React.Fragment key={n}>
                <div className={`prog-step ${step >= n ? 'done' : ''} ${step === n ? 'active' : ''}`}>
                  <div className="prog-circle">
                    {step > n
                      ? <i className="fas fa-check" />
                      : n}
                  </div>
                  <span className="prog-label">
                    {n === 1 ? 'Account' : n === 2 ? 'Category' : 'Business'}
                  </span>
                </div>
                {n < 3 && <div className={`prog-line ${step > n ? 'filled' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ─────── STEP 1: Account ─────── */}
          {step === 1 && (
            <div className="form-step animate-in">
              <div className="step-header">
                <h1 className="step-title">Create Your Account</h1>
                <p className="step-sub">Join the digital marketplace of Siwa Oasis</p>
              </div>

              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className={`field-wrap ${fieldErr.displayName ? 'is-err' : ''}`}>
                  <i className="fas fa-user field-icon" />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ahmed Hassan"
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); setFieldErr(p => ({...p, displayName: ''})); }}
                    autoFocus
                  />
                </div>
                {fieldErr.displayName && <span className="field-err">{fieldErr.displayName}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Email Address</label>
                <div className={`field-wrap ${fieldErr.email ? 'is-err' : ''}`}>
                  <i className="fas fa-envelope field-icon" />
                  <input
                    type="email"
                    className="field-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErr(p => ({...p, email: ''})); }}
                  />
                </div>
                {fieldErr.email && <span className="field-err">{fieldErr.email}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className={`field-wrap ${fieldErr.password ? 'is-err' : ''}`}>
                  <i className="fas fa-lock field-icon" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErr(p => ({...p, password: ''})); }}
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw(p => !p)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
                {fieldErr.password && <span className="field-err">{fieldErr.password}</span>}

                {/* Strength meter */}
                {password && (
                  <div className="strength-wrap">
                    <div className="strength-bars">
                      {[1,2,3,4].map(i => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <button type="button" className="btn-next" onClick={nextStep}>
                Continue <i className="fas fa-arrow-right" />
              </button>
            </div>
          )}

          {/* ─────── STEP 2: Category ─────── */}
          {step === 2 && (
            <div className="form-step animate-in">
              <div className="step-header">
                <h1 className="step-title">Choose Your Category</h1>
                <p className="step-sub">Select what best describes your business</p>
              </div>

              {error && <div className="form-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              {/* Parent categories (if any) */}
              {parents.length > 0 && (
                <div className="field-group">
                  <label className="field-label">Industry</label>
                  <div className="parent-grid">
                    {parents.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`parent-card ${parentId === p.id ? 'active' : ''}`}
                        onClick={() => {
                          setParentId(p.id === parentId ? null : p.id);
                          setChildId(null);
                        }}
                        style={{ '--accent': p.icon_color } as React.CSSProperties}
                      >
                        <i className={p.icon} style={{ color: p.icon_color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Child types */}
              <div className="field-group">
                <label className="field-label">
                  {parents.length > 0 ? 'Business Type' : 'Category'}
                  {parentId && selectedParent && (
                    <span className="filter-tag">in {selectedParent.name}</span>
                  )}
                </label>

                {children.length === 0 && allTypes.length > 0 ? (
                  <div className="empty-notice">
                    <i className="fas fa-info-circle" /> No subcategories found — select an industry above
                  </div>
                ) : (
                  <div className="child-grid">
                    {children.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`child-card ${childId === c.id ? 'active' : ''}`}
                        onClick={() => setChildId(c.id)}
                        style={{ '--accent': c.icon_color } as React.CSSProperties}
                      >
                        <div className="child-icon-wrap" style={{ background: `${c.icon_color}22` }}>
                          <i className={c.icon} style={{ color: c.icon_color }} />
                        </div>
                        <div className="child-info">
                          <span className="child-name">{c.name}</span>
                          {c.description && <span className="child-desc">{c.description}</span>}
                        </div>
                        <div className={`child-check ${childId === c.id ? 'visible' : ''}`}>
                          <i className="fas fa-check" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="btn-row">
                <button type="button" className="btn-back" onClick={prevStep}>
                  <i className="fas fa-arrow-left" /> Back
                </button>
                <button type="button" className="btn-next" onClick={nextStep} disabled={!childId}>
                  Continue <i className="fas fa-arrow-right" />
                </button>
              </div>
            </div>
          )}

          {/* ─────── STEP 3: Business ─────── */}
          {step === 3 && (
            <div className="form-step animate-in">
              <div className="step-header">
                <h1 className="step-title">Select Your Business</h1>
                <p className="step-sub">Find your pre-registered business in the registry</p>
              </div>

              {/* Context pill */}
              {selectedChild && (
                <div className="context-pill" style={{ borderColor: `${selectedChild.icon_color}44` }}>
                  <i className={selectedChild.icon} style={{ color: selectedChild.icon_color }} />
                  <span style={{ color: selectedChild.icon_color }}>{selectedChild.name}</span>
                  {selectedParent && selectedParent.id !== selectedChild.id && (
                    <>
                      <span className="pill-sep">·</span>
                      <span className="pill-parent">{selectedParent.name}</span>
                    </>
                  )}
                  <button
                    type="button"
                    className="pill-change"
                    onClick={() => setStep(2)}
                  >
                    Change <i className="fas fa-pen" />
                  </button>
                </div>
              )}

              {error && <div className="form-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              {/* Business list */}
              {busLoading ? (
                <div className="skeleton-list">
                  {[1,2,3].map(i => <div key={i} className="skeleton-item" />)}
                </div>
              ) : businesses.length === 0 ? (
                <div className="no-biz-notice">
                  <i className="fas fa-store-slash" />
                  <strong>No available businesses found</strong>
                  <p>No unassigned businesses exist for this category yet.<br/>Please contact an admin to pre-register your business.</p>
                </div>
              ) : (
                <div className="biz-list">
                  {businesses.map(biz => (
                    <button
                      key={biz.id}
                      type="button"
                      className={`biz-card ${businessId === biz.id ? 'active' : ''}`}
                      onClick={() => setBusinessId(biz.id)}
                      style={{ '--accent': selectedChild?.icon_color || '#D4AF37' } as React.CSSProperties}
                    >
                      <div className="biz-avatar" style={{ background: `${selectedChild?.icon_color || '#D4AF37'}22` }}>
                        <i className={selectedChild?.icon || 'fas fa-building'} style={{ color: selectedChild?.icon_color || '#D4AF37' }} />
                      </div>
                      <div className="biz-info">
                        <span className="biz-name">{biz.name}</span>
                        <span className="biz-slug">/{biz.slug}</span>
                      </div>
                      <div className={`biz-check ${businessId === biz.id ? 'visible' : ''}`}>
                        <i className="fas fa-check-circle" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Summary box */}
              {businessId && selectedBiz && (
                <div className="summary-box">
                  <div className="summary-row">
                    <span className="summary-key">Vendor</span>
                    <span className="summary-val">{displayName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-key">Email</span>
                    <span className="summary-val">{email}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-key">Business</span>
                    <span className="summary-val">{selectedBiz.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-key">Category</span>
                    <span className="summary-val">{selectedChild?.name}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="btn-row">
                  <button type="button" className="btn-back" onClick={prevStep}>
                    <i className="fas fa-arrow-left" /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !businessId || businesses.length === 0}
                  >
                    {loading ? (
                      <><i className="fas fa-circle-notch fa-spin" /> Creating Studio...</>
                    ) : (
                      <><i className="fas fa-rocket" /> Launch My Studio</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        <p className="signup-footer">
          Already have an account?&nbsp;
          <Link href="/login">Sign in here</Link>
        </p>
      </div>

      {/* ─── STYLES ─── */}
      <style jsx>{`
        /* Root */
        .signup-root {
          min-height: 100vh;
          background: #080c18;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          color: #fff;
        }

        /* Animated orbs */
        .signup-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }
        .orb1 { width: 500px; height: 500px; background: #D4AF37; top: -150px; right: -100px; }
        .orb2 { width: 400px; height: 400px; background: #7c3aed; bottom: -120px; left: -80px; animation-delay: -3s; }
        .orb3 { width: 300px; height: 300px; background: #0ea5e9; top: 50%; left: 40%; animation-delay: -6s; }
        @keyframes orbFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, -30px) scale(1.1); }
        }

        /* Wrap */
        .signup-wrap {
          width: 100%;
          max-width: 560px;
          position: relative;
          z-index: 1;
        }

        /* Top nav row */
        .signup-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .back-btn, .login-link {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s;
        }
        .back-btn:hover, .login-link:hover { color: #D4AF37; }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 900;
          font-size: 0.9rem;
          letter-spacing: 3px;
          color: #fff;
        }
        .brand-icon {
          color: #D4AF37;
          font-size: 1.2rem;
          animation: sunSpin 12s linear infinite;
        }
        @keyframes sunSpin { to { transform: rotate(360deg); } }

        /* Card */
        .signup-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          padding: 2.5rem;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Progress */
        .progress-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 2.5rem;
        }
        .prog-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }
        .prog-circle {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900;
          color: rgba(255,255,255,0.3);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          background: transparent;
        }
        .prog-step.done .prog-circle {
          background: #22c55e;
          border-color: #22c55e;
          color: #fff;
          box-shadow: 0 0 16px #22c55e55;
        }
        .prog-step.active .prog-circle {
          background: #D4AF37;
          border-color: #D4AF37;
          color: #1a1a1a;
          box-shadow: 0 0 20px #D4AF3766;
        }
        .prog-label {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.3);
          transition: color 0.3s;
        }
        .prog-step.active .prog-label { color: #D4AF37; }
        .prog-step.done  .prog-label { color: #22c55e; }

        .prog-line {
          flex: 1;
          height: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.4s;
          margin: 0 0.5rem;
          margin-bottom: 1.25rem;
        }
        .prog-line.filled { background: linear-gradient(90deg, #22c55e, #D4AF37); }

        /* Step content */
        .form-step { }
        .animate-in {
          animation: stepIn 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .step-header { margin-bottom: 2rem; }
        .step-title {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 0 0 0.4rem;
          background: linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.5));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .step-sub {
          color: rgba(255,255,255,0.45);
          font-size: 0.9rem;
          margin: 0;
        }

        /* Fields */
        .field-group { margin-bottom: 1.4rem; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.6rem;
        }
        .filter-tag {
          background: rgba(212,175,55,0.15);
          color: #D4AF37;
          border-radius: 20px;
          padding: 2px 8px;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: none;
        }

        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          transition: all 0.25s;
        }
        .field-wrap:focus-within {
          border-color: #D4AF37;
          background: rgba(212,175,55,0.06);
          box-shadow: 0 0 0 4px rgba(212,175,55,0.12);
        }
        .field-wrap.is-err {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.1);
        }
        .field-icon {
          padding: 0 0 0 1.1rem;
          color: rgba(255,255,255,0.3);
          font-size: 0.85rem;
          pointer-events: none;
        }
        .field-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 1rem 1rem 0.75rem;
          color: #fff;
          font-size: 0.95rem;
          font-family: inherit;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }
        .pw-toggle {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          padding: 0 1rem;
          cursor: pointer;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: #D4AF37; }
        .field-err {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #ef4444;
          margin-top: 0.4rem;
          padding-left: 0.25rem;
        }

        /* Password strength */
        .strength-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.6rem;
        }
        .strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 0.7rem;
          font-weight: 800;
          min-width: 44px;
          text-align: right;
        }

        /* Parent categories */
        .parent-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        .parent-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border-radius: 50px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .parent-card:hover {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08);
        }
        .parent-card.active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          color: #fff;
          box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 30%, transparent);
        }

        /* Child type cards */
        .child-grid {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }
        .child-grid::-webkit-scrollbar { width: 4px; }
        .child-grid::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 2px; }
        .child-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        .child-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
        }
        .child-card:hover {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
          transform: translateX(4px);
        }
        .child-card.active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .child-icon-wrap {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .child-card:hover .child-icon-wrap,
        .child-card.active .child-icon-wrap { transform: scale(1.1); }
        .child-info { flex: 1; }
        .child-name { display: block; font-size: 0.88rem; font-weight: 800; color: #fff; margin-bottom: 0.1rem; }
        .child-desc { display: block; font-size: 0.72rem; color: rgba(255,255,255,0.4); line-height: 1.4; }
        .child-check {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #D4AF37;
          color: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .child-check.visible { opacity: 1; transform: scale(1); }

        /* Business list */
        .biz-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 1.25rem;
          padding-right: 0.25rem;
        }
        .biz-list::-webkit-scrollbar { width: 4px; }
        .biz-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 2px; }
        .biz-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        .biz-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .biz-card:hover {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
        }
        .biz-card.active {
          border-color: var(--accent, #D4AF37);
          background: color-mix(in srgb, var(--accent, #D4AF37) 10%, transparent);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent, #D4AF37) 20%, transparent);
        }
        .biz-avatar {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .biz-info { flex: 1; }
        .biz-name { display: block; font-size: 0.95rem; font-weight: 800; color: #fff; }
        .biz-slug { display: block; font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 0.1rem; }
        .biz-check {
          color: #D4AF37;
          font-size: 1.3rem;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s;
        }
        .biz-check.visible { opacity: 1; transform: scale(1); }

        /* Context pill */
        .context-pill {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1rem;
          border-radius: 50px;
          border: 1.5px solid;
          background: rgba(255,255,255,0.04);
          margin-bottom: 1.25rem;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .pill-sep { color: rgba(255,255,255,0.2); }
        .pill-parent { color: rgba(255,255,255,0.5); font-weight: 600; }
        .pill-change {
          margin-left: auto;
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: color 0.2s;
        }
        .pill-change:hover { color: #D4AF37; }

        /* Skeleton */
        .skeleton-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
        .skeleton-item {
          height: 64px;
          border-radius: 14px;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.05) 25%,
            rgba(255,255,255,0.1) 50%,
            rgba(255,255,255,0.05) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        /* No business */
        .no-biz-notice {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
          padding: 2.5rem 1rem;
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 16px;
          margin-bottom: 1.25rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }
        .no-biz-notice i { font-size: 2rem; color: #ef4444; opacity: 0.7; }
        .no-biz-notice strong { color: #fff; font-size: 1rem; }
        .no-biz-notice p { font-size: 0.82rem; color: rgba(255,255,255,0.45); line-height: 1.6; margin: 0; }

        /* Empty notice */
        .empty-notice {
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.4);
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Summary box */
        .summary-box {
          background: rgba(212,175,55,0.06);
          border: 1px solid rgba(212,175,55,0.2);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.82rem;
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-key { color: rgba(255,255,255,0.4); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-val { color: #fff; font-weight: 700; }

        /* Error */
        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          animation: errShake 0.4s ease;
        }
        @keyframes errShake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-6px); }
          40%,80%  { transform: translateX(6px); }
        }

        /* Buttons */
        .btn-next {
          width: 100%;
          padding: 1rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #D4AF37, #f0c842);
          color: #1a1000;
          font-weight: 900;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(212,175,55,0.3);
          letter-spacing: 0.3px;
        }
        .btn-next:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(212,175,55,0.45);
        }
        .btn-next:active { transform: scale(0.98); }
        .btn-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-submit {
          flex: 1;
          padding: 1rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #D4AF37, #f0c842);
          color: #1a1000;
          font-weight: 900;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(212,175,55,0.3);
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(212,175,55,0.45);
        }
        .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-back {
          padding: 1rem 1.5rem;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-back:hover {
          border-color: rgba(255,255,255,0.25);
          color: #fff;
        }

        .btn-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Footer */
        .signup-footer {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
        }
        .signup-footer a {
          color: #D4AF37;
          text-decoration: none;
          font-weight: 800;
        }
        .signup-footer a:hover { text-decoration: underline; }

        /* Responsive */
        @media (max-width: 480px) {
          .signup-card { padding: 1.75rem 1.25rem; }
          .step-title { font-size: 1.3rem; }
          .btn-row { flex-direction: column-reverse; }
          .btn-submit, .btn-back { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
