'use client';

import { useEffect, useState } from 'react';

interface Place {
  source_id: string; name: string; type_id: string; address: string; phone: string;
  website: string; description: string; lat: number | null; lng: number | null; map_url: string | null;
}

export default function OSMImportPage() {
  const [query, setQuery] = useState('accommodation');
  const [places, setPlaces] = useState<Place[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [typeId, setTypeId] = useState('hotel');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { fetch('/api/jana/types').then(response => response.json()).then(setTypes).catch(() => setTypes([])); }, []);

  async function search() {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`/api/jana/osm-import?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed');
      setPlaces(data.results || []);
      setMessage(`${data.results?.length || 0} OpenStreetMap places found. Data is free and requires review.`);
    } catch (error: any) { setMessage(error.message); }
    setLoading(false);
  }

  async function save(place: Place) {
    setSaving(place.source_id);
    try {
      const response = await fetch('/api/jana/osm-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ place, type_id: typeId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setPlaces(current => current.filter(item => item.source_id !== place.source_id));
      setMessage(`${place.name} saved as a pending draft.`);
    } catch (error: any) { setMessage(error.message); }
    setSaving(null);
  }

  return <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.35rem' }}>Free Siwa Accommodation Import</h1>
      <p style={{ color: '#64748b' }}>OpenStreetMap discovery, one place at a time. Review and complete the 10-section content plan before publishing.</p>
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="accommodation" style={{ flex: 1, minWidth: 220, padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <select value={typeId} onChange={event => setTypeId(event.target.value)} style={{ padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: 8 }}>
          {types.filter(type => ['hotel', 'eco_lodge', 'guest_house', 'camp', 'resort', 'villa', 'apartment'].includes(type.id)).map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <button onClick={search} disabled={loading} style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 8, padding: '0.7rem 1rem', fontWeight: 800 }}>{loading ? 'SEARCHING...' : 'SEARCH SIWA'}</button>
      </section>
      {message && <p style={{ background: '#ecfdf5', color: '#047857', padding: '0.75rem 1rem', borderRadius: 8 }}>{message}</p>}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {places.map(place => <article key={place.source_id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div><h3 style={{ margin: 0 }}>{place.name}</h3><p style={{ margin: '0.35rem 0', color: '#64748b' }}>{place.address || 'Address not listed'}</p><small>{place.phone || 'No phone'} {place.website && <>· <a href={place.website} target="_blank">website</a></>}</small></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{place.map_url && <a href={place.map_url} target="_blank">View map</a>}<button onClick={() => save(place)} disabled={saving === place.source_id} style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, padding: '0.6rem 0.8rem', fontWeight: 800 }}>{saving === place.source_id ? 'SAVING...' : 'SAVE DRAFT'}</button></div>
        </article>)}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1.5rem' }}>Data source: OpenStreetMap contributors. Verify all details and add original content/photos before publishing.</p>
    </div>
  </main>;
}
