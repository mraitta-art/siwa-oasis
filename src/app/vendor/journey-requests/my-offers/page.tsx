'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MyOffer {
  id: number;
  journey_id: number;
  offer_title: string;
  offer_description: string;
  price: number;
  currency: string;
  inclusions: any;
  exclusions: any;
  validity_days: number;
  contact_email: string;
  contact_phone: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Journey fields
  vibe: string;
  duration: string;
  group_size: number;
  budget: string;
  itinerary_name: string;
  customer_name?: string;   // only shown if offer accepted
  customer_email?: string;  // only shown if offer accepted
  arrival_date?: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string; icon: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)',  label: 'Pending Review', icon: 'fa-clock' },
  accepted: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Accepted! 🎉',    icon: 'fa-check-circle' },
  rejected: { bg: 'rgba(239,68,68,0.08)',  color: '#ef4444', border: 'rgba(239,68,68,0.2)',   label: 'Not Selected',   icon: 'fa-times-circle' },
};

const VIBE_COLORS: Record<string, string> = {
  spiritual: '#8b5cf6', adventure: '#10b981', culture: '#f59e0b', culinary: '#ef4444',
};

export default function MyOffersPage() {
  const [offers, setOffers] = useState<MyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    setLoading(true);
    try {
      const res = await fetch('/api/journeys/offers?vendor_id=current');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (e) {
      console.error('Failed to load offers:', e);
    }
    setLoading(false);
  }

  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);

  const stats = {
    total:    offers.length,
    pending:  offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <i className="fas fa-spinner fa-spin" style={{ color: '#D4AF37', fontSize: '2rem' }} />
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '2px' }}>LOADING YOUR OFFERS…</div>
    </div>
  );

  return (
    <div style={{ color: '#fff' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ color: '#D4AF37', fontWeight: 900, letterSpacing: '3px', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            JOURNEY MARKETPLACE
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>My Submitted Offers</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Track the status of every offer you've sent to customers.
          </p>
        </div>
        <Link href="/vendor/journey-requests" style={{
          padding: '0.65rem 1.5rem', background: '#D4AF37', color: '#1a1a2e',
          borderRadius: '50px', fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.5px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <i className="fas fa-plus" /> New Offer
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Submitted', value: stats.total,    color: '#D4AF37', icon: 'fa-file-invoice' },
          { label: 'Pending Review',  value: stats.pending,  color: '#f59e0b', icon: 'fa-clock' },
          { label: 'Accepted',        value: stats.accepted, color: '#10b981', icon: 'fa-check-circle' },
          { label: 'Not Selected',    value: stats.rejected, color: '#ef4444', icon: 'fa-times-circle' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '1.25rem', textAlign: 'center',
          }}>
            <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1.25rem', marginBottom: '0.5rem', display: 'block' }} />
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => {
          const active = filter === f;
          const statusInfo = f !== 'all' ? STATUS_STYLE[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 1.1rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
              background: active ? (statusInfo?.bg || 'rgba(212,175,55,0.12)') : 'rgba(255,255,255,0.04)',
              color: active ? (statusInfo?.color || '#D4AF37') : 'rgba(255,255,255,0.4)',
              border: active ? `1px solid ${statusInfo?.border || 'rgba(212,175,55,0.3)'}` : '1px solid rgba(255,255,255,0.08)',
            }}>
              {f === 'all' ? `All (${stats.total})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${stats[f]})`}
            </button>
          );
        })}
      </div>

      {/* Offers list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <i className="fas fa-file-invoice" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block', opacity: 0.4 }} />
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            {filter === 'all' ? 'No offers submitted yet' : `No ${filter} offers`}
          </div>
          <div style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            {filter === 'all' ? 'Browse journey requests and submit your first offer.' : `No offers with "${filter}" status.`}
          </div>
          {filter === 'all' && (
            <Link href="/vendor/journey-requests" style={{
              background: '#D4AF37', color: '#1a1a2e', borderRadius: '50px',
              padding: '0.75rem 2rem', fontWeight: 900, fontSize: '0.8rem', textDecoration: 'none',
            }}>
              Browse Journey Requests →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(offer => {
            const st = STATUS_STYLE[offer.status];
            const vibeColor = VIBE_COLORS[offer.vibe] || '#D4AF37';
            const inclusions = Array.isArray(offer.inclusions)
              ? offer.inclusions
              : (typeof offer.inclusions === 'string' ? JSON.parse(offer.inclusions || '[]') : []);
            const daysAgo = Math.floor((Date.now() - new Date(offer.created_at).getTime()) / 86400000);

            return (
              <div key={offer.id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.06)`,
                borderLeft: `3px solid ${st.color}`,
                borderRadius: '20px',
                padding: '1.75rem',
              }}>
                {/* Offer header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', margin: '0 0 0.3rem' }}>{offer.offer_title}</h3>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>
                      <span style={{ color: vibeColor, fontWeight: 700, textTransform: 'capitalize' }}>{offer.vibe}</span>
                      {' · '}{offer.duration} days · {offer.group_size} person{offer.group_size > 1 ? 's' : ''}
                      {' · '}Offer #{offer.id} for Journey #{offer.journey_id}
                      {' · '}{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      borderRadius: '20px', padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontWeight: 900,
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <i className={`fas ${st.icon}`} /> {st.label}
                    </div>
                    <div style={{ color: '#D4AF37', fontSize: '1.25rem', fontWeight: 900 }}>
                      {offer.currency} {Number(offer.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Offer body */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {/* Description */}
                  {offer.offer_description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Description</div>
                      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{offer.offer_description}</p>
                    </div>
                  )}

                  {/* Inclusions */}
                  {inclusions.length > 0 && (
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Includes</div>
                      <ul style={{ margin: 0, paddingLeft: '1rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {inclusions.slice(0, 4).map((inc: string, i: number) => (
                          <li key={i}>{inc}</li>
                        ))}
                        {inclusions.length > 4 && <li style={{ color: 'rgba(255,255,255,0.3)' }}>+{inclusions.length - 4} more…</li>}
                      </ul>
                    </div>
                  )}

                  {/* Validity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Valid For</div>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{offer.validity_days} days</div>
                    </div>
                    {offer.contact_email && (
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Email</div>
                        <div style={{ color: '#a78bfa', fontSize: '0.82rem' }}>{offer.contact_email}</div>
                      </div>
                    )}
                    {offer.contact_phone && (
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Phone</div>
                        <div style={{ color: '#fff', fontSize: '0.82rem' }}>{offer.contact_phone}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accepted — show customer contact info */}
                {offer.status === 'accepted' && offer.customer_email && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#10b981', fontWeight: 900, fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                      <i className="fas fa-star" style={{ marginRight: '0.4rem' }} /> CUSTOMER ACCEPTED YOUR OFFER — CONTACT DETAILS
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Name</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{offer.customer_name}</div>
                      </div>
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Email</div>
                        <a href={`mailto:${offer.customer_email}`} style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>{offer.customer_email}</a>
                      </div>
                      {offer.arrival_date && (
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Arrival</div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{new Date(offer.arrival_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer links */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                  <Link href={`/vendor/journey-requests`} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <i className="fas fa-arrow-left" style={{ fontSize: '0.65rem' }} /> Back to Requests
                  </Link>
                  {offer.status === 'accepted' && offer.customer_email && (
                    <a href={`mailto:${offer.customer_email}?subject=Re: Your Siwa Journey — Let's Plan!`} style={{
                      marginLeft: 'auto', padding: '0.5rem 1.25rem', background: '#10b981', color: '#fff',
                      borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <i className="fas fa-envelope" /> Email Customer Now
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
