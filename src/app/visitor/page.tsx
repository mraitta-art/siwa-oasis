'use client';

import React, { useState } from 'react';

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  wrap: { minHeight: '100vh', padding: '6rem 0', background: '#0a0f1d', color: '#fff', fontFamily: 'system-ui, sans-serif' } as React.CSSProperties,
  inner: { maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px',
    padding: '3rem', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
  } as React.CSSProperties,
  h1: { fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '2.5rem' },
  input: {
    width: '100%', padding: '1.25rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s', marginBottom: '1.5rem'
  } as React.CSSProperties,
  btn: {
    width: '100%', padding: '1.25rem', borderRadius: '16px',
    background: '#D4AF37', color: '#1a1a2e', fontSize: '1rem', fontWeight: 900,
    border: 'none', cursor: 'pointer', transition: 'all 0.3s'
  } as React.CSSProperties,
  requestCard: {
    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem'
  } as React.CSSProperties,
  offerCard: {
    background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', padding: '1.25rem',
    border: '1px solid rgba(212, 175, 55, 0.2)', marginTop: '1rem'
  } as React.CSSProperties,
  tag: {
    display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '50px',
    fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '1px',
    background: 'rgba(255,255,255,0.1)', color: '#fff', marginRight: '0.5rem'
  } as React.CSSProperties,
  statusTag: (status: string) => ({
    display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '50px',
    fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '1px',
    background: status === 'open' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
    color: status === 'open' ? '#4ade80' : '#fff', float: 'right' as const
  } as React.CSSProperties),
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function VisitorDashboard() {
  const [phoneInput, setPhoneInput] = useState('');
  const [authenticatedPhone, setAuthenticatedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) {
      setError('Please enter your WhatsApp or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/visitor/requests?phone=${encodeURIComponent(phoneInput)}`);
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
        setAuthenticatedPhone(phoneInput);
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthenticatedPhone('');
    setPhoneInput('');
    setRequests([]);
  };

  if (!authenticatedPhone) {
    return (
      <div style={S.wrap}>
        <div style={S.inner}>
          <div style={{ ...S.card, maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <i className="fas fa-user" style={{ fontSize: '1.5rem', color: '#D4AF37' }} />
            </div>
            <h1 style={S.h1}>Visitor Dashboard</h1>
            <p style={S.sub}>Track your requests and view offers from local businesses.</p>
            
            <form onSubmit={handleLogin}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>WhatsApp / Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)} 
                  placeholder="+20 123 456 7890" 
                  style={S.input} 
                />
              </div>
              
              {error && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }} /> {error}
                </div>
              )}
              
              <button type="submit" style={S.btn} disabled={loading}>
                {loading ? 'LOADING...' : 'VIEW MY REQUESTS'} <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={S.h1}>My Requests</h1>
            <p style={{ ...S.sub, margin: 0, color: 'rgba(255,255,255,0.5)' }}>Showing requests for {authenticatedPhone}</p>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px' }}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: '0.5rem' }} /> LOGOUT
          </button>
        </div>

        {requests.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '5rem 2rem' }}>
            <i className="fas fa-inbox" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>No Requests Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto' }}>You haven't submitted any visitor requests yet. Head over to the Marketplace to get started.</p>
            <a href="/" style={{ display: 'inline-block', marginTop: '2rem', ...S.btn, width: 'auto', padding: '1rem 2rem', textDecoration: 'none' }}>
              CREATE A REQUEST
            </a>
          </div>
        ) : (
          <div>
            {requests.map(req => (
              <div key={req.id} style={S.requestCard}>
                <div style={S.statusTag(req.status)}>{req.status}</div>
                <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 1rem 0', textTransform: 'capitalize' }}>
                  {req.request_type.replace('_', ' ')} Request
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <span style={S.tag}><i className="fas fa-star" style={{ color: '#D4AF37', marginRight: '0.25rem' }} /> {req.vibe}</span>
                  {req.duration && <span style={S.tag}><i className="far fa-clock" style={{ marginRight: '0.25rem' }} /> {req.duration} Days</span>}
                  {req.group_size > 1 && <span style={S.tag}><i className="fas fa-users" style={{ marginRight: '0.25rem' }} /> {req.group_size} People</span>}
                  {req.budget && <span style={S.tag}><i className="fas fa-wallet" style={{ marginRight: '0.25rem' }} /> {req.budget}</span>}
                </div>
                
                {req.special_requests && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                    <strong>Notes:</strong> {req.special_requests}
                  </div>
                )}
                
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                  Submitted on {new Date(req.created_at).toLocaleDateString()}
                </div>
                
                {/* OFFERS SECTION */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <h4 style={{ color: '#D4AF37', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1rem 0' }}>
                    <i className="fas fa-handshake" style={{ marginRight: '0.5rem' }} /> 
                    Offers Received ({req.offers?.length || 0})
                  </h4>
                  
                  {req.offers && req.offers.length > 0 ? (
                    req.offers.map((offer: any) => (
                      <div key={offer.id} style={S.offerCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h5 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{offer.offer_title}</h5>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>By {offer.business_name}</div>
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37' }}>
                            ${offer.price} {offer.currency}
                          </div>
                        </div>
                        
                        {offer.offer_description && (
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0.5rem 0 1rem 0' }}>
                            {offer.offer_description}
                          </p>
                        )}
                        
                        {offer.inclusions && offer.inclusions.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Includes</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {offer.inclusions.map((inc: string, i: number) => (
                                <span key={i} style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                  <i className="fas fa-check" style={{ marginRight: '0.25rem' }}/> {inc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                          {offer.contact_phone && (
                            <a href={`tel:${offer.contact_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 800 }}>
                              <i className="fas fa-phone" /> Call Vendor
                            </a>
                          )}
                          {offer.contact_phone && (
                            <a href={`https://wa.me/${offer.contact_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 800 }}>
                              <i className="fab fa-whatsapp" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      Waiting for businesses to review and submit offers...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
