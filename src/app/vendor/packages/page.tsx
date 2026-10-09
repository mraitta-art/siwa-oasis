'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VendorOfferingStoryStudioModal from '@/components/VendorOfferingStoryStudioModal';

interface Package {
  id: string;
  package_name: string;
  package_type: 'bundle' | 'tier' | 'service_package' | 'combo' | 'package' | 'program';
  category?: string;
  base_price: number;
  package_price: number;
  savings_percentage: number;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  quantity_sold: number;
  quantity_available: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  valid_until: string;
  assigned_role?: string;
  revenue_share_pct?: number;
  is_syndicated?: boolean;
  is_composed_bundle?: boolean;
  included_services?: string[];
  highlights?: string[];
  pricing?: any;
}

type VendorCategory = 'hotel' | 'safari' | 'restaurant' | 'wellness' | 'tour_operator' | 'general';

const CATEGORY_PRESETS: Record<VendorCategory, Array<{
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  base_price: number;
  package_price: number;
  duration_days: number;
  highlights_en: string[];
  highlights_ar: string[];
  services?: string[];
}>> = {
  hotel: [
    {
      name_en: '3-Night Romantic Desert Camp Retreat',
      name_ar: 'إقامة ٣ ليالٍ رومانسية في مخيم صحراوي',
      desc_en: 'Exclusive chalet or luxury glamping with organic breakfast and complimentary sunset tea.',
      desc_ar: 'شاليه خاص أو خيمة فندقية فاخرة شاملة الإفطار العضوي وشاي الغروب السيوي.',
      base_price: 300,
      package_price: 240,
      duration_days: 3,
      highlights_en: ['3 Nights Lodging', 'Daily Organic Breakfast', 'Free Late Checkout', 'Welcome Siwan Dates'],
      highlights_ar: ['إقامة ٣ ليالٍ', 'إفطار عضوي يومي', 'تسجيل خروج متأخر مجاناً', 'ضيافة التمر السيوي'],
    },
    {
      name_en: 'Weekend Eco-Lodge & Salt Pool Pass',
      name_ar: 'باقة نهاية الأسبوع في نزل بيئي مع مسبح الملح',
      desc_en: '2 Nights stay in authentic mud-brick lodge with salt lake access and campfire nights.',
      desc_ar: 'إقامة ليلتين في نزل بيئي من الكرشيف مع دخول بحيرات الملح وسهرات النار.',
      base_price: 180,
      package_price: 145,
      duration_days: 2,
      highlights_en: ['2 Nights Eco-Lodge', 'Private Salt Pool', 'Campfire Evening'],
      highlights_ar: ['ليلتان في نزل بيئي', 'مسبح ملحي خاص', 'سهرة سمر حول النار'],
    },
  ],
  safari: [
    {
      name_en: 'Great Sand Sea 4x4 Safari & Sandboarding',
      name_ar: 'سفاري بحر الرمال الأعظم 4x4 مع التزلج على الرمال',
      desc_en: 'Thrilling deep desert dune bashing with professional Land Cruiser driver, sandboards, and sunset Bedouin tea.',
      desc_ar: 'مغامرة الكثبان الرملية العميقة بسيارة لاندكروزر مجهزة ومعدات تزلج وشاي بدوي عند الغروب.',
      base_price: 120,
      package_price: 95,
      duration_days: 1,
      highlights_en: ['Private 4x4 Land Cruiser', 'Sandboarding Boards Included', 'Bir Wahed Hot Spring Stop', 'Sunset Bedouin Tea'],
      highlights_ar: ['سيارة لاندكروزر 4x4 خاصة', 'معدات تزلج رملي مجانية', 'زيارة عين بئر واحد الكبريتية', 'شاي بدوي عند الغروب'],
    },
    {
      name_en: 'Cairo to Siwa Private Direct Transfer + City Tour',
      name_ar: 'توصيل خاص مباشر من القاهرة لسيوة مع جولة تعريفية',
      desc_en: 'Comfortable air-conditioned private vehicle from Cairo/Alexandria to Siwa with Shali Fortress tour.',
      desc_ar: 'سيارة مكيفة ومريحة وسائق محترف مباشرة من القاهرة/الإسكندرية لسيوة مع جولة لقلعة شالي.',
      base_price: 250,
      package_price: 210,
      duration_days: 1,
      highlights_en: ['Door-to-Door Private Transport', 'Complimentary Bottled Water & Snacks', 'Introductory Shali Tour'],
      highlights_ar: ['توصيل خاص من الباب للباب', 'مشروبات وضيافة مجانية بالسيارة', 'جولة تعريفية بقلعة شالي'],
    },
  ],
  restaurant: [
    {
      name_en: 'Palm Grove Candlelit Bedouin Feast',
      name_ar: 'عشاء بدوي فاخر على ضوء الشموع في واحة النخيل',
      desc_en: 'Traditional roasted lamb, tajines, fresh garden salads, Siwan bread, and herbal mint tea under the stars.',
      desc_ar: 'وليمة سيوية تقليدية تشمل لحم ردم وطواجن خضار وخبز بلدي وشاي سيوي فاخر تحت النجوم.',
      base_price: 60,
      package_price: 45,
      duration_days: 1,
      highlights_en: ['Full Traditional Dinner Course', 'Romantic Candlelit Setup', 'Live Oud/Bedouin Music', 'Fresh Dates Dessert'],
      highlights_ar: ['وجبة عشاء كاملة متعددة الأصناف', 'جلسة رومانسية على ضوء الشموع', 'موسيقى بدوية حية', 'تحلية تمور وفواكه طازجة'],
    },
  ],
  wellness: [
    {
      name_en: 'Healing Salt Floatation & Hot Sulfur Bath Pass',
      name_ar: 'باقة الطفو ببحيرات الملح وحمام العيون الكبريتية',
      desc_en: 'Deep physical rejuvenation in hyper-saline salt pools followed by Cleopatra warm mineral sulfur spring dip.',
      desc_ar: 'استرخاء علاجي كامل ببحيرات الملح فائقة النقاوة مع حمام استشفائي بعين كليوباترا الكبريتية.',
      base_price: 50,
      package_price: 35,
      duration_days: 1,
      highlights_en: ['Natural Salt Lake Float Session', 'Natural Mineral Skin Scrub', 'Cleopatra Spring Access', 'Towels & Robes Included'],
      highlights_ar: ['جلسة طفو ببحيرات الملح', 'صنفرة طبيعية بالمعادن', 'دخول عين كليوباترا', 'مناشف وأردية استحمام معقمة'],
    },
  ],
  tour_operator: [
    {
      name_en: '4-Day Ultimate All-Inclusive Siwa Oasis Expedition',
      name_ar: 'رحلة سيوة الشاملة المتكاملة (٤ أيام / ٣ ليالٍ)',
      desc_en: 'Complete turnkey package combining 3-night luxury camp, 4x4 desert safari, salt lake floatation, Bedouin feasts, and private guide.',
      desc_ar: 'باقة متكاملة كلياً تجمع بين إقامة المخيم الفاخر، سفاري الرمال 4x4، بحيرات الملح، العشاء البدوي، ومرشد سياحي خاص.',
      base_price: 490,
      package_price: 390,
      duration_days: 4,
      highlights_en: ['3 Nights Eco-Resort Lodging', 'Great Sand Sea 4x4 Safari', 'Salt Lake Wellness Session', 'All Meals & Bedouin Dinners', 'Private Local Guide'],
      highlights_ar: ['إقامة ٣ ليالٍ في منتجع بيئي', 'سفاري بحر الرمال بسيارات 4x4', 'جلسة استشفاء بحيرات الملح', 'جميع الوجبات والعشاء البدوي', 'مرشد محلي مرافق طوال الرحلة'],
      services: ['Hotel Lodging', '4x4 Desert Safari', 'Dining & Feasts', 'Salt Lake Wellness', 'Local Guiding'],
    },
  ],
  general: [
    {
      name_en: 'Special Experience Pass & Local Discount',
      name_ar: 'بطاقة تجربة مميزة مع خصم مباشر',
      desc_en: 'Enjoy special promotional rates and direct priority booking.',
      desc_ar: 'تمتع بأسعار ترويجية خاصة وأولوية الحجز المباشر.',
      base_price: 100,
      package_price: 80,
      duration_days: 1,
      highlights_en: ['Priority Booking', 'Direct Vendor WhatsApp', '100% Satisfaction Guarantee'],
      highlights_ar: ['أولوية الحجز', 'تواصل مباشر عبر الواتساب', 'ضمان الخدمة المتميزة'],
    },
  ],
};

