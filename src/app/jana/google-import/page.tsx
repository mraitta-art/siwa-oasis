'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
  const [contributorName, setContributorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [sourceCategory, setSourceCategory] = useState('');
  const [aiProvider, setAiProvider] = useState('ollama');
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({});
  const [placeData, setPlaceData] = useState<GooglePlaceData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Confirm the category and source link, then ask me about the import, missing fields, or duplicate risks.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const availableTypes = types.length ? types : FALLBACK_CATEGORIES;

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
      .then(data => setConfiguredProviders(data.providers || {}))
      .catch(() => setConfiguredProviders({}));
  }, []);

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 7000);
  };

  const handleFetch = async () => {
    if (!urlOrQuery.trim()) {
      showMsg('error', 'Please enter a source link or business URL.');
      return;
    }
    if (!sourceCategory) {
      showMsg('error', 'Please select the business category before continuing.');
      return;
    }
    if (!adminConfirmed) {
      showMsg('error', 'Admin confirmation is required before fetching or importing source data.');
      return;
    }
    if (configuredProviders[aiProvider] === false) {
      showMsg('error', `${aiProvider} is not configured on the production server. Add its server environment variable and restart the app.`);
      return;
    }
    setLoading(true);
    setPlaceData(null);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch', urlOrQuery, sourceCategory, adminConfirmed, aiProvider })
      });
      const data = await res.json();
      if (res.ok) {
        setPlaceData(data.place);
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

  const handleImport = async () => {
    if (!placeData) return;
    if (!selectedTypeId) {
      showMsg('error', 'Please map this place to a Business Typology.');
      return;
    }
    if (!sourceCategory) {
      showMsg('error', 'Please select the business category before saving.');
      return;
    }
    if (!adminConfirmed) {
      showMsg('error', 'Admin confirmation is required before saving the import.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: placeData.name,
          type_id: selectedTypeId,
          source_url: urlOrQuery,
          source_category: sourceCategory,
          admin_confirmed: adminConfirmed,
          ai_provider: aiProvider,
          google_place_id: placeData.placeId,
          contributor_name: contributorName,
          google_data: placeData
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `"${placeData.name}" imported successfully as pending approval! Redirecting...`);
        setTimeout(() => {
          window.location.href = '/jana/businesses';
        }, 2000);
      } else {
        showMsg('error', data.error || 'Failed to save business.');
      }
    } catch {
      showMsg('error', 'Save request failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleChat = async () => {
    const content = chatInput.trim();
    if (!content) return;
    if (!sourceCategory || !urlOrQuery.trim() || !adminConfirmed) {
      showMsg('error', 'Select the category, enter the source link, and confirm the import before chatting.');
      return;
    }
    if (configuredProviders[aiProvider] === false) {
      showMsg('error', `${aiProvider} is not configured on the server.`);
      return;
    }
    const nextMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: nextMessages,
          sourceCategory,
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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
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
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#fff', fontWeight: 800 }}>🔍 Step 1: Confirm Category & Source Link</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                BUSINESS CATEGORY
              </label>
              <select
                value={sourceCategory}
                onChange={e => setSourceCategory(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="">-- Select business category --</option>
                {availableTypes
                  .filter(t => !t.is_parent && t.parent_id)
                  .map(t => {
                    const parent = types.find(p => p.id === t.parent_id);
                    return (
                      <option key={t.id} value={t.id}>
                        {parent ? `${parent.name} › ` : ''}{t.name}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                AI PROVIDER
              </label>
              <select
                value={aiProvider}
                onChange={e => setAiProvider(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              >
                <option value="ollama">Ollama {configuredProviders.ollama ? '(configured)' : '(not configured)'}</option>
                <option value="openai">OpenAI {configuredProviders.openai ? '(configured)' : '(not configured)'}</option>
                <option value="claude">Claude {configuredProviders.claude ? '(configured)' : '(not configured)'}</option>
                <option value="gemini">Gemini {configuredProviders.gemini ? '(configured)' : '(not configured)'}</option>
                <option value="manus">Manus {configuredProviders.manus ? '(configured)' : '(not configured)'}</option>
              </select>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.4rem' }}>
                Only providers marked configured can analyze the source. Keys remain on the server.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                ADMIN SOURCE LINK
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Paste any admin source link (Google Maps, Booking.com, TripAdvisor, Airbnb, etc.)"
                  value={urlOrQuery}
                  onChange={e => setUrlOrQuery(e.target.value)}
                  style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
                <button
                  onClick={handleFetch}
                  disabled={loading}
                  style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? 'Analyzing...' : <><i className="fas fa-link"></i> Analyze Source</>}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={adminConfirmed}
                  onChange={e => setAdminConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#10b981' }}
                />
                Admin confirms this source link matches the selected business category and should be imported.
              </label>
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

        <div style={{ background: '#172033', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(96,165,250,0.25)', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', color: '#fff', fontWeight: 800 }}>💬 Chat with the selected agent</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 1rem' }}>
            Ask about category fit, missing data, source evidence, or duplicate risks. The agent only sees the confirmed import context.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 260, overflowY: 'auto', marginBottom: '1rem' }}>
            {chatMessages.map((chatMessage, index) => (
              <div key={`${chatMessage.role}-${index}`} style={{ alignSelf: chatMessage.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', background: chatMessage.role === 'user' ? 'rgba(212,175,55,0.16)' : '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.7rem 0.85rem', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                {chatMessage.content}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              value={chatInput}
              onChange={event => setChatInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleChat(); } }}
              placeholder="Ask the agent about this import..."
              disabled={chatLoading}
              style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
            <button
              onClick={handleChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ background: '#60a5fa', color: '#0f172a', border: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: chatLoading ? 'wait' : 'pointer' }}
            >
              {chatLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>

        {/* Place Details Preview Panel */}
        {placeData && (
          <div className="animate-in" style={{ background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 800 }}>📋 Step 2: Review Imported Place Data</h3>
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

            {/* Reviews list */}
            {placeData.reviews?.length > 0 && (
              <div style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>VERIFIED GOOGLE REVIEWS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {placeData.reviews.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{r.author_name}</strong>
                        <span style={{ color: '#FFB700', fontSize: '0.75rem', fontWeight: 800 }}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>"{r.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Mapping */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontWeight: 800 }}>🏢 Step 3: Map to Typology & Import</h3>
              
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

                <div style={{ marginTop: '0.5rem' }}>
                  <button 
                    onClick={handleImport}
                    disabled={saving}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.9rem 2.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {saving ? 'Saving...' : <><i className="fas fa-file-import"></i> Save & Import to Registry</>}
                  </button>
                  <span style={{ marginLeft: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                    Will be saved as <strong style={{ color: '#FFB700' }}>Pending Approval</strong> for Admin Moderation.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
