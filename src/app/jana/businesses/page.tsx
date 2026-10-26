'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';
import WhatsAppInviteModal from '@/components/WhatsAppInviteModal';
import MarketSelect from '@/components/jana/MarketSelect';

interface Business {
  id: string; name: string; slug: string; type_id: string; type_name: string; type_icon: string;
  type_icon_color: string; status: string; subscription_tier: string; vendor_email: string | null;
  vendor_id: string | null; approved_by_vendor: boolean; views: number; template_name?: string;
  market_id?: string | null;
}

/** The label above one box of the inline ADD PLACE form. */
const PLACE_FIELD_LABEL: React.CSSProperties = {
  fontSize: '0.6rem',
  fontWeight: 800,
  color: '#6b7280',
  display: 'block',
  marginBottom: '0.2rem',
};

export default function BusinessRegistryPage() {
  const { notify } = useAdmin();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  // WhatsApp Invite & Access Modal State
  const [whatsAppModal, setWhatsAppModal] = useState<{ isOpen: boolean; businessId: string; businessName: string }>({
    isOpen: false,
    businessId: '',
    businessName: ''
  });

  // Wizard Registry State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [types, setTypes] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [developments, setDevelopments] = useState<any[]>([]);
  const [places, setPlaces] = useState<{ id: string; path: string; type: string; depth: number; nameAr: string; nameEn: string; active?: boolean }[]>([]);
  // 3b does not only pick: the market's city is the parent a new place hangs
  // off, and `childTypes` is what the server will accept under it.
  const [placeContext, setPlaceContext] = useState<{
    city: { id: string; path: string; nameEn: string; nameAr: string; type: string } | null;
    childTypes: string[];
  }>({ city: null, childTypes: [] });
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [newPlace, setNewPlace] = useState({ nameEn: '', nameAr: '', type: '', active: true });
  const [placeBusy, setPlaceBusy] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [newBiz, setNewBiz] = useState({
    name: '',
    name_ar: '',
    type_id: '',
    market_id: '',
    location_id: '',
    development_id: '',
    subscription_tier: 'free',
    vendor_id: '',
    template_id: '',
    phone: '',
    email: '',
    description: '',
    logo_url: '',
    status: 'active',
    custom_data: {} as Record<string, any>
  });
  
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => { 
    loadBusinesses(); 
    fetchMetadata();
  }, []);

  // Compounds belong to one market, so the list reloads when the market changes.
  useEffect(() => {
    if (!newBiz.market_id) { setDevelopments([]); return; }
    let cancelled = false;
    fetch(`/api/developments?market=${encodeURIComponent(newBiz.market_id)}`)
      .then((r) => (r.ok ? r.json() : { developments: [] }))
      .then((data) => { if (!cancelled) setDevelopments(data.developments || []); })
      .catch(() => { if (!cancelled) setDevelopments([]); });
    return () => { cancelled = true; };
  }, [newBiz.market_id]);

  // Geography is loaded per market: a town in El Alamein is not a valid place
  // for a Siwa listing, and the server enforces the same rule on write.
  const loadPlaces = useCallback(async (market: string) => {
    if (!market) {
      setPlaces([]);
      setPlaceContext({ city: null, childTypes: [] });
      return;
    }
    try {
      const res = await fetch(`/api/jana/places?market=${encodeURIComponent(market)}`);
      const data = res.ok ? await res.json() : { places: [] };
      setPlaces(Array.isArray(data.places) ? data.places : []);
      setPlaceContext({
        city: data.city || null,
        childTypes: Array.isArray(data.childTypes) ? data.childTypes : [],
      });
    } catch {
      setPlaces([]);
      setPlaceContext({ city: null, childTypes: [] });
    }
  }, []);

  useEffect(() => {
    loadPlaces(newBiz.market_id);
  }, [newBiz.market_id, loadPlaces]);

  async function bulkAction(updates: any) {
    if (selectedIds.length === 0) return;
    setIsSyncing(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch('/api/jana/businesses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates })
        })
      ));
      notify(`Updated ${selectedIds.length} entities`, 'success');
      setSelectedIds([]);
      loadBusinesses();
    } catch (e) {
      notify('Bulk action failed', 'error');
    }
    setIsSyncing(false);
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} businesses?`)) return;
    setIsSyncing(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/jana/businesses?id=${id}`, { method: 'DELETE' })
      ));
      notify('Bulk deletion complete', 'success');
      setSelectedIds([]);
      loadBusinesses();
    } catch (e) { notify('Deletion failed', 'error'); }
    setIsSyncing(false);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === businesses.length ? [] : businesses.map(b => b.id));
  };

  async function loadBusinesses() {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/businesses');
      if (res.ok) setBusinesses(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchMetadata() {
    try {
      const [tRes, sRes, vRes, tmplRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/tiers'),
        fetch('/api/jana/vendors'),
        fetch('/api/jana/templates'),
      ]);
      if (tRes.ok) setTypes(await tRes.json());
      if (sRes.ok) setTiers(await sRes.json());
      if (vRes.ok) setVendors(await vRes.json());
      if (tmplRes.ok) setTemplates(await tmplRes.json());
    } catch (e) { console.error(e); }
  }

  // Fetch sections and fields for the selected type
  async function loadTypeSchema(typeId: string) {
    setIsSyncing(true);
    setSchemaFields([]);
    try {
      // For the simplified registry, we'll fetch all 'basic' and 'location' fields
      const res = await fetch(`/api/jana/forms?type=${typeId}`);
      if (res.ok) {
        setSchemaFields(await res.json());
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  async function deleteBiz(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/jana/businesses?id=${id}`, { method: 'DELETE' });
    loadBusinesses();
  }

  async function cloneBusiness(id: string, name: string) {
    const newName = prompt(`Clone template: "${name}"\n\nEnter the Trade Name for the new business instance:`, `${name} Cloned`);
    if (!newName) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          clone_from_id: id,
          is_master: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        notify(`Cloned successfully as "${newName}"`, 'success');
        loadBusinesses();
        // Redirect to edit page
        window.location.href = `/jana/businesses/${data.id}/orchestrate`;
      } else {
        const err = await res.json();
        notify(err.error || 'Cloning failed', 'error');
      }
    } catch (e) {
      notify('Cloning request failed', 'error');
    }
    setIsSyncing(false);
  }

  async function assignVendor(businessId: string, newVendorId: string) {
    setIsSyncing(true);
    try {
      const isClaimed = newVendorId !== 'anonymous' && newVendorId !== '';
      const res = await fetch('/api/jana/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: businessId,
          vendor_id: isClaimed ? newVendorId : 'anonymous',
          is_claimed: isClaimed,
          approved_by_vendor: isClaimed
        })
      });
      if (res.ok) {
        notify('Vendor assignment updated', 'success');
        loadBusinesses();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to update vendor assignment', 'error');
      }
    } catch (e) {
      notify('Failed to update vendor assignment', 'error');
    }
    setIsSyncing(false);
  }

  const handleFieldChange = (name: string, value: any) => {
    setNewBiz(prev => ({
      ...prev,
      custom_data: { ...prev.custom_data, [name]: value }
    }));
  };

  async function submitRegistration() {
    // A switched-off place cannot hold a published listing: the page it would
    // appear on does not exist. Turn it on first, from the warning under 3b.
    const chosenPlace = places.find((place) => place.id === newBiz.location_id);
    if (chosenPlace && chosenPlace.active === false) {
      notify(`"${chosenPlace.nameEn}" is switched off — activate it, or pick another place.`, 'error');
      return;
    }
    if (!newBiz.market_id) {
      alert('Pick a market first — every listing lives in exactly one.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `location_id` is the place inside the market; empty means the city.
        body: JSON.stringify({
          ...newBiz,
          name_ar: newBiz.name_ar.trim() || null,
          location_id: newBiz.location_id || null,
          development_id: newBiz.development_id || null,
        }),
      });
      if (res.ok) {
        const newBusiness = await res.json();
        if (newBiz.status === 'pending') {
          notify(`Business "${newBiz.name}" saved to Pending Intake Queue!`, 'success');
          setShowWizard(false);
          loadBusinesses();
        } else {
          notify(`Business "${newBiz.name}" registered and activated live! Redirecting to Unified Orchestrator...`, 'success');
          setShowWizard(false);
          window.location.href = `/jana/businesses/${newBusiness.id}/orchestrate`;
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register business');
      }
    } catch (e) { console.error(e); }
    setIsSyncing(false);
  }

  /**
   * 3b is not a picker only. A market with no place yet used to send the admin
   * to GEOGRAPHY and back; the place is created straight under the market's own
   * city, so it can never land in another market, and it comes back selected
   * because that is where the listing being registered belongs.
   */
  async function addPlace() {
    const nameEn = newPlace.nameEn.trim();
    if (!placeContext.city) {
      setPlaceError('This market has no city row yet, so a new place has nothing to sit under.');
      return;
    }
    if (!nameEn) {
      setPlaceError('An English name is required — it becomes the address.');
      return;
    }
    setPlaceBusy(true);
    setPlaceError(null);
    try {
      const res = await fetch('/api/jana/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: placeContext.city.id,
          marketId: newBiz.market_id,
          nameEn,
          nameAr: newPlace.nameAr.trim() || undefined,
          type: newPlace.type || placeContext.childTypes[0],
          active: newPlace.active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add the place');
      await loadPlaces(newBiz.market_id);
      if (newPlace.active) setNewBiz((prev) => ({ ...prev, location_id: data.id }));
      setNewPlace({ nameEn: '', nameAr: '', type: '', active: true });
      setShowPlaceForm(false);
      notify(
        `Place "${nameEn}" added${newPlace.active ? ' and activated' : ' (switched off)'}.`,
        'success'
      );
    } catch (e: any) {
      setPlaceError(e.message || 'Could not add the place');
    } finally {
      setPlaceBusy(false);
    }
  }

  /** A place that exists but is switched off can be turned on without leaving 3b. */
  async function activatePlace(id: string, name: string) {
    setPlaceBusy(true);
    setPlaceError(null);
    try {
      const res = await fetch('/api/jana/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not activate the place');
      }
      await loadPlaces(newBiz.market_id);
      notify(`"${name}" is active: it can be filed at and gets its own page.`, 'success');
    } catch (e: any) {
      setPlaceError(e.message || 'Could not activate the place');
    } finally {
      setPlaceBusy(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i></div>;

  const selectableBusinessTypes = types
    .filter((type: any) => !type.market_id || type.market_id === newBiz.market_id)
    .filter((type: any) => !type.is_parent && type.parent_id && type.id !== 'SECTION_TEMPLATE' && type.active !== false && Number(type.active) !== 0)
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  const selectableTypesByParent = new Map<string, any[]>();
  selectableBusinessTypes.forEach((type: any) => {
    const children = selectableTypesByParent.get(type.parent_id) || [];
    children.push(type);
    selectableTypesByParent.set(type.parent_id, children);
  });
  const selectableParents = types
    .filter((type: any) => (type.is_parent || Number(type.is_parent) === 1) && type.id !== 'SECTION_TEMPLATE' && type.active !== false && Number(type.active) !== 0 && selectableTypesByParent.has(type.id))
    .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  // Read once so the warning under 3b and the filing hint agree.
  const selectedPlace = places.find((place) => place.id === newBiz.location_id);

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}><i className="fas fa-building"></i> Business Registry</h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Register and manage governed business entities.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setShowWizard(!showWizard)}>
            <i className={`fas ${showWizard ? 'fa-times' : 'fa-plus'}`}></i> {showWizard ? 'CANCEL' : 'REGISTER BUSINESS'}
          </button>
          <Link href="/jana/google-import" className="btn btn-outline" style={{ color: '#D4AF37', borderColor: '#D4AF37', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 800 }}>
            <i className="fab fa-google"></i> GOOGLE IMPORT
          </Link>
        </div>
      </div>

      {/* ── INLINE QUICK-REGISTER PANEL ── */}
      {showWizard && (
        <div style={{ background: '#fffbeb', border: '2px solid #D4AF37', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e' }}><i className="fas fa-magic"></i> Register New Business Entity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* 0. Market — every listing lives in exactly one */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>0. MARKET *</label>
              <MarketSelect
                value={newBiz.market_id}
                onChange={(slug) => {
                  setNewBiz({ ...newBiz, market_id: slug, location_id: '', development_id: '', type_id: '', template_id: '' });
                  setSelectedParentId('');
                  setFilteredTemplates([]);
                }}
              />
              <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {newBiz.market_id
                  ? `Address will be /${newBiz.market_id}/${(newBiz.name || 'business-name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
                  : 'The registry, live and dark — or add a market without leaving this form.'}
              </div>
            </div>
            {/* Name */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>BUSINESS NAME *</label>
              <input className="form-control" placeholder="e.g. Great Sand Sea Expedition"
                value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} />
            </div>
            {/* Arabic name — stored, never derived, and printed on every /ar page */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>ARABIC NAME</label>
              <input
                className="form-control"
                dir="rtl"
                placeholder="الاسم بالعربية"
                value={newBiz.name_ar}
                onChange={e => setNewBiz({ ...newBiz, name_ar: e.target.value })}
              />
            </div>
            {/* 1. Parent Category */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>
                1. PARENT CATEGORY *
              </label>
              <select
                className="form-control"
                value={selectedParentId}
                onChange={e => {
                  const pid = e.target.value;
                  setSelectedParentId(pid);
                  setNewBiz({ ...newBiz, type_id: '', template_id: '' });
                  setFilteredTemplates([]);
                }}
              >
                <option value="">-- Step 1: Select Parent Category --</option>
                {selectableParents.map((parent: any) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Child Typology (Sub-Type) */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: selectedParentId ? '#6b7280' : '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                2. CHILD TYPOLOGY * {selectedParentId ? <span style={{ color: '#16a34a', fontWeight: 600 }}>({(selectableTypesByParent.get(selectedParentId) || []).length} available)</span> : <span style={{ color: '#ef4444', fontWeight: 600 }}>(select parent first)</span>}
              </label>
              <select
                className="form-control"
                value={newBiz.type_id}
                disabled={!selectedParentId}
                style={{ background: !selectedParentId ? '#f1f5f9' : '#fff' }}
                onChange={e => {
                  const tid = e.target.value;
                  setNewBiz({ ...newBiz, type_id: tid, template_id: '' });
                  // Show all templates: type-specific + universal (type_id = null)
                  setFilteredTemplates(templates.filter((t: any) => t.type_id === tid || !t.type_id));
                }}
              >
                <option value="">
                  {!selectedParentId ? '-- Pick Parent Category First --' : '-- Step 2: Select Sub-Category --'}
                </option>
                {(selectableTypesByParent.get(selectedParentId) || []).map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            {/* 3. Container (optional): a compound, a town or a village */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>
                3. INSIDE A COMPOUND / TOWN (OPTIONAL)
              </label>
              <select
                className="form-control"
                value={newBiz.development_id}
                onChange={e => setNewBiz({ ...newBiz, development_id: e.target.value })}
                disabled={!developments.length}
                style={{ background: developments.length ? '#fff' : '#f1f5f9' }}
              >
                <option value="">{developments.length ? '-- None: stands on its own --' : '-- No compounds or towns in this market yet --'}</option>
                {developments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn || d.name_ar || d.slug} ({d.kind || 'compound'})
                  </option>
                ))}
              </select>
            </div>
            {/* 3b. Place inside the market (optional) — chosen here, or created here */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280' }}>
                  3b. PLACE INSIDE THE MARKET (OPTIONAL)
                </label>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  disabled={!placeContext.city || placeBusy}
                  title={
                    placeContext.city
                      ? `Add a place under ${placeContext.city.nameEn}`
                      : 'Pick a market that has a city row first'
                  }
                  onClick={() => {
                    setShowPlaceForm((open) => !open);
                    setPlaceError(null);
                  }}
                >
                  <i className={`fas ${showPlaceForm ? 'fa-xmark' : 'fa-plus'}`}></i>{' '}
                  {showPlaceForm ? 'CANCEL' : 'ADD PLACE'}
                </button>
              </div>

              {/* A disabled button with a tooltip is not an explanation: the reason a
                  place cannot be added is written where the form would open. */}
              {!placeContext.city && (
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b45309', marginBottom: '0.35rem' }}>
                  {newBiz.market_id
                    ? 'This market has no city row yet: set one in GEOGRAPHY before adding a place.'
                    : 'Pick a market in 0. first — a new place is created under that market city.'}
                </div>
              )}

              {showPlaceForm && (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '0.6rem',
                    background: '#f8fafc',
                    marginBottom: '0.45rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <label style={PLACE_FIELD_LABEL}>NAME (ENGLISH) *</label>
                      <input
                        className="form-control"
                        placeholder="Shali"
                        value={newPlace.nameEn}
                        onChange={(e) => setNewPlace({ ...newPlace, nameEn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={PLACE_FIELD_LABEL}>NAME (ARABIC)</label>
                      <input
                        className="form-control"
                        dir="rtl"
                        placeholder="شالي"
                        value={newPlace.nameAr}
                        onChange={(e) => setNewPlace({ ...newPlace, nameAr: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={PLACE_FIELD_LABEL}>LEVEL</label>
                      <select
                        className="form-control"
                        value={newPlace.type || placeContext.childTypes[0] || ''}
                        onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}
                      >
                        {placeContext.childTypes.map((childType) => (
                          <option key={childType} value={childType}>
                            {childType}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newPlace.active}
                          onChange={(e) => setNewPlace({ ...newPlace, active: e.target.checked })}
                        />
                        ACTIVE
                      </label>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        disabled={placeBusy}
                        onClick={addPlace}
                      >
                        {placeBusy ? 'ADDING…' : 'ADD'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.35rem' }}>
                    {placeContext.city
                      ? `Added under ${placeContext.city.nameEn} (${placeContext.city.path}). An active place can be filed at, and gets its own page in this market.`
                      : 'This market has no city row yet — set one in GEOGRAPHY first.'}
                  </div>
                </div>
              )}

              <select
                className="form-control"
                value={newBiz.location_id}
                onChange={e => setNewBiz({ ...newBiz, location_id: e.target.value })}
                disabled={!places.length}
                style={{ background: places.length ? '#fff' : '#f1f5f9' }}
              >
                <option value="">
                  {places.length
                    ? '-- Inherits the market city --'
                    : '-- No places under this market yet: add one above --'}
                </option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {'· '.repeat(Math.max(0, place.depth - 1))}
                    {place.nameEn}{place.nameAr ? ` — ${place.nameAr}` : ''} ({place.type})
                    {place.active === false ? ' — switched off' : ''}
                  </option>
                ))}
              </select>
              {selectedPlace && selectedPlace.active === false && (
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#b45309',
                    fontWeight: 700,
                    marginTop: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    “{selectedPlace.nameEn}” is switched off: nothing can be filed there until it is
                    activated.
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled={placeBusy}
                    onClick={() => activatePlace(selectedPlace.id, selectedPlace.nameEn)}
                  >
                    <i className="fas fa-bolt"></i> ACTIVATE
                  </button>
                </div>
              )}
              <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {newBiz.location_id
                  ? `Filed at ${selectedPlace?.path || 'the chosen place'} — it appears on that place's page.`
                  : 'Left empty, the listing belongs to the city itself.'}
              </div>
              {placeError && (
                <div style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: 700, marginTop: '0.25rem' }}>
                  {placeError}
                </div>
              )}
            </div>
            {/* Template — auto-resolves from tier when not set */}
            <div>
              {(() => {
                const selectedTier = tiers.find((t: any) => t.id === newBiz.subscription_tier);
                const tierHasDefault = selectedTier?.default_template_id;
                const tierDefaultName = selectedTier?.default_template_name || selectedTier?.default_template_id;
                return (
                  <>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: tierHasDefault ? '#6b7280' : '#ef4444', display: 'block', marginBottom: '0.3rem' }}>
                      TEMPLATE {tierHasDefault ? '(optional — tier has default)' : '* (required)'}
                    </label>
                    <select className="form-control" value={newBiz.template_id}
                      style={{ borderColor: newBiz.template_id ? '#10b981' : tierHasDefault ? '#d97706' : '#ef4444' }}
                      onChange={e => setNewBiz({...newBiz, template_id: e.target.value})}
                      disabled={!newBiz.type_id}>
                      <option value="">
                        {!newBiz.type_id 
                          ? '-- Pick a Type first --'
                          : tierHasDefault
                            ? `Will use: ${tierDefaultName} (from ${selectedTier?.name} tier)`
                            : '-- Select Template --'}
                      </option>
                      {filteredTemplates.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} {!t.type_id ? '🌐 Universal' : ''}</option>
                      ))}
                      {newBiz.type_id && filteredTemplates.length === 0 && !tierHasDefault && <option disabled>No templates available</option>}
                    </select>
                    {tierHasDefault && !newBiz.template_id && (
                      <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
                        ✅ Auto-assigns "{tierDefaultName}" from {selectedTier?.name} tier
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            {/* Tier */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>SUBSCRIPTION TIER</label>
              <select className="form-control" value={newBiz.subscription_tier}
                onChange={e => setNewBiz({...newBiz, subscription_tier: e.target.value})}>
                {tiers.length > 0 ? tiers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>) : (
                  <><option value="free">Free</option><option value="gold">Gold</option></>
                )}
              </select>
            </div>
            {/* Vendor */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>ASSIGN VENDOR (OPTIONAL)</label>
              <select className="form-control" value={newBiz.vendor_id}
                onChange={e => setNewBiz({...newBiz, vendor_id: e.target.value})}>
                <option value="">-- Keep Unclaimed (Anonymous) --</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.display_name || v.email} ({v.email})</option>
                ))}
              </select>
            </div>
            {/* Phone */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>PHONE / WHATSAPP</label>
              <input className="form-control" placeholder="e.g. +20 100 123 4567"
                value={newBiz.phone} onChange={e => setNewBiz({...newBiz, phone: e.target.value})} />
            </div>
            {/* Email */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>CONTACT EMAIL</label>
              <input className="form-control" placeholder="e.g. info@sanctuary.com"
                value={newBiz.email} onChange={e => setNewBiz({...newBiz, email: e.target.value})} />
            </div>
            {/* Logo URL */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>LOGO IMAGE URL</label>
              <input className="form-control" placeholder="https://..."
                value={newBiz.logo_url} onChange={e => setNewBiz({...newBiz, logo_url: e.target.value})} />
            </div>
            {/* Status (Live vs Pending) */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>INITIAL PUBLICATION STATUS</label>
              <select className="form-control" value={newBiz.status}
                onChange={e => setNewBiz({...newBiz, status: e.target.value})}>
                <option value="active">🟢 Active (Live Minisite Immediately)</option>
                <option value="pending">🟡 Pending (Intake & Review Queue)</option>
              </select>
            </div>
          </div>
          {/* Description */}
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>BRIEF PROFILE / OVERVIEW</label>
            <textarea className="form-control" rows={2} placeholder="Short overview of the oasis establishment..."
              value={newBiz.description} onChange={e => setNewBiz({...newBiz, description: e.target.value})} />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {(() => {
              const selectedTier = tiers.find((t: any) => t.id === newBiz.subscription_tier);
              const tierHasDefault = selectedTier?.default_template_id;
              const canSubmit = !isSyncing && newBiz.name && newBiz.type_id;
              return (
                <>
                  <button className="btn btn-primary" onClick={submitRegistration} disabled={!canSubmit}>
                    {isSyncing ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> {newBiz.status === 'active' ? 'REGISTER & PUBLISH LIVE' : 'SAVE TO INTAKE QUEUE'}</>}
                  </button>
                  {!newBiz.name && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Enter a trade name and typology to proceed
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" checked={selectedIds.length === businesses.length && businesses.length > 0} onChange={toggleSelectAll} /></th>
              <th>Business Entity</th>
              <th>Typology</th>
              <th>Market</th>
              <th>Template</th>
              <th>Status / Tier</th>
              <th>Vendor Link</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b.id} style={{ background: selectedIds.includes(b.id) ? '#f8fafc' : 'transparent' }}>
                <td><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800 }}>{b.name}</div>
                    {(b as any).is_master === 1 && (
                      <span style={{ 
                        fontSize: '0.55rem', fontWeight: 900, background: '#1e1b4b', 
                        color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', 
                        border: '1px solid #fbbf24', letterSpacing: '0.5px' 
                      }}>
                        MASTER TEMPLATE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>ID: {b.id.slice(0, 8)}...</div>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className={b.type_icon} style={{ color: b.type_icon_color }}></i>
                    {b.type_name}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: '6px' }}>
                    {b.market_id || 'siwa'}
                  </span>
                </td>
                <td>
                  {b.template_name
                    ? <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#475569' }}><i className="fas fa-layer-group" style={{ marginRight: '4px', color: '#D4AF37' }}></i>{b.template_name}</span>
                    : <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>⚠️ No Template</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span className={`badge badge-${b.status === 'active' ? 'success' : 'warning'}`}>{(b.status || 'inactive').toUpperCase()}</span>
                    <span className="subscription-badge">{(b.subscription_tier || 'free').toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_recommended: !(b as any).is_recommended })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_recommended ? '#dcfce7' : '#f1f5f9', color: (b as any).is_recommended ? '#166534' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-thumbs-up"></i> REC
                     </button>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_trusted: !(b as any).is_trusted })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_trusted ? '#eff6ff' : '#f1f5f9', color: (b as any).is_trusted ? '#1e40af' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-check-shield"></i> TRUSTED
                     </button>
                     <button 
                       onClick={() => {
                         fetch('/api/jana/businesses', { 
                           method: 'PATCH', 
                           headers: {'Content-Type':'application/json'}, 
                           body: JSON.stringify({ id: b.id, is_featured: !(b as any).is_featured })
                         }).then(() => loadBusinesses());
                       }}
                       style={{ background: (b as any).is_featured ? '#fffbeb' : '#f1f5f9', color: (b as any).is_featured ? '#92400e' : '#94a3b8', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer' }}
                     >
                       <i className="fas fa-star"></i> FEATURED
                     </button>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <select
                      value={b.vendor_id || 'anonymous'}
                      onChange={(e) => assignVendor(b.id, e.target.value)}
                      className="form-control"
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.5rem', 
                        height: 'auto', 
                        borderColor: b.vendor_id && b.vendor_id !== 'anonymous' ? '#10b981' : '#fcd34d',
                        background: b.vendor_id && b.vendor_id !== 'anonymous' ? '#f0fdf4' : '#fffbeb',
                        color: b.vendor_id && b.vendor_id !== 'anonymous' ? '#166534' : '#92400e',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '6px',
                        width: '100%',
                        maxWidth: '220px',
                        appearance: 'auto'
                      }}
                    >
                      <option value="anonymous">🔓 Unclaimed (Anonymous)</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          👤 {v.display_name || v.email}
                        </option>
                      ))}
                    </select>
                    {b.vendor_id && b.vendor_id !== 'anonymous' && !b.approved_by_vendor && (
                      <span className="badge badge-warning" style={{ fontSize: '0.6rem', display: 'block', width: 'fit-content' }}>
                        PENDING VENDOR APPROVAL
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.views.toLocaleString()} <span style={{ color: '#9ca3af', fontWeight: 400 }}>views</span></div>
                </td>
                <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                       <select 
                         className="btn btn-xs btn-outline" 
                         style={{ color: '#8b5cf6', borderColor: '#8b5cf6', background: 'transparent', cursor: 'pointer', padding: '0.2rem 0.5rem', appearance: 'auto' }}
                         value={b.subscription_tier}
                         onChange={(e) => {
                           const newTier = e.target.value;
                           if (newTier && newTier !== b.subscription_tier) {
                             fetch('/api/jana/businesses', { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: b.id, subscription_tier: newTier })})
                             .then(() => loadBusinesses());
                           }
                         }}
                         title="Change Subscription Tier"
                       >
                         {tiers.length > 0 ? tiers.map(t => (
                           <option key={t.id} value={t.id} style={{color: '#000'}}>{t.name}</option>
                         )) : (
                           <>
                             <option value="free" style={{color: '#000'}}>Free</option>
                             <option value="pro" style={{color: '#000'}}>Pro</option>
                             <option value="gold" style={{color: '#000'}}>Gold</option>
                             <option value="premium" style={{color: '#000'}}>Premium</option>
                           </>
                         )}
                       </select>
                        <Link href={`/${b.slug || b.id}`} target="_blank" className="btn btn-xs btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }} title="View Public Minisite">
                          <i className="fas fa-external-link-alt"></i> VIEW SITE
                        </Link>
                        <Link href={`/jana/businesses/${b.id}/orchestrate`} className="btn btn-xs btn-premium" title="Orchestrate Minisite & Content">
                          <i className="fas fa-wand-magic-sparkles"></i> ORCHESTRATE &amp; EDIT
                        </Link>
                        <button 
                          className="btn btn-xs btn-outline" 
                          style={{ color: '#25D366', borderColor: '#25D366', fontWeight: 800 }} 
                          onClick={() => setWhatsAppModal({ isOpen: true, businessId: b.id, businessName: b.name })} 
                          title="Send Barcode & Temporary Access via WhatsApp"
                        >
                          <i className="fab fa-whatsapp"></i> WHATSAPP
                        </button>
                        <Link href={`/jana/businesses/${b.id}/qr`} className="btn btn-xs btn-outline" style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }} title="Print QR Onboarding Kit">
                          <i className="fas fa-qrcode"></i> QR KIT
                        </Link>
                        <button className="btn btn-xs btn-outline" style={{ color: '#d97706', borderColor: '#d97706' }} onClick={() => cloneBusiness(b.id, b.name)} title="Clone Business Instance">
                          <i className="fas fa-copy"></i> CLONE
                        </button>
                       <button className="btn btn-xs btn-outline" style={{ color: '#ef4444' }} onClick={() => deleteBiz(b.id, b.name)}><i className="fas fa-trash"></i></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar animate-in" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', border: '1px solid #334155', borderRadius: '50px', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 1000 }}>
           <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800, borderRight: '1px solid #334155', paddingRight: '1.5rem' }}>
              {selectedIds.length} ENTITIES SELECTED
           </div>
           <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-xs btn-outline" style={{ color: '#22c55e', borderColor: '#22c55e' }} onClick={() => bulkAction({ is_recommended: true })}>
                <i className="fas fa-thumbs-up"></i> RECOMMEND
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#3b82f6', borderColor: '#3b82f6' }} onClick={() => bulkAction({ is_trusted: true })}>
                <i className="fas fa-check-shield"></i> TRUST
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => bulkAction({ is_featured: true })}>
                <i className="fas fa-star"></i> FEATURE
              </button>
              <button className="btn btn-xs btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={bulkDelete}>
                <i className="fas fa-trash"></i> DELETE
              </button>
           </div>
           <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }} onClick={() => setSelectedIds([])}>
              <i className="fas fa-times"></i>
           </button>
        </div>
      )}
      {/* ── WHATSAPP ACCESS & BARCODE INVITE MODAL ── */}
      <WhatsAppInviteModal
        businessId={whatsAppModal.businessId}
        businessName={whatsAppModal.businessName}
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal({ isOpen: false, businessId: '', businessName: '' })}
      />
    </div>
  );
}
