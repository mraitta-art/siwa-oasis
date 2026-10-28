'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import { useAdmin } from '@/context/AdminContext';

/**
 * GOVERNANCE ORCHESTRATOR (PREMIUM)
 * The world-class onboarding engine for Siwa Oasis entities.
 * 
 * TERMINOLOGY DECLARATION:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * • "ARCHITECTURE" Step: Workflow phase/stage in the onboarding process
 * • "Typology/Typologies": Business classification taxonomy (Hotel, Restaurant, etc.)
 * 
 * This component uses both terms intentionally:
 *   - Step names (ARCHITECTURE, AESTHETICS, DNA_CONFIG, etc.) → Process/workflow structure
 *   - UI headings ("Select Typology") → Data model/business categories being selected
 * 
 * These are NOT synonymous and serve different conceptual purposes.
 * Developers: Do not standardize these to one term—this distinction is intentional.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

type Step =
  | 'INTENT'
  | 'MARKET'
  | 'MARKET_IDENTITY'
  | 'GEOGRAPHY'
  | 'ARCHITECTURE'
  | 'STRUCTURE'
  | 'AESTHETICS'
  | 'DNA_CONFIG'
  | 'AUTHORITY'
  | 'DEPLOYMENT';

/** The initiation journey the admin chose on step 0. It compiles the step list. */
type Intent = 'business' | 'development' | 'market' | 'place';

interface DevelopmentDraft {
  kind: string;
  nameEn: string;
  nameAr: string;
  developerName: string;
  deliveryYear: string;
  status: string;
}

interface MarketDraft {
  slug: string;
  nameEn: string;
  nameAr: string;
  governorateId: string;
  placeId: string;
  host: string;
  defaultLocale: string;
  currency: string;
  revenueModel: string;
  themeAccent: string;
  active: boolean;
  launchNotes: string;
  // Optional first project seeded in the same launch, sent as body.container.
  seedContainer: boolean;
  containerKind: string;
  containerNameEn: string;
}

interface PlaceDraft {
  parentId: string;
  type: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

interface WizardState {
  step: Step;
  intent: Intent;
  market: string;
  selectedParent: string;
  selectedType: string;
  containerKind: 'business' | 'development';
  existingDevelopmentId: string;
  locationId: string;
  development: DevelopmentDraft;
  marketForm: MarketDraft;
  placeForm: PlaceDraft;
  businessName: string;
  selectedVendor: string;
  businessData: Record<string, any>;
  minisiteTemplate: string;
  fields: any[];
  createdBizId?: string;
  createdDevId?: string;
  createdMarketSlug?: string;
  createdLocationPath?: string;
  createdDevSlug?: string;
}

const STORAGE_KEY = 'siwa_governance_wizard_state';

// Every journey compiles its own ordered steps from one shared library. A
// container never passes through ARCHITECTURE (a development has no business
// typology); a market launch never picks an existing market because it is
// creating one. This is the fix for the old forced-linear, typology-first flow.
const SEQUENCE: Record<Intent, Step[]> = {
  business: ['MARKET', 'STRUCTURE', 'ARCHITECTURE', 'AESTHETICS', 'DNA_CONFIG', 'AUTHORITY', 'DEPLOYMENT'],
  development: ['MARKET', 'STRUCTURE', 'DEPLOYMENT'],
  market: ['MARKET_IDENTITY', 'DEPLOYMENT'],
  place: ['MARKET', 'GEOGRAPHY', 'DEPLOYMENT'],
};

const INTENT_META: { id: Intent; name: string; tag: string; icon: string }[] = [
  { id: 'business', name: 'List a Business / Service', tag: 'SHOP · HOTEL · DEVELOPMENT SERVICE', icon: 'fa-store' },
  { id: 'development', name: 'Create a Development', tag: 'COMPOUND · TOWN · VILLAGE · RESORT', icon: 'fa-building' },
  { id: 'market', name: 'Launch a Market', tag: 'A NEW CITY OR DESTINATION', icon: 'fa-map-location-dot' },
  { id: 'place', name: 'Add a Place / Zone', tag: 'DISTRICT · AREA · VILLAGE', icon: 'fa-location-dot' },
];

const REVENUE_MODELS: { id: string; label: string }[] = [
  { id: 'realestate_lead', label: 'realestate_lead — compounds, price per m²' },
  { id: 'tourism_whatsapp', label: 'tourism_whatsapp — stays, tours, WhatsApp' },
  { id: 'directory_lead', label: 'directory_lead — local services' },
];

const PLACE_TYPES: { id: string; label: string }[] = [
  { id: 'city', label: 'CITY' },
  { id: 'district', label: 'DISTRICT' },
  { id: 'town', label: 'TOWN' },
  { id: 'area', label: 'AREA' },
  { id: 'zone', label: 'ZONE' },
  { id: 'neighborhood', label: 'NEIGHBORHOOD' },
];

// One line of guidance per step, shown in a persistent hint bar so the operator
// always knows what the current screen is for and what the choice unlocks. It is
// the in-product answer to "how do I use this wizard?".
const STEP_HINTS: Record<Step, string> = {
  INTENT: 'Start here: pick what you are creating. The wizard then shows only the steps that journey needs.',
  MARKET: 'Choose the market this belongs to. The category tree, geography and URL namespace all follow it. Dark markets are selectable so you can build one before it opens to the public.',
  MARKET_IDENTITY: 'Give the new market its slug and both names, then pick its governorate — the platform creates the city row from the slug. Leave it DARK and open the publication gate when ready.',
  GEOGRAPHY: 'Add a district, area or village under an existing parent inside the market. It renders a zone page listing everything filed there.',
  ARCHITECTURE: 'Pick the business typology (category). Choose a parent, then a child when one fits.',
  STRUCTURE: 'A listing files itself inside an optional existing project. A development defines its own kind, developer and status — no typology is needed.',
  AESTHETICS: 'Choose the minisite look, or leave AUTO so it resolves from the typology and tier.',
  DNA_CONFIG: 'Set the entity name and its section content. Arabic is stored exactly as you write it — never auto-translated.',
  AUTHORITY: 'Assign a vendor to manage this entity, or keep it under internal Siwa governance.',
  DEPLOYMENT: 'Done. Review how the new object connects, then start another or open its registry.',
};

// The container classifiers and lifecycle states mirror the server's
// DEVELOPMENT_KINDS / DEVELOPMENT_STATUSES. They live here as plain data so the
// picker can render without importing a server module into a client component.
const DEVELOPMENT_KINDS = ['compound', 'town', 'village', 'resort'];
const DEVELOPMENT_STATUSES = ['announced', 'under_construction', 'delivered', 'sold_out'];

// Shared inline styles for the STRUCTURE step's small selects/inputs, so the
// container draft form matches the wizard's typography without a new CSS block.
const fieldLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 900, color: '#d97706', letterSpacing: '1.5px', display: 'block', marginBottom: '0.4rem' };
const fieldInput: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a', background: '#fff' };

