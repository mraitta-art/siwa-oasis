'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseHospitalityRawText } from '@/lib/hospitality-mapper';

const CAFOUR_HOUSE_DEMO = `Cafour House Siwa - Hot Spring
Ragwa, Siwa, Egypt
https://www.booking.com/hotel/eg/cafour-house-siwa.html
9.3 Rated: Wonderful 9.3 – based on 600 reviews
Staff 9.6
Facilities 9.1
Cleanliness 9.0
Comfort 9.0
Value for money 9.4
Location 8.9
Free Wifi 9.3

“Amazing place, lovely and warm welcome, very easy to organize visits at a reasonable price”
Benjamin
France

“Came to stay 3 days, stayed 2 weeks and was sad to leave. Great place and great people working there. Very good food. Love going to the hot spring pool when waking up and enjoy the firepit at night.”
Natacha
Germany

“The place was very peaceful and relaxing, perfect for a getaway in Siwa. The hot spring experience was amazing and unique. The staff were friendly and welcoming.”
Chaima
United States

About this property
Elegant Accommodation: Cafour House Siwa - Hot Spring in Siwa offers comfortable camping with private bathrooms, air conditioning, and views of the garden or mountains. Each room includes a dining area and modern amenities. Relaxing Facilities: Guests can enjoy a hot spring bath, swimming pool with a view, sun terrace, and open-air bath. Additional amenities include a fitness room, yoga classes, and water sports facilities. Dining Experience: The traditional restaurant serves African cuisine with vegetarian, vegan, and gluten-free options. Breakfast, brunch, lunch, dinner, and high tea are available.

Most popular facilities
2 swimming pools
Free parking
Restaurant
Room service
Non-smoking rooms
Free Wifi
Airport shuttle
Family rooms
Bar
Wonderful Breakfast

Managed by Abdo
Languages Spoken
Arabic, German, English

[Double Room with Mountain View]
1 twin bed and 1 queen bed

[Two-Bedroom Suite]
1 twin bed and 1 queen bed

[Two-Bedroom Chalet]
2 twin beds 1 queen bed

[Comfort Triple Room]
3 twin beds

[Triple Room with Garden View]
1 twin bed and 1 queen bed

Check-in
Available 24 hours
Check-out
Available 24 hours
Quiet hours
Guests need be quiet between 11:00 PM and 7:00 AM.
Pets
Free! Pets are allowed. No extra charges.
`;

