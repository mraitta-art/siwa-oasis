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

const COUNTRY_CODES = [
  ['EG', 'Egypt', '+20'], ['AE', 'United Arab Emirates', '+971'], ['SA', 'Saudi Arabia', '+966'],
  ['MA', 'Morocco', '+212'], ['TN', 'Tunisia', '+216'], ['DZ', 'Algeria', '+213'], ['LY', 'Libya', '+218'],
  ['SD', 'Sudan', '+249'], ['JO', 'Jordan', '+962'], ['LB', 'Lebanon', '+961'], ['TR', 'Türkiye', '+90'],
  ['QA', 'Qatar', '+974'], ['KW', 'Kuwait', '+965'], ['BH', 'Bahrain', '+973'], ['OM', 'Oman', '+968'],
  ['GB', 'United Kingdom', '+44'], ['US', 'United States', '+1'], ['CA', 'Canada', '+1'], ['AU', 'Australia', '+61'],
  ['DE', 'Germany', '+49'], ['FR', 'France', '+33'], ['IT', 'Italy', '+39'], ['ES', 'Spain', '+34'],
  ['NL', 'Netherlands', '+31'], ['BE', 'Belgium', '+32'], ['CH', 'Switzerland', '+41'], ['AT', 'Austria', '+43'],
  ['SE', 'Sweden', '+46'], ['NO', 'Norway', '+47'], ['DK', 'Denmark', '+45'], ['FI', 'Finland', '+358'],
  ['IN', 'India', '+91'], ['PK', 'Pakistan', '+92'], ['CN', 'China', '+86'], ['JP', 'Japan', '+81'],
  ['KR', 'South Korea', '+82'], ['SG', 'Singapore', '+65'], ['MY', 'Malaysia', '+60'], ['ID', 'Indonesia', '+62'],
  ['TH', 'Thailand', '+66'], ['PH', 'Philippines', '+63'], ['VN', 'Vietnam', '+84'], ['ZA', 'South Africa', '+27'],
  ['NG', 'Nigeria', '+234'], ['KE', 'Kenya', '+254'], ['GH', 'Ghana', '+233'], ['BR', 'Brazil', '+55'],
  ['MX', 'Mexico', '+52'], ['AR', 'Argentina', '+54'], ['CL', 'Chile', '+56'],
].map(([value, label, code]) => ({ value, label, code }));

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);   // 1=Account 2=Category 3=Business 4=Terms

  /* ── form data ──────────────────────── */
  const [displayName,    setDisplayName]    = useState('');
  const [email,          setEmail]          = useState('');
  const [countryCode,    setCountryCode]    = useState('+20');
  const [phone,          setPhone]          = useState('');
  const [password,       setPassword]       = useState('');
  const [confirmPw,      setConfirmPw]      = useState('');
  const [showPw,         setShowPw]         = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [emailChecking,  setEmailChecking]  = useState(false);  // blur-time email check
  const [phoneChecking,  setPhoneChecking]  = useState(false);  // blur-time phone check

  /* ── type selection ──────────────────── */
  const [allTypes,    setAllTypes]    = useState<BizType[]>([]);
  const [parentId,    setParentId]    = useState<string | null>(null);   // selected parent
  const [childId,     setChildId]     = useState<string | null>(null);   // selected child type

  /* ── business selection ─────────────── */
  const [businesses,       setBusinesses]       = useState<Business[]>([]);
  const [businessId,       setBusinessId]       = useState<string>('');
  const [busLoading,       setBusLoading]       = useState(false);
  const [registerMode,     setRegisterMode]     = useState<'select'|'new'>('select');
  const [newBusinessName,  setNewBusinessName]  = useState<string>('');

  /* ── submission ─────────────────────── */
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState('');
  const [fieldErr,           setFieldErr]           = useState<Record<string, string>>({});
  const [registrationStatus, setRegistrationStatus] = useState<'idle'|'pending'|'approved'>('idle');
  const [pendingBizName,     setPendingBizName]     = useState('');
  const [termsAccepted,      setTermsAccepted]      = useState(false);

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
    if (!childId) { setBusinesses([]); setBusinessId(''); setNewBusinessName(''); return; }
    setBusLoading(true);
    setBusinesses([]);
    setBusinessId('');
    setNewBusinessName('');
    setRegisterMode('select');
    fetch(`/api/signup/vendor?type_id=${childId}`)
      .then(r => r.json())
      .then((data: Business[]) => {
        const list = Array.isArray(data) ? data : [];
        setBusinesses(list);
        // Auto-switch to Register New Name when category has no businesses yet
        if (list.length === 0) setRegisterMode('new');
      })
      .catch(() => { setBusinesses([]); setRegisterMode('new'); })
      .finally(() => setBusLoading(false));
  }, [childId]);

  /* ── blur-time email uniqueness check ───────────────── */
  const checkEmailUnique = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;
    setEmailChecking(true);
    try {
      const r = await fetch(`/api/signup/check-email?email=${encodeURIComponent(email)}`);
      const d = await r.json();
      if (d.taken) {
        setFieldErr(p => ({ ...p, email: 'An account with this email already exists' }));
      }
    } catch { /* silent — validated again at submit */ }
    finally { setEmailChecking(false); }
  };

  /* ── blur-time phone uniqueness check ───────────────── */
  const checkPhoneUnique = async () => {
    const normalizedPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    if (!phone || !/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) return;
    setPhoneChecking(true);
    try {
      const r = await fetch(`/api/signup/check-email?phone=${encodeURIComponent(normalizedPhone)}`);
      const d = await r.json();
      if (d.taken) {
        setFieldErr(p => ({ ...p, phone: 'An account with this phone number already exists' }));
      }
    } catch { /* silent — validated again at submit */ }
    finally { setPhoneChecking(false); }
  };

  /* ── step 1 validation ───────────────── */
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    const normalizedPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    if (!displayName.trim()) errs.displayName = 'Full name is required';
    if (!email.trim())       errs.email       = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address';
    if (!phone.trim())       errs.phone       = 'Phone number is required';
    else if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) errs.phone = 'Enter a valid phone number for the selected country';
    if (!password)           errs.password    = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    if (!confirmPw)          errs.confirmPw   = 'Please confirm your password';
    else if (password !== confirmPw) errs.confirmPw = 'Passwords do not match';
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
    if (registerMode === 'select' && !businessId) { setError('Please select your business'); return; }
    if (registerMode === 'new' && !newBusinessName.trim()) { setError('Please enter your business name'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup/vendor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email, password, displayName, phone: `${countryCode}${phone.replace(/\D/g, '')}`,
          businessId:      registerMode === 'select' ? businessId : undefined,
          newBusinessName: registerMode === 'new' ? newBusinessName.trim() : undefined,
          businessType: childId,
          termsAccepted,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }
      // 202 = pending admin approval
      if (res.status === 202 || data.pending) {
        setPendingBizName(registerMode === 'new' ? newBusinessName.trim() : (businesses.find(b => b.id === businessId)?.name || 'your business'));
        setRegistrationStatus('pending');
        return;
      }
      // 200 = open mode — auto-login so vendor lands directly on dashboard
      try {
        const loginRes = await fetch('/api/auth/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          router.push('/vendor');
          return;
        }
      } catch { /* fall through to login page */ }
      router.push('/login?registered=true');
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
  /* ── Pending approval screen ─── */
  if (registrationStatus === 'pending') {
    return (
      <div className="signup-root">
        <div className="signup-bg">
          <div className="bg-orb orb1" />
          <div className="bg-orb orb2" />
          <div className="bg-orb orb3" />
        </div>
        <div className="signup-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="signup-card" style={{ maxWidth: 520, textAlign: 'center', padding: '3rem 2.5rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b22, #d97706aa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: '2rem',
              boxShadow: '0 0 40px #f59e0b44'
            }}>
              <i className="fas fa-hourglass-half" style={{ color: '#f59e0b', animation: 'spin 3s linear infinite' }} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
              Registration Submitted!
            </h1>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Your vendor request for <strong style={{ color: '#D4AF37' }}>{pendingBizName}</strong> has been received.
              The admin will review and approve your account — you will be able to log in once approved.
            </p>
            <div style={{
              background: '#1e293b', border: '1px solid #f59e0b44',
              borderRadius: 12, padding: '1rem 1.25rem',
              marginBottom: '2rem', textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <i className="fas fa-envelope" style={{ color: '#f59e0b', fontSize: '0.85rem' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Registered email</span>
              </div>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{email}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: '#0f172a', borderRadius: 10, padding: '0.85rem 1rem',
                border: '1px solid #334155'
              }}>
                <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '1rem' }} />
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Account created and waiting for review</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: '#0f172a', borderRadius: 10, padding: '0.85rem 1rem',
                border: '1px solid #334155'
              }}>
                <i className="fas fa-bell" style={{ color: '#f59e0b', fontSize: '1rem' }} />
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Admin notified — approval usually within 24 hours</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: '#0f172a', borderRadius: 10, padding: '0.85rem 1rem',
                border: '1px solid #334155'
              }}>
                <i className="fas fa-unlock" style={{ color: '#60a5fa', fontSize: '1rem' }} />
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>You can log in once your account is approved</span>
              </div>
            </div>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '2rem', color: '#D4AF37', fontWeight: 600,
              textDecoration: 'none', fontSize: '0.95rem'
            }}>
              <i className="fas fa-home" /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            {([1,2,3,4] as const).map(n => (
              <React.Fragment key={n}>
                <div className={`prog-step ${step >= n ? 'done' : ''} ${step === n ? 'active' : ''}`}>
                  <div className="prog-circle">
                    {step > n
                      ? <i className="fas fa-check" />
                      : n}
                  </div>
                  <span className="prog-label">
                    {n === 1 ? 'Account' : n === 2 ? 'Category' : n === 3 ? 'Business' : 'Agreement'}
                  </span>
                </div>
                {n < 4 && <div className={`prog-line ${step > n ? 'filled' : ''}`} />}
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
                    onBlur={checkEmailUnique}
                  />
                  {emailChecking && <i className="fas fa-circle-notch fa-spin" style={{ position: 'absolute', right: '0.8rem', color: '#94a3b8' }} />}
                </div>
                {fieldErr.email && <span className="field-err">{fieldErr.email}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Phone Number</label>
                <div className={`phone-field ${fieldErr.phone ? 'is-err' : ''}`}>
                  <i className="fas fa-phone field-icon" />
                  <select
                    className="country-select"
                    aria-label="Country calling code"
                    value={countryCode}
                    onChange={e => { setCountryCode(e.target.value); setFieldErr(p => ({ ...p, phone: '' })); }}
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={`${country.value}-${country.code}`} value={country.code}>
                        {country.label} ({country.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    className="phone-input"
                    placeholder="100 123 4567"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setFieldErr(p => ({...p, phone: ''})); }}
                    onBlur={checkPhoneUnique}
                  />
                  {phoneChecking && <i className="fas fa-circle-notch fa-spin" style={{ position: 'absolute', right: '0.8rem', color: '#94a3b8' }} />}
                </div>
                {fieldErr.phone && <span className="field-err">{fieldErr.phone}</span>}
                <span className="field-hint">Saved internationally as {countryCode}{phone.replace(/\D/g, '') || '...'}</span>
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

              {/* Confirm Password */}
              <div className="field-group">
                <label className="field-label">Confirm Password</label>
                <div className={`field-wrap ${fieldErr.confirmPw ? 'is-err' : ''}`}>
                  <i className="fas fa-shield-alt field-icon" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Repeat your password"
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setFieldErr(p => ({...p, confirmPw: ''})); }}
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowConfirmPw(p => !p)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
                {fieldErr.confirmPw && <span className="field-err">{fieldErr.confirmPw}</span>}
                {confirmPw && password && confirmPw === password && (
                  <span className="field-hint" style={{ color: '#22c55e' }}>
                    <i className="fas fa-check" /> Passwords match
                  </span>
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
                <h1 className="step-title">Your Business</h1>
                <p className="step-sub">Claim an unclaimed listing or register your own business name</p>
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
                  <button type="button" className="pill-change" onClick={() => setStep(2)}>
                    Change <i className="fas fa-pen" />
                  </button>
                </div>
              )}

              {/* ── Mode toggle ── */}
              <div className="mode-toggle">
                <button
                  type="button"
                  className={`mode-tab ${registerMode === 'select' ? 'active' : ''}`}
                  onClick={() => { setRegisterMode('select'); setNewBusinessName(''); }}
                >
                  <i className="fas fa-list" /> Select Existing
                </button>
                <button
                  type="button"
                  className={`mode-tab ${registerMode === 'new' ? 'active' : ''}`}
                  onClick={() => { setRegisterMode('new'); setBusinessId(''); }}
                >
                  <i className="fas fa-plus-circle" /> Register New Name
                </button>
              </div>

              {error && <div className="form-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              {/* ── SELECT mode: show existing businesses ── */}
              {registerMode === 'select' && (
                busLoading ? (
                  <div className="skeleton-list">
                    {[1,2,3].map(i => <div key={i} className="skeleton-item" />)}
                  </div>
                ) : businesses.length === 0 ? (
                  <div className="no-biz-notice">
                    <i className="fas fa-store-slash" />
                    <strong>Be the first vendor in this category!</strong>
                    <p>No unclaimed listings in this category yet. Register your business name and become the sole owner of your profile.</p>
                    <button
                      type="button"
                      className="btn-next"
                      style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 1.4rem' }}
                      onClick={() => setRegisterMode('new')}
                    >
                      <i className="fas fa-plus-circle" /> Register New Name
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="field-hint" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-info-circle" style={{ color: '#94a3b8' }} />
                      Only unclaimed listings are shown. If your business isn't listed, use "Register New Name".
                    </p>
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
                  </>
                )
              )}\n


              {/* ── NEW mode: enter custom business name ── */}
              {registerMode === 'new' && (
                <div className="new-biz-section">
                  <div className="new-biz-info">
                    <i className="fas fa-info-circle" style={{ color: selectedChild?.icon_color || '#D4AF37' }} />
                    <p>
                      Register your business name under <strong>{selectedChild?.name}</strong>.
                      You will be the sole owner of this listing — only you can manage it from your vendor dashboard.
                    </p>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Your Business / Trade Name</label>
                    <div className={`field-wrap ${error && !newBusinessName ? 'is-err' : ''}`}>
                      <i className="fas fa-store field-icon" />
                      <input
                        type="text"
                        className="field-input"
                        placeholder={`e.g. Al-Nakhla Dates Trading Co.`}
                        value={newBusinessName}
                        onChange={e => { setNewBusinessName(e.target.value); setError(''); }}
                        autoFocus
                      />
                    </div>
                    <span className="field-hint">This will be your public vendor name on Siwa Oasis</span>
                  </div>
                </div>
              )}

              {/* Summary box */}
              {((registerMode === 'select' && businessId && selectedBiz) || (registerMode === 'new' && newBusinessName)) && (
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
                    <span className="summary-key">Phone</span>
                    <span className="summary-val">{phone}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-key">Business</span>
                    <span className="summary-val">{registerMode === 'new' ? newBusinessName : selectedBiz?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-key">Category</span>
                    <span className="summary-val">{selectedChild?.name}</span>
                  </div>
                  {registerMode === 'new' && (
                    <div className="summary-row">
                      <span className="summary-key">Status</span>
                      <span className="summary-val" style={{ color: '#22c55e' }}>✓ New registration</span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="btn-row">
                  <button type="button" className="btn-back" onClick={prevStep}>
                    <i className="fas fa-arrow-left" /> Back
                  </button>
                  <button
                    type="button"
                    className="btn-next"
                    disabled={(registerMode === 'select' && !businessId) || (registerMode === 'new' && !newBusinessName.trim())}
                    onClick={() => setStep(4)}
                  >
                    Continue <i className="fas fa-arrow-right" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─────── STEP 4: Responsibility Agreement ─────── */}
          {step === 4 && (
            <div className="form-step animate-in">
              <div className="step-header">
                <h1 className="step-title">Vendor Agreement</h1>
                <p className="step-sub">Read and accept before launching your studio</p>
              </div>

              {/* Agreement Card */}
              <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-shield-halved" style={{ color: '#D4AF37', fontSize: '1rem' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.9rem' }}>Vendor Responsibility Agreement</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    'I am legally authorized to manage and represent this business listing.',
                    'All content, photos, prices, and offers I publish are accurate and lawful.',
                    'I accept full legal responsibility for any bookings, claims, or transactions made through my listing.',
                    'I understand that misrepresentation or policy violations may result in immediate suspension.',
                    'This listing will display without a Trusted badge until my identity is verified by the Siwa Today team.',
                  ].map((clause, i) => (
                    <li key={i} style={{ color: 'rgba(248,250,252,0.75)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {clause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust Badge Notice */}
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <i className="fas fa-circle-info" style={{ color: '#818cf8', marginTop: '0.1rem', flexShrink: 0 }} />
                <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: '0.78rem', lineHeight: 1.6 }}>
                  After registration, you can upload your <strong style={{ color: '#a5b4fc' }}>National ID</strong> and <strong style={{ color: '#a5b4fc' }}>ownership proof</strong> from your dashboard to receive the <strong style={{ color: '#D4AF37' }}>✓ Trusted Vendor</strong> badge on your public minisite.
                </span>
              </div>

              {/* Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                <div
                  onClick={() => setTermsAccepted(p => !p)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: '0.1rem',
                    border: termsAccepted ? '2px solid #D4AF37' : '2px solid rgba(255,255,255,0.2)',
                    background: termsAccepted ? '#D4AF37' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                >
                  {termsAccepted && <i className="fas fa-check" style={{ color: '#1a1000', fontSize: '0.7rem', fontWeight: 900 }} />}
                </div>
                <span style={{ color: 'rgba(248,250,252,0.8)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                  I have read and I accept the Vendor Responsibility Agreement. I understand this is a legally binding commitment.
                </span>
              </label>

              {error && <div className="form-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="btn-row">
                  <button type="button" className="btn-back" onClick={() => setStep(3)}>
                    <i className="fas fa-arrow-left" /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !termsAccepted}
                    style={{ opacity: termsAccepted ? 1 : 0.5 }}
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
          background: #fcfbfa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          color: #334155;
        }

        /* Animated orbs — subtle warm tones */
        .signup-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
          animation: orbFloat 10s ease-in-out infinite alternate;
        }
        .orb1 { width: 500px; height: 500px; background: #fdf0c8; top: -150px; right: -100px; }
        .orb2 { width: 400px; height: 400px; background: #e8f4e8; bottom: -120px; left: -80px; animation-delay: -3s; }
        .orb3 { width: 300px; height: 300px; background: #fef9ec; top: 50%; left: 40%; animation-delay: -6s; }
        @keyframes orbFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, -40px) scale(1.1); }
        }

        /* Wrap */
        .signup-wrap {
          width: 100%;
          max-width: 580px;
          position: relative;
          z-index: 1;
        }

        /* Top nav row */
        .signup-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }
        .back-btn, .login-link {
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .back-btn:hover, .login-link:hover { color: #D4AF37; }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 3px;
          color: #1e293b;
        }
        .brand-icon {
          color: #D4AF37;
          font-size: 1.2rem;
          animation: sunSpin 12s linear infinite;
        }
        @keyframes sunSpin { to { transform: rotate(360deg); } }

        /* Card */
        .signup-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 28px;
          padding: 2.5rem;
          box-shadow: 0 4px 40px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
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
          border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900;
          color: #cbd5e1;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          background: #f8fafc;
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
          text-transform: uppercase;
          color: #cbd5e1;
          transition: color 0.3s;
        }
        .prog-step.active .prog-label { color: #D4AF37; }
        .prog-step.done  .prog-label { color: #22c55e; }

        .prog-line {
          flex: 1;
          height: 2px;
          background: #e2e8f0;
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
          color: #0f172a;
        }
        .step-sub {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
          font-weight: 500;
        }

        /* Fields */
        .field-group { margin-bottom: 1.4rem; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.6rem;
        }
        .filter-tag {
          background: rgba(212,175,55,0.15);
          color: #92702a;
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
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          transition: all 0.25s;
        }
        .field-wrap:focus-within {
          border-color: #D4AF37;
          background: #fffdf5;
          box-shadow: 0 0 0 4px rgba(212,175,55,0.15);
        }
        .field-wrap.is-err {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.1);
        }
        .phone-field {
          display: flex;
          align-items: center;
          min-height: 52px;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          transition: all 0.25s;
        }
        .phone-field:focus-within {
          border-color: #D4AF37;
          background: #fffdf5;
          box-shadow: 0 0 0 4px rgba(212,175,55,0.15);
        }
        .phone-field.is-err { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
        .phone-field .field-icon { padding-left: 1.1rem; }
        .country-select {
          width: 112px;
          margin-left: 0.55rem;
          padding: 0.55rem 0.25rem;
          border: 0;
          border-right: 1px solid #cbd5e1;
          background: transparent;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 700;
          outline: none;
        }
        .phone-input {
          min-width: 0;
          flex: 1;
          padding: 1rem 0.8rem;
          border: 0;
          outline: none;
          background: transparent;
          color: #334155;
          font: inherit;
        }
        .field-icon {
          padding: 0 0 0 1.1rem;
          color: #64748b;
          font-size: 0.85rem;
          pointer-events: none;
        }
        .field-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 1rem 1rem 0.75rem;
          color: #0f172a;
          font-size: 0.95rem;
          font-family: inherit;
          font-weight: 700;
        }
        .field-input::placeholder { color: #94a3b8; font-weight: 500; }
        .pw-toggle {
          background: none;
          border: none;
          color: #cbd5e1;
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
          background: #e2e8f0;
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
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .parent-card:hover {
          border-color: #D4AF37;
          background: #fffdf5;
          color: #92702a;
        }
        .parent-card.active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, #ffffff);
          color: #92702a;
          box-shadow: 0 2px 12px color-mix(in srgb, var(--accent) 20%, transparent);
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
        .child-grid::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
        .child-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

        .child-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1.5px solid #f1f5f9;
          background: #f8fafc;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          position: relative;
        }
        .child-card:hover {
          border-color: #e2e8f0;
          background: #fff;
          transform: translateX(4px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .child-card.active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 8%, #ffffff);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .child-icon-wrap {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          transition: transform 0.2s;
          background: #f1f5f9;
        }
        .child-card.active .child-icon-wrap { background: color-mix(in srgb, var(--accent) 15%, #ffffff); }
        .child-card:hover .child-icon-wrap,
        .child-card.active .child-icon-wrap { transform: scale(1.1); }
        .child-info { flex: 1; }
        .child-name { display: block; font-size: 0.88rem; font-weight: 800; color: #1e293b; margin-bottom: 0.1rem; }
        .child-desc { display: block; font-size: 0.72rem; color: #94a3b8; line-height: 1.4; }
        .child-check {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #D4AF37;
          color: #fff;
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
        .biz-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
        .biz-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

        .biz-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 14px;
          border: 1.5px solid #f1f5f9;
          background: #f8fafc;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .biz-card:hover {
          border-color: #e2e8f0;
          background: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .biz-card.active {
          border-color: var(--accent, #D4AF37);
          background: color-mix(in srgb, var(--accent, #D4AF37) 8%, #ffffff);
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent, #D4AF37) 15%, transparent);
        }
        .biz-avatar {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          background: #f1f5f9;
        }
        .biz-info { flex: 1; }
        .biz-name { display: block; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .biz-slug { display: block; font-size: 0.72rem; color: #94a3b8; margin-top: 0.1rem; }
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
          border: 1.5px solid #fde68a;
          background: #fffdf5;
          margin-bottom: 1.25rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #92702a;
        }
        .pill-sep { color: #fbbf24; }
        .pill-parent { color: #92702a; font-weight: 700; }
        .pill-change {
          margin-left: auto;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: color 0.2s;
        }
        .pill-change:hover { color: #D4AF37; }

        /* Mode toggle (Select Existing / Register New) */
        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.35rem;
          margin-bottom: 1.25rem;
        }
        .mode-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.65rem 1rem;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-tab:hover { color: #1e293b; background: #fff; }
        .mode-tab.active {
          background: #D4AF37;
          color: #1a1a1a;
          box-shadow: 0 2px 10px rgba(212,175,55,0.35);
        }

        /* New business name section */
        .new-biz-section { margin-bottom: 1.25rem; }
        .new-biz-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
          background: #fffdf5;
          border: 1.5px solid #fde68a;
          border-radius: 12px;
          margin-bottom: 1.25rem;
        }
        .new-biz-info i { font-size: 1rem; margin-top: 0.1rem; flex-shrink: 0; }
        .new-biz-info p { margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.6; }
        .new-biz-info strong { color: #92702a; }

        /* Field hint */
        .field-hint {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          margin-top: 0.4rem;
          padding-left: 0.25rem;
        }

        /* Skeleton */
        .skeleton-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
        .skeleton-item {
          height: 64px;
          border-radius: 14px;
          background: linear-gradient(90deg,
            #f1f5f9 25%,
            #e2e8f0 50%,
            #f1f5f9 75%
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
          background: #fff8f8;
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 16px;
          margin-bottom: 1.25rem;
          color: #64748b;
          font-size: 0.9rem;
        }
        .no-biz-notice i { font-size: 2rem; color: #ef4444; opacity: 0.7; }
        .no-biz-notice strong { color: #ef4444; font-size: 1rem; }
        .no-biz-notice p { font-size: 0.82rem; color: #94a3b8; line-height: 1.6; margin: 0; }

        /* Empty notice */
        .empty-notice {
          padding: 1rem;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          color: #94a3b8;
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Summary box */
        .summary-box {
          background: #fffdf5;
          border: 1.5px solid #fde68a;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.82rem;
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-key { color: #94a3b8; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-val { color: #1e293b; font-weight: 800; }

        /* Error */
        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fff8f8;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 700;
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
          color: #5a3e00;
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
          color: #5a3e00;
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
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-back:hover {
          border-color: #D4AF37;
          color: #92702a;
          background: #fffdf5;
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
          color: #94a3b8;
          font-weight: 500;
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
