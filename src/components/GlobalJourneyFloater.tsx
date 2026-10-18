'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const hasMovedRef = useRef(false);

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

  // Dragging event handlers (touch + mouse)
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragStartRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartRef.current.startX;
    const dy = t.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    setOffset({
      x: dragStartRef.current.startOffsetX + dx,
      y: dragStartRef.current.startOffsetY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
    hasMovedRef.current = false;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }
      setOffset({
        x: dragStartRef.current.startOffsetX + dx,
        y: dragStartRef.current.startOffsetY + dy,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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

      {/* Floating Bottom Right Draggable Journey Capsule */}
      <aside
        aria-label="Your Siwa Custom Journey Itinerary"
        style={{
          position: 'fixed',
          bottom: 'clamp(0.85rem, 3vw, 1.5rem)',
          right: 'clamp(0.75rem, 3vw, 1.5rem)',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.6rem',
          fontFamily: 'inherit',
          maxWidth: 'calc(100vw - 1.5rem)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Expanded Quick Drawer */}
        {isExpanded && !isMinimized && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize to floating bubble"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  <i className="fas fa-compress-alt" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  ✕
                </button>
              </div>
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

        {/* ── DRAGGABLE MINIMIZED BUBBLE OR PILL ── */}
        {isMinimized ? (
          /* Ultra-compact 48px circular bubble */
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onClick={() => {
              if (!hasMovedRef.current) {
                setIsMinimized(false);
                setIsExpanded(true);
              }
            }}
            title="Drag anywhere to move • Tap to expand itinerary"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(13, 21, 15, 0.95)',
              backdropFilter: 'blur(16px)',
              border: isCombo ? '2px solid #10b981' : '2px solid #D4AF37',
              boxShadow: '0 10px 25px rgba(0,0,0,0.85), 0 0 15px rgba(212,175,55,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              position: 'relative',
              transition: isDragging ? 'none' : 'transform 0.15s ease',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🏜️</span>
            {draft.itemsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: isCombo ? '#10b981' : '#D4AF37',
                  color: '#000',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {draft.itemsCount}
              </span>
            )}
          </div>
        ) : (
          /* The Main Pill Capsule (Draggable & Collapsible) */
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(7, 11, 8, 0.95)',
              backdropFilter: 'blur(16px)',
              border: isCombo ? '1.5px solid #10b981' : '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '50px',
              padding: '0.45rem 0.65rem 0.45rem 0.85rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(212, 175, 55, 0.15)',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
            }}
            onClick={() => {
              if (!hasMovedRef.current) {
                setIsExpanded(!isExpanded);
              }
            }}
          >
            {/* Drag Handle indicator icon */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isCombo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCombo ? '#10b981' : '#D4AF37',
                fontSize: '0.85rem',
              }}
            >
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
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '0.7rem',
              }}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'}`} />
            </div>

            {/* Minimize to Bubble Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
                setIsExpanded(false);
              }}
              title="Minimize to tiny bubble (no overlap)"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              &ndash;
            </button>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              title="Hide for this session"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '0 0.2rem',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
