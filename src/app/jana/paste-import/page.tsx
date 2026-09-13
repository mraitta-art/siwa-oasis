'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { parseHospitalityRawText, hospitalityDataTo10Sections } from '@/lib/hospitality-mapper';
import { detectBusinessCategory, type DetectedCategory } from '@/lib/category-detector';
import { getPreferredAiProvider, type SourceAiProvider } from '@/lib/source-agent';

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

const AI_PROVIDERS: Array<{ id: SourceAiProvider; label: string; icon: string; desc: string }> = [
  { id: 'built_in', label: 'Built-in Smart Heuristics', icon: '⚡', desc: 'Fast, offline regex & NLP parser' },
  { id: 'gemini', label: 'Google Gemini', icon: '✨', desc: 'Gemini 2.0 Flash reasoning' },
  { id: 'openai', label: 'OpenAI GPT-4o', icon: '🤖', desc: 'Precise schema formatting' },
  { id: 'claude', label: 'Anthropic Claude', icon: '🧠', desc: 'Defensive fact extraction' },
  { id: 'ollama', label: 'Local Ollama', icon: '🦙', desc: 'Private offline LLM (llama3.2)' },
];

export default function PasteImportPage() {
  const [pastedText, setPastedText] = useState('');
  const [types, setTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('hotel');
  const [customSlug, setCustomSlug] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [sections10, setSections10] = useState<Record<string, any> | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [detectedCategory, setDetectedCategory] = useState<DetectedCategory | null>(null);
  const [savedResult, setSavedResult] = useState<{ businessId: number; slug: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'sections10' | 'raw'>('summary');
  
  // AI Provider state
  const [aiProvider, setAiProvider] = useState<SourceAiProvider>('built_in');
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({ built_in: true });
  const [aiDraft, setAiDraft] = useState<any>(null);

  // Duplicate candidates
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateBox, setShowDuplicateBox] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load typologies
    fetch('/api/jana/types')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const leaves = d.filter(t => !t.is_parent && t.id !== 'SECTION_TEMPLATE');
          setTypes(leaves.length ? leaves : d);
        }
      })
      .catch(() => {});

    // Load available AI providers
    fetch('/api/jana/paste-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'providers' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.providers) {
          setConfiguredProviders(data.providers);
          const preferred = getPreferredAiProvider();
          if (data.providers[preferred]) {
            setAiProvider(preferred);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Real-time category detection when text changes
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (!pastedText.trim()) {
        setDetectedCategory(null);
        return;
      }
      const detected = detectBusinessCategory(pastedText);
      setDetectedCategory(detected);
      if (detected.confidence >= 0.7 && !businessId) {
        setSelectedTypeId(detected.childId);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [pastedText, businessId]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDemo = () => {
    setPastedText(CAFOUR_HOUSE_DEMO);
    const data = parseHospitalityRawText(CAFOUR_HOUSE_DEMO);
    const s10 = hospitalityDataTo10Sections(data);
    setParsedData(data);
    setSections10(s10);
    setSummary({
      name: data.basic.name || 'Cafour House Siwa - Hot Spring',
      rating: data.testimonials.rating || 9.3,
      reviews_count: data.testimonials.reviews_count || 600,
      pools_count: data.facilities.pools_count || 2,
      room_types_count: (data.rooms?.room_types || []).length,
      reviews_highlights_count: (data.testimonials.review_highlights || []).length,
      has_hot_spring: Boolean(data.facilities.hot_spring),
      has_restaurant: Boolean(data.gastronomy.restaurant_name),
    });
    setCustomSlug('cafour-house-siwa');
    const detected = detectBusinessCategory(CAFOUR_HOUSE_DEMO);
    setDetectedCategory(detected);
    setSelectedTypeId(detected.childId || 'hotel');
    setDuplicates([]);
    setShowDuplicateBox(false);
    notify('Cafour House Siwa demo loaded & analyzed instantly!');
  };

  const handleParse = async () => {
    if (!pastedText.trim()) {
      notify('Please paste hotel, OTA, or listing text first.', 'error');
      return;
    }
    setLoading(true);
    setSavedResult(null);
    setAiDraft(null);

    try {
      // 1. Instant local parse
      const localData = parseHospitalityRawText(pastedText);
      const localS10 = hospitalityDataTo10Sections(localData);
      setParsedData(localData);
      setSections10(localS10);

      // 2. Server parse with AI Agent enrichment & category resolution
      const res = await fetch('/api/jana/paste-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse',
          text: pastedText,
          typeId: selectedTypeId,
          aiProvider,
        }),
      });

      const serverData = await res.json();
      if (res.ok && serverData.success) {
        setParsedData(serverData.preview || localData);
        setSections10(serverData.sections10 || localS10);
        setSummary(serverData.summary);
        if (serverData.detectedCategory) {
          setDetectedCategory(serverData.detectedCategory);
          if (serverData.detectedCategory.confidence >= 0.7 && !businessId) {
            setSelectedTypeId(serverData.detectedCategory.childId);
          }
        }
        if (serverData.aiDraft) {
          setAiDraft(serverData.aiDraft);
        }

        const bName = serverData.preview?.basic?.name || localData.basic?.name;
        if (bName && !customSlug) {
          setCustomSlug(bName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
        }
        notify(`Data parsed & structured with ${aiProvider === 'built_in' ? 'Smart Heuristics' : aiProvider.toUpperCase()}!`);
      } else {
        notify(serverData.error || 'Parsed with local heuristic rules.', 'error');
      }
    } catch (e: any) {
      notify(e.message || 'Error parsing text', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCheck = async () => {
    if (!parsedData) {
      notify('Please analyze the text first before checking duplicates', 'error');
      return;
    }
    setCheckingDuplicates(true);
    try {
      const res = await fetch('/api/jana/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedData.basic?.name || '',
          address: parsedData.basic?.address || '',
          phone: parsedData.connector?.phone || parsedData.basic?.phone || '',
          website: parsedData.connector?.website || parsedData.basic?.booking_url || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check duplicates');
      const found = data.duplicates || [];
      setDuplicates(found);
      setShowDuplicateBox(true);
      if (found.length > 0) {
        notify(`Found ${found.length} potential duplicate record(s). Review below!`, 'error');
      } else {
        notify('✓ No duplicate records found in Siwa registry. Clear to import!');
      }
    } catch (e: any) {
      notify(e.message || 'Duplicate check error', 'error');
    } finally {
      setCheckingDuplicates(false);
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
          aiProvider,
          enrichedSections: sections10,
        }),
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
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            <Link href="/jana" style={{ color: '#D4AF37', textDecoration: 'none' }}>Admin Dashboard</Link>
            <span>/</span>
            <span>Smart Importer</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📋 Smart AI Multi-Source Paste Importer</span>
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Paste raw text from Booking.com, Airbnb, TripAdvisor, WhatsApp or raw notes. The hybrid AI engine auto-detects typology and maps all 10 canonical sections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadDemo}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #D4AF37', background: 'rgba(212,175,55,0.1)', color: '#92400e', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
          >
            ✨ Load Cafour House Demo
          </button>
          <Link href="/jana/google-import" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🗺️</span> Google Maps & URL Importer
          </Link>
          <Link href="/jana/businesses" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            🏢 Business Registry
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(480px, 1.25fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Input & AI Configuration */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📥 Paste Raw Listing Data</span>
          </h3>

          {/* AI Provider Selector */}
          <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
              🧠 Select AI Analysis Engine
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {AI_PROVIDERS.map(p => {
                const isConfigured = Boolean(configuredProviders[p.id]);
                const isSelected = aiProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAiProvider(p.id)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                      background: isSelected ? '#fffdf7' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(212,175,55,0.2)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? '#92400e' : '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{p.icon}</span> {p.label.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {isConfigured ? '✓ Ready' : 'Key unset (heuristic fallback)'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Category Auto-Detection Banner */}
          {detectedCategory && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: detectedCategory.confidence >= 0.7 ? '#f0fdf4' : '#fffbeb',
              border: `1.5px solid ${detectedCategory.confidence >= 0.7 ? '#86efac' : '#fde68a'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: detectedCategory.confidence >= 0.7 ? '#15803d' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎯 Auto-Detected Typology
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                  Confidence: {Math.round(detectedCategory.confidence * 100)}%
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                {detectedCategory.childName} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>({detectedCategory.parentName})</span>
              </div>
              {detectedCategory.reasons?.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  Why: {detectedCategory.reasons[0]}
                </div>
              )}
            </div>
          )}

          {/* Target Typology Picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Target Business Typology (Override or Confirm)
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
              rows={13}
              placeholder="Paste any hotel, factory, tour, or restaurant text: Name, description, review quotes, facilities, room types, scores..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.82rem', fontFamily: 'monospace', color: '#1e293b', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleParse}
              disabled={loading}
              style={{
                flex: 1, minWidth: '180px', padding: '0.85rem 1.5rem', borderRadius: '12px', border: 'none',
                background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {loading ? 'Analyzing with AI...' : '⚡ Analyze & Organize Sections'}
            </button>
            {parsedData && (
              <button
                onClick={handleDuplicateCheck}
                disabled={checkingDuplicates}
                style={{
                  padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1.5px solid #cbd5e1',
                  background: '#f8fafc', color: '#334155', fontWeight: 800, fontSize: '0.85rem',
                  cursor: checkingDuplicates ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <span>🔍</span> {checkingDuplicates ? 'Checking...' : 'Check Duplicates'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Structured Output & 10 Sections Preview */}
        <div>
          {/* Success Box */}
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

          {/* Duplicate Warnings Box */}
          {showDuplicateBox && (
            <div style={{
              background: duplicates.length > 0 ? '#fffbeb' : '#f0fdf4',
              borderRadius: '16px',
              padding: '1.25rem',
              border: `1.5px solid ${duplicates.length > 0 ? '#fde68a' : '#86efac'}`,
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: duplicates.length > 0 ? '#b45309' : '#15803d', marginBottom: '0.5rem' }}>
                {duplicates.length > 0 ? `⚠️ Potential Duplicate Alert (${duplicates.length} found)` : '✓ No Duplicate Records Detected'}
              </div>
              {duplicates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {duplicates.map((dup, i) => (
                    <div key={i} style={{ background: '#fff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{dup.name} (ID: #{dup.id})</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{dup.address || 'No address registered'}</div>
                      <div style={{ color: '#b45309', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.25rem' }}>
                        Match Score: {Math.round((dup.score || 0) * 100)}% — {dup.reasons?.join(', ')}
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.4rem' }}>
                    Tip: If this is the same business, enter its ID in the "Existing Business ID" field on the left to update it instead of creating a duplicate.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  Name and contact details do not conflict with existing Siwa businesses.
                </div>
              )}
            </div>
          )}

          {parsedData ? (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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

              {/* View Switcher Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                    background: activeTab === 'summary' ? '#0f172a' : '#f1f5f9',
                    color: activeTab === 'summary' ? '#fff' : '#64748b',
                    fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  ⚡ Quick Summary
                </button>
                <button
                  onClick={() => setActiveTab('sections10')}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                    background: activeTab === 'sections10' ? '#0f172a' : '#f1f5f9',
                    color: activeTab === 'sections10' ? '#fff' : '#64748b',
                    fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  🏛️ Canonical 10 Sections
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none',
                    background: activeTab === 'raw' ? '#0f172a' : '#f1f5f9',
                    color: activeTab === 'raw' ? '#fff' : '#64748b',
                    fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  JSON Payload
                </button>
              </div>

              {/* TAB 1: SUMMARY */}
              {activeTab === 'summary' && (
                <>
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

                  {/* AI Verification Notes if available */}
                  {aiDraft?.verification_notes?.length > 0 && (
                    <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1rem', border: '1px solid #bfdbfe', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1e40af', marginBottom: '0.35rem' }}>
                        🤖 AI Agent Analysis Notes ({aiProvider.toUpperCase()}):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.72rem', color: '#1e3a8a' }}>
                        {aiDraft.verification_notes.map((note: string, idx: number) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sections Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* 1. Identity */}
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>🏷️</span> Identity & Overview (sec_1_identity)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                        <strong>Address:</strong> {parsedData.basic?.address || 'N/A'}<br />
                        <strong>Languages:</strong> {(parsedData.basic?.languages_spoken || []).join(', ') || 'N/A'}<br />
                        <strong>Manager:</strong> {parsedData.basic?.manager_name || 'N/A'}<br />
                        <strong>Check-in / Check-out:</strong> {parsedData.basic?.checkin_time || '24h'} / {parsedData.basic?.checkout_time || '24h'}<br />
                        <strong>About:</strong> {parsedData.basic?.description || 'N/A'}
                      </div>
                    </div>

                    {/* 2. Testimonials */}
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>⭐</span> Reviews & Score Breakdown (sec_10_testimonials_faqs)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '0.4rem', marginBottom: '0.65rem' }}>
                        {parsedData.testimonials?.score_staff && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Staff: <strong>{parsedData.testimonials.score_staff}</strong></div>}
                        {parsedData.testimonials?.score_facilities && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Facilities: <strong>{parsedData.testimonials.score_facilities}</strong></div>}
                        {parsedData.testimonials?.score_cleanliness && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Cleanliness: <strong>{parsedData.testimonials.score_cleanliness}</strong></div>}
                        {parsedData.testimonials?.score_comfort && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Comfort: <strong>{parsedData.testimonials.score_comfort}</strong></div>}
                        {parsedData.testimonials?.score_value && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Value: <strong>{parsedData.testimonials.score_value}</strong></div>}
                        {parsedData.testimonials?.score_location && <div style={{ background: '#fff', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Location: <strong>{parsedData.testimonials.score_location}</strong></div>}
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
                        <span>🏊</span> Facilities & Amenities (sec_3_facilities)
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(parsedData.facilities?.facilities_list || []).map((f: string, i: number) => (
                          <span key={i} style={{ background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #e2e8f0', color: '#1e293b' }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 4. Rooms */}
                    {((parsedData.rooms?.room_types || [])).length > 0 && (
                      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🛏️</span> Room Configurations (sec_9_marketplace_catalog)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                          {(parsedData.rooms?.room_types || []).map((r: any, i: number) => (
                            <div key={i} style={{ background: '#fff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                              <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>{r.name}</div>
                              <div style={{ color: '#64748b' }}>{r.beds}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: CANONICAL 10 SECTIONS EXPLORER */}
              {activeTab === 'sections10' && sections10 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(sections10).map(([secKey, secVal]) => (
                    <div key={secKey} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                        📁 <strong>{secKey}</strong>
                      </div>
                      <pre style={{ margin: 0, padding: '0.6rem', background: '#fff', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', border: '1px solid #f1f5f9', color: '#334155' }}>
                        {JSON.stringify(secVal, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: RAW JSON */}
              {activeTab === 'raw' && (
                <pre style={{ margin: 0, padding: '1rem', background: '#0f172a', color: '#f8fafc', borderRadius: '12px', fontSize: '0.72rem', overflowX: 'auto', maxHeight: '550px' }}>
                  {JSON.stringify({ legacy: parsedData, canonical10: sections10, aiDraft }, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '4rem 2rem', border: '2px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>No data analyzed yet</div>
              <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                Paste any listing or hotel text on the left and click "Analyze & Organize Sections" to see the real-time AI category detection and 10-section breakdown.
              </div>
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

