'use client';

import React, { useState, useEffect } from 'react';

interface WhatsAppFeatureStudioModalProps {
  businessId: string;
  businessName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppFeatureStudioModal({
  businessId,
  businessName = 'Business',
  isOpen,
  onClose,
}: WhatsAppFeatureStudioModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [targetAudience, setTargetAudience] = useState<'client' | 'vendor'>('client');
  const [copied, setCopied] = useState(false);

  // Form State
  const [data, setData] = useState<any>(null);
  const [personalPhoto, setPersonalPhoto] = useState('');
  const [servicePhoto1, setServicePhoto1] = useState('');
  const [servicePhoto2, setServicePhoto2] = useState('');
  const [featuresAr, setFeaturesAr] = useState<string[]>([]);
  const [featuresEn, setFeaturesEn] = useState<string[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [customNoteAr, setCustomNoteAr] = useState('');
  const [customNoteEn, setCustomNoteEn] = useState('');
  const [syncToMinisite, setSyncToMinisite] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) {
      loadData();
    }
  }, [isOpen, businessId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/whatsapp-feature-dispatch?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setPersonalPhoto(d.personalPhoto || '');
        setServicePhoto1(d.servicePhoto1 || '');
        setServicePhoto2(d.servicePhoto2 || '');
        setFeaturesAr(d.selectedFeaturesAr || []);
        setFeaturesEn(d.selectedFeaturesEn || []);
        setCustomNoteAr(d.customNoteAr || '');
        setCustomNoteEn(d.customNoteEn || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'personal' | 'service1' | 'service2') {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        const url = json.url || json.secure_url;
        if (url) {
          if (field === 'personal') setPersonalPhoto(url);
          if (field === 'service1') setServicePhoto1(url);
          if (field === 'service2') setServicePhoto2(url);
        }
      } else {
        alert('Image upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setUploadingField(null);
    }
  }

  function toggleFeature(feature: string, currentLang: 'ar' | 'en') {
    if (currentLang === 'ar') {
      setFeaturesAr((prev) =>
        prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
      );
    } else {
      setFeaturesEn((prev) =>
        prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
      );
    }
  }

  function addCustomFeature() {
    const val = customFeatureInput.trim();
    if (!val) return;
    if (lang === 'ar') {
      setFeaturesAr((prev) => [...prev, `✨ ${val}`]);
    } else {
      setFeaturesEn((prev) => [...prev, `✨ ${val}`]);
    }
    setCustomFeatureInput('');
  }

  async function handleSaveAndSync() {
    setSaving(true);
    try {
      const res = await fetch('/api/jana/whatsapp-feature-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          personalPhoto,
          servicePhoto1,
          servicePhoto2,
          selectedFeaturesAr: featuresAr,
          selectedFeaturesEn: featuresEn,
          customNoteAr,
          customNoteEn,
          syncToMinisite,
        }),
      });
      if (res.ok) {
        alert('✅ Features and photos synchronized with Minisite & WhatsApp!');
      }
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  // Generate WhatsApp text payload
  function generateWhatsAppMessage(): string {
    const bName = data?.name || businessName;
    const isAr = lang === 'ar';
    const minisite = data?.minisiteUrl || `https://siwify.com/${data?.slug || ''}`;
    const selectedList = isAr ? featuresAr : featuresEn;
    const note = isAr ? customNoteAr : customNoteEn;

    if (targetAudience === 'client') {
      // Message directed to a tourist / client looking for this service (e.g. Tuk-Tuk, Safari, Stay)
      if (isAr) {
        return `🌴 مرحباً بك في واحة سيوة! ✨\n\nنقدم لك خدمة موثوقة ومباشرة مع: *${bName}*\n\n📸 *معرض الصور والمركبة / الخدمة:*\n${personalPhoto ? `👤 صورة السائق/المقدم: ${personalPhoto}\n` : ''}${servicePhoto1 ? `🛺 صورة المركبة/الخدمة (1): ${servicePhoto1}\n` : ''}${servicePhoto2 ? `📸 صورة المركبة/الخدمة (2): ${servicePhoto2}\n` : ''}\n✨ *المميزات والخدمات المشمولة:*\n${selectedList.map((f) => `• ${f}`).join('\n')}\n${note ? `\n📝 *ملاحظة:* ${note}\n` : ''}\n🌐 *للتفاصيل والحجز المباشر بدون عمولة (0%):*\n${minisite}\n\nنتمنى لكم إقامة وتجربة لا تُنسى في سيوة! 🌿`;
      } else {
        return `🌴 Welcome to Siwa Oasis! ✨\n\nHere is verified direct service details for: *${bName}*\n\n📸 *Photos & Showcase:*\n${personalPhoto ? `👤 Driver/Host Photo: ${personalPhoto}\n` : ''}${servicePhoto1 ? `🛺 Vehicle/Service Photo (1): ${servicePhoto1}\n` : ''}${servicePhoto2 ? `📸 Vehicle/Service Photo (2): ${servicePhoto2}\n` : ''}\n✨ *Highlights & Inclusions:*\n${selectedList.map((f) => `• ${f}`).join('\n')}\n${note ? `\n📝 *Note:* ${note}\n` : ''}\n🌐 *Direct Minisite & 0% Commission Booking:*\n${minisite}\n\nHave a magical journey in Siwa Oasis! 🌿`;
      }
    } else {
      // Message directed to the vendor / driver
      if (isAr) {
        return `مرحباً ${bName}! 🌴\nيسرنا إبلاغك بتحديث وتجهيز بطاقة نشاطك السياحي على منصة SiWiFy:\n\n✨ المميزات المفعلة في ملفك:\n${selectedList.map((f) => `• ${f}`).join('\n')}\n\n🌐 موقعك المصغر المباشر:\n${minisite}\n\nيمكنك مشاركة هذا الرابط مع ضيوفك للحجز الفوري بدون عمولة ✨`;
      } else {
        return `Hello ${bName}! 🌴\nYour official verified service card on SiWiFy.com has been customized:\n\n✨ Active Features:\n${selectedList.map((f) => `• ${f}`).join('\n')}\n\n🌐 Your Direct Minisite:\n${minisite}\n\nShare this link with your guests for 0% commission direct bookings ✨`;
      }
    }
  }

