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
}

export default function GoogleImportWizard() {
  const [urlOrQuery, setUrlOrQuery] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [placeData, setPlaceData] = useState<GooglePlaceData | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Load Typologies for Mapping
  useEffect(() => {
    fetch('/api/jana/types')
      .then(res => res.json())
      .then(data => setTypes(data || []))
      .catch(err => console.error('Failed to load typologies', err));
  }, []);

  const showMsg = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 7000);
  };

  const handleFetch = async () => {
    if (!urlOrQuery.trim()) {
      showMsg('error', 'Please enter a search term or Google Maps link.');
      return;
    }
    setLoading(true);
    setPlaceData(null);
    setIsDemoMode(false);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch', urlOrQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setPlaceData(data.place);
        setIsDemoMode(data.isDemoSandbox || false);
        if (data.isDemoSandbox) {
          showMsg('info', 'Sandbox Mode: Displaying mock data for demonstration. Set up your Google API key to enable live searches.');
        } else {
          showMsg('success', 'Successfully fetched Place details from Google Maps!');
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
    setSaving(true);
    try {
      const res = await fetch('/api/jana/google-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name: placeData.name,
          type_id: selectedTypeId,
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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/jana/businesses" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>
            ← BUSINESS REGISTRY
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0 0', letterSpacing: '-1px' }}>
            🗺️ Google Maps Import Wizard
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0' }}>
            Leverage Google contributions to fast-track vendor onboarding and enrich your minisite data feeds.
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
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#fff', fontWeight: 800 }}>🔍 Step 1: Query Google Database</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '0.5rem' }}>
                GOOGLE MAPS URL OR PLACE NAME
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Al Babenshal Lodge Siwa or paste a share link..."
                  value={urlOrQuery}
                  onChange={e => setUrlOrQuery(e.target.value)}
                  style={{ flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
                <button
                  onClick={handleFetch}
                  disabled={loading}
                  style={{ background: '#D4AF37', color: '#0f172a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? 'Fetching...' : <><i className="fab fa-google"></i> Fetch Place</>}
                </button>
              </div>
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

        {/* 🔑 API Setup Guide Accordion */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <button 
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            style={{ width: '100%', background: 'rgba(212,175,55,0.05)', border: 'none', padding: '1rem 1.5rem', color: '#D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <span>🔑 Google Maps API Keys Setup Guide</span>
            <span>{showSetupGuide ? '▲ Close Guide' : '▼ Open Guide'}</span>
          </button>
          
          {showSetupGuide && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(212,175,55,0.15)', fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8' }}>
              <p style={{ margin: '0 0 1rem 0' }}>To query live business data directly from Google Maps, set up your project API credentials:</p>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>Go to the <strong style={{ color: '#fff' }}>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" style={{ color: '#D4AF37', textDecoration: 'underline' }}>console.cloud.google.com</a>).</li>
                <li>Log in using your dedicated brand email account (e.g. <strong style={{ color: '#fff' }}>admin@siwify.com</strong>).</li>
                <li>Create a new project named <strong style={{ color: '#fff' }}>Siwa Oasis Marketplace</strong>.</li>
                <li>Enable billing on the project (This grants you Google's <strong style={{ color: '#fff' }}>$200 free monthly credit</strong>, covering thousands of fetches).</li>
                <li>Navigate to the API Library, search for, and enable the <strong style={{ color: '#fff' }}>Places API</strong> and the <strong style={{ color: '#fff' }}>Maps JavaScript API</strong>.</li>
                <li>Go to the credentials tab, click "Create Credentials", and select <strong style={{ color: '#fff' }}>API Key</strong>.</li>
                <li>Add the key to your environment variables:
                  <pre style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', color: '#38bdf8', overflowX: 'auto', fontSize: '0.75rem', margin: '0.5rem 0' }}>
                    GOOGLE_MAPS_API_KEY=your_key_here
                  </pre>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Place Details Preview Panel */}
        {placeData && (
          <div className="animate-in" style={{ background: '#1e293b', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 800 }}>📋 Step 2: Review Imported Place Data</h3>
              {isDemoMode && (
                <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ⚠️ DEMO SANDBOX MODE
                </span>
              )}
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
                  <span style={{ color: '#64748b', fontSize: '0.6rem', display: 'block', marginBottom: '0.25rem' }}>GOOGLE RATING</span>
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
                    <option value="">-- Map to Typology --</option>
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
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
