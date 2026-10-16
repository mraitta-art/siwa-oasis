'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: string;
  is_visible: boolean;
  vendor_business_ids?: string[];
  image?: string;
  icon?: string;
  title_en?: string;
  title_ar?: string;
  name_en?: string;
  name_ar?: string;
  category?: string;
  category_ar?: string;
  duration?: string;
  duration_ar?: string;
  base_price_egp?: number;
  price_per_night?: number;
  rate_per_day?: number;
  price_per_person?: number;
  highlight_en?: string;
  highlight_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  badge_en?: string;
  badge_ar?: string;
}

interface CustomWish {
  id: string;
  category: string;
  title: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  duration?: string;
  estimated_price?: number;
  notes?: string;
  is_custom_wish: true;
}

interface TimingSchedule {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  duration_label?: string;
}

// ─── STYLES & LUXURY PALETTE ────────────────────────────────────────────────

const S = {
  wrap: { padding: '5rem 0', background: '#0a0d14', color: '#f8fafc', borderTop: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties,
  goldBadge: {
    background: 'rgba(212,175,55,0.15)', color: '#D4AF37',
    border: '1px solid rgba(212,175,55,0.3)', padding: '0.25rem 0.75rem',
    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px',
    textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  },
  h2: { fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900, margin: '0.5rem 0', letterSpacing: '-0.5px' } as React.CSSProperties,
  sub: { color: '#94a3b8', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.6 } as React.CSSProperties,
  card: {
    background: '#111520', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px', padding: '1.5rem', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '0.75rem 1rem', background: '#0a0d14',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff',
    fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
  } as React.CSSProperties,
};

// ─── DEFAULT FALLBACKS ──────────────────────────────────────────────────────

const DEFAULT_EXPERIENCES: CatalogItem[] = [
  {
    id: 'exp_salt_lakes',
    is_visible: true,
    title_en: 'Salt Lakes Floating & Crystal Mineral Pools',
    title_ar: 'الطفو في بحيرات الملح وعيون المياه المعدنية العلاجية',
    category: 'Wellness & Nature',
    duration: '3-4 Hours',
    base_price_egp: 450,
    highlight_en: 'Zero-gravity salt float + pure olive oil rinse in ancient palms',
    icon: '🌊',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
  },
  {
    id: 'exp_great_sand_sea',
    is_visible: true,
    title_en: '4x4 Great Sand Sea Safari & Sunset Sandboarding',
    title_ar: 'سفاري بحر الرمال الأعظم بسيارات الدفع الرباعي',
    category: 'Safari & Adventure',
    duration: 'Half Day / Sunset',
    base_price_egp: 1250,
    highlight_en: 'Giant dunes crossing, fossil ocean site, Bedouin tea & sandboarding',
    icon: '🚙',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
  },
  {
    id: 'exp_shali_amun_oracle',
    is_visible: true,
    title_en: 'Ancient Fortress of Shali & Temple of the Oracle Walk',
    title_ar: 'جولة تاريخية في قلعة شالي القديمة ومعبد الوحي آمون',
    category: 'Heritage & History',
    duration: '2.5 Hours',
    base_price_egp: 350,
    highlight_en: 'Kershef mud-brick fortress climb with local Siwan storyteller',
    icon: '🏛️',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  },
];

const DEFAULT_ACCOMMODATIONS: CatalogItem[] = [
  {
    id: 'stay_authentic_ecolodge',
    is_visible: true,
    name_en: 'Heritage Salt & Palm Eco-Lodge',
    name_ar: 'نزل بيئي تقليدي من حجر الكرشيف والملح',
    desc_en: 'Authentic candlelit kershef lodge surrounded by organic date palms and freshwater spring',
    price_per_night: 1800,
    badge_en: 'Eco Certified',
    icon: '🛖',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  },
  {
    id: 'stay_luxury_desert_camp',
    is_visible: true,
    name_en: 'Great Sand Sea Luxury Glamping Camp',
    name_ar: 'مخيم فندقي فاخر في قلب بحر الرمال الأعظم',
    desc_en: 'Bedouin royal canvas suite, private campfire, dune sunrise viewing, private bath',
    price_per_night: 2400,
    badge_en: 'Stargazer Choice',
    icon: '⛺',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80',
  },
];

const DEFAULT_TRANSPORTS: CatalogItem[] = [
  {
    id: 'trans_4x4_safari_cruiser',
    is_visible: true,
    name_en: 'Private 4x4 Land Cruiser with Siwan Desert Pilot',
    name_ar: 'سيارة لاندكروزر دفع رباعي خاصة مع سائق خبير بالصحراء',
    desc_en: 'Fully desert-equipped 4WD with air conditioning, deflation gear, and licensed pilot',
    rate_per_day: 1800,
    icon: '🚙',
  },
  {
    id: 'trans_vip_cairo_transfer',
    is_visible: true,
    name_en: 'Direct VIP Private Transfer (Cairo / Alex <-> Siwa)',
    name_ar: 'توصيل سياحي خاص ومباشر (القاهرة / الإسكندرية إلى سيوة)',
    desc_en: 'Door-to-door luxury air-conditioned van with refreshments and rest stops',
    rate_per_day: 3500,
    icon: '🚐',
  },
];

const DEFAULT_MEALS: CatalogItem[] = [
  {
    id: 'meal_bedouin_sunset_feast',
    is_visible: true,
    name_en: 'Traditional Under-Sand Roasted Lamb (Radm) Feast',
    name_ar: 'وليمة لحم الردم البدوي المطهو تحت رمال الصحراء',
    desc_en: 'Slow-cooked lamb under hot desert sand, Siwan spiced rice, fresh garden salad, and lemongrass tea',
    price_per_person: 420,
    icon: '🔥',
  },
  {
    id: 'meal_palm_garden_lunch',
    is_visible: true,
    name_en: 'Organic Palm Grove Farm-to-Table Lunch',
    name_ar: 'غداء ريفي عضوي في مزارع النخيل وعيون المياه',
    desc_en: 'Freshly baked Siwan flatbread, sun-ripened olives, local duck or chicken tajine, date sweet',
    price_per_person: 280,
    icon: '🍽️',
  },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function SmartJourneyPlanner({ title, subtitle }: { title?: string; subtitle?: string }) {
  // Navigation & Category Tab state
  const [activeCategory, setActiveCategory] = useState<'accommodation' | 'safaris' | 'activities' | 'transport' | 'dining'>('accommodation');

  // Loaded Catalog Data
  const [catalog, setCatalog] = useState<{
    bundle_discount_percent: number;
    experiences: CatalogItem[];
    accommodations: CatalogItem[];
    transports: CatalogItem[];
    meals: CatalogItem[];
  }>({
    bundle_discount_percent: 15,
    experiences: DEFAULT_EXPERIENCES,
    accommodations: DEFAULT_ACCOMMODATIONS,
    transports: DEFAULT_TRANSPORTS,
    meals: DEFAULT_MEALS,
  });

  // Selected State per Category with Start and End Date/Time Timelines
  const [selectedStay, setSelectedStay] = useState<CatalogItem | null>(null);
  const [stayTiming, setStayTiming] = useState<TimingSchedule>({
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '14:00',
    end_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    end_time: '11:00',
  });

  const [selectedTours, setSelectedTours] = useState<Array<{ item: CatalogItem; timing: TimingSchedule }>>([]);
  const [selectedActivities, setSelectedActivities] = useState<Array<{ item: CatalogItem; timing: TimingSchedule }>>([]);
  
  const [selectedTransport, setSelectedTransport] = useState<CatalogItem | null>(null);
  const [transportTiming, setTransportTiming] = useState<TimingSchedule>({
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '08:00',
    end_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    end_time: '20:00',
  });

  const [selectedMeal, setSelectedMeal] = useState<CatalogItem | null>(null);
  const [mealTiming, setMealTiming] = useState<TimingSchedule>({
    start_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    start_time: '19:30',
    end_date: '',
    end_time: '22:00',
  });

  // Guests & Guide Preferences
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guideLanguage, setGuideLanguage] = useState('English');

  // Crowdsourced Custom Wishes (+ Add Custom Selection)
  const [customWishes, setCustomWishes] = useState<CustomWish[]>([]);
  const [showCustomWishModal, setShowCustomWishModal] = useState(false);
  const [wishInput, setWishInput] = useState({
    title: '',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '14:00',
    notes: '',
  });

  // Side-Part Inspector Drawer state ("sidepart")
  const [inspectingItem, setInspectingItem] = useState<{
    item: CatalogItem;
    category: string;
  } | null>(null);

  // Visitor Checkout & Submission
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Fetch Live Catalog on mount
  useEffect(() => {
    fetch('/api/journeys/customizer')
      .then(r => r.json())
      .then(d => {
        if (d?.catalog) {
          setCatalog(prev => ({
            ...prev,
            ...d.catalog,
            experiences: d.catalog.experiences?.length ? d.catalog.experiences : prev.experiences,
            accommodations: d.catalog.accommodations?.length ? d.catalog.accommodations : prev.accommodations,
            transports: d.catalog.transports?.length ? d.catalog.transports : prev.transports,
            meals: d.catalog.meals?.length ? d.catalog.meals : prev.meals,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ─── CALCULATIONS & COMBO DISCOUNT LOGIC ───────────────────────────────────

  const nightsCount = useMemo(() => {
    if (!stayTiming.start_date || !stayTiming.end_date) return 3;
    const diffTime = Math.abs(new Date(stayTiming.end_date).getTime() - new Date(stayTiming.start_date).getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [stayTiming.start_date, stayTiming.end_date]);

  const transportDays = useMemo(() => {
    if (!transportTiming.start_date || !transportTiming.end_date) return 3;
    const diffTime = Math.abs(new Date(transportTiming.end_date).getTime() - new Date(transportTiming.start_date).getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [transportTiming.start_date, transportTiming.end_date]);

  const pricingSummary = useMemo(() => {
    let subtotal = 0;
    const totalGuests = adults + children * 0.5;

    // Accommodation
    if (selectedStay) {
      subtotal += (selectedStay.price_per_night || 0) * nightsCount;
    }

    // Tours & Safaris
    selectedTours.forEach(t => {
      subtotal += (t.item.base_price_egp || 0) * adults + (t.item.base_price_egp || 0) * 0.5 * children;
    });

    // Activities
    selectedActivities.forEach(a => {
      subtotal += (a.item.base_price_egp || 0) * adults + (a.item.base_price_egp || 0) * 0.5 * children;
    });

    // Transport
    if (selectedTransport) {
      subtotal += (selectedTransport.rate_per_day || 0) * transportDays;
    }

    // Dining
    if (selectedMeal) {
      subtotal += (selectedMeal.price_per_person || 0) * totalGuests;
    }

    // Categories selected count for combo discount trigger
    let parentCount = 0;
    if (selectedStay) parentCount++;
    if (selectedTours.length > 0) parentCount++;
    if (selectedActivities.length > 0) parentCount++;
    if (selectedTransport) parentCount++;
    if (selectedMeal) parentCount++;
    if (customWishes.length > 0) parentCount++;

    const isComboUnlocked = parentCount >= 3;
    const discountPercent = isComboUnlocked ? (catalog.bundle_discount_percent || 15) : 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      parentCount,
      isComboUnlocked,
      discountPercent,
      discountAmount,
      finalTotal,
    };
  }, [
    selectedStay, nightsCount, selectedTours, selectedActivities,
    selectedTransport, transportDays, selectedMeal, adults, children,
    customWishes.length, catalog.bundle_discount_percent
  ]);

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────

  const handleToggleTour = (item: CatalogItem) => {
    const exists = selectedTours.find(t => t.item.id === item.id);
    if (exists) {
      setSelectedTours(prev => prev.filter(t => t.item.id !== item.id));
    } else {
      setSelectedTours(prev => [
        ...prev,
        {
          item,
          timing: {
            start_date: stayTiming.start_date || new Date().toISOString().split('T')[0],
            start_time: '14:30',
            end_date: stayTiming.start_date || new Date().toISOString().split('T')[0],
            end_time: '19:00',
            duration_label: item.duration || 'Half Day',
          },
        },
      ]);
    }
  };

  const handleAddCustomWish = () => {
    if (!wishInput.title.trim()) return;
    const newWish: CustomWish = {
      id: `wish_${Date.now()}`,
      category: activeCategory,
      title: wishInput.title,
      start_date: wishInput.start_date,
      start_time: wishInput.start_time,
      end_time: wishInput.end_time,
      notes: wishInput.notes,
      is_custom_wish: true,
    };
    setCustomWishes(prev => [...prev, newWish]);
    setShowCustomWishModal(false);
    setWishInput({
      title: '',
      start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '14:00',
      notes: '',
    });
  };

  const handleDispatchReservation = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and WhatsApp/Phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        duration_days: Math.max(nightsCount, transportDays),
        travel_dates: `${stayTiming.start_date} to ${stayTiming.end_date}`,
        adults_count: adults,
        children_count: children,
        guide_language: guideLanguage,
        special_notes: specialNotes,
        selected_experiences: [
          ...selectedTours.map(t => ({ id: t.item.id, title_en: t.item.title_en, base_price_egp: t.item.base_price_egp, timing: t.timing })),
          ...selectedActivities.map(a => ({ id: a.item.id, title_en: a.item.title_en, base_price_egp: a.item.base_price_egp, timing: a.timing })),
        ],
        selected_experience_ids: [
          ...selectedTours.map(t => t.item.id),
          ...selectedActivities.map(a => a.item.id),
        ],
        accommodation_id: selectedStay?.id,
        transport_id: selectedTransport?.id,
        meal_id: selectedMeal?.id,
        accommodation_preference: selectedStay?.name_en,
        transport_preference: selectedTransport?.name_en,
        meal_preference: selectedMeal?.name_en,
        custom_wishes: customWishes,
        timings: {
          stay: { ...stayTiming, nights: nightsCount },
          transport: { ...transportTiming, days: transportDays },
          meal: mealTiming,
        },
      };

      const res = await fetch('/api/journeys/custom-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.request_code) {
        setBookingSuccess(data);
      } else {
        alert(data.error || 'Failed to submit reservation. Please try again.');
      }
    } catch {
      alert('Network error while dispatching journey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── RESERVATION CONFIRMED VIEW ───────────────────────────────────────────

  if (bookingSuccess) {
    return (
      <section style={S.wrap}>
        <div style={S.inner}>
          <div style={{ ...S.card, textAlign: 'center', padding: '4.5rem 2rem', maxWidth: '750px', margin: '0 auto' }}>
            <div style={{ width: '84px', height: '84px', background: 'rgba(212,175,55,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2.75rem', color: '#D4AF37' }} />
            </div>
            <span style={S.goldBadge}>RESERVATION DISPATCHED</span>
            <h2 style={{ ...S.h2, marginTop: '1rem' }}>Your Siwa Journey is Booked!</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, margin: '1rem auto 2rem', maxWidth: '520px' }}>
              Reference Tracking Code: <strong style={{ color: '#D4AF37', fontSize: '1.25rem' }}>{bookingSuccess.request_code}</strong>
            </p>

            <div style={{ background: '#0a0d14', padding: '1.5rem', borderRadius: '18px', textAlign: 'left', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Summary of Confirmed Selections:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
                {selectedStay && <li>🏨 <strong>Stay:</strong> {selectedStay.name_en} ({nightsCount} nights: {stayTiming.start_date} to {stayTiming.end_date})</li>}
                {selectedTours.map((t, idx) => (
                  <li key={idx}>🚙 <strong>Safari:</strong> {t.item.title_en} ({t.timing.start_date} at {t.timing.start_time})</li>
                ))}
                {selectedTransport && <li>🚐 <strong>Transport:</strong> {selectedTransport.name_en} ({transportTiming.start_date})</li>}
                {selectedMeal && <li>🍽️ <strong>Dining:</strong> {selectedMeal.name_en} ({mealTiming.start_date} at {mealTiming.start_time})</li>}
                {customWishes.map((w, idx) => (
                  <li key={idx} style={{ color: '#ec4899' }}>✨ <strong>Custom Wish:</strong> {w.title} ({w.start_date})</li>
                ))}
              </ul>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Estimated Cost:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>{pricingSummary.finalTotal.toLocaleString()} EGP</span>
              </div>
            </div>

            {bookingSuccess.whatsapp_url && (
              <a
                href={bookingSuccess.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  background: '#25D366', color: '#000', padding: '1rem 2.5rem',
                  borderRadius: '50px', fontWeight: 900, fontSize: '1rem',
                  textDecoration: 'none', boxShadow: '0 10px 25px rgba(37,211,102,0.3)',
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.3rem' }} /> Open Itinerary on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ─── PLANNER MAIN VIEW ────────────────────────────────────────────────────

  return (
    <section style={S.wrap} id="smart-journey-planner">
      <div style={S.inner}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem' }}>
          <div>
            <span style={S.goldBadge}>
              <i className="fas fa-sparkles" /> {subtitle || 'SMART JOURNEY PLANNER'}
            </span>
            <h2 style={S.h2}>{title || 'Craft Your Custom Siwa Itinerary'}</h2>
            <p style={S.sub}>
              Select your accommodations, desert safaris, private transfers, and culinary feasts. Every selection supports exact date and timing with real-time combo discounts.
            </p>
          </div>

          {/* Combo Deal Flash Notifier Banner */}
          <div style={{
            background: pricingSummary.isComboUnlocked ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.12)',
            border: `1px solid ${pricingSummary.isComboUnlocked ? '#10b981' : '#D4AF37'}`,
            padding: '1rem 1.5rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem',
            animation: 'pulseGlow 2.5s infinite',
          }}>
            <div style={{ fontSize: '1.75rem' }}>{pricingSummary.isComboUnlocked ? '🎉' : '🔥'}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: pricingSummary.isComboUnlocked ? '#10b981' : '#D4AF37' }}>
                {pricingSummary.isComboUnlocked ? 'COMBO DISCOUNT ACTIVE: 15% OFF!' : 'BUNDLE & SAVE 15%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {pricingSummary.isComboUnlocked
                  ? `Saved ${pricingSummary.discountAmount.toLocaleString()} EGP across ${pricingSummary.parentCount} sectors!`
                  : `Select items from 3 sectors to unlock 15% off (${pricingSummary.parentCount}/3 chosen)`}
              </div>
            </div>
          </div>
        </div>

        {/* Parent Category Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'accommodation', label: '1. Accommodation', icon: 'fa-bed', selected: !!selectedStay },
            { id: 'safaris', label: '2. Safaris & Desert Tours', icon: 'fa-compass', count: selectedTours.length },
            { id: 'activities', label: '3. Activities & Wellness', icon: 'fa-spa', count: selectedActivities.length },
            { id: 'transport', label: '4. Transfers & Logistics', icon: 'fa-car', selected: !!selectedTransport },
            { id: 'dining', label: '5. Dining & Feasts', icon: 'fa-utensils', selected: !!selectedMeal },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                style={{
                  background: active ? '#D4AF37' : '#111520',
                  color: active ? '#000' : '#cbd5e1',
                  border: active ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                  padding: '0.85rem 1.4rem', borderRadius: '16px',
                  fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                }}
              >
                <i className={`fas ${cat.icon}`} />
                {cat.label}
                {cat.selected && <span style={{ background: active ? '#000' : '#10b981', color: active ? '#D4AF37' : '#fff', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.65rem' }}>✓</span>}
                {typeof cat.count === 'number' && cat.count > 0 && <span style={{ background: active ? '#000' : '#10b981', color: active ? '#D4AF37' : '#fff', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.65rem' }}>{cat.count}</span>}
              </button>
            );
          })}
        </div>

        {/* Planner Workspace Layout: 2 Columns (Main Selection + Sticky Live Manifest) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT: Category Selection & Timetable Controls */}
          <div>
            {/* ─── 1. ACCOMMODATION SECTOR ─── */}
            {activeCategory === 'accommodation' && (
              <div>
                {/* Stay Timing Pickers (Check-in / Check-out) */}
                <div style={{ ...S.card, marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-calendar-alt" style={{ color: '#D4AF37' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Stay Schedule & Duration</h3>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                      {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'} Stay
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, marginBottom: '0.4rem' }}>CHECK-IN DATE & TIME</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={stayTiming.start_date}
                          onChange={(e) => setStayTiming({ ...stayTiming, start_date: e.target.value })}
                          style={S.input}
                        />
                        <input
                          type="time"
                          value={stayTiming.start_time}
                          onChange={(e) => setStayTiming({ ...stayTiming, start_time: e.target.value })}
                          style={{ ...S.input, width: '100px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, marginBottom: '0.4rem' }}>CHECK-OUT DATE & TIME</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={stayTiming.end_date}
                          onChange={(e) => setStayTiming({ ...stayTiming, end_date: e.target.value })}
                          style={S.input}
                        />
                        <input
                          type="time"
                          value={stayTiming.end_time}
                          onChange={(e) => setStayTiming({ ...stayTiming, end_time: e.target.value })}
                          style={{ ...S.input, width: '100px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodations Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.accommodations.map((stay) => {
                    const isSelected = selectedStay?.id === stay.id;
                    return (
                      <div key={stay.id} style={{ ...S.card, border: isSelected ? '2px solid #D4AF37' : S.card.border, position: 'relative' }}>
                        {stay.badge_en && (
                          <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#D4AF37', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>
                            {stay.badge_en}
                          </span>
                        )}
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{stay.icon || '🏨'}</div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{stay.name_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '48px', margin: '0 0 1rem' }}>
                          {stay.desc_en}
                        </p>

                        {/* Flash Deal Tag */}
                        <div style={{ background: 'rgba(212,175,55,0.08)', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', color: '#D4AF37', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="fas fa-gift" /> Free Bedouin Welcome Tea & Dates
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{stay.price_per_night} EGP</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / night</span>
                          </div>
                          <button
                            onClick={() => setInspectingItem({ item: stay, category: 'accommodation' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect Details &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedStay(isSelected ? null : stay)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: isSelected ? '#10b981' : '#D4AF37',
                            color: isSelected ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ Stay Selected' : 'Choose This Stay'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 2. SAFARIS & DESERT TOURS ─── */}
            {activeCategory === 'safaris' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.experiences.map((exp) => {
                    const selected = selectedTours.find(t => t.item.id === exp.id);
                    return (
                      <div key={exp.id} style={{ ...S.card, border: selected ? '2px solid #D4AF37' : S.card.border }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>{exp.icon || '🚙'}</span>
                          <span style={{ background: 'rgba(255,255,255,0.06)', color: '#D4AF37', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                            {exp.duration}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{exp.title_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '48px', margin: '0 0 1rem' }}>
                          {exp.highlight_en}
                        </p>

                        {/* Flash Deal Notifier */}
                        <div style={{ background: 'rgba(236,72,153,0.08)', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', color: '#ec4899', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="fas fa-fire" /> Free Sandboards & Sunset Tea Included
                        </div>

                        {/* Schedule Timing Input when selected */}
                        {selected && (
                          <div style={{ background: '#0a0d14', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, marginBottom: '0.35rem' }}>TOUR DEPARTURE & SUNSET RETURN:</div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="date"
                                value={selected.timing.start_date}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  setSelectedTours(prev => prev.map(t => t.item.id === exp.id ? { ...t, timing: { ...t.timing, start_date: date, end_date: date } } : t));
                                }}
                                style={S.input}
                              />
                              <input
                                type="time"
                                value={selected.timing.start_time}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setSelectedTours(prev => prev.map(t => t.item.id === exp.id ? { ...t, timing: { ...t.timing, start_time: time } } : t));
                                }}
                                style={{ ...S.input, width: '90px' }}
                              />
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{exp.base_price_egp} EGP</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / person</span>
                          </div>
                          <button
                            onClick={() => setInspectingItem({ item: exp, category: 'safaris' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => handleToggleTour(exp)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: selected ? '#10b981' : '#D4AF37',
                            color: selected ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {selected ? '✓ Added to Journey' : '+ Add Safari Tour'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 3. ACTIVITIES & WELLNESS ─── */}
            {activeCategory === 'activities' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.experiences.slice(0, 2).map((act) => {
                    const selected = selectedActivities.find(a => a.item.id === act.id);
                    return (
                      <div key={act.id} style={{ ...S.card, border: selected ? '2px solid #D4AF37' : S.card.border }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{act.icon || '🏄'}</div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{act.title_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{act.highlight_en}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{act.base_price_egp} EGP</span>
                          <button
                            onClick={() => setInspectingItem({ item: act, category: 'activities' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            if (selected) {
                              setSelectedActivities(prev => prev.filter(a => a.item.id !== act.id));
                            } else {
                              setSelectedActivities(prev => [...prev, { item: act, timing: { start_date: stayTiming.start_date, start_time: '10:00', end_date: stayTiming.start_date, end_time: '13:00' } }]);
                            }
                          }}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: selected ? '#10b981' : '#D4AF37',
                            color: selected ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {selected ? '✓ Added Activity' : '+ Add Activity'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 4. TRANSFERS & LOGISTICS ─── */}
            {activeCategory === 'transport' && (
              <div>
                {/* Transport timing header */}
                <div style={{ ...S.card, marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-clock" style={{ color: '#D4AF37' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Pickup & Transit Schedule</h3>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                      {transportDays} Days Coverage
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, marginBottom: '0.4rem' }}>PICKUP DATE & TIME</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={transportTiming.start_date}
                          onChange={(e) => setTransportTiming({ ...transportTiming, start_date: e.target.value })}
                          style={S.input}
                        />
                        <input
                          type="time"
                          value={transportTiming.start_time}
                          onChange={(e) => setTransportTiming({ ...transportTiming, start_time: e.target.value })}
                          style={{ ...S.input, width: '100px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, marginBottom: '0.4rem' }}>DROP-OFF DATE & TIME</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={transportTiming.end_date}
                          onChange={(e) => setTransportTiming({ ...transportTiming, end_date: e.target.value })}
                          style={S.input}
                        />
                        <input
                          type="time"
                          value={transportTiming.end_time}
                          onChange={(e) => setTransportTiming({ ...transportTiming, end_time: e.target.value })}
                          style={{ ...S.input, width: '100px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.transports.map((trans) => {
                    const isSelected = selectedTransport?.id === trans.id;
                    return (
                      <div key={trans.id} style={{ ...S.card, border: isSelected ? '2px solid #D4AF37' : S.card.border }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{trans.icon || '🚐'}</div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{trans.name_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{trans.desc_en}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{trans.rate_per_day} EGP <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ day</span></span>
                          <button
                            onClick={() => setInspectingItem({ item: trans, category: 'transport' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedTransport(isSelected ? null : trans)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: isSelected ? '#10b981' : '#D4AF37',
                            color: isSelected ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ Vehicle Selected' : 'Select Vehicle'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 5. DINING & FEASTS ─── */}
            {activeCategory === 'dining' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {catalog.meals.map((meal) => {
                    const isSelected = selectedMeal?.id === meal.id;
                    return (
                      <div key={meal.id} style={{ ...S.card, border: isSelected ? '2px solid #D4AF37' : S.card.border }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{meal.icon || '🍽️'}</div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>{meal.name_en}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>{meal.desc_en}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{meal.price_per_person} EGP <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ person</span></span>
                          <button
                            onClick={() => setInspectingItem({ item: meal, category: 'dining' })}
                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Inspect &rarr;
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedMeal(isSelected ? null : meal)}
                          style={{
                            width: '100%', padding: '0.75rem',
                            background: isSelected ? '#10b981' : '#D4AF37',
                            color: isSelected ? '#fff' : '#000',
                            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ Dining Selected' : 'Choose Dining'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* "+ Add Custom Selection" Button (Crowdsourced Ingestion) */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.4rem' }}>
                Looking for an unlisted desert camp, hot spring, or special experience?
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1rem' }}>
                Add your custom wish directly to your itinerary. Our local team will arrange it with verified providers and review it for our official catalog.
              </p>
              <button
                onClick={() => setShowCustomWishModal(true)}
                style={{
                  background: 'rgba(236,72,153,0.12)', color: '#ec4899',
                  border: '1px solid rgba(236,72,153,0.3)', padding: '0.65rem 1.5rem',
                  borderRadius: '30px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <i className="fas fa-plus" /> + Add Custom {activeCategory} Selection
              </button>
            </div>
          </div>

          {/* RIGHT: Sticky Live Itinerary Manifest & Reservation Form */}
          <div style={{ position: 'sticky', top: '5.5rem' }}>
            <div style={{ ...S.card, border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                  Journey Manifest
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 800 }}>
                  {pricingSummary.parentCount} Selected
                </span>
              </div>

              {/* Guests Count Controls */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', background: '#0a0d14', padding: '0.75rem', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Adults</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', width: '100%', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Children (50%)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Itinerary Timeline List */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
                {selectedStay && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🏨 {selectedStay.name_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{stayTiming.start_date} ({nightsCount} nights)</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((selectedStay.price_per_night || 0) * nightsCount).toLocaleString()} EGP</span>
                  </div>
                )}

                {selectedTours.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🚙 {t.item.title_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.timing.start_date} at {t.timing.start_time}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((t.item.base_price_egp || 0) * (adults + children * 0.5)).toLocaleString()} EGP</span>
                  </div>
                ))}

                {selectedTransport && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🚐 {selectedTransport.name_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{transportTiming.start_date} ({transportDays} days)</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((selectedTransport.rate_per_day || 0) * transportDays).toLocaleString()} EGP</span>
                  </div>
                )}

                {selectedMeal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>🍽️ {selectedMeal.name_en}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{mealTiming.start_date} at {mealTiming.start_time}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{((selectedMeal.price_per_person || 0) * (adults + children * 0.5)).toLocaleString()} EGP</span>
                  </div>
                )}

                {customWishes.map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#ec4899' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>✨ {w.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{w.start_date} (Custom Wish)</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Admin Quote</span>
                  </div>
                ))}

                {pricingSummary.parentCount === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                    No items selected yet. Choose accommodations or tours above.
                  </div>
                )}
              </div>

              {/* Pricing Totals */}
              <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  <span>Subtotal:</span>
                  <span>{pricingSummary.subtotal.toLocaleString()} EGP</span>
                </div>
                {pricingSummary.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>Combo Discount ({pricingSummary.discountPercent}%):</span>
                    <span>-{pricingSummary.discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#fff', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Estimated Total:</span>
                  <span style={{ color: '#10b981' }}>{pricingSummary.finalTotal.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Customer Contact Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={S.input}
                />
                <input
                  type="tel"
                  placeholder="WhatsApp / Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={S.input}
                />
              </div>

              {/* Dispatch Button */}
              <button
                onClick={handleDispatchReservation}
                disabled={isSubmitting || pricingSummary.parentCount === 0}
                style={{
                  width: '100%', padding: '1rem',
                  background: pricingSummary.parentCount === 0 ? '#1e293b' : 'linear-gradient(135deg, #D4AF37, #f0c842)',
                  color: pricingSummary.parentCount === 0 ? '#64748b' : '#000',
                  border: 'none', borderRadius: '50px', fontWeight: 900, fontSize: '0.9rem',
                  cursor: pricingSummary.parentCount === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: pricingSummary.parentCount > 0 ? '0 10px 25px rgba(212,175,55,0.25)' : 'none',
                }}
              >
                {isSubmitting ? (
                  <span><i className="fas fa-spinner fa-spin" /> Dispatching...</span>
                ) : (
                  <span><i className="fab fa-whatsapp" /> Reserve & Dispatch Itinerary</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SIDE-PART INSPECTOR DRAWER ("sidepart") ────────────────────────── */}
      {inspectingItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        }}>
          {/* Backdrop click to dismiss */}
          <div
            onClick={() => setInspectingItem(null)}
            style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
          />

          {/* Slide Drawer Panel */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: '460px', height: '100%',
            background: '#111520', borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: '2.5rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxShadow: '-20px 0 50px rgba(0,0,0,0.8)',
            animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={S.goldBadge}>
                  {inspectingItem.category.toUpperCase()} DETAILS
                </span>
                <button
                  onClick={() => setInspectingItem(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              {inspectingItem.item.image && (
                <img
                  src={inspectingItem.item.image}
                  alt="Offering Preview"
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '1.5rem' }}
                />
              )}

              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem' }}>
                {inspectingItem.item.title_en || inspectingItem.item.name_en}
              </h3>
              {(inspectingItem.item.title_ar || inspectingItem.item.name_ar) && (
                <div style={{ fontSize: '0.95rem', color: '#D4AF37', fontWeight: 700, marginBottom: '1rem' }} dir="rtl">
                  {inspectingItem.item.title_ar || inspectingItem.item.name_ar}
                </div>
              )}

              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {inspectingItem.item.highlight_en || inspectingItem.item.desc_en}
              </p>

              <div style={{ background: '#0a0d14', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  INCLUDED HIGHLIGHTS & AMENITIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <div><i className="fas fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }} /> Direct provider WhatsApp verification</div>
                  <div><i className="fas fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }} /> Flexible timing adjustment</div>
                  <div><i className="fas fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }} /> Local English / Arabic speaking guidance</div>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => {
                  if (inspectingItem.category === 'accommodation') setSelectedStay(inspectingItem.item);
                  else if (inspectingItem.category === 'safaris') handleToggleTour(inspectingItem.item);
                  else if (inspectingItem.category === 'transport') setSelectedTransport(inspectingItem.item);
                  else if (inspectingItem.category === 'dining') setSelectedMeal(inspectingItem.item);
                  setInspectingItem(null);
                }}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: '#D4AF37', color: '#000',
                  border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '0.9rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <i className="fas fa-plus" /> Select & Add to My Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD CUSTOM SELECTION (+ CROWDSOURCED INGESTION) ─────────── */}
      {showCustomWishModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#111520', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                Add Custom {activeCategory.toUpperCase()} Wish
              </h3>
              <button onClick={() => setShowCustomWishModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Custom Place or Experience Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Private Sunset at Fatnas Island or Sand Bath at Dakrour"
                  value={wishInput.title}
                  onChange={(e) => setWishInput({ ...wishInput, title: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Target Date</label>
                  <input
                    type="date"
                    value={wishInput.start_date}
                    onChange={(e) => setWishInput({ ...wishInput, start_date: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Preferred Time</label>
                  <input
                    type="time"
                    value={wishInput.start_time}
                    onChange={(e) => setWishInput({ ...wishInput, start_time: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Special Requirements or Details</label>
                <textarea
                  rows={2}
                  placeholder="Tell us what you have in mind (e.g. bonfire, private musician, photography)..."
                  value={wishInput.notes}
                  onChange={(e) => setWishInput({ ...wishInput, notes: e.target.value })}
                  style={{ ...S.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCustomWishModal(false)}
                  style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomWish}
                  style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Add Wish to Itinerary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Injected CSS Keyframes */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.2); }
          50% { box-shadow: 0 0 30px rgba(212,175,55,0.45); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