  function handleSendWhatsApp() {
    const text = generateWhatsAppMessage();
    const phone = (data?.whatsapp || data?.phone || '').replace(/[^0-9]/g, '');
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleCopy() {
    const text = generateWhatsAppMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (!isOpen) return null;

  const currentFeatures = lang === 'ar' ? featuresAr : featuresEn;
  const presets = lang === 'ar' ? (data?.availablePresets?.ar || []) : (data?.availablePresets?.en || []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '960px',
          maxHeight: '92vh',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
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
            background: 'linear-gradient(135deg, rgba(212,175,55,0.1), transparent)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '2px' }}>
              WHATSAPP CLIENT FEATURE STUDIO &amp; PHOTO DISPATCH
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              {data?.name || businessName}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Lang switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setLang('ar')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 0,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  background: lang === 'ar' ? '#D4AF37' : 'transparent',
                  color: lang === 'ar' ? '#0f172a' : '#94a3b8',
                }}
              >
                🇸🇦 عربي
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 0,
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  background: lang === 'en' ? '#D4AF37' : 'transparent',
                  color: lang === 'en' ? '#0f172a' : '#94a3b8',
                }}
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 0,
                color: '#fff',
                width: 34,
                height: 34,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#D4AF37', gridColumn: '1 / -1' }}>
              ⏳ Loading business assets and presets...
            </div>
          ) : (
            <>
              {/* LEFT COLUMN: PHOTOS & ASSETS MANAGER */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px', marginBottom: '1rem' }}>
                  📸 1. PHOTOS &amp; ASSETS (DRIVERS / TUK-TUK / FLEET)
                </h3>

                {/* Personal / Driver Photo */}
                <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>👤 Personal / Driver Photo:</span>
                    {personalPhoto && (
                      <button onClick={() => setPersonalPhoto('')} style={{ background: 'none', border: 0, color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {personalPhoto ? (
                      <img src={personalPhoto} alt="Driver" style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>👤</div>
                    )}
                    <input
                      type="text"
                      value={personalPhoto}
                      onChange={(e) => setPersonalPhoto(e.target.value)}
                      placeholder="Image URL or upload below..."
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <label style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#D4AF37', color: '#0f172a', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploadingField === 'personal' ? '⏳...' : '⬆ Upload'}
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'personal')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Service Photo 1 (Tuk-Tuk Exterior) */}
                <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>🛺 Vehicle / Service Photo 1 (e.g. Tuk-Tuk Exterior):</span>
                    {servicePhoto1 && (
                      <button onClick={() => setServicePhoto1('')} style={{ background: 'none', border: 0, color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {servicePhoto1 ? (
                      <img src={servicePhoto1} alt="Vehicle 1" style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>🛺</div>
                    )}
                    <input
                      type="text"
                      value={servicePhoto1}
                      onChange={(e) => setServicePhoto1(e.target.value)}
                      placeholder="Image URL or upload below..."
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <label style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#D4AF37', color: '#0f172a', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploadingField === 'service1' ? '⏳...' : '⬆ Upload'}
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'service1')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Service Photo 2 (Tuk-Tuk Interior / Backdrop) */}
                <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>📸 Vehicle / Service Photo 2 (e.g. Interior / Sunset):</span>
                    {servicePhoto2 && (
                      <button onClick={() => setServicePhoto2('')} style={{ background: 'none', border: 0, color: '#ef4444', fontSize: '0.65rem', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {servicePhoto2 ? (
                      <img src={servicePhoto2} alt="Vehicle 2" style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>📸</div>
                    )}
                    <input
                      type="text"
                      value={servicePhoto2}
                      onChange={(e) => setServicePhoto2(e.target.value)}
                      placeholder="Image URL or upload below..."
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <label style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#D4AF37', color: '#0f172a', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploadingField === 'service2' ? '⏳...' : '⬆ Upload'}
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'service2')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Minisite Sync Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: '#D4AF37', cursor: 'pointer', background: 'rgba(212,175,55,0.06)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <input
                    type="checkbox"
                    checked={syncToMinisite}
                    onChange={(e) => setSyncToMinisite(e.target.checked)}
                    style={{ accentColor: '#D4AF37', width: 16, height: 16 }}
                  />
                  <span>🔄 Automatically sync photos &amp; highlights to live Minisite gallery</span>
                </label>
              </div>

              {/* RIGHT COLUMN: FEATURE SELECTOR & MESSAGE PREVIEW */}
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '1px', marginBottom: '1rem' }}>
                  ✨ 2. SELECT FEATURES TO SEND TO CLIENT
                </h3>

                {/* Presets Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {presets.map((preset: string, idx: number) => {
                    const isChecked = currentFeatures.includes(preset);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleFeature(preset, lang)}
                        style={{
                          padding: '0.65rem 0.9rem',
                          borderRadius: '12px',
                          background: isChecked ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isChecked ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          color: isChecked ? '#86efac' : '#94a3b8',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ color: isChecked ? '#22c55e' : '#64748b' }}>{isChecked ? '✓' : '○'}</span>
                        <span>{preset}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Feature */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomFeature()}
                    placeholder="+ Add custom feature (e.g. Free Cold Water, Speaks Italian)..."
                    style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    style={{ padding: '0.45rem 0.9rem', borderRadius: '10px', background: '#D4AF37', color: '#0f172a', fontWeight: 900, fontSize: '0.75rem', border: 0, cursor: 'pointer' }}
                  >
                    + Add
                  </button>
                </div>

                {/* AUDIENCE SELECTOR & PREVIEW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37' }}>📱 MESSAGE PREVIEW</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setTargetAudience('client')}
                      style={{
                        padding: '3px 8px', borderRadius: '6px', border: 0, fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                        background: targetAudience === 'client' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                      }}
                    >
                      For Tourist / Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetAudience('vendor')}
                      style={{
                        padding: '3px 8px', borderRadius: '6px', border: 0, fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                        background: targetAudience === 'vendor' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                      }}
                    >
                      For Vendor / Driver
                    </button>
                  </div>
                </div>

                {/* Live Message Box */}
                <pre
                  style={{
                    background: '#020617',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    padding: '1rem',
                    fontSize: '0.72rem',
                    color: '#cbd5e1',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    maxHeight: '160px',
                    overflowY: 'auto',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {generateWhatsAppMessage()}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={saving}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              background: '#D4AF37',
              color: '#0f172a',
              fontWeight: 900,
              fontSize: '0.8rem',
              border: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>💾</span>
            <span>{saving ? 'Syncing...' : 'Save & Sync to Minisite'}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                border: 0,
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Text'}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '12px',
                background: '#25D366',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.85rem',
                border: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