const PKG_CSS = `
  .vp-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .vp-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .vp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
  .vp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }

  .vp-badge {
    font-size: 0.6rem; font-weight: 900; padding: 3px 9px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;
  }
  .vp-badge.active { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
  .vp-badge.draft { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
  .vp-badge.featured { background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); }
  .vp-badge.bundle { background: rgba(99,102,241,0.12); color: #4f46e5; border: 1px solid rgba(99,102,241,0.3); }

  .vp-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.65);
    backdrop-filter: blur(5px); z-index: 500;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .vp-modal {
    background: #fff; border-radius: 24px; padding: 2rem;
    max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  }
`;

export default function VendorPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Form State with Category Adaptation
  const [category, setCategory] = useState<VendorCategory>('general');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgNameAr, setNewPkgNameAr] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');
  const [newPackageType, setNewPackageType] = useState<'package' | 'program' | 'bundle'>('package');
  const [newProgramType, setNewProgramType] = useState<'experience' | 'wellness' | 'retreat' | 'adventure'>('experience');
  const [newDuration, setNewDuration] = useState('1');
  const [newAudience, setNewAudience] = useState('All travelers');
  const [newDescription, setNewDescription] = useState('');
  const [newDescriptionAr, setNewDescriptionAr] = useState('');
  const [newHighlights, setNewHighlights] = useState<string[]>(['', '', '']);
  const [isComposedBundle, setIsComposedBundle] = useState(false);
  const [includedServices, setIncludedServices] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(d => {
        if (d?.business) {
          setSlug(d.business.slug || d.business.id || '');
          setBusinessName(d.business.name || '');
          setVendorPhone(d.business.vendor_phone || d.business.phone || '');
          // Detect category from business type
          const typeId = String(d.business.type_id || '').toLowerCase();
          if (typeId.includes('hotel') || typeId.includes('camp') || typeId.includes('resort')) setCategory('hotel');
          else if (typeId.includes('safari') || typeId.includes('transport') || typeId.includes('driver')) setCategory('safari');
          else if (typeId.includes('food') || typeId.includes('restaurant') || typeId.includes('cafe')) setCategory('restaurant');
          else if (typeId.includes('wellness') || typeId.includes('salt') || typeId.includes('spa')) setCategory('wellness');
          else if (typeId.includes('tour') || typeId.includes('operator') || typeId.includes('agency')) {
            setCategory('tour_operator');
            setIsComposedBundle(true);
          }
        }
      })
      .catch(() => {});

    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const res = await fetch('/api/vendor/packages');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPackages(Array.isArray(data.packages) ? data.packages : []);
    } catch (error) {
      console.error('Failed to load vendor packages', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  // Apply a 1-click Preset Template
  const applyPreset = (preset: typeof CATEGORY_PRESETS['hotel'][0]) => {
    setNewPkgName(preset.name_en);
    setNewPkgNameAr(preset.name_ar);
    setNewDescription(preset.desc_en);
    setNewDescriptionAr(preset.desc_ar);
    setNewBasePrice(String(preset.base_price));
    setNewPkgPrice(String(preset.package_price));
    setNewDuration(String(preset.duration_days));
    setNewHighlights(lang === 'ar' ? preset.highlights_ar : preset.highlights_en);
    if (preset.services) {
      setIsComposedBundle(true);
      setIncludedServices(preset.services);
    }
  };

  const filtered = packages.filter(p => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'bundles') return p.is_composed_bundle || p.package_type === 'bundle' || p.is_syndicated;
    return p.status === filterStatus;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newPkgName || !newPkgPrice) return;

    const base = Number(newBasePrice) || Number(newPkgPrice);
    const price = Number(newPkgPrice);
    const savings = base > price ? Math.round(((base - price) / base) * 100) : 0;
    const cleanHighlights = newHighlights.filter(h => h.trim().length > 0);

    const payload = {
      name: newPkgName,
      name_ar: newPkgNameAr,
      package_type: isComposedBundle ? 'bundle' : newPackageType,
      program_type: newProgramType,
      category,
      duration_days: Number(newDuration) || 1,
      audience: newAudience || 'All travelers',
      description: newDescription,
      description_ar: newDescriptionAr,
      base_price: base,
      package_price: price,
      savings_percentage: savings,
      status: 'active',
      is_featured: false,
      is_composed_bundle: isComposedBundle,
      included_services: includedServices,
      highlights: cleanHighlights,
      pricing: {
        base_price: base,
        package_price: price,
        savings_percentage: savings,
        package_type: isComposedBundle ? 'bundle' : newPackageType,
        program_type: newProgramType,
        category,
        duration_days: Number(newDuration) || 1,
        audience: newAudience || 'All travelers',
        description: newDescription,
        description_ar: newDescriptionAr,
        name_ar: newPkgNameAr,
        is_composed_bundle: isComposedBundle,
        included_services: includedServices,
        highlights: cleanHighlights,
      },
    };

    try {
      const res = await fetch('/api/vendor/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setShowModal(false);
      setNewPkgName('');
      setNewPkgNameAr('');
      setNewPkgPrice('');
      setNewBasePrice('');
      setNewDescription('');
      setNewDescriptionAr('');
      setNewHighlights(['', '', '']);
      await loadPackages();
    } catch (error) {
      console.error('Failed to save vendor package', error);
      alert(lang === 'ar' ? 'حدث خطأ أثناء حفظ الباقة. يرجى المحاولة ثانية.' : 'Could not save the package. Please try again.');
    }
  }

  const isRTL = lang === 'ar';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PKG_CSS }} />
      <div className="vp-root" style={{ direction: isRTL ? 'rtl' : 'ltr', maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>

        {/* Top Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {isRTL ? 'استوديو الباقات والعروض' : 'PACKAGE & DEAL STUDIO'}
              </span>
              <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                {category.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {isRTL ? '📦 إدارة الباقات والعروض الترويجية' : '📦 Packages, Deals & Composed Bundles'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0', fontWeight: 500 }}>
              {isRTL
                ? 'أنشئ عروض وباقات مخصصة لنشاطك، أو اجمع خدمات الفندق والسفاري والاستشفاء في باقة سياحية متكاملة.'
                : 'Create category-tailored promotions, discount deals, and multi-service tour operator bundles.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🌐 {lang === 'en' ? '🇸🇦 عربي' : '🇬🇧 English'}
            </button>

            {slug && (
              <Link
                href={`/${slug}#sec_9_marketplace_catalog`}
                target="_blank"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#D4AF37',
                  background: '#fdf8ee',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #fde68a',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }} />
                {isRTL ? 'معاينة في الموقع' : 'Preview Live'}
              </Link>
            )}

            <button
              onClick={() => setShowStudioModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: '#f0c842',
                border: '1px solid rgba(212,175,55,0.4)',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              <i className="fas fa-magic" /> {isRTL ? '✦ استوديو الصور والقصص' : '✦ Photos & Story Studio'}
            </button>

            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #f0c842)',
                color: '#1a1000',
                border: 'none',
                padding: '0.6rem 1.4rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(212,175,55,0.3)',
              }}
            >
              <i className="fas fa-plus" /> {isRTL ? 'إضافة باقة جديدة' : 'Create Package'}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label_en: 'All Packages', label_ar: 'جميع الباقات' },
            { id: 'active', label_en: 'Active', label_ar: 'النشطة' },
            { id: 'bundles', label_en: '🧭 Tour Bundles & Combos', label_ar: '🧭 باقات الجولات المجمعة' },
            { id: 'draft', label_en: 'Drafts', label_ar: 'المسودات' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: filterStatus === st.id ? '#0f172a' : '#f1f5f9',
                color: filterStatus === st.id ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              {isRTL ? st.label_ar : st.label_en}
            </button>
          ))}
        </div>

        {/* Package Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
            <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37', marginBottom: '0.75rem' }} />
            <div>{isRTL ? 'جاري تحميل باقات وعروض النشاط...' : 'Loading packages & offers...'}</div>
          </div>
        ) : (
          <div className="vp-grid">
            {filtered.map((pkg) => {
              const currentPrice = pkg.package_price || pkg.base_price;
              const originalPrice = pkg.base_price;
              const hasDiscount = originalPrice > currentPrice;
              const discountPct = pkg.savings_percentage || (hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
              const bookingMsg = encodeURIComponent(
                isRTL
                  ? `مرحباً ${businessName}! أود حجز الباقة: "${pkg.package_name}" بسعر ${currentPrice} EGP.`
                  : `Hello ${businessName}! I'd like to book the package: "${pkg.package_name}" ($${currentPrice}).`
              );
              const waLink = vendorPhone ? `https://wa.me/${vendorPhone.replace(/[^0-9]/g, '')}?text=${bookingMsg}` : '#';

              return (
                <div key={pkg.id} className="vp-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span className={`vp-badge ${pkg.status}`}>
                        {pkg.status === 'active' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'مسودة' : 'Draft')}
                      </span>
                      {pkg.is_composed_bundle && (
                        <span className="vp-badge bundle">
                          🧭 {isRTL ? 'باقة مجمعة' : 'Composed Bundle'}
                        </span>
                      )}
                    </div>
                    {discountPct > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        {discountPct}% {isRTL ? 'توفير' : 'OFF'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                    {pkg.package_name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#D4AF37' }}>
                      ${currentPrice}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ${originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Highlights */}
                  {Array.isArray(pkg.highlights) && pkg.highlights.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                      {pkg.highlights.slice(0, 3).map((hl: string, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="fas fa-check" style={{ color: '#16a34a', fontSize: '0.65rem' }} />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp Direct Test Button */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                      {isRTL ? 'الحجز التلقائي' : 'Instant WhatsApp'}
                    </span>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <i className="fab fa-whatsapp" /> {isRTL ? 'تجربة الحجز' : 'Test Booking'}
                    </a>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fas fa-box-open" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: 800 }}>
                  {isRTL ? 'لم يتم إضافة باقات بعد' : 'No Packages Created Yet'}
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem' }}>
                  {isRTL
                    ? 'اختر قالباً جاهزاً بنقرة واحدة أو صمم باقتك الخاصة.'
                    : 'Choose a 1-click industry preset template or build your custom deal.'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-plus" /> {isRTL ? 'إنشاء أول باقة' : 'Create First Package'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Category-Aware Package Creator & Bundler */}
        {showModal && (
          <div className="vp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="vp-modal" onClick={(e) => e.stopPropagation()} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {isRTL ? 'إنشاء وتخصيص باقة جديدة' : 'Create Industry-Tailored Package'}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {isRTL ? 'خصص الباقة حسب نوع نشاطك أو اجمع عدة خدمات' : 'Configure dynamic fields and 1-click presets by business type'}
                  </span>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              {/* 1. Category Selection Tabs */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                  {isRTL ? 'نوع النشاط / نمط الباقة' : 'BUSINESS CATEGORY & PACKAGE PROFILE'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.4rem' }}>
                  {[
                    { id: 'hotel', icon: 'fa-hotel', label_en: 'Hotels', label_ar: 'فنادق وإقامة' },
                    { id: 'safari', icon: 'fa-truck-monster', label_en: 'Safari 4x4', label_ar: 'سفاري ونقل' },
                    { id: 'restaurant', icon: 'fa-utensils', label_en: 'Dining', label_ar: 'مطاعم' },
                    { id: 'wellness', icon: 'fa-spa', label_en: 'Wellness', label_ar: 'استشفاء' },
                    { id: 'tour_operator', icon: 'fa-compass', label_en: 'Tour Bundler', label_ar: 'منظم رحلات' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id as any);
                        if (cat.id === 'tour_operator') setIsComposedBundle(true);
                      }}
                      style={{
                        padding: '0.55rem 0.4rem',
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: category === cat.id ? '#D4AF37' : '#e2e8f0',
                        background: category === cat.id ? '#fffdf7' : '#f8fafc',
                        color: category === cat.id ? '#0f172a' : '#64748b',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <i className={`fas ${cat.icon}`} style={{ color: category === cat.id ? '#D4AF37' : '#94a3b8' }} />
                      <span>{isRTL ? cat.label_ar : cat.label_en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 1-Click Industry Presets */}
              {CATEGORY_PRESETS[category] && (
                <div style={{ marginBottom: '1.25rem', padding: '0.85rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    ⚡ {isRTL ? 'قوالب جاهزة بنقرة واحدة (Presets):' : '1-Click Ready Presets:'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {CATEGORY_PRESETS[category].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        + {isRTL ? preset.name_ar : preset.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreate}>
                {/* Title (EN & AR) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                      Package Title (English)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3-Night Desert Camp Retreat"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                      عنوان الباقة (بالعربية)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: إقامة ٣ ليالٍ في مخيم صحراوي"
                      value={newPkgNameAr}
                      onChange={(e) => setNewPkgNameAr(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, direction: 'rtl' }}
                    />
                  </div>
                </div>

                {/* Pricing & Discounts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                      {isRTL ? 'السعر المخفض ($)' : 'Discounted Price ($)'}
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="240"
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                      {isRTL ? 'السعر الأصلي ($)' : 'Original Price ($)'}
                    </label>
                    <input
                      type="number"
                      placeholder="300"
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                      {isRTL ? 'المدة (بالأيام)' : 'Duration (Days)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* Highlights List */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    {isRTL ? 'أهم مميزات وشموليات الباقة (Highlights / Inclusions)' : 'Key Inclusions & Highlights'}
                  </label>
                  {newHighlights.map((hl, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`✦ Highlight #${idx + 1}`}
                      value={hl}
                      onChange={(e) => {
                        const updated = [...newHighlights];
                        updated[idx] = e.target.value;
                        setNewHighlights(updated);
                      }}
                      style={{ width: '100%', padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem', marginBottom: '0.35rem' }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewHighlights([...newHighlights, ''])}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    + {isRTL ? 'إضافة ميزة أخرى' : 'Add another highlight'}
                  </button>
                </div>

                {/* Tour Operator Composer: Included Services Checklist */}
                {category === 'tour_operator' && (
                  <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.4rem' }}>
                      🧭 {isRTL ? 'مكونات الحزمة السياحية المجمعة:' : 'Tour Bundler Components:'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {['Hotel Lodging', '4x4 Desert Safari', 'Dining & Feasts', 'Salt Lake Wellness', 'Local Guiding', 'Airport Transfers'].map((svc) => (
                        <label key={svc} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#1e3a8a', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={includedServices.includes(svc)}
                            onChange={(e) => {
                              if (e.target.checked) setIncludedServices([...includedServices, svc]);
                              else setIncludedServices(includedServices.filter((s) => s !== svc));
                            }}
                          />
                          {svc}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                    {isRTL ? 'تفاصيل ووصف الباقة' : 'Description & Itinerary Summary'}
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief highlights or booking conditions..."
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.6rem 1.6rem', borderRadius: '12px', background: '#D4AF37', color: '#1a1000', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
                  >
                    {isRTL ? 'حفظ ونشر الباقة' : 'Publish Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Story Studio Modal ─── */}
        <VendorOfferingStoryStudioModal
          isOpen={showStudioModal}
          onClose={() => setShowStudioModal(false)}
          businessName={businessName}
          businessSlug={slug}
          onItemCreated={() => {
            fetch('/api/vendor/packages')
              .then(res => res.json())
              .then(data => { if (Array.isArray(data)) setPackages(data); })
              .catch(() => {});
          }}
        />

      </div>
    </>
  );
}
