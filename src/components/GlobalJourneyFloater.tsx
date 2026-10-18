'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface JourneyDraftItem {
  id: string;
  name: string;
  category: 'stay' | 'tour' | 'transport' | 'dining' | 'activity' | 'wish';
  price: number;
}

export default function GlobalJourneyFloater() {
  const pathname = usePathname();
  const [draft, setDraft] = useState<{
    itemsCount: number;
    sectorsCount: number;
    totalEstimated: number;
    hasAccommodation: boolean;
    hasTour: boolean;
    hasTransport: boolean;
    hasDining: boolean;
  }>({
    itemsCount: 0,
    sectorsCount: 0,
    totalEstimated: 0,
    hasAccommodation: false,
    hasTour: false,
    hasTransport: false,
    hasDining: false,
  });

  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync draft from localStorage
  const syncDraft = () => {
    try {
      const saved = localStorage.getItem('siwify_journey_draft');
      if (!saved) {
        setDraft({
          itemsCount: 0,
          sectorsCount: 0,
          totalEstimated: 0,
          hasAccommodation: false,
          hasTour: false,
          hasTransport: false,
          hasDining: false,
        });
        return;
      }
      const data = JSON.parse(saved);
      const stayPeriods: any[] = Array.isArray(data.stayPeriods) ? data.stayPeriods : [];
      const tourBookings: any[] = Array.isArray(data.tourBookings) ? data.tourBookings : [];
      const transportLegs: any[] = Array.isArray(data.transportLegs) ? data.transportLegs : [];
      const diningBookings: any[] = Array.isArray(data.diningBookings) ? data.diningBookings : [];
      const customWishes: any[] = Array.isArray(data.customWishes) ? data.customWishes : [];

      const itemsCount = stayPeriods.length + tourBookings.length + transportLegs.length + diningBookings.length + customWishes.length;

      let sectorsCount = 0;
      if (stayPeriods.length > 0) sectorsCount++;
      if (tourBookings.length > 0) sectorsCount++;
      if (transportLegs.length > 0) sectorsCount++;
      if (diningBookings.length > 0) sectorsCount++;
      if (customWishes.length > 0) sectorsCount++;

      let total = 0;
      stayPeriods.forEach(s => { total += (s.total_price || 0); });
      tourBookings.forEach(t => { total += (t.total_price || 0); });
      transportLegs.forEach(l => { total += (l.total_price || 0); });
      diningBookings.forEach(d => { total += (d.total_price || 0); });

      // Apply combo discount if 3+ sectors
      if (sectorsCount >= 3) {
        total = Math.round(total * 0.85);
      }

      setDraft({
        itemsCount,
        sectorsCount,
        totalEstimated: total,
        hasAccommodation: stayPeriods.length > 0,
        hasTour: tourBookings.length > 0,
        hasTransport: transportLegs.length > 0,
        hasDining: diningBookings.length > 0,
      });
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    syncDraft();

    // Listen to local changes via storage event and custom events
    const handleStorageChange = () => syncDraft();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('siwify_draft_updated', handleStorageChange);

    const interval = setInterval(syncDraft, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siwify_draft_updated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Don't render on admin dashboard
  if (pathname?.startsWith('/jana') || isDismissed) {
    return null;
  }

  const isCombo = draft.sectorsCount >= 3;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gjf-pill-text-sub { display: inline; }
        @media (max-width: 400px) {
          .gjf-pill-text-sub { display: none; }
        }
      `}</style>
      {/* Floating Bottom Right Journey Capsule */}
      <aside
        aria-label="Your Siwa Custom Journey Itinerary"
        style={{
          position: 'fixed',
          bottom: 'clamp(0.85rem, 3vw, 1.5rem)',
          right: 'clamp(0.75rem, 3vw, 1.5rem)',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.6rem',
          fontFamily: 'inherit',
          maxWidth: 'calc(100vw - 1.5rem)',
        }}
      >
        {/* Expanded Quick Drawer */}
        {isExpanded && (
          <div
            style={{
              background: '#0d150f',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '20px',
              padding: '1.25rem',
              width: '320px',
              maxWidth: '90vw',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.1)',
              animation: 'fadeInUp 0.25s ease forwards',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🏜️</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Your Custom Journey</strong>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 0.85rem' }}>
              {draft.itemsCount > 0
                ? `You have ${draft.itemsCount} service(s) across ${draft.sectorsCount} sector(s) reserved in your journey draft.`
                : 'Build a seamless vacation: Reserve stays, 4x4 safaris, and transfers as you browse with one single itinerary dispatch.'}
            </p>

            {/* Checklist of sectors */}
            <div style={{ background: '#070b08', padding: '0.65rem 0.85rem', borderRadius: '12px', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: draft.hasAccommodation ? '#34d399' : '#64748b' }}>
                <span>🏨 Accommodations & Stays</span>
                <span>{draft.hasAccommodation ? '✓ Active' : '+ Add'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: draft.hasTour ? '#34d399' : '#64748b' }}>
                <span>🚙 4x4 Desert Safaris & Tours</span>
                <span>{draft.hasTour ? '✓ Active' : '+ Add'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: draft.hasTransport ? '#34d399' : '#64748b' }}>
                <span>🚐 Transfers (Cairo/Alex/Local)</span>
                <span>{draft.hasTransport ? '✓ Active' : '+ Add'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: draft.hasDining ? '#34d399' : '#64748b' }}>
                <span>🍽️ Bedouin Feasts & Dining</span>
                <span>{draft.hasDining ? '✓ Active' : '+ Add'}</span>
              </div>
            </div>

            {/* Combo Deal Notification */}
            <div style={{
              background: isCombo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.12)',
              border: `1px solid ${isCombo ? '#10b981' : '#D4AF37'}`,
              borderRadius: '10px',
              padding: '0.5rem 0.75rem',
              marginBottom: '1rem',
              fontSize: '0.72rem',
              color: isCombo ? '#6ee7b7' : '#fde68a',
            }}>
              {isCombo ? (
                <span>🎉 <strong>15% Bundle Discount Activated!</strong></span>
              ) : (
                <span>🔥 <strong>Bundle 3+ Sectors:</strong> Unlock 15% off your entire itinerary ({draft.sectorsCount}/3 active).</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href="/siwa-stay#smart-journey-planner"
                onClick={() => setIsExpanded(false)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #b48a28 100%)',
                  color: '#070b08',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                }}
              >
                Open Stay Planner &rarr;
              </Link>
              <Link
                href="/customize-journey"
                onClick={() => setIsExpanded(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Full Builder ↗
              </Link>
            </div>
          </div>
        )}

        {/* The Main Pill Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(7, 11, 8, 0.94)',
            backdropFilter: 'blur(16px)',
            border: isCombo ? '1.5px solid #10b981' : '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '50px',
            padding: '0.45rem 0.65rem 0.45rem 0.85rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(212, 175, 55, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Pulsing indicator icon */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: isCombo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isCombo ? '#10b981' : '#D4AF37', fontSize: '0.85rem',
          }}>
            <i className={`fas ${draft.itemsCount > 0 ? 'fa-suitcase-rolling' : 'fa-compass'}`} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.25rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              {draft.itemsCount > 0 ? `${draft.itemsCount} Reserved in Journey` : 'Planning a Full Journey?'}
            </span>
            <span style={{ fontSize: '0.65rem', color: isCombo ? '#34d399' : '#D4AF37', fontWeight: 700 }} className="gjf-pill-text-sub">
              {draft.itemsCount > 0
                ? (isCombo ? '15% Off Active • Tap to Review' : `${draft.sectorsCount}/3 Sectors • Add More for 15% Off`)
                : 'Combine All Services →'}
            </span>
          </div>

          {/* Expand/Collapse Chevron */}
          <div
            style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: '0.7rem',
            }}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'}`} />
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            title="Hide for this session"
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: '0.75rem', cursor: 'pointer', padding: '0 0.2rem',
            }}
          >
            ✕
          </button>
        </div>
      </aside>
    </>
  );
}