function OrchestratorContent() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [compounds, setCompounds] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [geoOptions, setGeoOptions] = useState<any[]>([]);
  const [typologies, setTypologies] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [visualTemplates, setVisualTemplates] = useState<any[]>([]);

  const [state, setState] = useState<WizardState>({
    step: 'INTENT',
    intent: 'business',
    market: searchParams.get('market') || '',
    selectedParent: '',
    selectedType: searchParams.get('type') || '',
    containerKind: 'business',
    existingDevelopmentId: '',
    locationId: '',
    development: { kind: 'compound', nameEn: '', nameAr: '', developerName: '', deliveryYear: '', status: 'announced' },
    marketForm: {
      slug: '', nameEn: '', nameAr: '', governorateId: '', placeId: '', host: '',
      defaultLocale: 'ar', currency: 'EGP', revenueModel: 'realestate_lead',
      themeAccent: '#0F4C81', active: false, launchNotes: '',
      seedContainer: false, containerKind: 'compound', containerNameEn: '',
    },
    placeForm: { parentId: '', type: 'district', nameEn: '', nameAr: '', slug: '' },
    businessName: '',
    selectedVendor: '',
    businessData: {},
    // No template is pinned by default: the server resolves the right one from the
    // typology, its parent, then the tier. The old hardcoded 'desert_luxury_v1' was
    // a row that no longer exists.
    minisiteTemplate: '',
    fields: []
  });

  const updateState = (updates: Partial<WizardState>) => setState(prev => ({ ...prev, ...updates }));
  const updateDevelopment = (updates: Partial<DevelopmentDraft>) =>
    setState(prev => ({ ...prev, development: { ...prev.development, ...updates } }));
  const updateMarketForm = (updates: Partial<MarketDraft>) =>
    setState(prev => ({ ...prev, marketForm: { ...prev.marketForm, ...updates } }));
  const updatePlaceForm = (updates: Partial<PlaceDraft>) =>
    setState(prev => ({ ...prev, placeForm: { ...prev.placeForm, ...updates } }));

  // Market-independent reference data plus the market/compound hierarchy, loaded
  // once. Markets come from the admin registry, so a dark market can still be
  // authored here even while its public door is closed.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (searchParams.get('type')) parsed.selectedType = searchParams.get('type');
        if (searchParams.get('market')) parsed.market = searchParams.get('market');
        // A cached intent that is no longer valid, or a cached step that is not in
        // that intent's compiled sequence, drops the resume back to the intent picker.
        if (parsed.intent && !SEQUENCE[parsed.intent as Intent]) parsed.intent = 'business';
        const seq = SEQUENCE[(parsed.intent || 'business') as Intent];
        if (parsed.step && !seq.includes(parsed.step)) parsed.step = 'INTENT';
        setState(prev => ({
          ...prev,
          ...parsed,
          development: { ...prev.development, ...(parsed.development || {}) },
          marketForm: { ...prev.marketForm, ...(parsed.marketForm || {}) },
          placeForm: { ...prev.placeForm, ...(parsed.placeForm || {}) },
        }));
      } catch (e) {}
    }

    const safeJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?redirect=/jana/orchestrator';
          return null;
        }
        return await res.json();
      } catch {
        return null;
      }
    };

    Promise.all([
      safeJson('/api/jana/vendors'),
      safeJson('/api/jana/sections'),
      safeJson('/api/jana/templates'),
      safeJson('/api/jana/markets'),
      safeJson('/api/jana/locations'),
    ]).then(([vendorList, sectionsList, visualList, marketData, geoData]) => {
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setAllSections(Array.isArray(sectionsList) ? sectionsList : []);
      setVisualTemplates(Array.isArray(visualList) ? visualList : []);
      const list = Array.isArray(marketData?.markets) ? marketData.markets : [];
      setMarkets(list);
      setCompounds(Array.isArray(marketData?.compounds) ? marketData.compounds : []);
      setGovernorates(Array.isArray(marketData?.governorates) ? marketData.governorates : []);
      setGeoOptions(Array.isArray(geoData?.options) ? geoData.options : []);
      setState(prev => {
        if (prev.market) return prev;
        const firstActive = list.find((m: any) => m.active) || list[0];
        return { ...prev, market: firstActive ? String(firstActive.slug ?? firstActive.id) : 'siwa' };
      });
      setLoading(false);
    });
  }, [searchParams]);

  // Market-scoped reads: only the categories offered in this market (plus the
  // shared ones) and only the places inside its geography. The write side re-checks
  // both; this simply stops the wizard from offering an invalid choice.
  useEffect(() => {
    if (!state.market) return;
    let cancelled = false;
    fetch(`/api/signup/types?market=${encodeURIComponent(state.market)}`)
      .then(res => (res.ok ? res.json() : { types: [] }))
      .then(data => { if (!cancelled) setTypologies(Array.isArray(data?.types) ? data.types : []); })
      .catch(() => { if (!cancelled) setTypologies([]); });
    fetch(`/api/jana/places?market=${encodeURIComponent(state.market)}`)
      .then(res => (res.ok ? res.json() : {}))
      .then((data: any) => { if (!cancelled) setPlaces(Array.isArray(data?.places) ? data.places : []); })
      .catch(() => { if (!cancelled) setPlaces([]); });
    // A market switch invalidates choices that no longer exist in this market.
    setState(prev => ({
      ...prev,
      selectedType: prev.selectedType && searchParams.get('type') === prev.selectedType ? prev.selectedType : '',
      selectedParent: '',
      existingDevelopmentId: '',
      locationId: '',
    }));
    return () => { cancelled = true; };
  }, [state.market]);

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);

  useEffect(() => {
    if (state.selectedType) {
      fetch(`/api/jana/forms?type=${state.selectedType}`)
        .then(res => res.json())
        .then(fields => {
          if (Array.isArray(fields)) updateState({ fields });
        })
        .catch(() => {});
    }
  }, [state.selectedType]);

  // The active journey's compiled step list. Everything (tracker, next/prev,
  // the finalize trigger, the gate) reads from here, not from a fixed array.
  const seq = SEQUENCE[state.intent];

  const buildPayload = (): Record<string, any> => {
    switch (state.intent) {
      case 'market': {
        const mf = state.marketForm;
        return {
          intent: 'market',
          slug: mf.slug,
          nameEn: mf.nameEn,
          nameAr: mf.nameAr,
          host: mf.host || undefined,
          defaultLocale: mf.defaultLocale,
          currency: mf.currency,
          revenueModel: mf.revenueModel,
          themeAccent: mf.themeAccent,
          active: mf.active,
          launchNotes: mf.launchNotes || undefined,
          // An existing place travels as locationId; otherwise the city row is
          // created from the slug under the chosen governorate — mirroring the
          // market form's own rule so the wizard never bypasses it.
          ...(mf.placeId ? { locationId: mf.placeId } : mf.governorateId ? { governorateId: mf.governorateId } : {}),
          ...(mf.seedContainer && mf.containerNameEn
            ? { container: { kind: mf.containerKind, nameEn: mf.containerNameEn } }
            : {}),
        };
      }
      case 'place': {
        const pf = state.placeForm;
        return {
          intent: 'place',
          marketId: state.market,
          parentId: pf.parentId,
          type: pf.type,
          nameEn: pf.nameEn,
          nameAr: pf.nameAr || pf.nameEn,
          slug: pf.slug || undefined,
        };
      }
      case 'development':
        return {
          intent: 'development',
          market: state.market,
          name: state.development.nameEn || state.businessName,
          nameAr: state.development.nameAr,
          location_id: state.locationId || null,
          // No type_id: a container stands on its own. If one is ever supplied
          // the server still mints a page business, but the journey omits it.
          development: {
            ...state.development,
            nameEn: state.development.nameEn || state.businessName,
            nameAr: state.development.nameAr || state.development.nameEn || state.businessName,
            locationId: state.locationId || null,
          },
        };
      case 'business':
      default:
        return {
          intent: 'business',
          market: state.market,
          containerKind: 'business',
          existingDevelopmentId: state.existingDevelopmentId || null,
          location_id: state.locationId || null,
          name: state.businessName,
          type_id: state.selectedType,
          vendor_id: state.selectedVendor || null,
          template_id: state.minisiteTemplate || null,
          custom_data: state.businessData,
          subscription_tier: 'free',
          url_style: 'market',
          status: 'pending',
        };
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jana/orchestrator/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const created = await res.json().catch(() => ({}));
      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        setState(prev => ({
          ...prev,
          step: 'DEPLOYMENT',
          createdBizId: created?.business?.id || created?.id || undefined,
          createdDevId: created?.development?.id || undefined,
          createdDevSlug: created?.development?.slug || undefined,
          createdMarketSlug: created?.market?.slug || undefined,
          createdLocationPath: created?.location?.path || undefined,
        }));
        notify(
          state.intent === 'market'
            ? 'Market launched'
            : state.intent === 'place'
              ? 'Place added to the geography'
              : state.intent === 'development'
                ? 'Development created'
                : 'Entity synthesized',
          'success'
        );
      } else {
        notify(created?.error || 'Orchestration Failed', 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Orchestration Failed', 'error');
    }
    setLoading(false);
  };

  const nextStep = () => {
    const idx = seq.indexOf(state.step);
    if (idx === -1) return;
    const next = seq[idx + 1];
    // Reaching the terminal step runs the write, which flips us to DEPLOYMENT.
    if (next === 'DEPLOYMENT') return handleFinalize();
    if (next) updateState({ step: next });
  };

  const prevStep = () => {
    const idx = seq.indexOf(state.step);
    if (idx > 0) updateState({ step: seq[idx - 1] });
    else if (idx === 0) updateState({ step: 'INTENT' });
  };

  if (loading) return <div className="loader-screen">ORCHESTRATING...</div>;

  // The compounds that live in this market — the containers a listing can be
  // filed inside. Filtered client-side from the single admin registry read.
  const marketCompounds = compounds.filter(c => String(c.marketId) === String(state.market));
  // NOTE: "Typologies" here refers to the DATA MODEL (business classification),
  // NOT the ARCHITECTURE step (the workflow process). This distinction is intentional.
  const parentTypologies = typologies.filter(t => t.is_parent || !t.parent_id);
  const childTypologies = state.selectedParent ? typologies.filter(t => t.parent_id === state.selectedParent) : [];
  const selectedMarketName = String(markets.find(m => String(m.slug ?? m.id) === state.market)?.nameEn || state.market);

  // The gate that governs the PROCEED button, per step and per journey. A step
  // that is not required by the active intent simply never appears, so its rule
  // is unreachable — a development, for example, is never blocked on a typology.
  const isFinalAction = seq[seq.indexOf(state.step) + 1] === 'DEPLOYMENT';
  const mf = state.marketForm;
  const pf = state.placeForm;
  const canProceed: boolean = (() => {
    switch (state.step) {
      case 'MARKET': return Boolean(state.market);
      case 'MARKET_IDENTITY': return Boolean(mf.slug && mf.nameEn && mf.nameAr && (mf.placeId || mf.governorateId));
      case 'GEOGRAPHY': return Boolean(pf.parentId && pf.nameEn);
      case 'STRUCTURE': return state.intent === 'development' ? Boolean(state.development.nameEn) : true;
      case 'ARCHITECTURE': return Boolean(state.selectedType);
      case 'DNA_CONFIG': return Boolean(state.businessName);
      default: return true;
    }
  })();

  return (
    <div className="orchestrator-container">
      <div className="bg-glow"></div>
      
      <div className="wizard-wrapper">
        {/* Wizard Header */}
        <header className="wizard-header">
           <div className="sub-badge">SYSTEM INITIATION</div>
           <h1 className="title">GOVERNANCE <span className="highlight">ORCHESTRATOR</span></h1>
           <p className="subtitle">Architect and deploy high-fidelity entities into the Siwa Oasis registry.</p>
        </header>

        {/* Progress Tracker — reflects the active journey's compiled steps. */}
        <div className="progress-tracker">
           {[('INTENT' as Step), ...seq].map((s, i) => {
             const active = state.step === s;
             const passed = [('INTENT' as Step), ...seq].indexOf(state.step) > i;
             return (
               <div key={s} className="progress-step">
                 <div className={`progress-bar ${active || passed ? 'active' : ''}`}></div>
                 <div className={`progress-label ${active ? 'active-text' : passed ? 'passed-text' : ''}`}>{s.replace(/_/g, ' ')}</div>
               </div>
             );
           })}
        </div>

        {/* Active Phase Glass Card */}
        <div className="glass-card animate-in">

          {/* Persistent guidance bar — what this step is for, and what it unlocks. */}
          {STEP_HINTS[state.step] && (
            <div className="step-hint">
              <i className="fas fa-circle-info"></i>
              <span>{STEP_HINTS[state.step]}</span>
            </div>
          )}

          {/* STEP 0: INTENT — the admin declares what they are initiating, and
              the wizard compiles a different journey for each. This replaces the
              old forced-linear flow that made every task drag through a typology. */}
          {state.step === 'INTENT' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>What Are You Initiating?</h2>
              </div>
              <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                Each choice opens its own guided path. A market, a place, a project, or a listing —
                the steps adapt, and every object stays filed inside the market you choose.
              </p>
              <div className="grid-selection">
                {INTENT_META.map(it => (
                  <button
                    key={it.id}
                    onClick={() => {
                      const firstStep = it.id === 'market' ? 'MARKET_IDENTITY' : it.id === 'place' ? 'MARKET' : 'MARKET';
                      updateState({ intent: it.id, step: firstStep });
                    }}
                    className={`selection-card ${state.intent === it.id ? 'selected' : ''}`}
                  >
                    <i className={`fas ${it.icon} icon`}></i>
                    <div className="name">{it.name}</div>
                    <div className="tag">{it.tag}</div>
                  </button>
                ))}
              </div>

              {/* QUICK GUIDE — a compact, self-serve how-to so an operator knows
                  what each journey does and the rules that hold across all of them. */}
              <div className="quick-guide">
                <div className="quick-guide-title">
                  <i className="fas fa-route"></i> HOW EACH JOURNEY RUNS
                </div>
                <div className="quick-guide-grid">
                  {INTENT_META.map(it => (
                    <div key={it.id} className="quick-guide-row">
                      <div className="qg-name">
                        <i className={`fas ${it.icon}`}></i> {it.name}
                      </div>
                      <div className="qg-steps">
                        {SEQUENCE[it.id].map((s, idx) => (
                          <span key={s} className="qg-step">
                            {idx > 0 && <span className="qg-arrow">›</span>}
                            {s.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="quick-guide-notes">
                  <li>Every object is filed inside the market you choose, so its category tree, geography and URL address stay consistent.</li>
                  <li>A new market publishes DARK — flip its publication gate when it is ready for the public.</li>
                  <li>Typing a new developer name creates the brand record automatically and links it.</li>
                  <li>Selling inventory (units, listings, auctions) happens afterwards, inside the entity — the wizard only lays the foundation.</li>
                </ul>
              </div>
            </div>
          )}

          {/* MARKET_IDENTITY — launch a brand-new market. Reuses the market form's
              contract: pick a governorate and the city row is created from the slug
              on the server. Stays DARK until you flip the publication gate. */}
          {state.step === 'MARKET_IDENTITY' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>Launch a New Market</h2>
              </div>
              <p style={{ opacity: 0.6, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                A market is a city or destination — Al Alamein, Hurghada. It creates its own place
                row from the governorate you pick, and can seed a first project in the same pass.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={fieldLabel}>URL SEGMENT (SLUG) *</label>
                  <input value={state.marketForm.slug} placeholder="hurghada"
                    onChange={e => updateMarketForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={fieldInput} />
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>NAME (ENGLISH) *</label>
                  <input value={state.marketForm.nameEn} placeholder="Hurghada"
                    onChange={e => updateMarketForm({ nameEn: e.target.value })} style={fieldInput} />
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>NAME (ARABIC) *</label>
                  <input value={state.marketForm.nameAr} placeholder="الغردقة"
                    onChange={e => updateMarketForm({ nameAr: e.target.value })} style={fieldInput} />
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>GOVERNORATE *</label>
                  <select value={state.marketForm.governorateId}
                    onChange={e => updateMarketForm({ governorateId: e.target.value, placeId: '' })} style={fieldInput}>
                    <option value="">— select a governorate —</option>
                    {governorates.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.nameEn} · {g.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>REVENUE MODEL</label>
                  <select value={state.marketForm.revenueModel}
                    onChange={e => updateMarketForm({ revenueModel: e.target.value })} style={fieldInput}>
                    {REVENUE_MODELS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>DEFAULT LOCALE</label>
                  <select value={state.marketForm.defaultLocale}
                    onChange={e => updateMarketForm({ defaultLocale: e.target.value })} style={fieldInput}>
                    <option value="ar">Arabic (ar)</option>
                    <option value="en">English (en)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>PUBLICATION</label>
                  <select value={state.marketForm.active ? 'live' : 'dark'}
                    onChange={e => updateMarketForm({ active: e.target.value === 'live' })} style={fieldInput}>
                    <option value="dark">DARK — rows only, /{state.marketForm.slug || 'slug'} answers 404</option>
                    <option value="live">LIVE — front door opens, indexable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>SEED FIRST PROJECT (OPTIONAL)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#0f172a', padding: '0.5rem 0' }}>
                    <input type="checkbox" checked={state.marketForm.seedContainer}
                      onChange={e => updateMarketForm({ seedContainer: e.target.checked })} />
                    Create a first development in this market
                  </label>
                </div>
                {state.marketForm.seedContainer && (
                  <>
                    <div className="form-group">
                      <label style={fieldLabel}>PROJECT KIND</label>
                      <select value={state.marketForm.containerKind}
                        onChange={e => updateMarketForm({ containerKind: e.target.value })} style={fieldInput}>
                        {DEVELOPMENT_KINDS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>PROJECT NAME (EN)</label>
                      <input value={state.marketForm.containerNameEn} placeholder="Marina View"
                        onChange={e => updateMarketForm({ containerNameEn: e.target.value })} style={fieldInput} />
                    </div>
                  </>
                )}
              </div>
              {governorates.length === 0 && (
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#b45309' }}>
                  No governorate rows yet — run the geography seed before launching a market.
                </p>
              )}
            </div>
          )}

          {/* GEOGRAPHY — add a place / zone / village under an existing parent. */}
          {state.step === 'GEOGRAPHY' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>Add a Place / Zone</h2>
                <span className="tag" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>
                  Inside: {selectedMarketName}
                </span>
              </div>
              <p style={{ opacity: 0.6, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                A geography row (district, area, town, village) that renders a zone page listing
                everything filed there. It hangs under a parent already in the tree.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={fieldLabel}>PARENT *</label>
                  <select value={state.placeForm.parentId}
                    onChange={e => updatePlaceForm({ parentId: e.target.value })} style={fieldInput}>
                    <option value="">— select a parent —</option>
                    {geoOptions.map((o: any) => (
                      <option key={o.id} value={o.id}>{'— '.repeat(Math.max(0, o.depth))}{o.label} ({o.type})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>TYPE</label>
                  <select value={state.placeForm.type}
                    onChange={e => updatePlaceForm({ type: e.target.value })} style={fieldInput}>
                    {PLACE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>NAME (ENGLISH) *</label>
                  <input value={state.placeForm.nameEn} placeholder="El Hammam"
                    onChange={e => updatePlaceForm({ nameEn: e.target.value })} style={fieldInput} />
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>NAME (ARABIC)</label>
                  <input value={state.placeForm.nameAr} placeholder="الحمّام"
                    onChange={e => updatePlaceForm({ nameAr: e.target.value })} style={fieldInput} />
                </div>
                <div className="form-group">
                  <label style={fieldLabel}>SLUG (OPTIONAL)</label>
                  <input value={state.placeForm.slug} placeholder="derived from name"
                    onChange={e => updatePlaceForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} style={fieldInput} />
                </div>
              </div>
            </div>
          )}

          {/* STEP: MARKET — every entity is filed inside one market first. */}
          {state.step === 'MARKET' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>Choose the Market</h2>
                {state.market && (
                  <span className="tag" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>
                    Current: {selectedMarketName}
                  </span>
                )}
              </div>
              <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                The category tree, geography and URL namespace all follow this choice.
              </p>
              <div className="grid-selection">
                {markets.map(m => {
                  const slug = String(m.slug ?? m.id);
                  return (
                    <button
                      key={slug}
                      onClick={() => updateState({ market: slug })}
                      className={`selection-card ${state.market === slug ? 'selected' : ''}`}
                    >
                      <i className="fas fa-map-location-dot icon"></i>
                      <div className="name">{m.nameEn || slug}</div>
                      <div className="tag" style={{ color: m.active ? '#059669' : '#94a3b8' }}>
                        {m.active ? 'LIVE MARKET' : 'DARK / PREPARING'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP: STRUCTURE — the shape of what is being created. For a
              business journey it decides which container the listing files inside;
              for a development journey it collects the container itself, with NO
              typology step, because a compound is not a business category. */}
          {state.step === 'STRUCTURE' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>{state.intent === 'development' ? 'Define the Development' : 'Where Does It Live?'}</h2>
              </div>

              <div style={{ marginTop: '0' }} className="dna-form-wrapper">
                <div className="form-group main-name-input" style={{ marginBottom: '1.5rem' }}>
                  <label>PLACE (OPTIONAL)</label>
                  <select
                    value={state.locationId}
                    onChange={e => updateState({ locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="">Market default city (recommended)</option>
                    {places.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.nameEn || p.nameAr} — {p.type}</option>
                    ))}
                  </select>
                </div>

                {state.intent === 'development' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={fieldLabel}>PROJECT NAME (EN) *</label>
                      <input type="text" value={state.development.nameEn} onChange={e => updateDevelopment({ nameEn: e.target.value })} placeholder="e.g. Marassi Elmilaha" style={fieldInput} />
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>PROJECT NAME (AR)</label>
                      <input type="text" value={state.development.nameAr} onChange={e => updateDevelopment({ nameAr: e.target.value })} placeholder="مراسي" style={fieldInput} />
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>CONTAINER KIND</label>
                      <select value={state.development.kind} onChange={e => updateDevelopment({ kind: e.target.value })} style={fieldInput}>
                        {DEVELOPMENT_KINDS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>STATUS</label>
                      <select value={state.development.status} onChange={e => updateDevelopment({ status: e.target.value })} style={fieldInput}>
                        {DEVELOPMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>DEVELOPER (OPTIONAL)</label>
                      <input type="text" value={state.development.developerName} onChange={e => updateDevelopment({ developerName: e.target.value })} placeholder="e.g. Dorra Group" style={fieldInput} />
                    </div>
                    <div className="form-group">
                      <label style={fieldLabel}>DELIVERY YEAR (OPTIONAL)</label>
                      <input type="number" inputMode="numeric" value={state.development.deliveryYear} onChange={e => updateDevelopment({ deliveryYear: e.target.value })} placeholder="2028" style={fieldInput} />
                    </div>
                    <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                      Naming a developer creates the brand row automatically, so its portfolio page exists from this project. Inventory (units) is added later in the vendor inventory desk.
                    </p>
                  </div>
                ) : (
                  <div className="form-group main-name-input" style={{ marginBottom: 0 }}>
                    <label>FILE INSIDE AN EXISTING PROJECT (OPTIONAL)</label>
                    <select
                      value={state.existingDevelopmentId}
                      onChange={e => updateState({ existingDevelopmentId: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', background: '#fff' }}
                    >
                      <option value="">Standalone — not inside a project</option>
                      {marketCompounds.map(c => (
                        <option key={c.id} value={c.id}>{c.nameEn || c.nameAr} ({c.kind})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: ARCHITECTURE - Business Type Selection */}
          {/* NOTE: This STEP is called "ARCHITECTURE" (workflow process),
                    but it displays "Typology" headings (data classification).
                    This is intentional: ARCHITECTURE describes the workflow phase,
                    while "Typology" describes the business category being selected. */}
          {state.step === 'ARCHITECTURE' && (
            <div className="phase-content">
              <div className="phase-header">
                <h2>{state.selectedParent ? 'Select Child Typology' : 'Define Master Typology'}</h2>
                {state.selectedParent && (
                  <button onClick={() => updateState({ selectedParent: '', selectedType: '' })} className="btn-undo">
                    <i className="fas fa-undo-alt"></i> CHANGE PARENT
                  </button>
                )}
              </div>
              
              {!state.selectedParent ? (
                <div className="grid-selection">
                  {parentTypologies.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => updateState({ selectedParent: t.id, selectedType: t.id })}
                      className={`selection-card ${state.selectedParent === t.id ? 'selected' : ''}`}
                    >
                      <i className={`fas ${t.icon || 'fa-layer-group'} icon`}></i>
                      <div className="name">{t.name}</div>
                      <div className="tag">PARENT CATEGORY</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid-selection">
                  {childTypologies.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-info-circle"></i>
                      <div>No sub-typologies found. You can proceed with the primary category.</div>
                    </div>
                  ) : childTypologies.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => updateState({ selectedType: t.id })}
                      className={`selection-card child ${state.selectedType === t.id ? 'selected' : ''}`}
                    >
                      <i className={`fas ${t.icon || 'fa-sitemap'} icon`}></i>
                      <div className="name">{t.name}</div>
                      <div className="tag success">CHILD TYPOLOGY</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: AESTHETICS */}
          {state.step === 'AESTHETICS' && (
             <div className="phase-content">
                <div className="phase-header">
                   <h2>Visual Blueprint Selection</h2>
                </div>
                <div className="grid-selection templates">
                   <div
                      onClick={() => updateState({ minisiteTemplate: '' })}
                      className={`template-card ${!state.minisiteTemplate ? 'selected' : ''}`}
                   >
                      <div className="preview-window">
                         <i className={`fas fa-wand-magic-sparkles icon`}></i>
                      </div>
                      <div className="info">
                         <div className="name">AUTO (RECOMMENDED)</div>
                         <div className="tag">RESOLVED FROM TYPOLOGY &amp; TIER</div>
                      </div>
                   </div>
                   {visualTemplates.map(t => (
                     <div 
                        key={t.id} 
                        onClick={() => updateState({ minisiteTemplate: t.id })}
                        className={`template-card ${state.minisiteTemplate === t.id ? 'selected' : ''}`}
                     >
                        <div className="preview-window">
                           <i className={`fas ${t.type_icon || 'fa-magic'} icon`}></i>
                        </div>
                        <div className="info">
                           <div className="name">{t.name?.toUpperCase() || t.id}</div>
                           <div className="tag">{t.type_name ? t.type_name.toUpperCase() : 'UNIVERSAL MINISITE'}</div>
                        </div>
                     </div>
                   ))}
                   {visualTemplates.length === 0 && (
                     <div className="empty-state">
                       <i className="fas fa-palette"></i>
                       <div>No specific visual templates yet — the system resolves one from the typology and plan.</div>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* STEP 3: DNA_CONFIG (IDENTITY) */}
          {state.step === 'DNA_CONFIG' && (
            <div className="phase-content">
               <div className="phase-header">
                 <h2>Entity DNA & Content</h2>
               </div>
               
               <div className="form-group main-name-input">
                 <label>PRIMARY ENTITY NAME</label>
                 <input 
                   type="text" 
                   value={state.businessName || ''} 
                   onChange={e => updateState({ businessName: e.target.value })}
                   placeholder="e.g. Adrère Amellal Resort..."
                   autoFocus
                 />
               </div>

               <div className="dna-form-wrapper">
                 <DynamicForm 
                   fields={state.fields}
                   data={state.businessData}
                   sections={allSections}
                   userRole="admin"
                   onChange={(sid, name, val) => updateState({ businessData: { ...state.businessData, [sid]: { ...(state.businessData[sid] || {}), [name]: val } } })}
                 />
               </div>
            </div>
          )}

          {/* STEP 4: AUTHORITY (VENDOR MAPPING) */}
          {state.step === 'AUTHORITY' && (
            <div className="phase-content">
               <div className="phase-header">
                 <h2>Vendor Authority & Ownership</h2>
               </div>
               <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem' }}>
                 Assign an external vendor to manage this entity, or leave it blank if internally managed.
               </p>
               
               <div className="grid-selection">
                 <button 
                   onClick={() => updateState({ selectedVendor: '' })}
                   className={`selection-card ${!state.selectedVendor ? 'selected' : ''}`}
                 >
                   <i className="fas fa-shield-alt icon" style={{ color: '#10b981' }}></i>
                   <div className="name">Internal Management</div>
                   <div className="tag">SIWA GOVERNANCE</div>
                 </button>
                 
                 {vendors.map(v => (
                   <button 
                     key={v.id} 
                     onClick={() => updateState({ selectedVendor: v.id })}
                     className={`selection-card ${state.selectedVendor === v.id ? 'selected' : ''}`}
                   >
                     <i className="fas fa-user-tie icon" style={{ color: '#3b82f6' }}></i>
                     <div className="name">{v.display_name || v.email}</div>
                     <div className="tag">VENDOR ACCOUNT</div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* STEP: DEPLOYMENT (SUCCESS) — a per-journey summary of what now
              exists and how it interconnects, then the listing-specific minisite
              chooser only for the business journey. */}
          {state.step === 'DEPLOYMENT' && (
             <div className="success-content">
                <div className="check-ring">
                  <i className="fas fa-check"></i>
                </div>
                <h2>
                  {state.intent === 'market' ? 'Market Launched'
                    : state.intent === 'place' ? 'Place Added'
                    : state.intent === 'development' ? 'Development Created'
                    : 'Entity Registered & Ready'}
                </h2>

                {/* The relationship band: where the object landed and the links it
                    now shares with the rest of the platform. */}
                <div style={{ margin: '1.5rem auto 0', maxWidth: 720, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem 1.4rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '2px', marginBottom: '0.75rem' }}>
                    HOW IT CONNECTS
                  </div>
                  {state.intent === 'market' && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>
                      <strong>{state.marketForm.nameEn || state.createdMarketSlug}</strong> now owns its own place row and URL namespace
                      at <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 6 }}>siwify.com/{state.createdMarketSlug}</code>.
                      {state.marketForm.active
                        ? ' It is LIVE and indexable.'
                        : ' It is DARK — pages answer 404 until you open the publication gate on the markets screen.'}
                      {state.createdDevSlug ? ` Its first project is live at /${state.createdMarketSlug}/${state.createdDevSlug}.` : ''}
                    </p>
                  )}
                  {state.intent === 'place' && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>
                      A new geography row was filed under <strong>{selectedMarketName}</strong> at path
                      <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 6, margin: '0 4px' }}>{state.createdLocationPath}</code>
                      , rendering a zone page that lists everything filed inside it.
                    </p>
                  )}
                  {state.intent === 'development' && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>
                      <strong>{state.development.nameEn || state.businessName}</strong> is a container in
                      <strong> {selectedMarketName}</strong> at <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 6, margin: '0 4px' }}>/{state.market}/{state.createdDevSlug}</code>.
                      {state.development.developerName
                        ? ` The developer “${state.development.developerName}” brand and its portfolio page were created and cross-linked automatically.`
                        : ' Listings can now be filed inside it from the business journey.'}
                    </p>
                  )}
                  {state.intent === 'business' && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>
                      The entity was created inside <strong>{selectedMarketName}</strong>
                      {state.existingDevelopmentId ? ' and filed within its chosen project' : ''}
                      {state.selectedVendor ? ', owned by the assigned vendor' : ', internally managed'}.
                    </p>
                  )}
                </div>

                {/* Minisite Architecture Choice — only meaningful for a NEW listing. */}
                {state.intent === 'business' && (
                <div style={{ margin: '2rem auto', maxWidth: 720, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '3px', marginBottom: '1.25rem', textAlign: 'center' }}>
                    CHOOSE MINISITE ARCHITECTURE FOR THIS NEW ENTITY
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

                    {/* Option A: Sectional (legacy free system) */}
                    <div style={{ padding: '1.75rem', borderRadius: '20px', border: '2px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-layer-group" style={{ color: '#64748b', fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>Sectional Minisite</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#22c55e', letterSpacing: '1px' }}>FREE — DEFAULT SYSTEM</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        The standard section-based minisite. Sections are inherited from the business typology and automatically populated from the business data. <strong>All existing businesses use this — zero cost.</strong>
                      </p>
                      <ul style={{ fontSize: '0.75rem', color: '#475569', paddingLeft: '1.25rem', margin: 0, lineHeight: 2 }}>
                        <li>Auto-generated from business typology</li>
                        <li>Sections show: identity, gallery, services, blogs</li>
                        <li>Fully functional from day one</li>
                        <li>No builder access needed</li>
                      </ul>
                      {state.createdBizId ? (
                        <Link
                          href={`/jana/businesses/${state.createdBizId}/orchestrate`}
                          className="btn-premium"
                          style={{ textAlign: 'center', marginTop: '0.5rem' }}
                        >
                          <i className="fas fa-layer-group" style={{ marginRight: '6px' }} /> USE SECTIONAL (FREE)
                        </Link>
                      ) : (
                        <Link href="/jana/businesses" className="btn-premium" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                          ENTER REGISTRY
                        </Link>
                      )}
                    </div>

                    {/* Option B: Builder Minisite */}
                    <div style={{ padding: '1.75rem', borderRadius: '20px', border: '2px solid #d97706', background: '#fffdf5', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 8px 24px rgba(217,119,6,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-wand-magic-sparkles" style={{ color: '#d97706', fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>Builder Minisite</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '1px' }}>NEW — COMPONENT STUDIO</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Admin-designed page with drag-and-drop component blocks. Replaces or layers on top of the section system. Pre-fills from the business database. Governed by subscription tier.
                      </p>
                      <ul style={{ fontSize: '0.75rem', color: '#475569', paddingLeft: '1.25rem', margin: 0, lineHeight: 2 }}>
                        <li>Component-based (hero, gallery, packages…)</li>
                        <li>Site-specific content auto-pre-filled</li>
                        <li>Replace or untied from sections system</li>
                        <li>Admin-only studio access</li>
                      </ul>
                      {state.createdBizId ? (
                        <Link
                          href={`/jana/minisite-builder?slug=${state.createdBizId}`}
                          className="btn-premium"
                          style={{ background: '#d97706', textAlign: 'center', marginTop: '0.5rem' }}
                        >
                          <i className="fas fa-wand-magic-sparkles" style={{ marginRight: '6px' }} /> OPEN IN MINISITE BUILDER
                        </Link>
                      ) : null}
                    </div>

                  </div>

                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '1.25rem', fontWeight: 600 }}>
                    <i className="fas fa-info-circle" style={{ color: '#d97706', marginRight: '6px' }} />
                    You can always switch later. Existing sectional minisites are never affected — builder is only activated when you explicitly open the Builder Studio for a business.
                  </p>
                </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-outline" onClick={() => updateState({ step: 'INTENT', intent: 'business', createdBizId: undefined, createdDevId: undefined, createdDevSlug: undefined, createdMarketSlug: undefined, createdLocationPath: undefined, businessName: '', businessData: {}, selectedType: '', selectedParent: '', existingDevelopmentId: '', locationId: '', selectedVendor: '', minisiteTemplate: '', fields: [], development: { kind: 'compound', nameEn: '', nameAr: '', developerName: '', deliveryYear: '', status: 'announced' }, marketForm: { ...state.marketForm, slug: '', nameEn: '', nameAr: '', governorateId: '', placeId: '', seedContainer: false, containerNameEn: '' }, placeForm: { parentId: '', type: 'district', nameEn: '', nameAr: '', slug: '' } })}>
                    <i className="fas fa-plus" style={{ marginRight: 6 }} /> INITIATE ANOTHER
                  </button>
                  <Link href={state.intent === 'business' ? '/jana/businesses' : '/jana/markets'} className="btn-outline">
                    {state.intent === 'business' ? 'VIEW ALL IN REGISTRY' : 'OPEN MARKETS DESK'}
                  </Link>
                </div>
             </div>
          )}

          {/* Persistent Controls — the gate is per step and per journey. The
              next button fires the write on the last step before DEPLOYMENT. */}
          {state.step !== 'DEPLOYMENT' && state.step !== 'INTENT' && (
            <div className="wizard-controls">
              <button onClick={prevStep} className="btn-ghost">
                <i className="fas fa-chevron-left"></i> PREVIOUS
              </button>

              <button
                onClick={nextStep}
                className="btn-premium next-btn"
                disabled={!canProceed}
              >
                {isFinalAction ? 'SYNTHESIZE & DEPLOY' : 'PROCEED'}
                <i className={isFinalAction ? "fas fa-rocket" : "fas fa-chevron-right"}></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .loader-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #d97706; font-weight: 900; letter-spacing: 5px; }
        
        .orchestrator-container {
          min-height: 100vh;
          background: transparent;
          color: #0f172a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: clamp(1rem, 3vw, 2.5rem) clamp(0.75rem, 2vw, 1.5rem);
          position: relative;
          overflow: hidden;
        }

        .bg-glow {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(217,119,6,0.06) 0%, rgba(255,255,255,0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        .wizard-wrapper {
          max-width: 1050px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .wizard-header {
          text-align: center;
          margin-bottom: clamp(1.5rem, 4vw, 3rem);
        }
        
        .sub-badge {
          font-size: clamp(0.6rem, 1.5vw, 0.7rem); font-weight: 900; color: #d97706; 
          letter-spacing: clamp(2px, 0.5vw, 4px); margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .title {
          font-size: clamp(1.75rem, 5vw, 2.8rem); font-weight: 900; letter-spacing: -1px;
          margin: 0; color: #0f172a; line-height: 1.15;
        }

        .highlight { color: #d97706; }

        .subtitle {
          color: #64748b; font-size: clamp(0.85rem, 2vw, 1rem); max-width: 500px; 
          margin: 0.75rem auto 0; line-height: 1.5; font-weight: 500;
        }

        .progress-tracker {
          display: flex; gap: clamp(0.4rem, 1.5vw, 1.5rem); margin-bottom: clamp(1.5rem, 3vw, 3rem);
          overflow-x: auto; padding-bottom: 4px;
        }

        .progress-step { flex: 1; min-width: 55px; }

        .progress-bar {
          height: 5px; border-radius: 4px;
          background: #e2e8f0;
          margin-bottom: 0.5rem; transition: all 0.4s ease;
        }

        .progress-bar.active {
          background: linear-gradient(90deg, #d97706, #f59e0b);
          box-shadow: 0 0 10px rgba(217,119,6,0.3);
        }

        .progress-label {
          font-size: clamp(0.52rem, 1.2vw, 0.65rem); font-weight: 800; letter-spacing: 0.5px;
          color: #94a3b8; transition: all 0.4s ease;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .progress-label.active-text { color: #d97706; font-weight: 900; }
        .progress-label.passed-text { color: #0f172a; font-weight: 800; }

        .glass-card {
          padding: clamp(1.25rem, 4vw, 3.5rem) clamp(1rem, 3.5vw, 3rem);
          border-radius: clamp(16px, 3vw, 24px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .phase-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: clamp(1.25rem, 3vw, 2.5rem);
          flex-wrap: wrap; gap: 0.75rem;
        }

        .phase-header h2 {
          font-size: clamp(1.25rem, 3vw, 2rem); font-weight: 900; margin: 0; color: #0f172a;
          letter-spacing: -0.5px;
        }

        .btn-undo {
          background: #fffdf5; color: #d97706;
          border: 1px solid #fde68a; cursor: pointer;
          font-weight: 900; font-size: 0.7rem; padding: 0.5rem 1rem;
          border-radius: 50px; transition: all 0.2s;
        }
        .btn-undo:hover { background: #fef3c7; }

        .grid-selection {
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(clamp(130px, 20vw, 220px), 1fr)); 
          gap: clamp(0.75rem, 2vw, 1.5rem);
        }

        .selection-card {
          padding: clamp(1.25rem, 2.5vw, 2rem) clamp(0.75rem, 1.5vw, 1.25rem);
          border-radius: clamp(14px, 2vw, 20px);
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; cursor: pointer; text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .selection-card:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }

        .selection-card.selected {
          border-color: #d97706;
          background: #fffdf5;
          box-shadow: 0 10px 25px rgba(217,119,6,0.12);
          transform: translateY(-4px);
        }

        .selection-card .icon {
          font-size: clamp(1.4rem, 3vw, 2rem); color: #d97706; 
          margin-bottom: 0.85rem; display: block;
        }

        .selection-card.child .icon { color: #059669; }

        .selection-card .name { font-weight: 800; font-size: clamp(0.82rem, 1.5vw, 0.95rem); margin-bottom: 0.35rem; color: #0f172a; line-height: 1.2; }
        .selection-card .tag { font-size: clamp(0.55rem, 1vw, 0.6rem); color: #64748b; font-weight: 900; letter-spacing: 0.5px; }
        .selection-card .tag.success { color: #059669; }

        /* Persistent per-step guidance strip at the top of the active card. */
        .step-hint {
          display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 1.6rem;
          padding: 0.8rem 1rem; font-size: 0.8rem; line-height: 1.5; color: var(--siwa-gold);
          background: rgba(197, 164, 104, 0.06); border: 1px solid rgba(197, 164, 104, 0.22); border-radius: 12px;
        }
        .step-hint i { margin-top: 0.1rem; flex-shrink: 0; }

        /* Self-serve how-to panel on the intent picker. */
        .quick-guide {
          margin-top: 2.2rem; padding: 1.4rem 1.5rem; background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--siwa-border); border-radius: 16px;
        }
        .quick-guide-title {
          font-family: 'Space Grotesk', sans-serif; font-size: 0.75rem; letter-spacing: 0.15em;
          color: var(--siwa-gold); margin-bottom: 1.1rem;
        }
        .quick-guide-title i { margin-right: 0.4rem; }
        .quick-guide-grid { display: flex; flex-direction: column; gap: 0.7rem; }
        .quick-guide-row {
          display: grid; grid-template-columns: 220px 1fr; gap: 0.4rem 1rem; align-items: baseline;
          padding-bottom: 0.7rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .quick-guide-row:last-child { border-bottom: none; }
        .qg-name { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em; }
        .qg-name i { color: var(--siwa-gold); margin-right: 0.4rem; width: 1rem; text-align: center; }
        .qg-steps { display: flex; flex-wrap: wrap; gap: 0.25rem 0.35rem; align-items: center; }
        .qg-step {
          font-size: 0.62rem; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.66);
          background: rgba(255, 255, 255, 0.05); padding: 0.15rem 0.5rem; border-radius: 999px;
        }
        .qg-arrow { color: var(--siwa-gold); margin-right: 0.3rem; opacity: 0.6; }
        .quick-guide-notes {
          margin: 1.1rem 0 0; padding: 0 0 0 1.1rem; list-style: disc;
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .quick-guide-notes li { font-size: 0.72rem; line-height: 1.5; color: rgba(255, 255, 255, 0.55); }
        @media (max-width: 640px) { .quick-guide-row { grid-template-columns: 1fr; } }

        .empty-state {
          grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;
          background: #f8fafc; border-radius: 20px;
          border: 1px dashed #cbd5e1;
        }
        .empty-state i { font-size: 2rem; color: #94a3b8; margin-bottom: 0.75rem; }
        .empty-state div { color: #64748b; font-weight: 600; font-size: 0.85rem; }

        .template-card {
          border-radius: 18px; overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer; transition: all 0.3s;
        }
        .template-card:hover { transform: translateY(-4px); border-color: #cbd5e1; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .template-card.selected { border: 2px solid #d97706; box-shadow: 0 12px 30px rgba(217,119,6,0.15); transform: translateY(-4px); }
        
        .template-card .preview-window {
          height: clamp(100px, 15vw, 150px); background: #f1f5f9; 
          display: flex; align-items: center; justify-content: center;
        }
        .template-card .preview-window .icon { font-size: 2rem; opacity: 0.4; color: #0f172a; }
        .template-card .info { padding: 1rem; background: #ffffff; color: #0f172a; }
        .template-card .info .name { font-weight: 900; font-size: 0.85rem; margin-bottom: 0.2rem; color: #0f172a; }
        .template-card .info .tag { font-size: 0.58rem; color: #d97706; font-weight: 900; letter-spacing: 0.5px; }

        .main-name-input { margin-bottom: clamp(1.75rem, 4vw, 3.5rem); }
        .main-name-input label {
          font-size: 0.72rem; font-weight: 900; color: #d97706; 
          letter-spacing: 1.5px; display: block; margin-bottom: 0.5rem;
        }
        .main-name-input input {
          width: 100%; background: transparent; border: none;
          border-bottom: 2px solid #cbd5e1; color: #0f172a;
          font-size: clamp(1.35rem, 4vw, 2.5rem); font-weight: 900; padding: 0.5rem 0; outline: none;
          transition: all 0.3s;
        }
        .main-name-input input:focus { border-bottom-color: #d97706; }
        .main-name-input input::placeholder { color: #cbd5e1; }

        .dna-form-wrapper {
          background: #f8fafc;
          padding: clamp(1rem, 2.5vw, 2rem); border-radius: 18px;
          border: 1px solid #e2e8f0;
        }

        .success-content { text-align: center; padding: 1.5rem 0; }
        .check-ring {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem; font-size: 2rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        .success-content h2 { font-size: clamp(1.6rem, 4vw, 2.5rem); font-weight: 900; letter-spacing: -1px; margin-bottom: 0.75rem; color: #0f172a; }
        .success-content p { font-size: clamp(0.85rem, 2vw, 1.05rem); color: #64748b; margin-bottom: 2rem; }
        .success-content .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        .wizard-controls {
          margin-top: clamp(1.75rem, 4vw, 4rem); padding-top: clamp(1rem, 2.5vw, 2rem);
          border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          gap: 1rem;
        }

        .btn-ghost {
          background: transparent; border: none; color: #64748b;
          font-weight: 800; font-size: 0.8rem; cursor: pointer;
          letter-spacing: 1px; transition: color 0.2s; padding: 0.75rem 1.25rem;
        }
        .btn-ghost:hover:not(:disabled) { color: #0f172a; }
        .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-premium { 
          padding: clamp(0.85rem, 2vw, 1.1rem) clamp(1.75rem, 4vw, 3rem); border-radius: 50px; 
          background: #0f172a; 
          color: #ffffff; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          border: none; font-weight: 800; letter-spacing: 0.5px; cursor: pointer;
          box-shadow: 0 10px 25px rgba(15,23,42,0.15); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: clamp(0.78rem, 1.5vw, 0.88rem);
        }
        .btn-premium:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 30px rgba(15,23,42,0.25); 
          background: #1e293b;
        }
        .btn-premium:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

        .btn-premium.next-btn { display: inline-flex; align-items: center; gap: 0.75rem; }

        .btn-outline { 
          padding: clamp(0.85rem, 2vw, 1.1rem) clamp(1.75rem, 4vw, 3rem); border-radius: 50px; 
          background: #ffffff; color: #0f172a; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid #cbd5e1; 
          font-weight: 800; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          font-size: clamp(0.78rem, 1.5vw, 0.88rem);
        }
        .btn-outline:hover { border-color: #0f172a; background: #f8fafc; }

        /* MOBILE OPTIMIZATIONS (Laptop vs Phone Alignment) */
        @media (max-width: 768px) {
          .wizard-controls {
            flex-direction: column-reverse;
            gap: 0.75rem;
          }
          .wizard-controls .btn-premium,
          .wizard-controls .btn-outline,
          .wizard-controls .btn-ghost {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
          .success-content .actions .btn-premium,
          .success-content .actions .btn-outline {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function GovernanceWizardPage() {
  return (
    <Suspense fallback={<div className="loader-screen">INITIALIZING PROTOCOLS...</div>}>
      <OrchestratorContent />
    </Suspense>
  );
}
