'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  type_name: string;
  type_icon: string;
  subscription_tier: string;
  published: boolean;
  is_claimed: boolean;
  whatsapp: string;
  phone: string;
  has_whatsapp: boolean;
  vanityUrl: string;
  socialToolkitUrl: string;
  claimUrl: string;
}

interface Stats {
  total: number;
  withWhatsapp: number;
  missingWhatsapp: number;
  claimed: number;
}

export default function WhatsAppOutreachPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, withWhatsapp: 0, missingWhatsapp: 0, claimed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing' | 'unclaimed'>('all');
  const [search, setSearch] = useState('');
  const [msgLang, setMsgLang] = useState<'ar' | 'en'>('ar');
  
  // Editing contact
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/jana/whatsapp-outreach');
      const data = await res.json();
      if (data.businesses) {
        setBusinesses(data.businesses);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getMessageText(biz: BusinessItem, lang: 'ar' | 'en'): string {
    if (lang === 'ar') {
      return `مرحباً ${biz.name}! 🌴\nيسرنا إبلاغكم بإطلاق تطبيقكم الحصري المجاني لإدارة ونمو نشاطكم السياحي في سيوة على منصة SiWiFy:\n\n📲 1. تطبيق إدارة السوشيال ميديا وريلز الفيديو المجاني:\n${biz.socialToolkitUrl}\n(يمكنكم تثبيته مباشرة على الموبايل أو سطح المكتب بنقرة واحدة)\n\n🌐 2. موقعكم المصغر الرسمي للحجز المباشر بدون عمولة (0%):\n${biz.vanityUrl}\n\n🔑 3. لتفعيل وتأكيد حسابكم كشريك رسمي مجاناً:\n${biz.claimUrl}\n\nنتشرف بوجودكم معنا لتعزيز السياحة والضيافة في واحة سيوة ✨`;
    }

    return `Hello ${biz.name}! 🌴\nWe are excited to share your free exclusive growth & social media app on SiWiFy.com:\n\n📲 1. Free Social Media & Video Reels App:\n${biz.socialToolkitUrl}\n(Install directly on mobile or desktop in 1-click)\n\n🌐 2. Your Official Live Minisite (0% Commission Direct Bookings):\n${biz.vanityUrl}\n\n🔑 3. Activate and claim your official partner account for free:\n${biz.claimUrl}\n\nWe look forward to welcoming your guests in Siwa Oasis! ✨`;
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
    const targetPhone = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
    const text = getMessageText(biz, msgLang);
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  const filtered = businesses.filter((b) => {
    if (filter === 'ready' && !b.has_whatsapp) return false;
    if (filter === 'missing' && b.has_whatsapp) return false;
    if (filter === 'unclaimed' && b.is_claimed) return false;

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
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${businesses.length})` },
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
            minWidth: '260px',
          }}
        />
      </div>

      {/* BUSINESS OUTREACH TABLE / CARDS */}
      {loading ? (
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
                  </div>
                </div>

                {/* WHATSAPP CONTACT & INLINE EDITOR */}
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                          flex: 1,
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
    </div>
  );
}
