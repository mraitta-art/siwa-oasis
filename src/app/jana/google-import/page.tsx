'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getPreferredAiProvider } from '@/lib/source-agent';
import { detectBusinessCategory, type DetectedCategory } from '@/lib/category-detector';

interface GooglePlaceData {
  name: string;
  address: string;
  phone: string;
  website: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: any[];
  photos: string[];
  placeId: string;
  sourceProvider?: string;
  sourceUrl?: string;
  detailsAvailable?: boolean;
  aiDraft?: {
    suggested_type?: string;
    confidence?: number;
    sections?: Record<string, any>;
    missing_fields?: string[];
    verification_notes?: string[];
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const FALLBACK_CATEGORIES = [
  { id: 'hotel', name: 'Hotel & Resort', parent_id: 'accommodation', is_parent: false },
  { id: 'eco_lodge', name: 'Eco Lodge & Traditional Karshif', parent_id: 'accommodation', is_parent: false },
  { id: 'camp', name: 'Desert Camp & Glamping', parent_id: 'accommodation', is_parent: false },
  { id: 'guest_house', name: 'Guest House & Villa', parent_id: 'accommodation', is_parent: false },
  { id: 'restaurant', name: 'Restaurant & Traditional Dining', parent_id: 'food_beverage', is_parent: false },
  { id: 'cafe', name: 'Cafe & Bedouin Tea Lounge', parent_id: 'food_beverage', is_parent: false },
  { id: 'travel_agency', name: 'Travel Agency & Tour Operator', parent_id: 'adventure', is_parent: false },
  { id: 'safari_operator', name: 'Safari Operator & Great Sand Sea', parent_id: 'adventure', is_parent: false },
  { id: 'water_factory', name: 'Water Bottling & Natural Spring Factory', parent_id: 'agriculture_industry', is_parent: false },
  { id: 'olive_mill', name: 'Olive Mill & Oil Production', parent_id: 'agriculture_industry', is_parent: false },
  { id: 'date_factory', name: 'Date Packaging & Processing', parent_id: 'agriculture_industry', is_parent: false },
  { id: 'salt_factory', name: 'Salt Processing & Refining', parent_id: 'agriculture_industry', is_parent: false },
  { id: 'herbal_factory', name: 'Herbal & Botanical Production', parent_id: 'agriculture_industry', is_parent: false },
  { id: 'hot_spring', name: 'Hot Spring & Healing Waters', parent_id: 'wellness', is_parent: false },
  { id: 'sand_bath', name: 'Sand Bath Therapy & Salt Caves', parent_id: 'wellness', is_parent: false },
  { id: 'souvenir_shop', name: 'Handicrafts & Souvenir Shop', parent_id: 'crafts', is_parent: false },
  { id: 'taxi_transfer', name: 'Taxi & Local Transfer Service', parent_id: 'transportation', is_parent: false },
  { id: 'other', name: 'Other Services', parent_id: 'other', is_parent: false },
];

export default function GoogleImportWizard() {
  // Source inputs
  const [urlOrQuery, setUrlOrQuery] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [sourceMode, setSourceMode] = useState<'url' | 'text'>('url');
  const [sourceProvenance, setSourceProvenance] = useState<{ mode: 'url' | 'text'; sourceLabel: string; status: 'live_url' | 'saved_text'; capturedAt: string } | null>(null);
  const [contributorName, setContributorName] = useState('');
  
  // Loading & state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  
  // Category selection & Auto-detection
  const [sourceParentCategory, setSourceParentCategory] = useState('accommodation');
  const [sourceCategory, setSourceCategory] = useState('hotel');
  const [selectedTypeId, setSelectedTypeId] = useState('hotel');
  const [detectedCategory, setDetectedCategory] = useState<DetectedCategory | null>(null);
  const [showManualCategoryPicker, setShowManualCategoryPicker] = useState(false);
  
  // Custom edits on extracted place data
  const [placeData, setPlaceData] = useState<GooglePlaceData | null>(null);
  const [heroPhotoIndex, setHeroPhotoIndex] = useState<number>(0);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [customFacilities, setCustomFacilities] = useState<string[]>([]);
  const [newFacilityInput, setNewFacilityInput] = useState('');
  const [customRoomTypes, setCustomRoomTypes] = useState<Array<{ name: string; beds: string; price?: string }>>([]);
  
  // Sections & Minisite
  const [activeMinistiteSections, setActiveMinistiteSections] = useState<string[]>([]);
  const [availableSectionsForType, setAvailableSectionsForType] = useState<any[]>([]);
  const [adminConfirmed, setAdminConfirmed] = useState(true);
  const [planApproved, setPlanApproved] = useState(true);
  const [policyUpdates, setPolicyUpdates] = useState('');
  const [regulationUpdates, setRegulationUpdates] = useState('');
  
  // Duplicate check
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  
  // Collapsible AI Assistant Drawer
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState('built_in');
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({ built_in: true });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Welcome to the Siwa Oasis Importer. Ask me anything about category rules, required database fields, or source provenance.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Alerts
  const [message, setMessage] = useState({ type: '', text: '' });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const preferredProvider = getPreferredAiProvider();
  const availableTypes = types.length ? types : FALLBACK_CATEGORIES;
  const availableParentTypes = availableTypes.filter(t => t.is_parent && t.id !== 'SECTION_TEMPLATE');

  // Load Typologies & AI providers on mount
  useEffect(() => {
    fetch('/api/jana/types')
      .then(res => res.json())
      .then(data => setTypes(data || []))
      .catch(err => console.error('Failed to load typologies', err));

    fetch('/api/jana/google-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'providers' }),
    })
      .then(res => res.json())
      .then(data => {
        const providers = data.providers || {};
        setConfiguredProviders(providers);
        const preferred = getPreferredAiProvider();
        if (providers[preferred]) {
          setAiProvider(preferred);
        }
      })
      .catch(() => setConfiguredProviders({}));
  }, []);

  // Real-time Auto-Detection when typing or pasting
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const activeText = sourceMode === 'text' ? sourceText : urlOrQuery;
      if (!activeText.trim()) return;

      const detected = detectBusinessCategory(sourceText, urlOrQuery);
      setDetectedCategory(detected);

      // Auto-apply detection if user hasn't opened manual picker
      if (!showManualCategoryPicker && detected.confidence >= 0.7) {
        setSourceParentCategory(detected.parentId);
        setSourceCategory(detected.childId);
        setSelectedTypeId(detected.childId);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sourceText, urlOrQuery, sourceMode, showManualCategoryPicker]);

