'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Market { id: string; slug: string; name_en: string; name_ar: string; }
interface Location { id: string; market_id: string | null; name_en: string; name_ar: string; type: string; }
interface Developer { id: string; slug: string; name: string; name_ar: string | null; }
interface Development { id: string; slug: string; name: string; developer_id: string; market_id: string; }

type AssetType = 'real_estate' | 'hospitality' | 'tour' | 'restaurant';

export default function UniversalMinisiteBuilderPage() {
  const [isArabic, setIsArabic] = useState(true);
  const [assetType, setAssetType] = useState<AssetType>('real_estate');

  // Metadata
  const [markets, setMarkets] = useState<Market[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

  // Form state
  const [marketId, setMarketId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [developerId, setDeveloperId] = useState('');
  const [developmentId, setDevelopmentId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [contactPhone, setContactPhone] = useState('+201012345678');
  const [contactWhatsapp, setContactWhatsapp] = useState('+201012345678');

  // Dynamic Specs based on Asset Type
  const [specs, setSpecs] = useState<Record<string, any>>({
    // Real Estate
    listingKind: 'sale',
    unitType: 'chalet',
    price: '4500000',
    areaSqm: '125',
    bedrooms: '2',
    bathrooms: '2',
    downPaymentPct: '10',
    installmentYears: '7',
    finishing: 'fully_finished',
    furnished: false,
    // Hospitality
    roomType: 'deluxe_suite',
    pricePerNight: '2200',
    mealPlan: 'breakfast_included',
    maxGuests: '2',
    bedType: 'king',
    viewType: 'sea_salt_lake',
    // Tour
    tourDurationHours: '8',
    tourDifficulty: 'moderate',
    pricePerPerson: '1200',
    transportIncluded: true,
    mealsIncluded: true,
    meetingPoint: 'City Center / Hotel Pickup',
    // Restaurant
    cuisineType: 'authentic_siwan_bedouin',
    tableCapacity: '4',
    avgPricePerPerson: '450',
    outdoorSeating: true,
    traditionalFloorSeating: true,
  });

  useEffect(() => {
    fetch('/api/admin/universal-minisite-builder/metadata')
      .then(r => r.json())
      .then(d => {
        if (d.markets) {
          setMarkets(d.markets);
          if (d.markets.length > 0) setMarketId(d.markets[0].slug);
        }
        if (d.locations) setLocations(d.locations);
        if (d.developers) setDevelopers(d.developers);
        if (d.developments) setDevelopments(d.developments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter developments based on selected market
  const filteredDevelopments = developments.filter(
    dev => !marketId || dev.market_id === marketId || !dev.market_id
  );

  // Filter locations based on market
  const filteredLocations = locations.filter(
    loc => !marketId || loc.market_id === marketId || !loc.market_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedResult(null);

    try {
      const res = await fetch('/api/admin/universal-minisite-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          marketId,
          locationId,
          developmentId,
          developerId,
          nameEn,
          nameAr,
          slug,
          descriptionEn,
          descriptionAr,
          coverImage: coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
          specs,
          contactPhone,
          contactWhatsapp
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create minisite');
      setCreatedResult(data);
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const ASSET_TABS = [
    { id: 'real_estate', labelAr: '🏢 وحدة عقارية (بيع / إيجار)', labelEn: '🏢 Property Unit (Sale/Rent)', icon: 'fa-building' },
    { id: 'hospitality', labelAr: '🏨 غرفة فندق / شقة / لودج', labelEn: '🏨 Hotel Room / Lodge / Stay', icon: 'fa-bed' },
    { id: 'tour', labelAr: '🐪 جولة سياحية / رحلة سفاري', labelEn: '🐪 Tour / Desert Safari', icon: 'fa-compass' },
    { id: 'restaurant', labelAr: '🍽️ مطعم / طاولة طعام', labelEn: '🍽️ Restaurant / Table Booking', icon: 'fa-utensils' },
  ];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        fontFamily: isArabic ? "'Cairo', 'Segoe UI', system-ui, sans-serif" : "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800 }}>
              {isArabic ? '← لوحة الإدارة العامة' : '← Admin Portal'}
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
              {isArabic ? 'المعالج الذكي الشامل للمواقع المصغرة' : 'Universal Minisite Builder'}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            {isArabic ? 'استوديو إنشاء المواقع المصغرة متعدد المدن والأنشطة' : 'Universal Multi-City Minisite Builder'}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            {isArabic
              ? 'إنشاء مواقع مصغرة تفاعلية لكافة المحافظات والمدن: وحدات عقارية، غرف فندقية وكامبات، جولات وسفاري، وحجوزات مطاعم.'
              : 'Create interactive minisites across all cities: Real estate units, hotel rooms/lodges, desert safari tours, and restaurant dining.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsArabic(!isArabic)}
          style={{
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#92702a',
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {isArabic ? 'English View' : 'الواجهة العربية'}
        </button>
      </div>

      {/* Asset Type Switcher */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {ASSET_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAssetType(tab.id as AssetType);
              setCreatedResult(null);
            }}
            style={{
              padding: '1.1rem 1rem',
              borderRadius: '16px',
              border: assetType === tab.id ? '2px solid #D4AF37' : '1px solid #e2e8f0',
              background: assetType === tab.id ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(240,200,66,0.06))' : '#fff',
              color: assetType === tab.id ? '#92400e' : '#334155',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: assetType === tab.id ? '0 8px 20px rgba(212,175,55,0.18)' : '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
              textAlign: isArabic ? 'right' : 'left'
            }}
          >
            {isArabic ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Success Banner */}
      {createdResult && (
        <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#065f46' }}>
              ✓ {isArabic ? 'تم إنشاء الموقع المصغر بنجاح وبدأ نشره فورياً!' : 'Minisite successfully created and published!'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '4px' }}>
              {isArabic ? 'الرابط العام:' : 'Public Minisite URL:'}{' '}
              <strong style={{ direction: 'ltr', display: 'inline-block' }}>{window.location.origin}{createdResult.publicUrl}</strong>
            </div>
          </div>
          <Link
            href={createdResult.publicUrl}
            target="_blank"
            style={{
              background: '#047857',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(4,120,87,0.25)'
            }}
          >
            <i className="fas fa-external-link-alt" /> {isArabic ? 'زيارة الموقع المصغر الآن' : 'View Minisite Live'}
          </Link>
        </div>
      )}

      {/* Split-Screen: Left Form | Right Live Minisite Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT: Unified Form */}
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #eef0f5', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {isArabic ? '1. الموقع الجغرافي والمدينة / المحافظة' : '1. Geographic Location & Market City'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Market */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {isArabic ? 'المدينة / السوق الرئيسي *' : 'Market / City Region *'}
              </label>
              <select
                value={marketId}
                onChange={e => setMarketId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                {markets.map(m => (
                  <option key={m.id} value={m.slug}>
                    {isArabic ? m.name_ar : m.name_en} ({m.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* City / District Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {isArabic ? 'الحي / المنطقة المحددة' : 'Specific District / Sub-location'}
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600 }}
              >
                <option value="">{isArabic ? '-- اختر المنطقة / الحي --' : '-- Choose District / Town --'}</option>
                {filteredLocations.map(l => (
                  <option key={l.id} value={l.id}>
                    {isArabic ? l.name_ar : l.name_en} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Real Estate: Developer & Compound */}
          {assetType === 'real_estate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#fdfbf5', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {isArabic ? 'المطور العقاري' : 'Real Estate Developer'}
                </label>
                <select
                  value={developerId}
                  onChange={e => setDeveloperId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="">{isArabic ? '-- مطور مستقل / غير محدد --' : '-- Independent / Unspecified --'}</option>
                  {developers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.name_ar ? `(${d.name_ar})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {isArabic ? 'المشروع / الكمبوند' : 'Compound / Master Project'}
                </label>
                <select
                  value={developmentId}
                  onChange={e => setDevelopmentId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="">{isArabic ? '-- وحدة قائمة بذاتها / خارج كمبوند --' : '-- Standalone Project --'}</option>
                  {filteredDevelopments.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Titles & Description */}
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {isArabic ? '2. المسمى التجاري والوصف الجذاب' : '2. Minisite Title & Narrative'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {isArabic ? 'الاسم بالعربية *' : 'Arabic Name *'}
              </label>
              <input
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder={
                  assetType === 'real_estate' ? 'مثال: شاليه فاخر بحديقة خاصة - مراسي' :
                  assetType === 'hospitality' ? 'مثال: جناح النخيل الكبريتي الفاخر - لودج شالي' :
                  assetType === 'tour' ? 'مثال: سفاري بحر الرمال الأعظم والتخييم الفلكي' :
                  'مثال: مطعم خيمة واحة سيوة للأطباق البدوية'
                }
                required
                style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {isArabic ? 'الاسم بالإنجليزية (اختياري)' : 'English Name'}
              </label>
              <input
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                placeholder="e.g. Luxury Private Garden Chalet"
                style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, direction: 'ltr' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              {isArabic ? 'الوصف التسويقي للنشاط' : 'Marketing Overview'}
            </label>
            <textarea
              rows={3}
              value={descriptionAr}
              onChange={e => setDescriptionAr(e.target.value)}
              placeholder={isArabic ? 'أدخل وصفاً تفصيلياً يبرز أهم مزايا الوحدة أو التجربة للزوار...' : 'Enter narrative description...'}
              style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 }}
            />
          </div>

          {/* DYNAMIC SPECS SECTION */}
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {isArabic ? '3. المواصفات الفنية والشروط المالية' : '3. Technical Specs & Pricing'}
          </h3>

          {/* 🏢 REAL ESTATE SPECS */}
          {assetType === 'real_estate' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>نوع الطرح</label>
                <select
                  value={specs.listingKind}
                  onChange={e => setSpecs({ ...specs, listingKind: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="sale">للبيع (تمليك)</option>
                  <option value="rent_month">للإيجار الشهري</option>
                  <option value="rent_night">للإيجار اليومي الفندقي</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>السعر الإجمالي (EGP)</label>
                <input
                  type="number"
                  value={specs.price}
                  onChange={e => setSpecs({ ...specs, price: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>المساحة (م²)</label>
                <input
                  type="number"
                  value={specs.areaSqm}
                  onChange={e => setSpecs({ ...specs, areaSqm: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>المقدم (%)</label>
                <input
                  type="number"
                  value={specs.downPaymentPct}
                  onChange={e => setSpecs({ ...specs, downPaymentPct: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>سنوات التقسيط</label>
                <input
                  type="number"
                  value={specs.installmentYears}
                  onChange={e => setSpecs({ ...specs, installmentYears: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>حالة الفرش</label>
                <select
                  value={specs.furnished ? '1' : '0'}
                  onChange={e => setSpecs({ ...specs, furnished: e.target.value === '1' })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="0">فارغة بدون أثاث (Unfurnished)</option>
                  <option value="1">مفروشة بالكامل (Furnished)</option>
                </select>
              </div>
            </div>
          )}

          {/* 🏨 HOSPITALITY SPECS */}
          {assetType === 'hospitality' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>سعر الليلة (EGP)</label>
                <input
                  type="number"
                  value={specs.pricePerNight}
                  onChange={e => setSpecs({ ...specs, pricePerNight: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>خطة الوجبات</label>
                <select
                  value={specs.mealPlan}
                  onChange={e => setSpecs({ ...specs, mealPlan: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="breakfast_included">إفطار مشمول (B&amp;B)</option>
                  <option value="half_board">إفطار وعشاء (Half Board)</option>
                  <option value="room_only">إقامة فقط بدون وجبات</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>الحد الأقصى للنزلاء</label>
                <input
                  type="number"
                  value={specs.maxGuests}
                  onChange={e => setSpecs({ ...specs, maxGuests: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
            </div>
          )}

          {/* 🐪 TOUR SPECS */}
          {assetType === 'tour' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>سعر الفرد (EGP)</label>
                <input
                  type="number"
                  value={specs.pricePerPerson}
                  onChange={e => setSpecs({ ...specs, pricePerPerson: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>مدة الجولة (بالساعات)</label>
                <input
                  type="number"
                  value={specs.tourDurationHours}
                  onChange={e => setSpecs({ ...specs, tourDurationHours: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>سيارات الدفع الرباعي 4x4</label>
                <select
                  value={specs.transportIncluded ? '1' : '0'}
                  onChange={e => setSpecs({ ...specs, transportIncluded: e.target.value === '1' })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="1">مشمولة مع سائق خبير</option>
                  <option value="0">غير مشمولة (تجمع في الموقع)</option>
                </select>
              </div>
            </div>
          )}

          {/* 🍽️ RESTAURANT SPECS */}
          {assetType === 'restaurant' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>نوع المطبخ</label>
                <input
                  value={specs.cuisineType}
                  onChange={e => setSpecs({ ...specs, cuisineType: e.target.value })}
                  placeholder="مأكولات بدوية واحاتية"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>متوسط تكلفة الوجبة (EGP)</label>
                <input
                  type="number"
                  value={specs.avgPricePerPerson}
                  onChange={e => setSpecs({ ...specs, avgPricePerPerson: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>جلسات بدوية حول النار</label>
                <select
                  value={specs.traditionalFloorSeating ? '1' : '0'}
                  onChange={e => setSpecs({ ...specs, traditionalFloorSeating: e.target.value === '1' })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="1">متاحة (جلسة عربي واحاتية)</option>
                  <option value="0">طاولات طعام عادية</option>
                </select>
              </div>
            </div>
          )}

          {/* Contact Routing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                رقم الواتساب المباشر للحجز
              </label>
              <input
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
                placeholder="+201012345678"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, direction: 'ltr' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                رابط صورة الغلاف
              </label>
              <input
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, direction: 'ltr' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #D4AF37 0%, #b45309 100%)',
              color: '#0f172a',
              border: 'none',
              padding: '1rem',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 900,
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <i className="fas fa-rocket" />
            {submitting ? (isArabic ? 'جاري بناء ونشر الموقع المصغر...' : 'Publishing Minisite...') : (isArabic ? '🚀 إطلاق ونشر الموقع المصغر فورياً' : '🚀 Launch Minisite Live')}
          </button>
        </form>

        {/* RIGHT: Live Responsive Phone Simulator */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.78rem', fontWeight: 800, color: '#64748b' }}>
            📱 {isArabic ? 'معاينة حية فورية لشكل الموقع المصغر للعملاء' : 'Live Real-Time Minisite Viewport Simulator'}
          </div>

          <div style={{
            width: '380px',
            margin: '0 auto',
            background: '#0f172a',
            borderRadius: '40px',
            padding: '12px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
            border: '4px solid #1e293b'
          }}>
            {/* Phone Screen Container */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '32px',
              overflow: 'hidden',
              minHeight: '620px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header Image */}
              <div style={{
                height: '180px',
                background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'}) center/cover`,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(212,175,55,0.9)', color: '#1a1000', padding: '3px 10px', borderRadius: '12px', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {assetType.replace('_', ' ')}
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 8px', borderRadius: '10px', fontSize: '0.62rem' }}>
                    📍 {marketId || 'Siwa Oasis'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1.2 }}>
                    {nameAr || nameEn || (isArabic ? 'اسم الموقع المصغر' : 'Minisite Title')}
                  </div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '2px' }}>
                    {locationId || marketId || 'Egypt'}
                  </div>
                </div>
              </div>

              {/* Specs Pills Strip */}
              <div style={{ padding: '0.85rem', display: 'flex', gap: '6px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                {assetType === 'real_estate' && (
                  <>
                    <span style={{ background: '#fefce8', border: '1px solid #fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      💰 {Number(specs.price || 0).toLocaleString()} EGP
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      📐 {specs.areaSqm || 120} م²
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🗓️ {specs.installmentYears || 7} سنوات تقسيط
                    </span>
                  </>
                )}
                {assetType === 'hospitality' && (
                  <>
                    <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      🌙 {specs.pricePerNight} EGP / ليلة
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      👥 أقصى نزلاء: {specs.maxGuests}
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🍳 {specs.mealPlan}
                    </span>
                  </>
                )}
                {assetType === 'tour' && (
                  <>
                    <span style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', color: '#9d174d', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      🐪 {specs.pricePerPerson} EGP / فرد
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ⏱️ {specs.tourDurationHours} ساعات
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🚙 سيارات 4x4
                    </span>
                  </>
                )}
                {assetType === 'restaurant' && (
                  <>
                    <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      🍽️ متوسط الوجبة: {specs.avgPricePerPerson} EGP
                    </span>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🔥 جلسة بدوية
                    </span>
                  </>
                )}
              </div>

              {/* Description preview */}
              <div style={{ padding: '1rem', flex: 1, background: '#fff' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  عن هذا العرض
                </div>
                <p style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                  {descriptionAr || 'وصف الموقع المصغر يظهر هنا مباشرة مع كافة التفاصيل والمميزات لجذب المهتمين.'}
                </p>
              </div>

              {/* Sticky Action CTA */}
              <div style={{ padding: '0.85rem', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <a
                  href={`https://wa.me/${(contactWhatsapp || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#16a34a',
                    color: '#fff',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                  }}
                >
                  <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                  {assetType === 'real_estate' ? 'استفسار وحجز معاينة عبر واتساب' :
                   assetType === 'hospitality' ? 'حجز الإقامة عبر واتساب' :
                   assetType === 'tour' ? 'حجز الجولة فوراً' :
                   'حجز طاولة في المطعم'}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
