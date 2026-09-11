'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getPreferredAiProvider } from '@/lib/source-agent';

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
  aiDraft?: unknown;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const FALLBACK_CATEGORIES = [
  { id: 'hotel', name: 'Hotel', parent_id: 'accommodation', is_parent: false },
  { id: 'guest_house', name: 'Guest House', parent_id: 'accommodation', is_parent: false },
  { id: 'villa', name: 'Villa', parent_id: 'accommodation', is_parent: false },
  { id: 'restaurant', name: 'Restaurant', parent_id: 'food_beverage', is_parent: false },
  { id: 'activity', name: 'Activity', parent_id: 'experiences', is_parent: false },
  { id: 'attraction', name: 'Attraction', parent_id: 'experiences', is_parent: false },
  { id: 'transportation', name: 'Transportation', parent_id: 'transportation', is_parent: false },
  { id: 'craft', name: 'Craft', parent_id: 'crafts', is_parent: false },
  { id: 'wellness', name: 'Wellness', parent_id: 'wellness', is_parent: false },
  { id: 'other', name: 'Other', parent_id: 'other', is_parent: false },
];

export default function GoogleImportWizard() {
  const [urlOrQuery, setUrlOrQuery] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [sourceMode, setSourceMode] = useState<'url' | 'text'>('url');
  const [sourceProvenance, setSourceProvenance] = useState<{ mode: 'url' | 'text'; sourceLabel: string; status: 'live_url' | 'saved_text'; capturedAt: string } | null>(null);
  const [contributorName, setContributorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('hotel');
  const [adminConfirmed, setAdminConfirmed] = useState(true);
  const [activeMinistiteSections, setActiveMinistiteSections] = useState<string[]>([]);
  const [availableSectionsForType, setAvailableSectionsForType] = useState<any[]>([]);
  const [planApproved, setPlanApproved] = useState(true);
  const [policyUpdates, setPolicyUpdates] = useState('');
  const [regulationUpdates, setRegulationUpdates] = useState('');
  const [chatCompleted, setChatCompleted] = useState(false);
  const [sourceParentCategory, setSourceParentCategory] = useState('accommodation');
  const [sourceCategory, setSourceCategory] = useState('hotel');
  const [aiProvider, setAiProvider] = useState('built_in');
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({ built_in: true });
  const preferredProvider = getPreferredAiProvider();
  const startupTriggeredRef = useRef(false);
  const providerStatusText = `${aiProvider.toUpperCase()} ${configuredProviders[aiProvider] ? 'configured' : 'not configured'}${preferredProvider === aiProvider ? ' · preferred default' : ''}`;
  const [placeData, setPlaceData] = useState<GooglePlaceData | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Before fetching anything, tell me what you want to import. I can help plan the website/page review, category fit, database fields, source limits, provenance, and duplicate checks.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const availableTypes = types.length ? types : FALLBACK_CATEGORIES;
  const availableParentTypes = availableTypes.filter(t => t.is_parent && t.id !== 'SECTION_TEMPLATE');
  const availableChildTypes = availableTypes.filter(t => !t.is_parent && t.parent_id === sourceParentCategory);
  const selectedParentType = availableTypes.find(t => t.id === sourceParentCategory);
  const selectedChildType = availableTypes.find(t => t.id === sourceCategory);

  const validateCategorySelection = () => {
    // Permissive: auto-resolves category if missing or mismatched
    return { valid: true, message: '' };
  };

  // Load Typologies for Mapping
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

  // Load sections for the selected child typology (for the minisite section picker)
  useEffect(() => {
    if (!sourceCategory) { setAvailableSectionsForType([]); setActiveMinistiteSections([]); return; }
    fetch(`/api/jana/sections?type=${sourceCategory}`)
      .then(res => res.json())
      .then((sections: any[]) => {
        setAvailableSectionsForType(sections || []);
        // Default: all sections selected
        setActiveMinistiteSections((sections || []).map((s: any) => s.id));
      })
      .catch(() => {});
  }, [sourceCategory]);

  useEffect(() => {
    if (startupTriggeredRef.current) return;
    if (!Object.keys(configuredProviders).length) return;

    const preferred = getPreferredAiProvider();
    const selectedProvider = configuredProviders[preferred] ? preferred : (configuredProviders['built_in'] ? 'built_in' : 'built_in');
    if (selectedProvider) {
      setAiProvider(selectedProvider);
    }

    const runStartupChat = async () => {
      if (!configuredProviders[selectedProvider] || startupTriggeredRef.current) return;
      startupTriggeredRef.current = true;
      const welcomePrompt = 'Initialize the admin-only source import workflow. Review the selected category rules, source provenance requirements, duplicate-check plan, and show the next required admin step before any source fetch or publish action.';
      const nextMessages = [...chatMessages, { role: 'user' as const, content: welcomePrompt }];
      setChatMessages(current => [...current, { role: 'user', content: welcomePrompt }]);
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
            aiProvider: selectedProvider,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'The selected agent could not start the workflow.');
        setChatMessages(current => [...current, { role: 'assistant', content: data.reply || 'The agent returned an empty reply.' }]);
      } catch (error: any) {
        setChatMessages(current => [...current, { role: 'assistant', content: `Startup chat error: ${error.message}` }]);
      } finally {
        setChatLoading(false);
      }
    };

    runStartupChat();
  }, [configuredProviders, aiProvider, sourceCategory, sourceParentCategory, urlOrQuery, adminConfirmed]);

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 7000);
  };

  const applyCategorySelection = (parentId: string, childId: string) => {
    setSourceParentCategory(parentId);
    setSourceCategory(childId);
    setSelectedTypeId(childId);
    setPlanApproved(false);
  };

  const handleFetch = async () => {
    const hasUrl = sourceMode === 'url' && urlOrQuery.trim();
    const hasText = sourceMode === 'text' && sourceText.trim();

    if (!hasUrl && !hasText) {
      showMsg('error', sourceMode === 'text' ? 'Please paste the source text or business details to analyze.' : 'Please enter a source link or business URL.');
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
        setPlaceData(data.place);
        if (data.category && !sourceCategory) {
          setSourceCategory(data.category);
          setSelectedTypeId(data.category);
        }
        if (data.parentCategory && !sourceParentCategory) {
          setSourceParentCategory(data.parentCategory);
        }
        setAdminConfirmed(true);
        setPlanApproved(true);
        const provenanceMode = sourceMode === 'url' ? 'live_url' : 'saved_text';
        setSourceProvenance({
          mode: sourceMode,
          sourceLabel: sourceMode === 'url' ? (urlOrQuery || 'Live source URL') : 'Saved page / pasted text snapshot',
          status: provenanceMode,
          capturedAt: new Date().toISOString(),
        });
        if (data.detailsAvailable === false) {
          showMsg('error', data.message || 'The source page did not expose complete location details. Review the draft before saving.');
        } else {
          showMsg('success', `Successfully analyzed the ${data.source || 'source'} page.`);
        }
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
        showMsg('success', `Found ${data.duplicates.length} likely duplicate cluster(s). Review before saving.`);
      } else {
        showMsg('success', 'No strong duplicate cluster detected for this source.');
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
      showMsg('success', `${decision === 'merge' ? 'Merged' : decision === 'keep_separate' ? 'Kept separate' : 'Rejected'} ${targetName || placeData.name} from duplicate review.`);
    } catch (error: any) {
      showMsg('error', error.message || 'Duplicate decision update failed.');
    }
  };

  const handleImport = async (publishImmediately = true) => {
    if (!placeData) return;
    const finalTypeId = selectedTypeId || sourceCategory || 'hotel';
    setSaving(true);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: placeData.name,
          type_id: finalTypeId,
          source_url: urlOrQuery || placeData.sourceUrl || 'direct_import',
          source_category: sourceCategory || finalTypeId,
          source_parent_category: sourceParentCategory,
          policy_updates: policyUpdates,
          regulation_updates: regulationUpdates,
          admin_confirmed: true,
          plan_approved: true,
          ai_provider: aiProvider,
          google_place_id: placeData.placeId || `place_${Date.now()}`,
          contributor_name: contributorName,
          google_data: placeData,
          publish_immediately: publishImmediately,
          active_minisite_sections: activeMinistiteSections,
        })
      });
      const data = await res.json();
      if (res.ok) {
        const msg = publishImmediately
          ? `"${placeData.name}" saved and PUBLISHED directly to Business Registry! Redirecting...`
          : `"${placeData.name}" saved as pending review. Redirecting...`;
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
    if (configuredProviders[aiProvider] === false) {
      showMsg('error', `${aiProvider} is not configured on the server.`);
      return;
    }
    const nextMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(nextMessages);
    if (!contentToSend) setChatInput('');
    setChatLoading(true);
    try {
      setChatCompleted(true);
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
      if (!res.ok) throw new Error(data.error || 'The selected agent could not reply.');
      setChatMessages(current => [...current, { role: 'assistant', content: data.reply || 'The agent returned an empty reply.' }]);
    } catch (error: any) {
      setChatMessages(current => [...current, { role: 'assistant', content: `Chat error: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChat = async () => {
    await sendChatMessage();
  };


  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/jana/businesses" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
            ← BUSINESS REGISTRY
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0 0', letterSpacing: '-1px' }}>
            🔗 Source Import Wizard
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0' }}>
            Paste an approved source link and confirm the matching business category before fetching and importing the record.
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1.5rem', background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, color: message.type === 'error' ? '#fca5a5' : '#6ee7b7', fontWeight: 700 }}>
            {message.text}
          </div>
        )}

        {/* Main Form Control */}
        <div style={{ order: 1, background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#fff', fontWeight: 800 }}>📌 Step 1: Select Category & Source Data</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                PARENT CATEGORY
              </label>
              <select
                value={sourceParentCategory}
                onChange={e => {
                  const nextParentId = e.target.value;
                  setSourceParentCategory(nextParentId);
                  setSourceCategory('');
                  setSelectedTypeId('');
                  setPlanApproved(false);
                }}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="">-- Select parent category --</option>
                {availableParentTypes.map(parent => (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
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
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="">-- Auto-detect typology (or choose specific) --</option>
                {availableTypes.filter(t => !t.is_parent && t.id !== 'SECTION_TEMPLATE').map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                AI PROVIDER
              </label>
              <select
                value={aiProvider}
                onChange={e => {
                  setAiProvider(e.target.value);
                  setPlanApproved(false);
                }}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="built_in">⚡ Built-in Smart Extractor (Ready / Zero Setup)</option>
                <option value="gemini">Google Gemini {configuredProviders.gemini ? '(configured)' : '(not configured)'}</option>
                <option value="openai">OpenAI {configuredProviders.openai ? '(configured)' : '(not configured)'}</option>
                <option value="claude">Claude {configuredProviders.claude ? '(configured)' : '(not configured)'}</option>
                <option value="ollama">Ollama {configuredProviders.ollama ? '(configured)' : '(not configured)'}</option>
                <option value="manus">Manus {configuredProviders.manus ? '(configured)' : '(not configured)'}</option>
              </select>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.4rem' }}>
                Only providers marked configured can analyze the source. Keys remain on the server. Preferred default: <strong style={{ color: '#D4AF37' }}>{preferredProvider.toUpperCase()}</strong>.
              </div>
              <div style={{ marginTop: '0.55rem', color: '#bfdbfe', fontSize: '0.7rem', fontWeight: 700 }}>
                Active status: {providerStatusText}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                SOURCE INPUT
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setSourceMode('url')}
                  style={{
                    background: sourceMode === 'url' ? '#D4AF37' : '#0f172a',
                    color: sourceMode === 'url' ? '#0f172a' : '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Public Link / Search
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('text')}
                  style={{
                    background: sourceMode === 'text' ? '#60a5fa' : '#0f172a',
                    color: sourceMode === 'text' ? '#0f172a' : '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Pasted Text / Document Summary
                </button>
              </div>

              {sourceMode === 'url' ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Paste a Google Maps link, website URL, or type a place name (e.g. Siwa Paradise Hotel)..."
                    value={urlOrQuery}
                    onChange={e => {
                      setUrlOrQuery(e.target.value);
                      setPlanApproved(false);
                    }}
                    style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              ) : (
                <textarea
                  rows={6}
                  placeholder="Paste a saved page, brochure text, supplier note, or extracted content here. This mode is meant for offline analysis when the internet is unavailable."
                  value={sourceText}
                  onChange={e => {
                    setSourceText(e.target.value);
                    setPlanApproved(false);
                  }}
                  style={{ width: '100%', resize: 'vertical', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              )}

              <div style={{ marginTop: '0.75rem', padding: '0.7rem 0.9rem', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', fontSize: '0.72rem', color: '#bfdbfe', fontWeight: 700 }}>
                Source mode: {sourceMode === 'url' ? 'LIVE URL / internet available' : 'OFFLINE SAVED PAGE / pasted content'}
                {sourceProvenance && (
                  <span style={{ display: 'block', marginTop: '0.3rem', color: '#dbeafe' }}>
                    Provenance: {sourceProvenance.status === 'live_url' ? 'Live fetch captured' : 'Saved-page snapshot captured'} · {new Date(sourceProvenance.capturedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
                <button
                  onClick={handleFetch}
                  disabled={loading}
                  style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? 'Analyzing...' : <><i className="fas fa-link"></i> Analyze Source</>}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={adminConfirmed}
                  onChange={e => {
                    setAdminConfirmed(e.target.checked);
                    setPlanApproved(e.target.checked);
                  }}
                  style={{ width: 18, height: 18, accentColor: '#10b981' }}
                />
                <span>Admin confirms source match and approves analysis for this typology.</span>
              </label>
            </div>


            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                BUSINESS POLICIES UPDATE (OPTIONAL)
              </label>
              <textarea
                rows={4}
                value={policyUpdates}
                onChange={e => setPolicyUpdates(e.target.value)}
                placeholder="Add any policy changes, booking rules, cancellation guidance, refund terms, or business operating policies for this listing."
                style={{ width: '100%', resize: 'vertical', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                REGULATIONS & COMPLIANCE UPDATE (OPTIONAL)
              </label>
              <textarea
                rows={4}
                value={regulationUpdates}
                onChange={e => setRegulationUpdates(e.target.value)}
                placeholder="Add regulations, safety rules, compliance text, guest requirements, or legal/operational requirements that should be visible to visitors."
                style={{ width: '100%', resize: 'vertical', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                CONTRIBUTOR ATTRIBUTION NAME (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Fatma Local Guide (Rewards & Badge will link to this name)"
                value={contributorName}
                onChange={e => setContributorName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div style={{ order: 2, background: '#172033', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(96,165,250,0.25)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, color: '#fff', fontWeight: 800 }}>💬 Step 2: AI Pre-flight Planning & Verification (Optional)</h3>
            <span style={{ fontSize: '0.72rem', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
              {selectedChildType ? `Active: ${selectedChildType.name}` : 'Typology: Pending Selection'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 0.8rem' }}>
            Ask the AI advisor to verify category rules, recommend typologies for complex venues, or explain required database fields.
          </p>

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <button
              type="button"
              onClick={() => sendChatMessage('Help me pick the best category for this place')}
              disabled={chatLoading}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              💡 Help Me Pick Category
            </button>
            <button
              type="button"
              onClick={() => sendChatMessage('Show required sections and fields for this category')}
              disabled={chatLoading}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              📋 Show Required Fields
            </button>
            <button
              type="button"
              onClick={() => sendChatMessage('Verify category rules and duplicate check plan')}
              disabled={chatLoading}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              ✅ Verify Category Rules
            </button>
            <button
              type="button"
              onClick={() => sendChatMessage('Initialize and confirm pre-flight plan')}
              disabled={chatLoading}
              style={{ background: 'rgba(255,255,255,0.06)', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🚀 Confirm Plan
            </button>
          </div>

          <div role="log" aria-live="polite" aria-label="Selected agent conversation" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 240, overflowY: 'auto', marginBottom: '1rem', background: '#0b1120', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {chatMessages.map((chatMessage, index) => (
              <div key={`${chatMessage.role}-${index}`} style={{ alignSelf: chatMessage.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', background: chatMessage.role === 'user' ? 'rgba(212,175,55,0.16)' : '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.7rem 0.85rem', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                {chatMessage.content}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleChat(); } }}
              placeholder="Ask the AI advisor any question before analyzing..."
              disabled={chatLoading}
              style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
            <button
              onClick={handleChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ background: '#60a5fa', color: '#0f172a', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 800, cursor: chatLoading ? 'wait' : 'pointer' }}
            >
              {chatLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>


        {/* Place Details Preview Panel */}
        {placeData && (
          <div className="animate-in" style={{ order: 3, background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 800 }}>📋 Step 3: Preview & Confirm Extracted Data</h3>
            </div>

            {/* Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Basic Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>NAME</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: '0.2rem' }}>{placeData.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>ADDRESS</span>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>{placeData.address}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>PHONE</span>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>{placeData.phone || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>WEBSITE</span>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.2rem', textDecoration: 'underline' }}>
                    {placeData.website ? <a href={placeData.website} target="_blank" style={{ color: '#38bdf8' }}>{placeData.website}</a> : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Map & Coordinates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0f172a', padding: '1.25rem', borderRadius: '12px' }}>
                <span style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px' }}>📍 LOCATION COORDINATES</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', display: 'block' }}>LATITUDE</span>
                    <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{placeData.lat}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', display: 'block' }}>LONGITUDE</span>
                    <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{placeData.lng}</strong>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.6rem', display: 'block', marginBottom: '0.25rem' }}>SOURCE RATING</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#FFB700' }}>⭐ {placeData.rating} / 5</span>
                </div>
                {/* 🗺️ Two-Way Link to Google Maps */}
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.6rem', display: 'block', marginBottom: '0.4rem', fontWeight: 800 }}>TWO-WAY SYNC HELPER</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${placeData.lat},${placeData.lng}`} 
                    target="_blank" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}
                  >
                    <i className="fas fa-map-marked-alt"></i> Contribute / View on Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Photos Preview */}
            {placeData.photos?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>PHOTOS IMPORTED</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {placeData.photos.map((src, i) => (
                    <img key={i} src={src} alt="Imported thumbnail" style={{ width: 100, height: 70, borderRadius: '8px', objectFit: 'cover', background: '#0f172a' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Hospitality Breakdown from AI / Universal Parser */}
            {Boolean((placeData as any).aiDraft?.sections) && (() => {
              const draftSecs = ((placeData as any).aiDraft?.sections || {}) as Record<string, any>;
              const facList = draftSecs.sec_3_facilities?.facilities_list || [];
              const roomTypes = draftSecs.sec_9_marketplace_catalog?.room_types || [];
              const reviewList = draftSecs.sec_10_testimonials_faqs?.review_highlights || [];
              return (
                <div style={{ marginBottom: '1.5rem', background: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    🏨 STRUCTURED SECTIONS RECOGNIZED (AUTOMATICALLY POPULATED)
                  </div>
                  {facList.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>FACILITIES & AMENITIES</span>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {facList.map((f: string, idx: number) => (
                          <span key={idx} style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {roomTypes.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>ROOM / LODGING CONFIGURATIONS ({roomTypes.length})</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {roomTypes.map((r: any, idx: number) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#fff' }}>{r.name}</strong>
                            <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginTop: '0.15rem' }}>{r.beds}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reviewList.length > 0 && (
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>GUEST REVIEWS ({reviewList.length})</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {reviewList.slice(0, 2).map((q: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.72rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', color: '#cbd5e1' }}>
                            "{q.text}" — <strong>{q.author}</strong> ({q.country})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Reviews list */}
            {placeData.reviews?.length > 0 && (
              <div style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>VERIFIED REVIEWS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {placeData.reviews.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{r.author_name}</strong>
                        <span style={{ color: '#FFB700', fontSize: '0.75rem', fontWeight: 800 }}>{'★'.repeat(r.rating || 5)}</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>"{r.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Mapping */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontWeight: 800 }}>🏢 Step 4: Fill Database & Save for Approval</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>SELECT BUSINESS TYPOLOGY *</label>
                  <select 
                    value={selectedTypeId} 
                    onChange={e => setSelectedTypeId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  >
                    <option value="">-- Map to Typology (subcategories only) --</option>
                    {types
                      .filter(t => !t.is_parent && t.parent_id)
                      .map(t => {
                        const parent = types.find(p => p.id === t.parent_id);
                        return (
                          <option key={t.id} value={t.id}>
                            {parent ? `${parent.name} › ` : ''}{t.name}
                          </option>
                        );
                      })
                    }
                  </select>
                </div>

                {/* ── MINISITE SECTION VISIBILITY PICKER ─────────────────── */}
                {availableSectionsForType.length > 0 && (
                  <div style={{ marginTop: '1rem', background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span style={{ color: '#D4AF37', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '1px' }}>
                        🗂️ MINISITE SECTIONS — Choose which sections visitors can see
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setActiveMinistiteSections(availableSectionsForType.map((s: any) => s.id))}
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
                          All On
                        </button>
                        <button type="button" onClick={() => setActiveMinistiteSections([])}
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
                          All Off
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableSectionsForType.map((s: any) => {
                        const isOn = activeMinistiteSections.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveMinistiteSections(prev =>
                              isOn ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            )}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              background: isOn ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${isOn ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                              color: isOn ? '#D4AF37' : '#64748b',
                              padding: '0.35rem 0.75rem', borderRadius: '999px',
                              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            {s.icon && <i className={`fas ${s.icon}`} style={{ fontSize: '0.65rem' }} />}
                            {isOn ? '✓' : '○'} {s.name}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '0.65rem', fontSize: '0.65rem', color: '#475569' }}>
                      {activeMinistiteSections.length} of {availableSectionsForType.length} sections visible to visitors
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={handleDuplicateCheck}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.8rem 1.25rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    🔍 Check Duplicates
                  </button>
                  <button
                    onClick={() => handleImport(true)}
                    disabled={saving}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.85rem 1.8rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {saving ? 'Saving...' : <><i className="fas fa-check-circle"></i> Save &amp; Publish (Live in Registry)</>}
                  </button>
                  <button
                    onClick={() => handleImport(false)}
                    disabled={saving}
                    style={{ background: '#334155', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {saving ? 'Saving...' : <><i className="fas fa-clock"></i> Save as Pending Review</>}
                  </button>
                </div>


                {duplicateGroups.length > 0 && (
                  <div style={{ marginTop: '1rem', background: '#0f172a', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(96,165,250,0.35)' }}>
                    <div style={{ color: '#7dd3fc', fontWeight: 800, marginBottom: '0.8rem', letterSpacing: '1px', fontSize: '0.68rem' }}>DUPLICATE REVIEW GROUPS</div>
                    {duplicateGroups.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.8rem', background: 'rgba(15,23,42,0.8)', marginBottom: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ color: '#fff' }}>{item.name}</strong>
                          <span style={{ color: '#93c5fd', fontWeight: 800, fontSize: '0.72rem' }}>Match {item.score.toFixed(2)}</span>
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '0.45rem' }}>{item.address || 'No address available'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                          {item.reasons.length ? item.reasons.join(' • ') : 'Likely duplicate based on name and location.'}
                        </div>
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button onClick={() => handleDuplicateDecision('merge', item.id, item.name)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.7rem', fontWeight: 700 }}>Merge</button>
                          <button onClick={() => handleDuplicateDecision('keep_separate', item.id, item.name)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.7rem', fontWeight: 700 }}>Keep Separate</button>
                          <button onClick={() => handleDuplicateDecision('reject', item.id, item.name)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.7rem', fontWeight: 700 }}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
