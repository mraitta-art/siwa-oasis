'use client';

import React, { useState } from 'react';

// ─── STYLES ─────────────────────────────────────────────────────────────────

const S = {
  wrap: { padding: '6rem 0', background: '#0a0f1d', borderTop: '1px solid rgba(255,255,255,0.03)' } as React.CSSProperties,
  inner: { maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '35px',
    padding: 'clamp(1.5rem, 5vw, 3.5rem)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
  } as React.CSSProperties,
  label: { color: '#D4AF37', fontWeight: 900, letterSpacing: '4px', fontSize: '0.75rem', textTransform: 'uppercase' as const, display: 'block', marginBottom: '1rem' },
  h2: { color: '#fff', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 900, margin: 0 } as React.CSSProperties,
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '1rem' } as React.CSSProperties,
  btn: (active: boolean) => ({
    padding: '2rem 1.5rem', borderRadius: '24px',
    background: active ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.01)',
    border: active ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
    color: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
  } as React.CSSProperties),
  input: {
    width: '100%', padding: '0.9rem 1.25rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  } as React.CSSProperties,
  textarea: {
    width: '100%', padding: '0.9rem 1.25rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: '80px',
  } as React.CSSProperties,
};

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

// Defaults kept for safety; will be replaced at runtime by dynamic config when available
const DEFAULT_CATEGORIES = [
  { id: 'journey', label: 'Full Journey & Tour', desc: 'Complete organized trips, safaris, and itineraries.', icon: 'fa-route' },
  { id: 'accommodation', label: 'Accommodation', desc: 'Hotels, Ecolodges, and Desert Camps.', icon: 'fa-bed' },
  { id: 'real_estate', label: 'Real Estate & Land', desc: 'Investment, buying, or long-term rental properties.', icon: 'fa-home' },
  { id: 'restaurant', label: 'Dining & Restaurants', desc: 'Table reservations and authentic meals.', icon: 'fa-utensils' },
  { id: 'shop', label: 'Local Shops & Crafts', desc: 'Handicrafts, salt lamps, and olive oil.', icon: 'fa-shopping-bag' },
];

