'use client';

import React, { useState } from 'react';
import { CommercialItem, CommercialOption, BookingPayload } from '@/lib/commercial-types';

interface BookingModalProps {
  item: CommercialItem;
  onClose: () => void;
  accentColor?: string;
}

export default function CommercialBookingModal({ item, onClose, accentColor = '#D4AF37' }: BookingModalProps) {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [quantity, setQuantity] = useState(item.minimum_order || 1);
  const [selectedOption, setSelectedOption] = useState<CommercialOption | null>(
    item.options && item.options.length > 0 ? item.options[0] : null
  );

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const hasPrice = typeof item.price === 'number' && item.price > 0 && !item.price_on_request;

  // Dynamic calculation
  const calculateTotal = () => {
    if (!hasPrice) return 0;
    let base = item.price || 0;
    if (selectedOption?.multiplier) {
      base = base * selectedOption.multiplier;
    }
    if (selectedOption?.price_delta) {
      base += selectedOption.price_delta;
    }

    if (item.sector === 'accommodation') {
      let nights = 1;
      if (startDate && endDate) {
        const d1 = new Date(startDate).getTime();
        const d2 = new Date(endDate).getTime();
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        nights = diff > 0 ? diff : 1;
      }
      return Math.round(base * nights * quantity);
    }

    if (item.sector === 'dining' || item.sector === 'tours' || item.sector === 'activities') {
      const multiplier = adults + (children * 0.5);
      return Math.round(base * multiplier * quantity);
    }

    // Products / Transports
    return Math.round(base * quantity);
  };

  const totalPrice = calculateTotal();

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Please provide your name and WhatsApp/phone number.');
      return;
    }

    setLoading(true);
    try {
      const payload: BookingPayload = {
        item_id: item.id,
        item_title: item.title_en,
        sector: item.sector,
        kind: item.kind,
        business_id: item.business_id,
        business_name: item.business_name,
        whatsapp_number: item.whatsapp_number,
        business_phone: item.business_phone,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_notes: customerNotes,
        start_date: startDate,
        end_date: endDate || undefined,
        adults_count: adults,
        children_count: children,
        quantity: quantity,
        selected_option_id: selectedOption?.id,
        selected_option_name: selectedOption?.name_en,
        unit_price: item.price,
        total_price: totalPrice,
        currency: item.currency || 'EGP'
      };

      const res = await fetch('/api/commercial/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data);
      } else {
        alert(data.error || 'Failed to submit reservation.');
      }
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert('Network error submitting reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(5, 8, 16, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#0d1322',
        border: `1px solid rgba(212, 175, 55, 0.35)`,
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        color: '#0F172A',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <div>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: accentColor
            }}>
              {item.sector.toUpperCase()} â€¢ {item.kind.toUpperCase()}
            </span>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
              Reserve with {item.business_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            Ã—
          </button>
        </div>

        {bookingSuccess ? (
          /* Confirmation & WhatsApp Dispatch Screen */
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ðŸŽ‰</div>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
              Reservation Request Prepared!
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your itinerary details for <strong>{item.title_en}</strong> have been recorded. Click below to open WhatsApp and confirm availability instantly with the host.
            </p>
            <div style={{
              background: '#141d33',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Guest:</span>
                <span style={{ fontWeight: 800, color: '#fff' }}>{customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Total Estimate:</span>
                <span style={{ fontWeight: 900, color: '#10b981', fontSize: '1.1rem' }}>
                  {totalPrice} {item.currency || 'EGP'}
                </span>
              </div>
            </div>

            <a
              href={bookingSuccess.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '1rem',
                borderRadius: '16px',
                background: '#25D366',
                color: '#000',
                fontWeight: 900,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
                marginBottom: '1rem'
              }}
            >
              <span>ðŸ’¬ Confirm via WhatsApp Now</span>
            </a>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close Window
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleConfirmReservation} style={{ padding: '1.5rem' }}>
            {/* Item summary banner */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              background: '#141d33',
              padding: '0.85rem',
              borderRadius: '16px',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <img
                src={item.image}
                alt={item.title_en}
                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title_en}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, marginTop: '0.2rem' }}>
                  {hasPrice ? `${item.price} ${item.currency || 'EGP'} / ${item.price_unit || 'night'}` : 'âœ¨ Rates Upon Request (Customized Quote)'}
                </div>
              </div>
            </div>

            {/* Transit Route & Schedule Card */}

            {item.sector === 'transports' && (item.departure_time || item.route_label) && (
              <div style={{
                background: 'rgba(212,175,55,0.06)',
                border: `1px solid rgba(212,175,55,0.3)`,
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, color: accentColor, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                    ðŸšŒ {item.booking_unit_type === 'seat' ? 'Scheduled Passenger Coach' : 'Private Vehicle Service'}
                  </span>
                  {item.duration_approx && (
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', color: '#475569' }}>
                      â±ï¸ {item.duration_approx}
                    </span>
                  )}
                </div>

                {item.route_label && (
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>
                    {item.route_label}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.2rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Departure:</div>
                    <div style={{ fontWeight: 800, color: '#38bdf8' }}>{item.departure_time || 'On-Demand'}</div>
                    {item.departure_station && (
                      <div style={{ fontSize: '0.7rem', color: '#475569' }}>ðŸ“ {item.departure_station}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Estimated Arrival:</div>
                    <div style={{ fontWeight: 800, color: '#4ade80' }}>{item.estimated_arrival_time || 'Determined by driver'}</div>
                    {item.arrival_station && (
                      <div style={{ fontSize: '0.7rem', color: '#475569' }}>ðŸ {item.arrival_station}</div>
                    )}
                  </div>
                </div>

                {item.amenities && item.amenities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                    {item.amenities.map((amenity, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', color: '#64748b' }}>
                        âœ“ {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* Sector-specific options tier */}
            {item.options && item.options.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Select Tier / Room / Option:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  {item.options.map(opt => {
                    const isSelected = selectedOption?.id === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setSelectedOption(opt)}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '12px',
                          border: isSelected ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
                          background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                          color: isSelected ? '#fff' : '#cbd5e1',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>{opt.name_en}</div>
                        {opt.capacity && <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{opt.capacity}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dates / Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: item.sector === 'accommodation' ? '1fr 1fr' : '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {item.sector === 'accommodation' ? 'Check-in Date' : 'Preferred Date'}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {item.sector === 'accommodation' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Guests or Quantity selector */}
            {(item.sector === 'accommodation' || item.sector === 'dining' || item.sector === 'tours' || item.sector === 'activities') ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Adults
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={adults}
                    onChange={e => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Children
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={children}
                    onChange={e => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Quantity ({item.price_unit}s)
                </label>
                <input
                  type="number"
                  min={item.minimum_order || 1}
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(item.minimum_order || 1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Customer Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  WhatsApp / Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+20 100 ..."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Total breakdown */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#F8FAFC',
              borderRadius: '14px',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                  {hasPrice ? 'Estimated Investment' : 'Pricing & Availability'}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {hasPrice ? 'No prepayment required â€¢ Direct payment in Siwa' : 'Direct custom quote sent to your WhatsApp/Phone'}
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: hasPrice ? '#10b981' : accentColor }}>
                {hasPrice ? `${totalPrice} ${item.currency || 'EGP'}` : 'Upon Request'}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '50px',
                background: accentColor,
                color: '#000',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: `0 8px 25px rgba(212, 175, 55, 0.3)`
              }}
            >
              {loading ? 'Processing...' : (hasPrice ? 'Reserve & Dispatch Itinerary â†’' : 'Inquire Direct & Request Quote â†’')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