export default function PasteImportPage() {
  const [pastedText, setPastedText] = useState('');
  const [types, setTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('hotel');
  const [customSlug, setCustomSlug] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<{ businessId: number; slug: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/jana/types')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const leaves = d.filter(t => !t.is_parent && t.id !== 'SECTION_TEMPLATE');
          setTypes(leaves.length ? leaves : d);
        }
      })
      .catch(() => {});
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDemo = () => {
    setPastedText(CAFOUR_HOUSE_DEMO);
    // Instant parse demo
    const data = parseHospitalityRawText(CAFOUR_HOUSE_DEMO);
    setParsedData(data);
    setSummary({
      name: data.basic.name || 'Cafour House Siwa - Hot Spring',
      rating: data.testimonials.rating || 9.3,
      reviews_count: data.testimonials.reviews_count || 600,
      pools_count: data.facilities.pools_count || 2,
      room_types_count: (data.accommodation.room_types || []).length,
      reviews_highlights_count: (data.testimonials.review_highlights || []).length,
      has_hot_spring: Boolean(data.facilities.hot_spring),
      has_restaurant: Boolean(data.gastronomy.restaurant_name),
    });
    setCustomSlug('cafour-house-siwa');
    notify('Cafour House Siwa demo loaded & analyzed instantly!');
  };

  const handleParse = () => {
    if (!pastedText.trim()) {
      notify('Please paste hotel, OTA, or listing text first.', 'error');
      return;
    }
    setLoading(true);
    setSavedResult(null);
    try {
      // 1. Instant client-side parse (zero latency guaranteed)
      const data = parseHospitalityRawText(pastedText);
      setParsedData(data);
      setSummary({
        name: data.basic.name || 'Unnamed Property',
        rating: data.testimonials.rating || null,
        reviews_count: data.testimonials.reviews_count || 0,
        pools_count: data.facilities.pools_count || 0,
        room_types_count: (data.accommodation.room_types || []).length,
        reviews_highlights_count: (data.testimonials.review_highlights || []).length,
        has_hot_spring: Boolean(data.facilities.hot_spring),
        has_restaurant: Boolean(data.gastronomy.restaurant_name),
      });
      if (data.basic?.name && !customSlug) {
        setCustomSlug(data.basic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      }
      notify('Data successfully analyzed and organized across sections!');
    } catch (e: any) {
      notify(e.message || 'Error parsing text', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) {
      notify('Please analyze the text before saving', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/jana/paste-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          text: pastedText,
          typeId: selectedTypeId,
          customSlug: customSlug.trim() || undefined,
          businessId: businessId ? parseInt(businessId) : undefined,
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save');
      setSavedResult({ businessId: data.businessId, slug: data.slug });
      notify('Listing imported and saved to database successfully!');
    } catch (e: any) {
      notify(e.message || 'Error saving to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '12px',
          fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none' }}>Admin Dashboard</Link>
            <span>/</span>
            <span>Smart Importer</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📋 Smart Multi-OTA Paste Importer</span>
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Paste raw text from Booking.com, Airbnb, TripAdvisor, or Agoda. Our AI mapper automatically sorts it into structured section fields.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadDemo}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #D4AF37', background: 'rgba(212,175,55,0.1)', color: '#92400e', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
          >
            ✨ Load Cafour House Demo
          </button>
          <Link href="/jana/google-import" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🗺️ Google Maps Import
          </Link>
          <Link href="/jana/businesses" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🏢 Business Registry
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(450px, 1.2fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Input */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📥 Paste Raw Listing Data</span>
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Target Business Typology
            </label>
            <select
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', outline: 'none' }}
            >
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                Custom Minisite Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. cafour-house-siwa"
                value={customSlug}
                onChange={e => setCustomSlug(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                Existing Business ID (Optional)
              </label>
              <input
                type="number"
                placeholder="Leave blank for new"
                value={businessId}
                onChange={e => setBusinessId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Raw Text Content
            </label>
            <textarea
              rows={14}
              placeholder="Paste any hotel text here: Name, description, review quotes, facilities list, room types, scores..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.82rem', fontFamily: 'monospace', color: '#1e293b', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleParse}
              disabled={loading}
              style={{
                flex: 1, padding: '0.85rem 1.5rem', borderRadius: '12px', border: 'none',
                background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {loading ? 'Analyzing Data...' : '⚡ Analyze & Organize Sections'}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Output Preview */}
        <div>
          {savedResult && (
            <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1.5rem', border: '2px solid #86efac', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803d', marginBottom: '0.5rem' }}>
                🎉 Successfully Imported & Saved!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '1rem' }}>
                Business ID: <strong>{savedResult.businessId}</strong> | Slug: <strong>{savedResult.slug}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={`/${savedResult.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', background: '#16a34a', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}
                >
                  🚀 View Live Minisite
                </a>
                <Link
                  href="/jana/businesses"
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', border: '1.5px solid #bbf7d0', background: '#fff', color: '#166534', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}
                >
                  🏢 Manage in Registry
                </Link>
              </div>
            </div>
          )}

          {parsedData ? (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {parsedData.testimonials?.source ? `Source: ${parsedData.testimonials.source}` : 'Structure Ready'}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {parsedData.basic?.name || 'Structured Breakdown'}
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: '#10b981', color: '#fff', fontWeight: 900, fontSize: '0.9rem',
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                  }}
                >
                  {saving ? 'Saving to Database...' : '💾 Confirm & Save to DB'}
                </button>
              </div>

              {/* Summary Badges */}
              {summary && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {summary.rating && (
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ⭐ Rating: {summary.rating}/10 ({summary.reviews_count} reviews)
                    </span>
                  )}
                  {summary.has_hot_spring && (
                    <span style={{ background: '#ecfdf5', color: '#065f46', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ♨️ Natural Hot Spring
                    </span>
                  )}
                  {summary.pools_count > 0 && (
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      🏊 {summary.pools_count} Swimming Pools
                    </span>
                  )}
                  {summary.room_types_count > 0 && (
                    <span style={{ background: '#f5f3ff', color: '#5b21b6', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      🛏️ {summary.room_types_count} Room Configurations
                    </span>
                  )}
                  {summary.reviews_highlights_count > 0 && (
                    <span style={{ background: '#fdf2f8', color: '#9d174d', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                      💬 {summary.reviews_highlights_count} Guest Review Quotes
                    </span>
                  )}
                </div>
              )}

              {/* Sections Accordion / Preview Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. Basic & Identity */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-id-card" style={{ color: '#D4AF37' }}></i> Identity & Description (basic)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                    <strong>Address:</strong> {parsedData.basic?.address || 'N/A'}<br />
                    <strong>Languages:</strong> {(parsedData.basic?.languages_spoken || []).join(', ') || 'N/A'}<br />
                    <strong>Manager:</strong> {parsedData.basic?.manager_name || 'N/A'}<br />
                    <strong>Check-in / Check-out:</strong> {parsedData.basic?.checkin_time || '24h'} / {parsedData.basic?.checkout_time || '24h'}<br />
                    <strong>About:</strong> {parsedData.basic?.description || 'N/A'}
                  </div>
                </div>

                {/* 2. Testimonials & Ratings */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-star" style={{ color: '#f59e0b' }}></i> Reviews & Score Breakdown (testimonials)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {parsedData.testimonials?.score_staff && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Staff: <strong>{parsedData.testimonials.score_staff}</strong></div>}
                    {parsedData.testimonials?.score_facilities && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Facilities: <strong>{parsedData.testimonials.score_facilities}</strong></div>}
                    {parsedData.testimonials?.score_cleanliness && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Cleanliness: <strong>{parsedData.testimonials.score_cleanliness}</strong></div>}
                    {parsedData.testimonials?.score_comfort && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Comfort: <strong>{parsedData.testimonials.score_comfort}</strong></div>}
                    {parsedData.testimonials?.score_value && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Value: <strong>{parsedData.testimonials.score_value}</strong></div>}
                    {parsedData.testimonials?.score_location && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Location: <strong>{parsedData.testimonials.score_location}</strong></div>}
                  </div>
                  {parsedData.testimonials?.review_highlights?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {parsedData.testimonials.review_highlights.slice(0, 3).map((q: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.72rem', fontStyle: 'italic', background: '#fff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          "{q.text}" — <strong>{q.author}</strong> ({q.country})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Facilities */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-concierge-bell" style={{ color: '#3b82f6' }}></i> Facilities & Amenities (facilities)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(parsedData.facilities?.facilities_list || []).map((f: string, i: number) => (
                      <span key={i} style={{ background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #e2e8f0', color: '#1e293b' }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Rooms / Accommodation */}
                {parsedData.accommodation?.room_types?.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-bed" style={{ color: '#8b5cf6' }}></i> Rooms & Accommodation (accommodation)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                      {parsedData.accommodation.room_types.map((r: any, i: number) => (
                        <div key={i} style={{ background: '#fff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                          <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>{r.name}</div>
                          <div style={{ color: '#64748b' }}>{r.beds}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Food & Dining */}
                {parsedData.gastronomy?.restaurant_name && (
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-utensils" style={{ color: '#ef4444' }}></i> Food & Dining (gastronomy)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                      <strong>Cuisine:</strong> {(parsedData.gastronomy?.cuisine_type || []).join(', ')}<br />
                      <strong>Dietary Options:</strong> {(parsedData.gastronomy?.dietary_options || []).join(', ')}<br />
                      <strong>Meals:</strong> {(parsedData.gastronomy?.meal_types || []).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '4rem 2rem', border: '2px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>No data analyzed yet</div>
              <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Paste any listing or hotel text on the left and click "Analyze & Organize Sections" to see the smart section breakdown.</div>
              <button
                onClick={loadDemo}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ✨ Try with Cafour House Siwa Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