const DEFAULT_VIBES: Record<string, { id: string; label: string; icon: string }[]> = {
  journey: [
    { id: 'spiritual', label: 'Spiritual & Healing', icon: 'fa-heart' },
    { id: 'adventure', label: 'Nomadic Adventure', icon: 'fa-compass' },
    { id: 'culture', label: 'Cultural Storytelling', icon: 'fa-book-open' },
  ],
  accommodation: [
    { id: 'luxury', label: 'Luxury Ecolodge', icon: 'fa-star' },
    { id: 'budget', label: 'Budget & Cozy', icon: 'fa-wallet' },
    { id: 'camp', label: 'Desert Camping', icon: 'fa-campground' },
  ],
  real_estate: [
    { id: 'buy', label: 'Buy Property', icon: 'fa-key' },
    { id: 'invest', label: 'Investment / Land', icon: 'fa-seedling' },
    { id: 'rent', label: 'Long Term Rent', icon: 'fa-calendar-alt' },
  ],
  restaurant: [
    { id: 'traditional', label: 'Traditional Siwan', icon: 'fa-fire' },
    { id: 'romantic', label: 'Romantic / Sunset', icon: 'fa-heart' },
    { id: 'casual', label: 'Casual & Cafe', icon: 'fa-coffee' },
  ],
  shop: [
    { id: 'crafts', label: 'Handicrafts & Salt', icon: 'fa-hammer' },
    { id: 'food', label: 'Dates & Olive Oil', icon: 'fa-leaf' },
    { id: 'other', label: 'Other', icon: 'fa-box' },
  ]
};

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '15px', left: 0, width: `${((step - 1) / (total - 1)) * 100}%`, height: '2px', background: '#D4AF37', zIndex: 1, transition: 'width 0.4s ease' }} />
      {Array.from({ length: total }, (_, i) => i + 1).map(num => (
        <div key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: step >= num ? '#D4AF37' : '#0f172a',
            color: step >= num ? '#0a0f1d' : 'rgba(255,255,255,0.3)',
            border: step >= num ? 'none' : '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.8rem', transition: 'all 0.3s',
          }}>
            {step > num ? <i className="fas fa-check" style={{ fontSize: '0.7rem' }} /> : num}
          </div>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: '0.75rem', color: step >= num ? '#D4AF37' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {['CATEGORY', 'PREFERENCES', 'DETAILS', 'SUBMIT'][num - 1]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── NAV CONTROLS ─────────────────────────────────────────────────────────

function NavControls({ step, canProceed, onBack, onNext, nextLabel = 'CONTINUE' }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
      <button disabled={step === 1} onClick={onBack} style={{ background: 'none', border: 'none', color: step === 1 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: step === 1 ? 'default' : 'pointer', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="fas fa-arrow-left" /> BACK
      </button>
      <button disabled={!canProceed} onClick={onNext} style={{ padding: '0.85rem 2.5rem', background: canProceed ? '#D4AF37' : 'rgba(255,255,255,0.05)', color: canProceed ? '#1a1a2e' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50px', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.3s' }}>
        {nextLabel} <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }} />
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────

export default function SmartJourneyPlanner() {
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState('');
  const [vibe, setVibe] = useState('');
  
  // Generic Details
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [groupSize, setGroupSize] = useState('2');
  const [arrivalDate, setArrivalDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // User Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Dynamic config (loaded from server). Falls back to defaults above.
  const [categories, setCategories] = useState<typeof DEFAULT_CATEGORIES>(DEFAULT_CATEGORIES);
  const [vibes, setVibes] = useState<typeof DEFAULT_VIBES>(DEFAULT_VIBES as any);

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/journeys/config')
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d?.categories) setCategories(d.categories);
        if (d?.vibes) setVibes(d.vibes);
      })
      .catch(() => {
        // ignore, use defaults
      });
    return () => { mounted = false; };
  }, []);

  const TOTAL_STEPS = 4;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const canProceed = (): boolean => {
    if (step === 1) return !!requestType;
    if (step === 2) return !!vibe;
    if (step === 3) return true; // Details are mostly optional, except maybe some depending on type
    if (step === 4) return !!name && !!email;
    return false;
  };

  const submitRequest = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          request_type: requestType,
          vibe: vibe,
          duration: duration,
          budget: budget,
          group_size: parseInt(groupSize) || 1,
          arrival_date: arrivalDate,
          special_requests: specialRequests,
          custom_details: {
            selected_category_name: categories.find(c => c.id === requestType)?.label,
            selected_preference_name: vibes[requestType]?.find((v: any) => v.id === vibe)?.label,
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error || 'Failed to submit request');
      }
    } catch (e: any) {
      setSubmitError('A network error occurred.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <section style={S.wrap}>
        <div style={S.inner}>
          <div style={{ ...S.card, textAlign: 'center', padding: '6rem 2rem' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#D4AF37' }} />
            </div>
            <h2 style={S.h2}>Request Submitted!</h2>
            <p style={{ ...S.sub, fontSize: '1.1rem', maxWidth: '500px', margin: '1rem auto 2rem' }}>
              Your request has been securely routed to our platform. Verified local businesses matching your needs will review it and send you custom offers.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Keep an eye on <strong>{email}</strong> for updates.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={S.wrap} id="marketplace">
      <div style={S.inner}>
        <div style={S.card}>
          <ProgressBar step={step} total={TOTAL_STEPS} />

          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="animate-in">
              <span style={S.label}>STEP 1: THE CORE</span>
              <h2 style={S.h2}>What are you looking for?</h2>
              <p style={S.sub}>Tell us what you need in Siwa, and we'll connect you directly with the best local providers.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setRequestType(cat.id)} style={S.btn(requestType === cat.id)}>
                    <i className={`fas ${cat.icon}`} style={{ fontSize: '2.5rem', color: requestType === cat.id ? '#D4AF37' : 'rgba(255,255,255,0.2)', marginBottom: '1.5rem', display: 'block' }} />
                    <h3 style={{ color: requestType === cat.id ? '#D4AF37' : '#fff', fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.5rem' }}>{cat.label}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PREFERENCES */}
          {step === 2 && requestType && (
            <div className="animate-in">
              <span style={S.label}>STEP 2: PREFERENCES</span>
              <h2 style={S.h2}>Refine your request</h2>
              <p style={S.sub}>Help us narrow down exactly what kind of {categories.find(c => c.id === requestType)?.label.toLowerCase()} you want.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
                {vibes[requestType]?.map(v => (
                  <button key={v.id} onClick={() => setVibe(v.id)} style={S.btn(vibe === v.id)}>
                    <i className={`fas ${v.icon}`} style={{ fontSize: '2rem', color: vibe === v.id ? '#D4AF37' : 'rgba(255,255,255,0.2)', marginBottom: '1rem', display: 'block' }} />
                    <h3 style={{ color: vibe === v.id ? '#D4AF37' : '#fff', fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{v.label}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 3 && (
            <div className="animate-in">
              <span style={S.label}>STEP 3: LOGISTICS</span>
              <h2 style={S.h2}>The Details</h2>
              <p style={S.sub}>Provide a few more specifics so businesses can give you an accurate offer.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '3rem' }}>
                {['journey', 'accommodation'].includes(requestType) && (
                  <>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Duration (Days/Nights)</label>
                      <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3" style={S.input} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Group Size</label>
                      <input type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="e.g. 2" style={S.input} />
                    </div>
                  </>
                )}
                
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Estimated Budget</label>
                  <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $500 or 'Flexible'" style={S.input} />
                </div>
                
                {['journey', 'accommodation', 'restaurant'].includes(requestType) && (
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Arrival / Date</label>
                    <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} style={S.input} />
                  </div>
                )}
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Special Requests or Notes</label>
                  <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Tell us any specific requirements, allergies, or questions you have..." style={S.textarea} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUBMIT */}
          {step === 4 && (
            <div className="animate-in">
              <span style={S.label}>STEP 4: CONNECTION</span>
              <h2 style={S.h2}>Where should we send the offers?</h2>
              <p style={S.sub}>Your contact details will be kept secure. Verified vendors will respond to your request with custom proposals.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '3rem', maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={S.input} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={S.input} />
                </div>
              </div>

              {submitError && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }} /> {submitError}
                </div>
              )}
            </div>
          )}

          <NavControls 
            step={step} 
            canProceed={canProceed()} 
            onBack={handleBack} 
            onNext={step === TOTAL_STEPS ? submitRequest : handleNext}
            nextLabel={step === TOTAL_STEPS ? (submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST') : 'CONTINUE'}
          />
        </div>
      </div>
      
      <style>{`
        .animate-in { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}
