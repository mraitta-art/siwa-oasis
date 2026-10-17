'use client';

import React, { useState } from 'react';
import { RetreatProgram, RetreatDayProgram, RetreatTimeSlot } from '@/lib/retreat-types';
import { SIGNATURE_RETREAT_PROGRAMS } from '@/lib/retreat-catalog';
import { DEFAULT_COMMERCIAL_ITEMS } from '@/lib/commercial-catalog';
import { CommercialItem } from '@/lib/commercial-types';
import CommercialBookingEngine from '@/components/CommercialBookingEngine';

export interface RetreatProgramBuilderProps {
  initialProgramId?: string;
  accentColor?: string;
}

export default function RetreatProgramBuilder({
  initialProgramId = 'retreat_silence_3days',
  accentColor = '#D4AF37'
}: RetreatProgramBuilderProps) {
  // Programs
  const [selectedProgram, setSelectedProgram] = useState<RetreatProgram>(
    SIGNATURE_RETREAT_PROGRAMS.find(p => p.id === initialProgramId) || SIGNATURE_RETREAT_PROGRAMS[0]
  );

  // Active Day tab
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);

  // Booking details
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{
    bookingId: string;
    whatsappUrl: string;
  } | null>(null);

  // Swap modal state
  const [swapModalSector, setSwapModalSector] = useState<{
    dayIndex: number;
    sector: 'accommodation' | 'transports' | 'activities' | 'dining';
  } | null>(null);

  const activeDay = selectedProgram.days[activeDayIndex] || selectedProgram.days[0];

  // Calculate dynamic totals
  const totalBasePrice = selectedProgram.days.reduce((acc, d) => acc + (d.day_price || 0), 0) * adultsCount;
  const bundleDiscount = Math.round(totalBasePrice * 0.15); // 15% full package bundle saving
  const finalPrice = totalBasePrice - bundleDiscount;

  // Handle swapping a sector item in a specific day
  const handleSwapItem = (newItem: CommercialItem) => {
    if (!swapModalSector) return;
    const { dayIndex, sector } = swapModalSector;

    const updatedDays = [...selectedProgram.days];
    const targetDay = { ...updatedDays[dayIndex] };

    if (sector === 'accommodation') targetDay.accommodation = newItem;
    if (sector === 'transports') targetDay.transport = newItem;
    if (sector === 'activities') targetDay.activity = newItem;
    if (sector === 'dining') targetDay.dining = newItem;

    // Recalculate day price
    targetDay.day_price = (
      (targetDay.accommodation?.price || 0) +
      (targetDay.transport?.price || 0) +
      (targetDay.activity?.price || 0) +
      (targetDay.dining?.price || 0)
    );

    updatedDays[dayIndex] = targetDay;
    setSelectedProgram({
      ...selectedProgram,
      days: updatedDays
    });

    setSwapModalSector(null);
  };

  // Submit complete retreat reservation
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Please provide your name and phone number to finalize reservation.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        item_id: selectedProgram.id,
        item_title: `${selectedProgram.title_en} (${selectedProgram.duration_days} Days / ${selectedProgram.duration_nights} Nights)`,
        business_id: 'biz_siwify_concierge',
        business_name: 'Siwify Retreat Concierge',
        whatsapp_number: '201001234567',
        sector: 'activities' as const,
        kind: 'package' as const,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_notes: specialNotes,
        start_date: startDate,
        adults_count: adultsCount,
        children_count: 0,
        quantity: 1,
        total_price: finalPrice,
        currency: 'EGP'
      };

      const res = await fetch('/api/commercial/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setBookingSuccessModal({
          bookingId: data.booking_id,
          whatsappUrl: data.whatsapp_url
        });
      } else {
        alert(data.error || 'Failed to place booking.');
      }
    } catch (err: any) {
      alert('Error connecting to booking engine: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Items available for swapping in modal
  const availableSwapItems = swapModalSector
    ? DEFAULT_COMMERCIAL_ITEMS.filter(item => item.sector === swapModalSector.sector)
    : [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem 6rem', fontFamily: 'inherit' }}>
      
      {/* ── 1. PROGRAM SELECTOR TABS ────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(212,175,55,0.12)',
          color: '#854d0e',
          padding: '0.35rem 1rem',
          borderRadius: '30px',
          fontSize: '0.75rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.75rem'
        }}>
          <span>✨</span>
          <span>Orchestrated Experiential Programs</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 0.8rem', letterSpacing: '-0.02em' }}>
          Siwa Vibe Retreats
        </h1>
        <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem', color: '#64748b', lineHeight: 1.6 }}>
          A transformative multi-day journey where each day embodies a unique vibe — seamlessly integrating waterfront eco-lodges, private 4x4 dunes, healing mineral waters, and authentic candlelit banquets.
        </p>

        {/* Signature Program Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginTop: '2rem'
        }}>
          {SIGNATURE_RETREAT_PROGRAMS.map(prog => {
            const isSelected = selectedProgram.id === prog.id;
            return (
              <button
                key={prog.id}
                type="button"
                onClick={() => {
                  setSelectedProgram(prog);
                  setActiveDayIndex(0);
                }}
                style={{
                  padding: '1rem 1.6rem',
                  borderRadius: '16px',
                  border: isSelected ? `2.5px solid ${accentColor}` : '1px solid #e2e8f0',
                  background: isSelected ? '#ffffff' : '#f8fafc',
                  boxShadow: isSelected ? '0 10px 25px rgba(212,175,55,0.18)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(212,175,55,0.15)' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  {prog.duration_days === 3 ? '🛖' : '🌊'}
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: accentColor }}>
                    {prog.duration_days} Days / {prog.duration_nights} Nights • Save {prog.discount_percentage}%
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                    {prog.title_en}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. ACTIVE RETREAT OVERVIEW BANNER ───────────────────────────────── */}
      <div style={{
        background: '#0f172a',
        borderRadius: '28px',
        overflow: 'hidden',
        color: '#ffffff',
        marginBottom: '2.5rem',
        boxShadow: '0 15px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center'
        }}>
          <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                background: accentColor,
                color: '#0f172a',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {selectedProgram.badge_en}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {selectedProgram.duration_days} Days • {selectedProgram.duration_nights} Nights
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
              {selectedProgram.title_en}
            </h2>

            <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
              {selectedProgram.tagline_en}
            </p>

            {/* Inclusions checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
              {selectedProgram.inclusions_en.map((inc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#e2e8f0' }}>
                  <span style={{ color: accentColor, fontWeight: 900 }}>✓</span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '100%', minHeight: '300px', position: 'relative' }}>
            <img
              src={selectedProgram.hero_image}
              alt={selectedProgram.title_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. DAY-BY-DAY VIBE ORCHESTRATION ─────────────────────────────────── */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
              Day-by-Day Program Timeline
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              Select a day below to explore its specific atmosphere, view, accommodation, and curated time slots.
            </p>
          </div>

          {/* Day Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedProgram.days.map((day, idx) => {
              const isDayActive = activeDayIndex === idx;
              return (
                <button
                  key={day.day_number}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '12px',
                    border: isDayActive ? `2px solid ${day.vibe_color}` : '1px solid #e2e8f0',
                    background: isDayActive ? day.vibe_color : '#ffffff',
                    color: isDayActive ? '#ffffff' : '#334155',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Day {day.day_number}: {day.vibe_badge_en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Day Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
        }}>
          {/* Day Vibe Header */}
          <div style={{
            background: `linear-gradient(135deg, ${activeDay.vibe_color}12, transparent)`,
            borderLeft: `5px solid ${activeDay.vibe_color}`,
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: activeDay.vibe_color }}>
                {activeDay.vibe_title_en}
              </span>
              <span style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 800, color: '#334155' }}>
                📍 View: {activeDay.vibe_view}
              </span>
            </div>

            <p style={{ margin: '0.75rem 0 0', fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>
              {activeDay.vibe_quote_en}
            </p>
          </div>

          {/* Grid of the 4 Day Pillars (Accommodation, Transport, Activity, Dining) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            
            {/* 1. ACCOMMODATION FOR THIS DAY */}
            {activeDay.accommodation && (
              <CommercialBookingEngine
                mode="embedded"
                item={activeDay.accommodation}
                slotTimeStart="14:00"
                slotTimeEnd="11:00 (Next Day)"
                accentColor={activeDay.vibe_color}
                onCustomiseClick={() => setSwapModalSector({ dayIndex: activeDayIndex, sector: 'accommodation' })}
              />
            )}

            {/* 2. TRANSPORTATION FOR THIS DAY */}
            {activeDay.transport && (
              <CommercialBookingEngine
                mode="embedded"
                item={activeDay.transport}
                slotTimeStart="Dedicated Full Day"
                accentColor={activeDay.vibe_color}
                onCustomiseClick={() => setSwapModalSector({ dayIndex: activeDayIndex, sector: 'transports' })}
              />
            )}

            {/* 3. ACTIVITY / WELLNESS FOR THIS DAY */}
            {activeDay.activity && (
              <CommercialBookingEngine
                mode="embedded"
                item={activeDay.activity}
                slotTimeStart="16:00"
                slotTimeEnd="18:00"
                accentColor={activeDay.vibe_color}
                onCustomiseClick={() => setSwapModalSector({ dayIndex: activeDayIndex, sector: 'activities' })}
              />
            )}

            {/* 4. DINING FOR THIS DAY */}
            {activeDay.dining && (
              <CommercialBookingEngine
                mode="embedded"
                item={activeDay.dining}
                slotTimeStart="19:30"
                slotTimeEnd="21:30"
                accentColor={activeDay.vibe_color}
                onCustomiseClick={() => setSwapModalSector({ dayIndex: activeDayIndex, sector: 'dining' })}
              />
            )}
          </div>

          {/* Chronological Schedule Accordion */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🕒 Day {activeDay.day_number} Hour-by-Hour Flow
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeDay.timeline.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: '#ffffff',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ minWidth: '100px', fontSize: '0.82rem', fontWeight: 800, color: activeDay.vibe_color }}>
                    {slot.time_start} — {slot.time_end}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{slot.title_en}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>📍 {slot.location_name}</span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                      {slot.description_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. COMPLETE RETREAT CHECKOUT CARD ─────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        border: `2px solid ${accentColor}`,
        borderRadius: '24px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        boxShadow: '0 10px 30px rgba(212,175,55,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.4rem' }}>
              Complete Retreat Package Reservation
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
              Lock in your {selectedProgram.title_en}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              All daily eco-lodges, private 4x4 desert cruisers, wellness floating sessions, and candlelit feasts bundled seamlessly under a single coordinated reservation.
            </p>

            {/* Financial Breakdown */}
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Individual Sectors Subtotal ({adultsCount} Guests):</span>
                <span>EGP {totalBasePrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>
                <span>Retreat Full Package Bundle Discount (-15%):</span>
                <span>- EGP {bundleDiscount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.5rem', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Total Estimated Package:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>EGP {finalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConfirmReservation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  📅 Desired Start Date:
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                  👥 Number of Guests:
                </label>
                <select
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value={1}>1 Solo Retreat</option>
                  <option value={2}>2 Guests (Standard Double)</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests (Family/Group)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                👤 Full Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                📱 Mobile / WhatsApp (with country code):
              </label>
              <input
                type="tel"
                required
                placeholder="+20 100 123 4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                ✍️ Dietary / Wellness Requests (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian, quietest lake chalet"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              style={{
                marginTop: '0.5rem',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: accentColor,
                color: '#0f172a',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {bookingLoading ? 'Securing Itinerary...' : 'Confirm & Dispatch Retreat Reservation →'}
            </button>
          </form>
        </div>
      </div>

      {/* ── 5. SECTOR SWAP MODAL ──────────────────────────────────────────────── */}
      {swapModalSector && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  Swap Day {swapModalSector.dayIndex + 1} {swapModalSector.sector.toUpperCase()}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Choose an alternative option from verified Siwa providers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwapModalSector(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {availableSwapItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img
                      src={item.image}
                      alt={item.title_en}
                      style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                        {item.business_name}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {item.title_en}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {item.currency} {item.price.toLocaleString()} /{item.price_unit}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSwapItem(item)}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Select Option
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. BOOKING CONFIRMATION MODAL ────────────────────────────────────── */}
      {bookingSuccessModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Retreat Reservation Initiated!
            </h3>
            <div style={{
              background: '#f8fafc',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#64748b',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              Reference: {bookingSuccessModal.bookingId}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your curated retreat itinerary across all selected eco-lodges, 4x4 desert safari cruisers, and dining providers has been generated and queued for vendor synchronization.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={bookingSuccessModal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
                }}
              >
                <span>💬 Open Retreat Itinerary on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setBookingSuccessModal(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
