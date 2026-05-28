'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface TierFeatures {
  journey_marketplace_access?: boolean;      // can see this page at all
  journey_view_requests?: boolean;           // can see open requests
  journey_contact_email?: boolean;           // can contact via email
  journey_contact_phone?: boolean;           // can contact via phone
  journey_contact_whatsapp?: boolean;        // can contact via whatsapp
  journey_submit_offer?: boolean;            // can submit a formal offer
  [key: string]: any;
}

interface Journey {
  id: number;
  customer_name: string;
  customer_email: string;
  vibe: string;
  duration: string;
  pace: string;
  budget: string;
  group_size: number;
  arrival_date: string | null;
  special_requests: string;
  itinerary_name: string;
  itinerary_summary: string;
  status: string;
  created_at: string;
  offer_count?: number;
  request_type: string;
  custom_details: any;
}

// ─── TYPES & CONFIG ────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All Requests' },
  { id: 'journey', label: 'Journeys' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'shop', label: 'Shops' },
];

const TYPE_COLORS: Record<string, string> = {
  journey: '#8b5cf6', accommodation: '#10b981', real_estate: '#f59e0b', restaurant: '#ef4444', shop: '#3b82f6'
};
const TYPE_ICONS: Record<string, string> = {
  journey: 'fa-route', accommodation: 'fa-bed', real_estate: 'fa-home', restaurant: 'fa-utensils', shop: 'fa-shopping-bag'
};

