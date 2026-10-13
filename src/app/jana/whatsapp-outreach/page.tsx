'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import WhatsAppFeatureStudioModal from '@/components/WhatsAppFeatureStudioModal';
import WhatsAppTemplateManagerModal from '@/components/WhatsAppTemplateManagerModal';

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  type_id?: string;
  type_name: string;
  type_icon: string;
  parent_type_id?: string;
  parent_type_name?: string;
  parent_type_icon?: string;
  subscription_tier: string;
  published: boolean;
  is_claimed: boolean;
  whatsapp: string;
  phone: string;
  has_whatsapp: boolean;
  vanityUrl: string;
  socialToolkitUrl: string;
  claimUrl: string;
  mobileDashboardUrl: string;
}

interface Stats {
  total: number;
  withWhatsapp: number;
  missingWhatsapp: number;
  claimed: number;
  hasMinisite: number;
}

export default function WhatsAppOutreachPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, withWhatsapp: 0, missingWhatsapp: 0, claimed: 0, hasMinisite: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing' | 'unclaimed' | 'has_minisite'>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [msgLang, setMsgLang] = useState<'ar' | 'en'>('ar');
  
  // Showcase modal state
  const [showcaseBiz, setShowcaseBiz] = useState<{ id: string; name: string } | null>(null);

  // Template Governance Manager state
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  // Targeted Template Dispatch Picker Modal for a specific business
  const [dispatchBiz, setDispatchBiz] = useState<BusinessItem | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Editing contact
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch('/api/jana/whatsapp-templates');
      if (res.ok) {
        const data = await res.json();
        if (data.templates) setTemplates(data.templates);
      }
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  }

  const [authError, setAuthError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await fetch('/api/jana/whatsapp-outreach');
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Failed to load directory. Please sign in as admin.');
        return;
      }
      if (data.businesses) {
        setBusinesses(data.businesses);
        setStats(data.stats);
      }
    } catch (e: any) {
      console.error(e);
      setAuthError(e?.message || 'Error loading outreach directory');
    } finally {
      setLoading(false);
    }
  }

  function getMessageText(biz: BusinessItem, lang: 'ar' | 'en', explicitTemplateId?: string): string {
    // 1. If explicit template ID provided or find matching template in templates list
    let tpl = explicitTemplateId ? templates.find((t) => t.id === explicitTemplateId) : null;
    
    if (!tpl && templates.length > 0) {
      // Find matching template by childTypeId or parentTypeId
      tpl = templates.find((t) => !t.isHidden && t.childTypeId && t.childTypeId === biz.type_id)
        || templates.find((t) => !t.isHidden && t.parentTypeId && t.parentTypeId === biz.parent_type_id)
        || templates.find((t) => !t.isHidden && t.categoryKey === 'general')
        || templates[0];
    }

    if (tpl) {
      const templateStr = lang === 'ar' ? (tpl.contentAr || tpl.contentEn) : (tpl.contentEn || tpl.contentAr);
      if (templateStr) {
        return templateStr
          .replace(/\{name\}/g, biz.name)
          .replace(/\{parentType\}/g, biz.parent_type_name || 'سياحة وضيافة سيوة')
          .replace(/\{childType\}/g, biz.type_name || 'خدمة معتمدة')
          .replace(/\{minisiteUrl\}/g, biz.vanityUrl)
          .replace(/\{mobileDashboardUrl\}/g, biz.mobileDashboardUrl)
          .replace(/\{socialToolkitUrl\}/g, biz.socialToolkitUrl)
          .replace(/\{claimUrl\}/g, biz.claimUrl)
          .replace(/\{photoLinks\}/g, biz.vanityUrl)
          .replace(/\{featureList\}/g, `• حجز مباشر بدون وسيط\n• معتمد وموثق على SiWiFy.com`);
      }
    }

    // Fallback standard message
    if (lang === 'ar') {
      return `أهلاً وسهلاً بيك يا كابتن/صاحب نشاط *${biz.name}*! 🌴✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا جهزنالك كارت وصفحة شخصية مجانية تماماً ليك ولمركبتك/نشاطك في سيوة:\n🏷️ *${biz.parent_type_name || 'خدمات سيوة'} ➔ ${biz.type_name || 'نشاط معتمد'}*\n\n🎁 *خدماتك المجانية المتاحة فوراً على تليفونك:*\n1️⃣ موقعك وكارتك للحجز المباشر (مكسبك كامل في جيبك 0% عمولة): ${biz.vanityUrl}\n2️⃣ تطبيق خفيف على موبايلك لمتابعة مشاويرك وأسعارك: ${biz.mobileDashboardUrl}\n3️⃣ صانع فيديوهات وستوري واتساب باسمك: ${biz.socialToolkitUrl}\n\n🔑 *لتأكيد اسمك واستلام صفحتك مجاناً:*\n👉 ${biz.claimUrl}\n\nلو محتاج أي مساعدة، رد عليا هنا وأنا معاك خطوة بخطوة! 🌿🤝`;
    }

    return `Welcome *${biz.name}*! 🌴✨\nThis is *Jana* from *SiWiFy.com*.\nYour verified digital card & booking page is ready under:\n🏷️ *${biz.parent_type_name || 'Tourism'} ➔ ${biz.type_name || 'Service'}*\n\n🎁 *Your 100% Free Included Tools:*\n1️⃣ Official Minisite (0% Commission): ${biz.vanityUrl}\n2️⃣ Mobile Command Dashboard: ${biz.mobileDashboardUrl}\n3️⃣ Social Video Reels Maker: ${biz.socialToolkitUrl}\n\n🔑 Claim your account: ${biz.claimUrl}\n\nHave a magical journey in Siwa Oasis! 🌿`;
  }

  async function handleSaveContact(bizId: string) {
    try {
      setSavingContact(true);
      const res = await fetch('/api/jana/whatsapp-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizId, whatsapp: editWhatsapp }),
      });
      const data = await res.json();
      if (data.success) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === bizId
              ? {
                  ...b,
                  whatsapp: data.whatsapp,
                  phone: data.phone,
                  has_whatsapp: !!data.whatsapp,
                }
              : b
          )
        );
        setEditingId(null);
        // Refresh stats
        setStats((prev) => ({
          ...prev,
          withWhatsapp: prev.withWhatsapp + (editWhatsapp ? 1 : 0),
          missingWhatsapp: prev.missingWhatsapp - (editWhatsapp ? 1 : 0),
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingContact(false);
    }
  }

  function handleCopyMessage(biz: BusinessItem) {
    const text = getMessageText(biz, msgLang);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(biz.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  function handleSendWhatsApp(biz: BusinessItem) {
    let raw = (biz.whatsapp || biz.phone || '').trim();
    // Normalize phone number to international E.164 format
    let clean = raw.replace(/[^0-9]/g, '');
    if (clean.startsWith('00')) clean = clean.substring(2);
    // If standard Egyptian 11-digit mobile starting with 01 (e.g. 010, 011, 012, 015), prepend country code 2
    if (clean.length === 11 && clean.startsWith('01')) {
      clean = '2' + clean;
    }
    const text = getMessageText(biz, msgLang);
    const url = clean
      ? `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  const filtered = businesses.filter((b) => {
    if (filter === 'ready' && !b.has_whatsapp) return false;
    if (filter === 'missing' && b.has_whatsapp) return false;
    if (filter === 'unclaimed' && b.is_claimed) return false;
    if (filter === 'has_minisite' && !(b as any).has_minisite) return false;

    if (parentFilter !== 'all') {
      const matchParent = (b.parent_type_id || '').toLowerCase() === parentFilter.toLowerCase();
      const matchType = (b.type_id || '').toLowerCase() === parentFilter.toLowerCase();
      if (!matchParent && !matchType) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || b.whatsapp.includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.8rem' }}>📲</span>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
              WhatsApp Reactivation & Vendor Outreach Hub
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Dispatch personalized WhatsApp invitations to all partners with 1-click links to their free Social Growth App & Minisite.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* TEMPLATE GOVERNANCE BUTTON */}
          <button
            type="button"
            onClick={() => setIsTemplateManagerOpen(true)}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.3)',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <span>⚙️</span>
            <span>Templates &amp; Delivery Rules</span>
          </button>

          {/* MESSAGE LANGUAGE PICKER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', padding: '0 0.5rem' }}>Message Language:</span>
            <button
              type="button"
              onClick={() => setMsgLang('ar')}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', border: 0, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                background: msgLang === 'ar' ? '#0f172a' : 'transparent',
                color: msgLang === 'ar' ? '#fff' : '#64748b',
              }}
            >
              🇸🇦 العربية
            </button>
            <button
              type="button"
              onClick={() => setMsgLang('en')}
              style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', border: 0, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                background: msgLang === 'en' ? '#0f172a' : 'transparent',
                color: msgLang === 'en' ? '#fff' : '#64748b',
              }}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      {/* STATS TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '1px' }}>TOTAL BUSINESSES</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform directory entities</div>
        </div>

        <div style={{ background: '#f0fdf4', borderRadius: '18px', padding: '1.25rem', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#166534', letterSpacing: '1px' }}>READY WITH WHATSAPP</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', margin: '0.2rem 0' }}>{stats.withWhatsapp}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>1-Click WhatsApp dispatch enabled</div>
        </div>

        <div style={{ background: '#fff7ed', borderRadius: '18px', padding: '1.25rem', border: '1px solid #fed7aa', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#9a3412', letterSpacing: '1px' }}>NEEDS WHATSAPP NUMBER</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c2410c', margin: '0.2rem 0' }}>{stats.missingWhatsapp}</div>
          <div style={{ fontSize: '0.75rem', color: '#ea580c' }}>Add number to enable 1-click outreach</div>
        </div>

        <div style={{ background: '#faf5ff', borderRadius: '18px', padding: '1.25rem', border: '1px solid #e9d5ff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#6b21a8', letterSpacing: '1px' }}>CLAIMED PARTNERS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7e22ce', margin: '0.2rem 0' }}>{stats.claimed}</div>
          <div style={{ fontSize: '0.75rem', color: '#9333ea' }}>Fully verified partner portals</div>
        </div>

        <div style={{ background: '#f0f9ff', borderRadius: '18px', padding: '1.25rem', border: '1px solid #bae6fd', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#075985', letterSpacing: '1px' }}>HAS LIVE MINISITE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', margin: '0.2rem 0' }}>{stats.hasMinisite}</div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Ready to receive dashboard link</div>
        </div>
      </div>

      {/* ── DIRECT QUICK DISPATCH & TEST SENDER (إرسال فوري ومباشر لأي رقم) ── */}
      <QuickDirectSender msgLang={msgLang} />

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${businesses.length})` },
            { id: 'has_minisite', label: `🌐 Has Minisite (${stats.hasMinisite})` },
            { id: 'ready', label: `Ready WhatsApp (${stats.withWhatsapp})` },
            { id: 'missing', label: `Needs WhatsApp (${stats.missingWhatsapp})` },
            { id: 'unclaimed', label: `Unclaimed (${stats.total - stats.claimed})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: filter === tab.id ? '#0f172a' : '#e2e8f0',
                background: filter === tab.id ? '#0f172a' : '#fff',
                color: filter === tab.id ? '#fff' : '#64748b',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <select
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1.5px solid #D4AF37',
              background: '#fff',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">📂 كل التصنيفات الرئيسية (All Parents)</option>
            <option value="logistics">🛺 النقل والمواصلات والتوك توك (Logistics &amp; Transport)</option>
            <option value="adventure">🚙 سفاري ورحلات المغامرة (Travel &amp; Safari)</option>
            <option value="wellness">🌿 الاستشفاء وبحيرات الملح والرمال (Health &amp; Wellness)</option>
            <option value="accommodation">🏨 الإقامة والفنادق والمخيمات (Accommodations)</option>
            <option value="food">🍲 المطاعم والوجبات البدوية (Food &amp; Dining)</option>
            <option value="crafts">🏺 التمور وزيت الزيتون والحرف (Trade &amp; Crafts)</option>
            <option value="arts_culture">🎨 الفنون والتراث الثقافي (Arts &amp; Culture)</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search business name, slug, phone..."
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem',
              outline: 'none',
              minWidth: '220px',
            }}
          />
        </div>
      </div>

      {/* BUSINESS OUTREACH TABLE / CARDS */}
      {authError ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '18px', border: '2px dashed #fca5a5', margin: '1rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontWeight: 900 }}>Admin Login Required</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{authError}</p>
          <a
            href="/login?redirect=/jana/whatsapp-outreach"
            style={{
              padding: '0.65rem 1.4rem', borderRadius: '10px', background: '#0f172a', color: '#fff',
              textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', display: 'inline-block'
            }}
          >
            Sign in as Admin →
          </a>
        </div>
      ) : loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          ⏳ Loading businesses and WhatsApp directory...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((biz) => {
            const isEditing = editingId === biz.id;
            const previewMsg = getMessageText(biz, msgLang);

            return (
              <div
                key={biz.id}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                {/* BUSINESS META */}
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{biz.name}</h3>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', background: '#f1f5f9', color: '#475569' }}>
                      {biz.type_name}
                    </span>
                    {biz.is_claimed ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', background: '#dcfce7', color: '#15803d' }}>
                        ✓ Claimed
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', background: '#fef3c7', color: '#b45309' }}>
                        Unclaimed
                      </span>
                    )}
                    {(biz as any).has_minisite ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', background: '#e0f2fe', color: '#0369a1' }}>
                        🌐 Minisite Live
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', background: '#f1f5f9', color: '#94a3b8' }}>
                        No Minisite
                      </span>
                    )}
                  </div>

                  {/* QUICK LINKS */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <Link href={`/${biz.slug}`} target="_blank" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>
                      🌐 Minisite: /{biz.slug}
                    </Link>
                    <Link href={`/vendor/social-toolkit?slug=${biz.slug}`} target="_blank" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
                      📲 Social App Link
                    </Link>
                    <Link href={`/vendor/claim?slug=${biz.slug}`} target="_blank" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
                      🔑 Claim Link
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) navigator.clipboard.writeText(biz.mobileDashboardUrl);
                      }}
                      style={{ background: 'none', border: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      📊 Copy Dashboard Link
                    </button>
                  </div>
                </div>

                {/* WHATSAPP CONTACT & INLINE EDITOR WITH COUNTRY CODE SELECTOR */}
                <div style={{ flex: '1 1 340px', minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Country Calling Code Selector */}
                      <select
                        onChange={(e) => {
                          const prefix = e.target.value;
                          if (!prefix) return;
                          // If current value already starts with a +, replace the prefix
                          const digitsOnly = editWhatsapp.replace(/^\+[0-9]{1,4}/, '').replace(/^0+/, '');
                          setEditWhatsapp(`${prefix}${digitsOnly}`);
                        }}
                        style={{
                          padding: '0.45rem 0.5rem',
                          borderRadius: '8px',
                          border: '2px solid #25D366',
                          background: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        defaultValue="+20"
                      >
                        <option value="+20">🇪🇬 +20 (مصر)</option>
                        <option value="+963">🇸🇾 +963 (سوريا)</option>
                        <option value="+218">🇱🇾 +218 (ليبيا)</option>
                        <option value="+966">🇸🇦 +966 (السعودية)</option>
                        <option value="+971">🇦🇪 +971 (الإمارات)</option>
                        <option value="+965">🇰🇼 +965 (الكويت)</option>
                        <option value="+974">🇶🇦 +974 (قطر)</option>
                        <option value="+968">🇴🇲 +968 (عمان)</option>
                        <option value="+962">🇯🇴 +962 (الأردن)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+39">🇮🇹 +39 (Italy)</option>
                        <option value="+49">🇩🇪 +49 (Germany)</option>
                        <option value="+33">🇫🇷 +33 (France)</option>
                        <option value="+1">🇺🇸 +1 (US/CA)</option>
                      </select>

                      <input
                        type="text"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        placeholder="+201000000000"
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid #25D366',
                          fontSize: '0.85rem',
                          outline: 'none',
                          flex: '1 1 140px',
                          minWidth: '120px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveContact(biz.id)}
                        disabled={savingContact}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          background: '#15803d',
                          color: '#fff',
                          border: 0,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        {savingContact ? '...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: 0,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          background: biz.has_whatsapp ? '#f0fdf4' : '#fff7ed',
                          border: `1px solid ${biz.has_whatsapp ? '#bbf7d0' : '#fed7aa'}`,
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: biz.has_whatsapp ? '#15803d' : '#c2410c',
                        }}
                      >
                        <i className="fab fa-whatsapp" />
                        <span>{biz.whatsapp || biz.phone || 'No WhatsApp set'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(biz.id);
                          setEditWhatsapp(biz.whatsapp || biz.phone || '');
                        }}
                        style={{
                          background: 'none',
                          border: 0,
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textDecoration: 'underline',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* DISPATCH ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowcaseBiz({ id: biz.id, name: biz.name })}
                    style={{
                      padding: '0.55rem 0.9rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #D4AF37, #F5E6AD)',
                      color: '#0f172a',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      border: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 8px rgba(212,175,55,0.2)',
                    }}
                    title="Customize features & upload photos (driver, tuk-tuk, etc.)"
                  >
                    <span>✨</span>
                    <span>Customize Showcase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyMessage(biz)}
                    style={{
                      padding: '0.55rem 0.9rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#1e293b',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>📋</span>
                    <span>{copiedId === biz.id ? '✓ Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDispatchBiz(biz);
                      // Auto-select best matching template for this business
                      const bestTpl = templates.find((t) => !t.isHidden && t.childTypeId && t.childTypeId === biz.type_id)
                        || templates.find((t) => !t.isHidden && t.parentTypeId && t.parentTypeId === biz.parent_type_id)
                        || templates.find((t) => !t.isHidden && t.categoryKey === 'general')
                        || (templates.length > 0 ? templates[0] : null);
                      setSelectedTemplateId(bestTpl ? bestTpl.id : '');
                    }}
                    style={{
                      padding: '0.55rem 0.95rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      color: '#D4AF37',
                      border: '1px solid rgba(212,175,55,0.4)',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    title="Choose from categorized templates tailored to this business"
                  >
                    <span>📜</span>
                    <span>اختيار النموذج والإرسال</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(biz)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '10px',
                      background: '#25D366',
                      color: '#fff',
                      border: 0,
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
                    }}
                  >
                    <i className="fab fa-whatsapp" style={{ fontSize: '1rem' }} />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No businesses matched your search criteria.
            </div>
          )}
        </div>
      )}

      {/* TARGETED WHATSAPP TEMPLATE DISPATCH MODAL (Parent ➔ Child ➔ Business Name ➔ Template) */}
      {dispatchBiz && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              background: '#0f172a',
              color: '#fff',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '92vh',
              borderRadius: '24px',
              border: '1px solid rgba(212,175,55,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,23,42,0.9))',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>
                  HIERARCHICAL DISPATCHER · إرسال مخصص حسب النشاط
                </div>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                  {dispatchBiz.name}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  🏷️ {dispatchBiz.parent_type_name || 'سياحة وضيافة سيوة'} ➔ {dispatchBiz.type_name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDispatchBiz(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 0,
                  color: '#fff',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* TEMPLATE PICKER */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', marginBottom: '0.45rem' }}>
                  اختر النموذج المراد إرساله (Available Welcoming Templates):
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: '#1e293b',
                    border: '1.5px solid #D4AF37',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {templates
                    .filter((t) => !t.isHidden)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — ({t.categoryKey})
                      </option>
                    ))}
                </select>
              </div>

              {/* MESSAGE LIVE PREVIEW */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1' }}>
                    معاينة نص الرسالة قبل الإرسال (WhatsApp Message Preview):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 800 }}>
                    جاهز للإرسال الفوري 🟢
                  </span>
                </div>

                <div
                  dir={msgLang === 'ar' ? 'rtl' : 'ltr'}
                  style={{
                    background: '#020617',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    fontFamily: msgLang === 'ar' ? "'Noto Sans Arabic', 'Inter', sans-serif" : "'Inter', sans-serif",
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  {getMessageText(dispatchBiz, msgLang, selectedTemplateId)}
                </div>
              </div>

              {/* DESTINATION PHONE INFO */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>الرقم المستلم (Recipient Phone):</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: dispatchBiz.has_whatsapp ? '#4ade80' : '#fb923c' }}>
                    {dispatchBiz.whatsapp || dispatchBiz.phone || '⚠️ لا يوجد رقم مسجل (سيفتح واتساب لاختيار جهة الاتصال)'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const text = getMessageText(dispatchBiz, msgLang, selectedTemplateId);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                        alert('✅ تم نسخ نص الرسالة للحافظة بنجاح!');
                      }
                    }}
                    style={{
                      padding: '0.65rem 1.1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      border: 0,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    📋 نسخ النص
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      let raw = (dispatchBiz.whatsapp || dispatchBiz.phone || '').trim();
                      let clean = raw.replace(/[^0-9]/g, '');
                      if (clean.startsWith('00')) clean = clean.substring(2);
                      if (clean.length === 11 && clean.startsWith('01')) clean = '2' + clean;
                      const text = getMessageText(dispatchBiz, msgLang, selectedTemplateId);
                      const url = clean
                        ? `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
                        : `https://wa.me/?text=${encodeURIComponent(text)}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      padding: '0.65rem 1.4rem',
                      borderRadius: '10px',
                      background: '#25D366',
                      color: '#020617',
                      border: 0,
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
                    }}
                  >
                    <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                    <span>إرسال عبر الواتساب فوراً 🚀</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FEATURE & PHOTO SHOWCASE STUDIO MODAL */}
      {showcaseBiz && (
        <WhatsAppFeatureStudioModal
          isOpen={!!showcaseBiz}
          businessId={showcaseBiz.id}
          businessName={showcaseBiz.name}
          onClose={() => setShowcaseBiz(null)}
        />
      )}

      {/* WHATSAPP TEMPLATE & AUDIENCE DELIVERY RULES GOVERNANCE MODAL */}
      <WhatsAppTemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        onSaved={() => {
          loadData();
          loadTemplates();
        }}
      />
    </div>
  );
}

/* ─── QUICK DIRECT TEST & MANUAL DISPATCH COMPONENT ────────────────── */
function QuickDirectSender({ msgLang }: { msgLang: 'ar' | 'en' }) {
  const [driverName, setDriverName] = useState('كابتن أحمد (تجربة)');
  const [categoryType, setCategoryType] = useState('🛺 خدمة التوك توك والنقل المحلي');
  const [countryCode, setCountryCode] = useState('+963');
  const [localNumber, setLocalNumber] = useState('');
  const [customSlug, setCustomSlug] = useState('siwa-tuktuk-demo');

  const fullPhone = `${countryCode}${localNumber.replace(/^0+/, '')}`;

  function handleSend() {
    let clean = fullPhone.replace(/[^0-9]/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://siwify.com';
    const vanityUrl = `${origin}/${customSlug || 'siwa-go'}`;
    const mobileDashboardUrl = `${origin}/jana/businesses/demo/mobile`;
    const socialToolkitUrl = `${origin}/vendor/social-toolkit?slug=${customSlug || 'siwa-go'}`;
    const claimUrl = `${origin}/vendor/claim?slug=${customSlug || 'siwa-go'}`;

    const text = msgLang === 'ar'
      ? `أهلاً وسهلاً بيك يا كابتن *${driverName}*! 🛺🌴✨\nمعاك *جنا* من منصة *SiWiFy.com*، وبحب أقولك إننا جهزنالك كارت وصفحة شخصية مجانية تماماً ليك ولمركبتك في سيوة:\n🏷️ *${categoryType}*\n\n🎁 *خدماتك المجانية الجاهزة فوراً على تليفونك:*\n━━━━━━━━━━━━━━━━━━\n1️⃣ *موقعك وكارتك الشخصي للحجز المباشر (مكسبك كامل في جيبك 0% عمولة):*\n🔗 ${vanityUrl}\n(تقدر تبعت الرابط ده لأي زبون أو سائح على واتساب عشان يحجز معاك مشاوير بحيرات الملح وفطناس وشالي)\n\n2️⃣ *تطبيق خفيف على موبايلك لإدارة مواعيدك وأسعارك:*\n📲 ${mobileDashboardUrl}\n(تقدر تعدل منه أرقامك، صور التوك توك، وأسعار مشاويرك في أي وقت)\n\n3️⃣ *صانع فيديوهات وستوري واتساب باسمك:*\n🎬 ${socialToolkitUrl}\n\n🔑 *اضغط هنا لتأكيد اسمك واستلام صفحتك مجاناً:*\n👉 ${claimUrl}\n\nلو محتاج أي مساعدة أو استفسار، رد عليا على نفس الرقم ده وأنا في خدمتك فوراً يا كابتن! 🌿🤝`
      : `Welcome Captain *${driverName}*! 🛺🌴✨\nThis is *Jana* from *SiWiFy.com*.\nYour free digital card & booking page is ready under: *${categoryType}*.\n\n🔗 Minisite: ${vanityUrl}\n📲 Mobile App: ${mobileDashboardUrl}\n🔑 Claim profile: ${claimUrl}`;

    const url = clean ? `https://wa.me/${clean}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <div style={{
      marginBottom: '1.75rem',
      padding: '1.5rem',
      borderRadius: '20px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '2px solid rgba(212,175,55,0.4)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      color: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #D4AF37, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#0f172a' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#D4AF37' }}>
              إرسال فوري ومباشر لأي رقم (Quick Dispatch &amp; Test)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              أدخل أي اسم وأي رقم واتساب بأي كود دولة وأرسل رسالة التوك توك فوراً للتجربة أو لسائق جديد
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '3px 10px', borderRadius: '20px' }}>
          جاهز للإرسال المباشر 🟢
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
            اسم السائق / الكابتن / النشاط:
          </label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
            التصنيف (Parent ➔ Child):
          </label>
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            <option value="🛺 النقل والمواصلات ➔ خدمة التوك توك والنقل المحلي">🛺 النقل ➔ خدمة التوك توك والنقل المحلي</option>
            <option value="🚐 النقل والمواصلات ➔ سيارات النقل والمطارات">🚐 النقل ➔ سيارات النقل والمطارات</option>
            <option value="🚙 رحلات ومغامرات ➔ سفاري 4x4 بحر الرمال">🚙 رحلات ➔ سفاري 4x4 بحر الرمال</option>
            <option value="🌿 الصحة والاستشفاء ➔ حمامات الرمال وبحيرات الملح">🌿 الصحة ➔ حمامات الرمال وبحيرات الملح</option>
            <option value="🏨 الإقامة والفنادق ➔ إيكولودج ومخيمات بيئية">🏨 الإقامة ➔ إيكولودج ومخيمات بيئية</option>
            <option value="🍲 الأغذية والضيافة ➔ مطاعم وعشاء بدوي">🍲 الأغذية ➔ مطاعم وعشاء بدوي</option>
            <option value="🏺 التجارة والحرف ➔ تمور وزيت زيتون ومنتجات يدوية">🏺 التجارة ➔ تمور وزيت زيتون ومنتجات يدوية</option>
            <option value="🗺️ رحلات وبرامج ➔ تنظيم رحلات متكاملة">🗺️ رحلات ➔ تنظيم رحلات متكاملة</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
            كود الدولة (مفتاح الاتصال):
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #D4AF37', background: '#1e293b', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 800, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            <option value="+963">🇸🇾 +963 (سوريا)</option>
            <option value="+20">🇪🇬 +20 (مصر)</option>
            <option value="+218">🇱🇾 +218 (ليبيا)</option>
            <option value="+966">🇸🇦 +966 (السعودية)</option>
            <option value="+971">🇦🇪 +971 (الإمارات)</option>
            <option value="+965">🇰🇼 +965 (الكويت)</option>
            <option value="+974">🇶🇦 +974 (قطر)</option>
            <option value="+968">🇴🇲 +968 (عمان)</option>
            <option value="+962">🇯🇴 +962 (الأردن)</option>
            <option value="+44">🇬🇧 +44 (UK)</option>
            <option value="+39">🇮🇹 +39 (Italy)</option>
            <option value="+49">🇩🇪 +49 (Germany)</option>
            <option value="+1">🇺🇸 +1 (US)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.35rem' }}>
            رقم الهاتف (الواتساب):
          </label>
          <input
            type="text"
            value={localNumber}
            onChange={(e) => setLocalNumber(e.target.value)}
            placeholder="مثال: 944123456"
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
          الرقم النهائي للواتساب: <strong style={{ color: '#D4AF37', fontSize: '0.85rem' }}>{fullPhone || 'لم يتم إدخال رقم'}</strong>
        </div>

        <button
          type="button"
          onClick={handleSend}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: '12px',
            background: '#25D366',
            color: '#0a0f1e',
            border: 0,
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(37,211,102,0.3)',
          }}
        >
          <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
          <span>فتح وإرسال عبر واتساب فوراً 🚀</span>
        </button>
      </div>
    </div>
  );
}