  // Load sections when selected typology changes
  useEffect(() => {
    if (!sourceCategory) { setAvailableSectionsForType([]); setActiveMinistiteSections([]); return; }
    fetch(`/api/jana/sections?type=${sourceCategory}`)
      .then(res => res.json())
      .then((sections: any[]) => {
        setAvailableSectionsForType(sections || []);
        setActiveMinistiteSections((sections || []).map((s: any) => s.id));
      })
      .catch(() => {});
  }, [sourceCategory]);

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 8000);
  };

  const handleFetch = async () => {
    const hasUrl = sourceMode === 'url' && urlOrQuery.trim();
    const hasText = sourceMode === 'text' && sourceText.trim();

    if (!hasUrl && !hasText) {
      showMsg('error', sourceMode === 'text' ? 'Please paste the source text or business details.' : 'Please enter a source link or business query.');
      return;
    }

    setLoading(true);
    setPlaceData(null);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch',
          urlOrQuery: sourceMode === 'url' ? urlOrQuery : '',
          sourceText: sourceMode === 'text' ? sourceText : '',
          sourceMode,
          sourceCategory: sourceCategory || selectedTypeId || 'hotel',
          sourceParentCategory: sourceParentCategory || 'accommodation',
          adminConfirmed: true,
          plan_approved: true,
          aiProvider,
        })
      });
      const data = await res.json();
      if (res.ok) {
        const place = data.place as GooglePlaceData;
        setPlaceData(place);
        
        // Auto-configure photos
        const photosList = place.photos || [];
        setSelectedPhotos(photosList);
        setHeroPhotoIndex(0);

        // Auto-configure facilities
        const draftSecs = (place.aiDraft?.sections || {}) as Record<string, any>;
        const facs = draftSecs.sec_3_facilities?.facilities_list || [];
        setCustomFacilities(Array.isArray(facs) ? facs : []);

        // Auto-configure room types
        const rooms = draftSecs.sec_9_marketplace_catalog?.room_types || [];
        setCustomRoomTypes(Array.isArray(rooms) ? rooms : []);

        if (data.detectedCategory) {
          setDetectedCategory(data.detectedCategory);
          if (!showManualCategoryPicker) {
            setSourceParentCategory(data.detectedCategory.parentId);
            setSourceCategory(data.detectedCategory.childId);
            setSelectedTypeId(data.detectedCategory.childId);
          }
        }

        const provenanceMode = sourceMode === 'url' ? 'live_url' : 'saved_text';
        setSourceProvenance({
          mode: sourceMode,
          sourceLabel: sourceMode === 'url' ? (urlOrQuery || 'Live source URL') : 'Saved page / pasted text snapshot',
          status: provenanceMode,
          capturedAt: new Date().toISOString(),
        });

        showMsg('success', `Successfully analyzed ${place.name || 'business'}. Verify details below.`);
      } else {
        showMsg('error', data.error || 'Failed to retrieve details.');
      }
    } catch {
      showMsg('error', 'API connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCheck = async () => {
    if (!placeData) return;
    try {
      const res = await fetch('/api/jana/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: placeData.name,
          address: placeData.address,
          phone: placeData.phone,
          website: placeData.website,
          lat: placeData.lat,
          lng: placeData.lng,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate check failed');
      setDuplicateGroups(data.duplicates || []);
      if ((data.duplicates || []).length > 0) {
        showMsg('success', `Found ${data.duplicates.length} duplicate cluster(s). Review below.`);
      } else {
        showMsg('success', '✓ No duplicate records found. Ready for instant save!');
      }
    } catch (error: any) {
      showMsg('error', error.message || 'Duplicate check failed.');
    }
  };

  const handleDuplicateDecision = async (decision: 'merge' | 'keep_separate' | 'reject', targetBusinessId?: string, targetName?: string) => {
    if (!placeData) return;
    try {
      const res = await fetch('/api/jana/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          decision,
          candidateId: placeData.placeId || placeData.name,
          targetBusinessId,
          sourceName: placeData.name,
          sourceUrl: placeData.sourceUrl || urlOrQuery || sourceText,
          reason: `${decision} selected by admin for duplicate review on ${placeData.name}`,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Decision update failed.');

      setDuplicateGroups(current => current.filter(item => item.id !== (targetBusinessId || item.id)));
      showMsg('success', `Updated duplicate decision for ${targetName || placeData.name}.`);
    } catch (error: any) {
      showMsg('error', error.message || 'Duplicate decision update failed.');
    }
  };

  const handleImport = async (publishImmediately = true) => {
    if (!placeData) return;
    const finalTypeId = selectedTypeId || sourceCategory || 'hotel';
    setSaving(true);
    try {
      // Re-order photos putting the hero photo first
      const heroPhoto = selectedPhotos[heroPhotoIndex] || selectedPhotos[0] || '';
      const finalPhotosList = [
        heroPhoto,
        ...selectedPhotos.filter((_, idx) => idx !== heroPhotoIndex)
      ].filter(Boolean);

      // Update placeData payload with custom edits
      const updatedPlaceData: GooglePlaceData = {
        ...placeData,
        photos: finalPhotosList,
        aiDraft: {
          ...((placeData.aiDraft as any) || {}),
          sections: {
            ...((placeData.aiDraft?.sections as any) || {}),
            sec_3_facilities: {
              ...(((placeData.aiDraft?.sections as any)?.sec_3_facilities) || {}),
              facilities_list: customFacilities,
            },
            sec_9_marketplace_catalog: {
              ...(((placeData.aiDraft?.sections as any)?.sec_9_marketplace_catalog) || {}),
              room_types: customRoomTypes,
            }
          }
        }
      };

      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: updatedPlaceData.name,
          type_id: finalTypeId,
          source_url: urlOrQuery || updatedPlaceData.sourceUrl || 'direct_import',
          source_category: sourceCategory || finalTypeId,
          source_parent_category: sourceParentCategory,
          policy_updates: policyUpdates,
          regulation_updates: regulationUpdates,
          admin_confirmed: true,
          plan_approved: true,
          ai_provider: aiProvider,
          google_place_id: updatedPlaceData.placeId || `place_${Date.now()}`,
          contributor_name: contributorName,
          google_data: updatedPlaceData,
          publish_immediately: publishImmediately,
          active_minisite_sections: activeMinistiteSections,
          hero_photo: heroPhoto,
        })
      });
      const data = await res.json();
      if (res.ok) {
        const msg = publishImmediately
          ? `✓ "${updatedPlaceData.name}" saved & PUBLISHED directly to Business Registry! Redirecting...`
          : `✓ "${updatedPlaceData.name}" saved as pending review. Redirecting...`;
        showMsg('success', msg);
        setTimeout(() => {
          window.location.href = '/jana/businesses';
        }, 1200);
      } else {
        showMsg('error', data.error || 'Failed to save business.');
      }
    } catch {
      showMsg('error', 'Save request failed.');
    } finally {
      setSaving(false);
    }
  };

  const sendChatMessage = async (contentToSend?: string) => {
    const content = (typeof contentToSend === 'string' ? contentToSend : chatInput).trim();
    if (!content) return;
    const nextMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(nextMessages);
    if (!contentToSend) setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: nextMessages,
          sourceCategory,
          sourceParentCategory,
          sourceUrl: urlOrQuery,
          adminConfirmed,
          aiProvider,
          draft: placeData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI agent could not reply.');
      setChatMessages(current => [...current, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch (error: any) {
      setChatMessages(current => [...current, { role: 'assistant', content: `Chat error: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to determine completeness status of a section
  const getSectionCompleteness = (sectionId: string) => {
    if (!placeData) return { label: 'Empty', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    const id = sectionId.toLowerCase();
    
    if (/basic|identity|info|about/.test(id)) {
      return placeData.name && placeData.phone ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
    if (/facilit|amenit/.test(id)) {
      return customFacilities.length > 0 ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
    if (/room|catalog|accommodat/.test(id)) {
      return customRoomTypes.length > 0 ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
    if (/location|map/.test(id)) {
      return placeData.lat && placeData.lng ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
    if (/review|testimon/.test(id)) {
      return (placeData.reviews || []).length > 0 ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Empty', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    }
    if (/gallery|photo/.test(id)) {
      return selectedPhotos.length > 0 ? { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' } : { label: 'Empty', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    }
    return { label: 'Ready', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', padding: '2rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/jana/businesses" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
              ← BACK TO BUSINESS REGISTRY
            </Link>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.4rem 0 0', letterSpacing: '-0.5px' }}>
              ⚡ Smart Source Import &amp; Analyzer
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
              Auto-detect categories, parse multi-OTA listings or raw text, customize inline, and publish directly to Siwa Oasis Directory.
            </p>
          </div>

          {/* Quick AI Advisor Drawer Toggle */}
          <button
            onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            style={{
              background: isAiDrawerOpen ? '#38bdf8' : 'rgba(56,189,248,0.12)',
              color: isAiDrawerOpen ? '#0f172a' : '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
              padding: '0.65rem 1.2rem',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <i className="fas fa-robot"></i> {isAiDrawerOpen ? 'Close AI Advisor' : '💬 Open AI Advisor'}
          </button>
        </div>

        {/* Global Toast Alert */}
        {message.text && (
          <div style={{
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
            color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className={`fas ${message.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            {message.text}
          </div>
        )}

        {/* ── STEP 1: SOURCE INPUT & SMART AUTO-CATEGORIZATION ── */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '1.8rem', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              📥 Step 1: Source Data &amp; Intelligent Classification
            </h2>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setSourceMode('url')}
                style={{
                  background: sourceMode === 'url' ? '#D4AF37' : 'rgba(255,255,255,0.05)',
                  color: sourceMode === 'url' ? '#0f172a' : '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🔗 Public Link / Google Maps
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('text')}
                style={{
                  background: sourceMode === 'text' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: sourceMode === 'text' ? '#0f172a' : '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                📄 Raw Text / Brochure / WhatsApp
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div style={{ marginBottom: '1.2rem' }}>
            {sourceMode === 'url' ? (
              <div>
                <input
                  type="text"
                  placeholder="Paste Google Maps URL, Booking.com link, TripAdvisor link, or place name (e.g. Siwa Safari Camp)..."
                  value={urlOrQuery}
                  onChange={e => setUrlOrQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFetch(); }}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ) : (
              <div>
                <textarea
                  rows={5}
                  placeholder="Paste hotel description, booking confirmation, supplier notes, olive mill specs, or brochure text..."
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          {/* ⚡ Smart Category Auto-Detection Banner */}
          <div style={{
            background: detectedCategory ? 'rgba(212,175,55,0.08)' : 'rgba(15,23,42,0.6)',
            border: `1px solid ${detectedCategory ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                background: '#D4AF37',
                color: '#0f172a',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
                flexShrink: 0
              }}>
                ⚡
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                  CLASSIFICATION INFERENCE
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginTop: '0.15rem' }}>
                  {detectedCategory ? (
                    <span>
                      <strong style={{ color: '#D4AF37' }}>{detectedCategory.parentName}</strong> › {detectedCategory.childName}
                    </span>
                  ) : (
                    <span style={{ color: '#64748b' }}>Awaiting source text to infer typology...</span>
                  )}
                </div>
                {detectedCategory && (
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                    Match Confidence: <strong style={{ color: '#10b981' }}>{Math.round(detectedCategory.confidence * 100)}%</strong> · {detectedCategory.reasons[0]}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowManualCategoryPicker(!showManualCategoryPicker)}
              style={{
                background: showManualCategoryPicker ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.15)',
                color: showManualCategoryPicker ? '#cbd5e1' : '#D4AF37',
                border: '1px solid rgba(212,175,55,0.3)',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {showManualCategoryPicker ? '✓ Done Overriding' : '✏️ Override Category'}
            </button>
          </div>

          {/* Optional Manual Category Dropdowns */}
          {showManualCategoryPicker && (
            <div style={{
              background: '#0f172a',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '1.2rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  PARENT CATEGORY
                </label>
                <select
                  value={sourceParentCategory}
                  onChange={e => {
                    const nextParentId = e.target.value;
                    setSourceParentCategory(nextParentId);
                    setSourceCategory('');
                    setSelectedTypeId('');
                  }}
                  style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="">-- Select parent category --</option>
                  {availableParentTypes.map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  CHILD TYPOLOGY
                </label>
                <select
                  value={sourceCategory}
                  onChange={e => {
                    const nextChildId = e.target.value;
                    setSourceCategory(nextChildId);
                    setSelectedTypeId(nextChildId);
                    const child = availableTypes.find(type => type.id === nextChildId);
                    if (child && child.parent_id) {
                      setSourceParentCategory(child.parent_id);
                    }
                  }}
                  style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="">-- Select specific typology --</option>
                  {availableTypes.filter(t => !t.is_parent && t.id !== 'SECTION_TEMPLATE').map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
              Engine: <strong style={{ color: '#38bdf8' }}>{aiProvider.toUpperCase()} Multi-OTA Analyzer</strong>
            </div>
            <button
              onClick={handleFetch}
              disabled={loading}
              style={{
                background: '#D4AF37',
                color: '#0f172a',
                border: 'none',
                padding: '0.8rem 2rem',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 15px rgba(212,175,55,0.25)'
              }}
            >
              {loading ? (
                <>⏳ Analyzing Source Data...</>
              ) : (
                <>🚀 Fetch &amp; Analyze Source</>
              )}
            </button>
          </div>
        </div>

        {/* ── STEP 2: INLINE EDITABLE PREVIEW & SECTION ENRICHMENT ── */}
        {placeData && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem', boxShadow: '0 4px 25px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                  STEP 2: EXTRACTED DATA
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0.4rem 0 0' }}>
                  Interactive Review &amp; Inline Customizer
                </h2>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                ✏️ Click any field to edit before publishing
              </div>
            </div>

            {/* Basic Info Inline Editor Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.8rem' }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  BUSINESS NAME *
                </label>
                <input
                  type="text"
                  value={placeData.name}
                  onChange={e => setPlaceData({ ...placeData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  PHONE &amp; WHATSAPP
                </label>
                <input
                  type="text"
                  value={placeData.phone}
                  placeholder="+20 100 000 0000"
                  onChange={e => setPlaceData({ ...placeData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  OFFICIAL WEBSITE / BOOKING LINK
                </label>
                <input
                  type="text"
                  value={placeData.website}
                  placeholder="https://..."
                  onChange={e => setPlaceData({ ...placeData, website: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  ADDRESS / LOCATION
                </label>
                <input
                  type="text"
                  value={placeData.address}
                  onChange={e => setPlaceData({ ...placeData, address: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  LATITUDE &amp; LONGITUDE
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={placeData.lat}
                    onChange={e => setPlaceData({ ...placeData, lat: parseFloat(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={placeData.lng}
                    onChange={e => setPlaceData({ ...placeData, lng: parseFloat(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.35rem' }}>
                  SOURCE RATING (OUT OF 5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={placeData.rating}
                  onChange={e => setPlaceData({ ...placeData, rating: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#FFB700', fontSize: '0.95rem', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ── PHOTO GALLERY & HERO CAROUSEL PICKER ── */}
            {placeData.photos && placeData.photos.length > 0 && (
              <div style={{ marginBottom: '1.8rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px' }}>
                    📸 PHOTO GALLERY &amp; HERO BANNER PICKER ({selectedPhotos.length} Photos Selected)
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    Click photo to toggle · Golden border is Hero Banner
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {placeData.photos.map((src, i) => {
                    const isHero = heroPhotoIndex === i;
                    const isSelected = selectedPhotos.includes(src);
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: isHero ? '3px solid #D4AF37' : isSelected ? '2px solid #38bdf8' : '2px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          background: '#1e293b'
                        }}
                      >
                        <img
                          src={src}
                          alt="Scraped place thumbnail"
                          style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', opacity: isSelected ? 1 : 0.4 }}
                          onClick={() => {
                            setSelectedPhotos(prev =>
                              isSelected ? prev.filter(p => p !== src) : [...prev, src]
                            );
                          }}
                        />
                        {isHero && (
                          <div style={{ position: 'absolute', top: 4, left: 4, background: '#D4AF37', color: '#0f172a', fontSize: '0.6rem', fontWeight: 900, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            ★ HERO BANNER
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setHeroPhotoIndex(i);
                            if (!selectedPhotos.includes(src)) setSelectedPhotos([...selectedPhotos, src]);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            background: isHero ? '#10b981' : 'rgba(15,23,42,0.85)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.2rem 0.45rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {isHero ? '✓ Hero' : 'Set Hero'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FACILITIES & AMENITIES INLINE CHIP EDITOR ── */}
            <div style={{ marginBottom: '1.8rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.75rem' }}>
                🛎️ FACILITIES &amp; AMENITIES INLINE EDITOR ({customFacilities.length} Tags)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {customFacilities.map((f, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(56,189,248,0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56,189,248,0.3)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    ✓ {f}
                    <button
                      type="button"
                      onClick={() => setCustomFacilities(customFacilities.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 900, padding: 0, fontSize: '0.8rem' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 400 }}>
                <input
                  type="text"
                  placeholder="Add custom facility (e.g. Desert Campfire, Organic Pool)..."
                  value={newFacilityInput}
                  onChange={e => setNewFacilityInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newFacilityInput.trim()) {
                      e.preventDefault();
                      setCustomFacilities([...customFacilities, newFacilityInput.trim()]);
                      setNewFacilityInput('');
                    }
                  }}
                  style={{ flex: 1, padding: '0.55rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newFacilityInput.trim()) {
                      setCustomFacilities([...customFacilities, newFacilityInput.trim()]);
                      setNewFacilityInput('');
                    }
                  }}
                  style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* ── ROOM / UNIT TYPES INLINE EDITOR (If applicable) ── */}
            {customRoomTypes.length > 0 && (
              <div style={{ marginBottom: '1.8rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  🛏️ ROOM / LODGING / CATALOG INVENTORY ({customRoomTypes.length} Configurations)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {customRoomTypes.map((room, idx) => (
                    <div key={idx} style={{ background: '#1e293b', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <input
                        type="text"
                        value={room.name}
                        onChange={e => {
                          const updated = [...customRoomTypes];
                          updated[idx].name = e.target.value;
                          setCustomRoomTypes(updated);
                        }}
                        style={{ width: '100%', padding: '0.45rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        value={room.beds}
                        placeholder="Bed configuration / specs"
                        onChange={e => {
                          const updated = [...customRoomTypes];
                          updated[idx].beds = e.target.value;
                          setCustomRoomTypes(updated);
                        }}
                        style={{ width: '100%', padding: '0.45rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MINISITE SECTION VISIBILITY & HEALTH INDICATORS ── */}
            {availableSectionsForType.length > 0 && (
              <div style={{ marginBottom: '1.8rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', display: 'block' }}>
                      🗂️ MINISITE SECTIONS &amp; HEALTH STATUS
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                      🟢 Complete data · 🟡 Partial / Baseline · ⚪ Empty
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setActiveMinistiteSections(availableSectionsForType.map((s: any) => s.id))}
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}>
                      Enable All
                    </button>
                    <button type="button" onClick={() => setActiveMinistiteSections([])}
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}>
                      Disable All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem' }}>
                  {availableSectionsForType.map((s: any) => {
                    const isOn = activeMinistiteSections.includes(s.id);
                    const health = getSectionCompleteness(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => setActiveMinistiteSections(prev =>
                          isOn ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        )}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isOn ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isOn ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          padding: '0.6rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: isOn ? '#D4AF37' : '#64748b', fontWeight: 900, fontSize: '0.85rem' }}>
                            {isOn ? '☑' : '☐'}
                          </span>
                          <span style={{ color: isOn ? '#fff' : '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>
                            {s.name}
                          </span>
                        </div>
                        <span style={{
                          background: health.bg,
                          color: health.color,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}>
                          {health.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Policy & Contributor Attribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.8rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  POLICIES &amp; REGULATIONS (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={policyUpdates}
                  onChange={e => setPolicyUpdates(e.target.value)}
                  placeholder="Cancellation policies, check-in times, desert safety rules..."
                  style={{ width: '100%', padding: '0.65rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  LOCAL GUIDE / CONTRIBUTOR ATTRIBUTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siwa Oasis Scout / Fatma Guide"
                  value={contributorName}
                  onChange={e => setContributorName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ── STEP 3: DUPLICATE CHECK & PUBLISHING BAR ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                onClick={handleDuplicateCheck}
                style={{
                  background: 'rgba(56,189,248,0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56,189,248,0.3)',
                  padding: '0.8rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🔍 Check Duplicates
              </button>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleImport(false)}
                  disabled={saving}
                  style={{
                    background: '#334155',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.85rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Save as Draft / Pending
                </button>
                <button
                  onClick={() => handleImport(true)}
                  disabled={saving}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '0.85rem 2rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: saving ? 'wait' : 'pointer',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {saving ? 'Saving...' : '✓ Save & Publish Live'}
                </button>
              </div>
            </div>

            {/* Duplicate Clusters Review List (if detected) */}
            {duplicateGroups.length > 0 && (
              <div style={{ marginTop: '1.5rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(96,165,250,0.35)' }}>
                <div style={{ color: '#7dd3fc', fontWeight: 800, marginBottom: '0.8rem', letterSpacing: '1px', fontSize: '0.75rem' }}>
                  ⚠️ DUPLICATE CLUSTERS DETECTED ({duplicateGroups.length})
                </div>
                {duplicateGroups.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.8rem', background: 'rgba(15,23,42,0.8)', marginBottom: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#fff' }}>{item.name}</strong>
                      <span style={{ color: '#93c5fd', fontWeight: 800, fontSize: '0.72rem' }}>Match {item.score?.toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '0.35rem' }}>{item.address || 'Siwa Oasis'}</div>
                    <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleDuplicateDecision('merge', item.id, item.name)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontWeight: 700, fontSize: '0.75rem' }}>Merge</button>
                      <button onClick={() => handleDuplicateDecision('keep_separate', item.id, item.name)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontWeight: 700, fontSize: '0.75rem' }}>Keep Separate</button>
                      <button onClick={() => handleDuplicateDecision('reject', item.id, item.name)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontWeight: 700, fontSize: '0.75rem' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COLLAPSIBLE AI IMPORT ADVISOR DRAWER ── */}
        {isAiDrawerOpen && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '420px',
            maxWidth: '90vw',
            background: '#1e293b',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(56,189,248,0.3)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1rem 1.25rem', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>AI Import Advisor</strong>
              </div>
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Quick Chips */}
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.5)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => sendChatMessage('Help me classify this business category')}
                disabled={chatLoading}
                style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
              >
                💡 Classify Category
              </button>
              <button
                type="button"
                onClick={() => sendChatMessage('List required database fields for this business')}
                disabled={chatLoading}
                style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
              >
                📋 Required Fields
              </button>
            </div>

            {/* Chat Conversation Log */}
            <div style={{ padding: '1rem', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.role === 'user' ? '#D4AF37' : '#0f172a',
                    color: msg.role === 'user' ? '#0f172a' : '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    fontWeight: msg.role === 'user' ? 800 : 400
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '0.75rem 1rem', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.5rem' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendChatMessage(); }}
                placeholder="Ask question..."
                style={{ flex: 1, padding: '0.55rem 0.75rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
              />
              <button
                onClick={() => sendChatMessage()}
                disabled={chatLoading || !chatInput.trim()}
                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {chatLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