const TIER_LABELS: Record<string, { label: string; color: string; gradient: string }> = {
  free:    { label: 'Free',     color: '#6b7280', gradient: 'linear-gradient(135deg, #374151, #1f2937)' },
  basic:   { label: 'Basic',   color: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)' },
  premium: { label: 'Premium', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #3b1f6e, #5b21b6)' },
  gold:    { label: 'Gold VIP',  color: '#D4AF37', gradient: 'linear-gradient(135deg, #78350f, #92400e)' },
  vip:     { label: 'Enterprise', color: '#10b981', gradient: 'linear-gradient(135deg, #064e3b, #065f46)' },
};

// What each tier can do BY DEFAULT (overrideable from DB tier features)
const DEFAULT_TIER_CAPS: Record<string, TierFeatures> = {
  free:    { journey_marketplace_access: false, journey_view_requests: false, journey_contact_email: false, journey_contact_phone: false, journey_contact_whatsapp: false, journey_submit_offer: false },
  basic:   { journey_marketplace_access: true,  journey_view_requests: true,  journey_contact_email: false, journey_contact_phone: false, journey_contact_whatsapp: false, journey_submit_offer: false },
  premium: { journey_marketplace_access: true,  journey_view_requests: true,  journey_contact_email: true,  journey_contact_phone: false, journey_contact_whatsapp: false, journey_submit_offer: true  },
  gold:    { journey_marketplace_access: true,  journey_view_requests: true,  journey_contact_email: true,  journey_contact_phone: true,  journey_contact_whatsapp: true,  journey_submit_offer: true  },
  vip:     { journey_marketplace_access: true,  journey_view_requests: true,  journey_contact_email: true,  journey_contact_phone: true,  journey_contact_whatsapp: true,  journey_submit_offer: true  },
};

// ─── LOCKED OVERLAY COMPONENT ────────────────────────────────────────────────

function LockedFeature({ requiredTier, feature }: { requiredTier: string; feature: string }) {
  return (
    <div style={{
      background: 'rgba(10,15,29,0.95)',
      border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: '20px',
      padding: '3rem 2rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.25rem',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(212,175,55,0.06)',
        border: '2px solid rgba(212,175,55,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="fas fa-lock" style={{ color: '#D4AF37', fontSize: '1.75rem' }} />
      </div>
      <div>
        <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          FEATURE LOCKED
        </div>
        <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.75rem' }}>{feature}</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', maxWidth: '380px', lineHeight: 1.6 }}>
          This feature is available on the <strong style={{ color: '#D4AF37' }}>{requiredTier}</strong> tier and above.
          Upgrade your plan to unlock access.
        </p>
      </div>
      <Link href="/vendor/upgrade" style={{
        padding: '0.85rem 2rem',
        background: '#D4AF37',
        color: '#1a1a2e',
        borderRadius: '50px',
        fontWeight: 900,
        fontSize: '0.8rem',
        letterSpacing: '1px',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <i className="fas fa-arrow-up" /> UPGRADE NOW
      </Link>
    </div>
  );
}

// ─── TIER BADGE ──────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const info = TIER_LABELS[tier] || TIER_LABELS.free;
  return (
    <span style={{
      background: `${info.color}22`,
      color: info.color,
      border: `1px solid ${info.color}44`,
      borderRadius: '20px',
      padding: '0.2rem 0.75rem',
      fontSize: '0.65rem',
      fontWeight: 900,
      letterSpacing: '1px',
      textTransform: 'uppercase',
    }}>
      {info.label}
    </span>
  );
}

// ─── FEATURE GATE INLINE BADGE ───────────────────────────────────────────────

function FeatureGate({ allowed, label, icon }: { allowed: boolean; label: string; icon: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 0.85rem',
      borderRadius: '10px',
      background: allowed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
      border: `1px solid ${allowed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
      fontSize: '0.75rem',
      fontWeight: 700,
      color: allowed ? '#10b981' : 'rgba(255,255,255,0.3)',
    }}>
      <i className={`fas ${allowed ? icon : 'fa-lock'}`} style={{ fontSize: '0.7rem' }} />
      {label}
    </div>
  );
}

// ─── VIBE COLORS ─────────────────────────────────────────────────────────────

const VIBE_COLORS: Record<string, string> = {
  spiritual: '#8b5cf6',
  adventure: '#10b981',
  culture:   '#f59e0b',
  culinary:  '#ef4444',
};
const VIBE_ICONS: Record<string, string> = {
  spiritual: 'fa-heart',
  adventure: 'fa-compass',
  culture:   'fa-book-open',
  culinary:  'fa-utensils',
};

// ─── SUBMIT OFFER MODAL ──────────────────────────────────────────────────────

function SubmitOfferModal({
  journey, caps, onClose, onSubmitted,
}: {
  journey: Journey;
  caps: TierFeatures;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [validityDays, setValidityDays] = useState('7');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const I = { color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', width: '100%', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const };
  const L = { color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '0.4rem', display: 'block' };

  async function handleSubmit() {
    if (!offerTitle || !price) { setError('Title and Price are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/journeys/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journey.id,
          business_id: 'current', // server resolves from session
          offer_title: offerTitle,
          offer_description: offerDesc,
          price: parseFloat(price),
          currency,
          inclusions: inclusions.split('\n').filter(Boolean),
          exclusions: exclusions.split('\n').filter(Boolean),
          validity_days: parseInt(validityDays) || 7,
          contact_phone: caps.journey_contact_phone ? contactPhone : '',
          contact_email: caps.journey_contact_email ? contactEmail : '',
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) { onSubmitted(); onClose(); }
      else setError(data.error || 'Submission failed.');
    } catch { setError('Network error.'); }
    setSubmitting(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>SUBMIT YOUR OFFER</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Journey #{journey.id} — {journey.itinerary_name || journey.vibe}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.25rem' }}><i className="fas fa-times" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={L}>Offer Title *</label>
            <input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder={`e.g. "Proposal for your ${journey.request_type} request"`} style={I} />
          </div>
          <div>
            <label style={L}>Offer Description</label>
            <textarea value={offerDesc} onChange={e => setOfferDesc(e.target.value)} placeholder="Describe what you offer for this journey..." style={{ ...I, minHeight: '80px', resize: 'vertical' as const }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={L}>Total Price *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={I} />
            </div>
            <div>
              <label style={L}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={I}>
                <option>USD</option><option>EUR</option><option>EGP</option>
              </select>
            </div>
          </div>
          <div>
            <label style={L}>What's Included (one per line)</label>
            <textarea value={inclusions} onChange={e => setInclusions(e.target.value)} placeholder={"Accommodation (4 nights)\nDesert Safari (2 days)\nAll Meals\nAirport Transfer"} style={{ ...I, minHeight: '80px', resize: 'vertical' as const }} />
          </div>
          <div>
            <label style={L}>What's NOT Included (one per line)</label>
            <textarea value={exclusions} onChange={e => setExclusions(e.target.value)} placeholder={"International Flights\nPersonal Expenses"} style={{ ...I, minHeight: '60px', resize: 'vertical' as const }} />
          </div>
          <div>
            <label style={L}>Offer Valid For (days)</label>
            <input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} placeholder="7" style={I} />
          </div>

          {/* ── TIER-GATED CONTACT FIELDS ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>
              CONTACT INFORMATION <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontWeight: 600 }}>(shown to customer based on your tier)</span>
            </div>

            {/* Email — Premium+ */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...L, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Contact Email
                {!caps.journey_contact_email && (
                  <span style={{ background: '#8b5cf644', color: '#8b5cf6', border: '1px solid #8b5cf633', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.6rem', fontWeight: 900 }}>
                    PREMIUM+
                  </span>
                )}
              </label>
              {caps.journey_contact_email ? (
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="your@business.com" style={I} />
              ) : (
                <div style={{ ...I, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}>
                  <i className="fas fa-lock" style={{ fontSize: '0.75rem' }} /> Upgrade to Premium to include email contact
                </div>
              )}
            </div>

            {/* Phone — Gold+ */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...L, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Phone Number
                {!caps.journey_contact_phone && (
                  <span style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3733', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.6rem', fontWeight: 900 }}>
                    GOLD+
                  </span>
                )}
              </label>
              {caps.journey_contact_phone ? (
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" style={I} />
              ) : (
                <div style={{ ...I, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}>
                  <i className="fas fa-lock" style={{ fontSize: '0.75rem' }} /> Upgrade to Gold to include phone & WhatsApp
                </div>
              )}
            </div>

            {/* WhatsApp note */}
            {caps.journey_contact_whatsapp && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '0.4rem' }} />
                Your phone number will also appear as a WhatsApp link for the customer.
              </div>
            )}
          </div>

          <div>
            <label style={L}>Additional Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional information for the customer..." style={{ ...I, minHeight: '60px', resize: 'vertical' as const }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '50px', padding: '0.75rem 1.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
              CANCEL
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{
              background: submitting ? 'rgba(212,175,55,0.5)' : '#D4AF37',
              color: '#1a1a2e', border: 'none', borderRadius: '50px',
              padding: '0.75rem 2rem', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 900, fontSize: '0.8rem', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {submitting ? <><i className="fas fa-spinner fa-spin" /> SUBMITTING…</> : <><i className="fas fa-paper-plane" /> SUBMIT OFFER</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JOURNEY CARD ─────────────────────────────────────────────────────────────

function JourneyCard({
  journey, caps, onOfferClick, blurred,
}: {
  journey: Journey;
  caps: TierFeatures;
  onOfferClick: (j: Journey) => void;
  blurred: boolean;
}) {
  const typeColor = TYPE_COLORS[journey.request_type] || '#D4AF37';
  const typeIcon = TYPE_ICONS[journey.request_type] || 'fa-star';
  const daysAgo = Math.floor((Date.now() - new Date(journey.created_at).getTime()) / 86400000);
  const details = typeof journey.custom_details === 'string' ? JSON.parse(journey.custom_details || '{}') : (journey.custom_details || {});

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderLeft: `3px solid ${typeColor}`,
      borderRadius: '20px',
      padding: '1.75rem',
      position: 'relative',
      transition: 'border-color 0.3s',
      filter: blurred ? 'blur(6px)' : 'none',
      pointerEvents: blurred ? 'none' : 'auto',
      userSelect: blurred ? 'none' : 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${typeColor}15`, border: `1px solid ${typeColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`fas ${typeIcon}`} style={{ color: typeColor, fontSize: '1rem' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem', textTransform: 'capitalize' }}>
              {journey.request_type.replace('_', ' ')} Request
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
              Request #{journey.id} · {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(journey.offer_count || 0) > 0 && (
            <span style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.65rem', fontWeight: 900 }}>
              {journey.offer_count} OFFER{(journey.offer_count || 0) > 1 ? 'S' : ''}
            </span>
          )}
          <span style={{
            background: journey.status === 'open' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${journey.status === 'open' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: journey.status === 'open' ? '#10b981' : 'rgba(255,255,255,0.4)',
            borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
          }}>
            {journey.status}
          </span>
        </div>
      </div>

      {/* Journey Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          ...(details.selected_preference_name ? [{ icon: 'fa-heart', label: 'Preference', value: details.selected_preference_name, color: typeColor }] : []),
          ...(journey.duration ? [{ icon: 'fa-calendar', label: 'Duration', value: `${journey.duration} Days` }] : []),
          ...(journey.group_size ? [{ icon: 'fa-users', label: 'Group', value: `${journey.group_size} person${journey.group_size > 1 ? 's' : ''}` }] : []),
          ...(journey.budget ? [{ icon: 'fa-wallet', label: 'Budget', value: journey.budget }] : []),
          ...(journey.arrival_date ? [{ icon: 'fa-plane-arrival', label: 'Arrival', value: new Date(journey.arrival_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }] : []),
        ].map(item => (
          <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              <i className={`fas ${item.icon}`} style={{ color: (item as any).color || '#D4AF37', marginRight: '0.3rem' }} />{item.label}
            </div>
            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {journey.itinerary_summary && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 1.25rem', borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '0.75rem' }}>
          {journey.itinerary_summary.length > 150 ? journey.itinerary_summary.slice(0, 150) + '…' : journey.itinerary_summary}
        </p>
      )}

      {/* Special Requests */}
      {journey.special_requests && (
        <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#C2A478', lineHeight: 1.5 }}>
          <i className="fas fa-comment-dots" style={{ marginRight: '0.4rem' }} />
          <strong>Special Requests:</strong> {journey.special_requests}
        </div>
      )}

      {/* CTA Row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Email Contact — Premium+ */}
        {caps.journey_contact_email ? (
          journey.customer_email ? (
            <a href={`mailto:${journey.customer_email}?subject=Offer for your Siwa Journey #${journey.id} — ${journey.itinerary_name}`} style={{
              padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <i className="fas fa-envelope" /> Email Customer
            </a>
          ) : (
            <div title="Customer contact info is hidden by the Admin. Please submit an offer instead." style={{
              padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'not-allowed',
            }}>
              <i className="fas fa-eye-slash" /> Email Hidden
            </div>
          )
        ) : (
          <div title="Upgrade to Premium to contact via email" style={{
            padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'not-allowed',
          }}>
            <i className="fas fa-lock" /> Email <span style={{ fontSize: '0.6rem', color: '#8b5cf6' }}>PREMIUM</span>
          </div>
        )}

        {/* WhatsApp — Gold+ */}
        {caps.journey_contact_whatsapp ? (
          <a href={`https://wa.me/?text=Hi! I'd like to offer you a package for your Siwa Journey #${journey.id}`} target="_blank" rel="noreferrer" style={{
            padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <i className="fab fa-whatsapp" /> WhatsApp
          </a>
        ) : (
          <div title="Upgrade to Gold to contact via WhatsApp" style={{
            padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'not-allowed',
          }}>
            <i className="fas fa-lock" /> WhatsApp <span style={{ fontSize: '0.6rem', color: '#D4AF37' }}>GOLD</span>
          </div>
        )}

        {/* Submit Offer — Premium+ */}
        {caps.journey_submit_offer ? (
          <button onClick={() => onOfferClick(journey)} style={{
            padding: '0.6rem 1.5rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.5px',
            background: '#D4AF37', color: '#1a1a2e', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <i className="fas fa-file-invoice" /> Submit Offer
          </button>
        ) : (
          <div title="Upgrade to Premium to submit offers" style={{
            padding: '0.6rem 1.5rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.5px',
            background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.3)', border: '1px solid rgba(212,175,55,0.15)',
            display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'not-allowed',
          }}>
            <i className="fas fa-lock" /> Submit Offer <span style={{ fontSize: '0.6rem' }}>PREMIUM</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function VendorJourneyRequests() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('free');
  const [caps, setCaps] = useState<TierFeatures>(DEFAULT_TIER_CAPS.free);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [filterVibe, setFilterVibe] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load vendor tier info
      const storyRes = await fetch('/api/vendor/story');
      if (storyRes.ok) {
        const storyData = await storyRes.json();
        const vendorTier = storyData.business?.subscription_tier || 'free';
        setTier(vendorTier);

        // Merge DB tier features with defaults
        const dbFeatures: TierFeatures = storyData.tierFeatures || {};
        const defaultCaps = DEFAULT_TIER_CAPS[vendorTier] || DEFAULT_TIER_CAPS.free;
        // DB features take priority if set, else use tier defaults
        const merged: TierFeatures = { ...defaultCaps };
        const journeyKeys = ['journey_marketplace_access', 'journey_view_requests', 'journey_contact_email', 'journey_contact_phone', 'journey_contact_whatsapp', 'journey_submit_offer'];
        journeyKeys.forEach(k => {
          if (k in dbFeatures) merged[k] = dbFeatures[k];
        });
        setCaps(merged);

        // Load journeys only if allowed
        if (merged.journey_view_requests) {
          // Use business_type to filter generic queries if applicable
          const bizType = storyData.business?.type_id || '';
          const journeysRes = await fetch(`/api/journeys?status=open&limit=50&business_category=${bizType}&vendor_id=${storyData.business?.vendor_id || ''}`);
          if (journeysRes.ok) {
            const data = await journeysRes.json();
            setJourneys(data.journeys || []);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load marketplace requests:', e);
    }
    setLoading(false);
  }

  const filtered = filterVibe === 'all' ? journeys : journeys.filter(j => j.request_type === filterVibe);
  const tierInfo = TIER_LABELS[tier] || TIER_LABELS.free;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ color: '#D4AF37', fontSize: '2rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '2px' }}>LOADING JOURNEY REQUESTS…</div>
      </div>
    );
  }

  return (
    <div style={{ color: '#fff' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            MARKETPLACE
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>Customer Requests</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Real customers looking for services matching your business — waiting for your best offer.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <TierBadge tier={tier} />
          {!caps.journey_submit_offer && (
            <Link href="/vendor/upgrade" style={{
              padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900,
              background: '#D4AF37', color: '#1a1a2e', textDecoration: 'none', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <i className="fas fa-arrow-up" /> Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* ── SUCCESS MESSAGE ── */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="fas fa-check-circle" style={{ fontSize: '1.1rem' }} />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><i className="fas fa-times" /></button>
        </div>
      )}

      {/* ── TIER CAPABILITY MATRIX ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
          YOUR ACCESS LEVEL — <span style={{ color: tierInfo.color }}>{tierInfo.label.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <FeatureGate allowed={!!caps.journey_marketplace_access} label="View Marketplace" icon="fa-eye" />
          <FeatureGate allowed={!!caps.journey_view_requests}     label="See Requests"    icon="fa-list" />
          <FeatureGate allowed={!!caps.journey_submit_offer}      label="Submit Offer"    icon="fa-file-invoice" />
          <FeatureGate allowed={!!caps.journey_contact_email}     label="Email Contact"   icon="fa-envelope" />
          <FeatureGate allowed={!!caps.journey_contact_phone}     label="Phone Contact"   icon="fa-phone" />
          <FeatureGate allowed={!!caps.journey_contact_whatsapp}  label="WhatsApp"        icon="fab fa-whatsapp" />
        </div>
        {!caps.journey_submit_offer && (
          <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
            <i className="fas fa-info-circle" style={{ color: '#D4AF37', marginRight: '0.4rem' }} />
            Upgrade to <strong style={{ color: '#8b5cf6' }}>Premium</strong> to submit offers & email customers.
            Upgrade to <strong style={{ color: '#D4AF37' }}>Gold VIP</strong> to add phone & WhatsApp contact.
          </div>
        )}
      </div>

      {/* ── FREE TIER — FULLY LOCKED ── */}
      {!caps.journey_marketplace_access && (
        <LockedFeature
          requiredTier="Basic"
          feature="Journey Marketplace"
        />
      )}

      {/* ── BASIC+ — CAN VIEW ── */}
      {caps.journey_marketplace_access && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 700 }}>FILTER:</span>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFilterVibe(c.id)} style={{
                padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                background: filterVibe === c.id ? (c.id === 'all' ? '#D4AF37' : `${TYPE_COLORS[c.id]}22`) : 'rgba(255,255,255,0.04)',
                color: filterVibe === c.id ? (c.id === 'all' ? '#1a1a2e' : TYPE_COLORS[c.id]) : 'rgba(255,255,255,0.45)',
                border: filterVibe === c.id ? `1px solid ${c.id === 'all' ? '#D4AF37' : TYPE_COLORS[c.id]}` : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
              }}>
                {c.id === 'all' ? c.label : <><i className={`fas ${TYPE_ICONS[c.id]}`} style={{ marginRight: '0.4rem' }} />{c.label}</>}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              {filtered.length} request{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Journey Cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }} />
              <div style={{ fontWeight: 700 }}>No open journey requests at the moment</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>New requests from customers will appear here in real time.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
              {filtered.map((j, idx) => (
                <div key={j.id} style={{ position: 'relative' }}>
                  <JourneyCard
                    journey={j}
                    caps={caps}
                    onOfferClick={setSelectedJourney}
                    blurred={false}
                  />
                  {/* Basic tier — show first 2 full, blur the rest */}
                  {tier === 'basic' && idx >= 2 && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(10,15,29,0.8)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10,
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <i className="fas fa-lock" style={{ color: '#D4AF37', fontSize: '1.5rem', marginBottom: '0.75rem', display: 'block' }} />
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          +{filtered.length - 2} more requests
                        </div>
                        <Link href="/vendor/upgrade" style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                          Upgrade to see all →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )).slice(0, tier === 'basic' ? Math.min(filtered.length, 3) : filtered.length)}
            </div>
          )}

          {/* Basic tier — upgrade banner after 2 visible */}
          {tier === 'basic' && filtered.length > 2 && (
            <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(212,175,55,0.05))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ color: '#a78bfa', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {filtered.length - 2} MORE REQUESTS HIDDEN
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Upgrade to <strong style={{ color: '#8b5cf6' }}>Premium</strong> to unlock all journey requests, submit offers, and email customers.
              </p>
              <Link href="/vendor/upgrade" style={{ background: '#8b5cf6', color: '#fff', borderRadius: '50px', padding: '0.75rem 2rem', fontSize: '0.8rem', fontWeight: 900, textDecoration: 'none', display: 'inline-block' }}>
                Unlock Full Access →
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── OFFER SUBMISSION MODAL ── */}
      {selectedJourney && (
        <SubmitOfferModal
          journey={selectedJourney}
          caps={caps}
          onClose={() => setSelectedJourney(null)}
          onSubmitted={() => {
            setSuccessMsg(`✅ Your offer for Journey #${selectedJourney.id} was submitted! The customer will be notified.`);
            loadData();
          }}
        />
      )}
    </div>
  );
}
