'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

interface MarketRow {
  id: string;
  slug: string;
  locationId: string | null;
  locationPath: string | null;
  locationLabel: string | null;
  nameAr: string;
  nameEn: string;
  host: string | null;
  defaultLocale: string;
  currency: string;
  revenueModel: string;
  themeAccent: string | null;
  active: boolean;
  launchNotes: string | null;
  listings: number;
  compounds: number;
}

interface CompoundRow {
  id: string;
  marketId: string;
  locationId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  developerName: string | null;
  deliveryYear: number | null;
  status: string;
  active: boolean;
  listings: number;
  /** Business that speaks for this compound, when one is linked. */
  pageBusinessId: string | null;
}

interface ListingRow {
  id: string;
  name: string;
  slug: string;
  marketId: string;
  developmentId: string | null;
  status: string;
  tier: string;
  typeId: string | null;
  typeName: string | null;
  typeIcon: string | null;
}

interface TypeRow {
  id: string;
  name: string;
  is_parent?: any;
  parent_id?: string | null;
  market_id?: string | null;
  active?: any;
}

interface TierRow {
  id: string;
  name: string;
}

interface GovernorateOption {
  id: string;
  nameEn: string;
  nameAr: string;
  path: string;
}

interface GeoNodeRow {
  id: string;
  parentId: string | null;
  type: string;
  slug: string;
  path: string;
  nameAr: string;
  nameEn: string;
  lat: number | null;
  lng: number | null;
  active: boolean;
  sortOrder: number;
  marketId: string | null;
  listings: number;
  markets: number;
  children: GeoNodeRow[];
}

interface GeoOptionRow {
  id: string;
  path: string;
  type: string;
  label: string;
  depth: number;
  marketId: string | null;
}

const LABEL: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 800,
  color: '#6b7280',
  display: 'block',
  marginBottom: '0.3rem',
};

const HINT: React.CSSProperties = { fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.25rem' };

function Badge({
  tone,
  children,
}: {
  tone: 'live' | 'dark' | 'muted' | 'warn';
  children: React.ReactNode;
}) {
  const tones: Record<string, React.CSSProperties> = {
    live: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    dark: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
    muted: { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' },
    warn: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  };
  return (
    <span
      style={{
        ...tones[tone],
        fontSize: '0.6rem',
        fontWeight: 900,
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** The governorate a market's location path sits under, if any. */
function governorateFromPath(governorates: GovernorateOption[], path: string | null): string {
  if (!path) return '';
  const match = governorates.find(
    (governorate) => path === governorate.path || path.startsWith(`${governorate.path}/`)
  );
  return match?.id || '';
}

/** A market can own a city, a town or a coastal area. Districts and
 *  neighbourhoods below that belong to listings, not to a market. */
const MARKET_PLACE_TYPES = ['city', 'town', 'area'];

interface GeoIndex {
  byId: Map<string, GeoNodeRow>;
  byPath: Map<string, GeoNodeRow>;
  countries: GeoNodeRow[];
}

/** One pass over the tree the page already loaded, so every level of the
 *  cascade is answered without another request. */
function indexGeoTree(tree: GeoNodeRow[]): GeoIndex {
  const byId = new Map<string, GeoNodeRow>();
  const byPath = new Map<string, GeoNodeRow>();
  const walk = (nodes: GeoNodeRow[]) => {
    for (const node of nodes) {
      byId.set(node.id, node);
      byPath.set(node.path, node);
      walk(node.children || []);
    }
  };
  walk(tree);
  return { byId, byPath, countries: tree.filter((node) => node.type === 'country') };
}

function MarketForm({
  initial,
  governorates,
  geoTree,
  onClose,
  onSaved,
}: {
  initial: MarketRow | 'new';
  governorates: GovernorateOption[];
  geoTree: GeoNodeRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial === 'new';
  const seed = isNew ? null : (initial as MarketRow);
  const geo = useMemo(() => indexGeoTree(geoTree), [geoTree]);

  // Seed the cascade from the stored path (`eg/matrouh/el-alamein`) so an edit
  // opens on the market's real place instead of on the first option.
  const seedSegments = String(seed?.locationPath || '').split('/').filter(Boolean);
  const seedCountryId =
    geo.byPath.get(seedSegments[0] || '')?.id ||
    (geo.countries.length === 1 ? geo.countries[0].id : '');
  const seedGovernorateId =
    geo.byPath.get(seedSegments.slice(0, 2).join('/'))?.id ||
    governorateFromPath(governorates, seed?.locationPath || null);

  const [form, setForm] = useState({
    slug: seed?.slug || '',
    nameEn: seed?.nameEn || '',
    nameAr: seed?.nameAr || '',
    host: seed?.host || '',
    countryId: seedCountryId,
    governorateId: seedGovernorateId,
    placeId: seed?.locationId || '',
    lat: '',
    lng: '',
    defaultLocale: seed?.defaultLocale || 'ar',
    currency: seed?.currency || 'EGP',
    revenueModel: seed?.revenueModel || 'tourism_whatsapp',
    themeAccent: seed?.themeAccent || '#0F4C81',
    active: seed?.active ?? false,
    launchNotes: seed?.launchNotes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryNode = geo.byId.get(form.countryId);
  const governorateNode = geo.byId.get(form.governorateId);
  const governoratePath =
    governorateNode?.path ||
    governorates.find((option) => option.id === form.governorateId)?.path ||
    null;

  // Without a country the governorate list stays unfiltered, which keeps the
  // form usable before the geography tree has been seeded.
  const governorateList: GovernorateOption[] = countryNode
    ? (countryNode.children || []).filter((node) => node.type === 'governorate' && node.active)
    : governorates;

  const placeNodes = (governorateNode?.children || []).filter(
    (node) => MARKET_PLACE_TYPES.includes(node.type) && node.active
  );
  // Keep the market's current row in the list even if it sits at a level this
  // form would not offer, so editing never shows a blank selection.
  const seedPlace = seed?.locationId ? geo.byId.get(seed.locationId) : undefined;
  const placeChoices =
    seedPlace && !placeNodes.some((node) => node.id === seedPlace.id)
      ? [seedPlace, ...placeNodes]
      : placeNodes;

  const cityPathPreview = form.placeId
    ? geo.byId.get(form.placeId)?.path || null
    : governoratePath && form.slug
      ? `${governoratePath}/${form.slug}`
      : null;
  const locationChanged =
    form.governorateId !== seedGovernorateId ||
    (form.placeId || '') !== (seed?.locationId || '');

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        slug: form.slug,
        nameEn: form.nameEn,
        nameAr: form.nameAr,
        host: form.host,
        defaultLocale: form.defaultLocale,
        currency: form.currency,
        revenueModel: form.revenueModel,
        themeAccent: form.themeAccent,
        active: form.active,
        launchNotes: form.launchNotes,
      };

      // Only re-run geography when the operator actually moved the market, so
      // editing a name never rewrites a location row. An existing place travels
      // as `locationId`; otherwise the server creates or reuses the city row
      // from the slug under the chosen governorate.
      if (isNew || locationChanged || !seed?.locationId) {
        if (form.placeId) payload.locationId = form.placeId;
        else if (form.governorateId) payload.governorateId = form.governorateId;
      }
      if (form.lat !== '') payload.lat = Number(form.lat);
      if (form.lng !== '') payload.lng = Number(form.lng);

      const res = isNew
        ? await fetch('/api/jana/markets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/jana/markets', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, slug: seed?.slug }),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the market');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save the market');
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    saving || !form.nameEn || !form.nameAr || !form.governorateId || (isNew && !form.slug);

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '2px solid #c7d2fe',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '0.75rem',
      }}
    >
      <h4 style={{ margin: '0 0 0.35rem 0', color: '#1e293b' }}>
        <i className="fas fa-globe" style={{ marginRight: '0.4rem', color: '#D4AF37' }}></i>
        {isNew ? 'NEW MARKET' : `EDIT ${seed?.nameEn}`}
      </h4>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.72rem', color: '#64748b' }}>
        Country → governorate → city or area. Each step filters the next, so you can drill down to
        the exact place; pick an existing row or let the form create it from the slug.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.9rem',
        }}
      >
        <div>
          <label style={LABEL}>URL SEGMENT (SLUG) *</label>
          <input
            className="form-control"
            value={form.slug}
            disabled={!isNew}
            placeholder="hurghada"
            onChange={(e) =>
              setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
            }
          />
          <div style={HINT}>
            {isNew
              ? 'Becomes /hurghada and the city path segment. Cannot be renamed later.'
              : 'Locked: listings address themselves by this slug.'}
          </div>
        </div>

        <div>
          <label style={LABEL}>NAME (ENGLISH) *</label>
          <input
            className="form-control"
            value={form.nameEn}
            placeholder="Hurghada"
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </div>

        <div>
          <label style={LABEL}>NAME (ARABIC) *</label>
          <input
            className="form-control"
            value={form.nameAr}
            placeholder="الغردقة"
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </div>

        <div>
          <label style={LABEL}>COUNTRY *</label>
          <select
            className="form-control"
            value={form.countryId}
            disabled={geo.countries.length === 0}
            onChange={(e) =>
              setForm({ ...form, countryId: e.target.value, governorateId: '', placeId: '' })
            }
          >
            <option value="">— select a country —</option>
            {geo.countries.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nameEn} · {option.nameAr}
              </option>
            ))}
          </select>
          <div style={HINT}>
            {geo.countries.length === 0
              ? 'No country row found yet — the governorates below are unfiltered.'
              : 'Filters the governorates below.'}
          </div>
        </div>

        <div>
          <label style={LABEL}>GOVERNORATE *</label>
          <select
            className="form-control"
            value={form.governorateId}
            disabled={governorateList.length === 0}
            onChange={(e) => setForm({ ...form, governorateId: e.target.value, placeId: '' })}
          >
            <option value="">— select a governorate —</option>
            {governorateList.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nameEn} · {option.nameAr}
              </option>
            ))}
          </select>
          <div style={HINT}>
            {governorateList.length === 0
              ? 'Pick a country first, or run the geography migration.'
              : 'Parent of the city row this market creates.'}
          </div>
        </div>

        <div>
          <label style={LABEL}>CITY / AREA *</label>
          <select
            className="form-control"
            value={form.placeId}
            disabled={!form.governorateId}
            onChange={(e) => setForm({ ...form, placeId: e.target.value })}
          >
            <option value="">
              {form.slug ? `+ create "${form.slug}" under this governorate` : '+ create from the slug'}
            </option>
            {placeChoices.map((option) => {
              const taken = Boolean(option.marketId) && option.marketId !== seed?.slug;
              return (
                <option key={option.id} value={option.id} disabled={taken}>
                  {option.nameEn} · {option.nameAr} ({option.type})
                  {taken ? ` — taken by ${option.marketId}` : ''}
                </option>
              );
            })}
          </select>
          <div style={HINT}>
            {cityPathPreview
              ? `Location path: ${cityPathPreview}`
              : 'Pick an existing city, town or coastal area — or let the form create the row.'}
          </div>
        </div>

        <div>
          <label style={LABEL}>HOST</label>
          <input
            className="form-control"
            value={form.host}
            placeholder="hurghada.siwify.com"
            onChange={(e) => setForm({ ...form, host: e.target.value })}
          />
          <div style={HINT}>&lt;slug&gt;.siwify.com resolves by label even before DNS exists.</div>
        </div>

        <div>
          <label style={LABEL}>CITY LATITUDE</label>
          <input
            className="form-control"
            value={form.lat}
            placeholder="27.2579"
            onChange={(e) => setForm({ ...form, lat: e.target.value.replace(/[^0-9.-]/g, '') })}
          />
        </div>

        <div>
          <label style={LABEL}>CITY LONGITUDE</label>
          <input
            className="form-control"
            value={form.lng}
            placeholder="33.8116"
            onChange={(e) => setForm({ ...form, lng: e.target.value.replace(/[^0-9.-]/g, '') })}
          />
        </div>

        <div>
          <label style={LABEL}>DEFAULT LOCALE</label>
          <select
            className="form-control"
            value={form.defaultLocale}
            onChange={(e) => setForm({ ...form, defaultLocale: e.target.value })}
          >
            <option value="ar">Arabic (ar)</option>
            <option value="en">English (en)</option>
          </select>
        </div>

        <div>
          <label style={LABEL}>CURRENCY</label>
          <input
            className="form-control"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })}
          />
        </div>

        <div>
          <label style={LABEL}>REVENUE MODEL</label>
          <select
            className="form-control"
            value={form.revenueModel}
            onChange={(e) => setForm({ ...form, revenueModel: e.target.value })}
          >
            <option value="tourism_whatsapp">tourism_whatsapp — stays, tours, WhatsApp</option>
            <option value="realestate_lead">realestate_lead — compounds, price per m²</option>
            <option value="directory_lead">directory_lead — local services</option>
          </select>
        </div>

        <div>
          <label style={LABEL}>THEME ACCENT</label>
          <input
            type="color"
            className="form-control"
            style={{ padding: '0.15rem', height: '38px' }}
            value={form.themeAccent}
            onChange={(e) => setForm({ ...form, themeAccent: e.target.value })}
          />
        </div>

        <div>
          <label style={LABEL}>PUBLICATION</label>
          <select
            className="form-control"
            value={form.active ? 'live' : 'dark'}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'live' })}
          >
            <option value="dark">DARK — rows only, /{form.slug || 'slug'} answers 404</option>
            <option value="live">LIVE — front door opens, pages are indexable</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '0.9rem' }}>
        <label style={LABEL}>LAUNCH NOTES</label>
        <textarea
          className="form-control"
          rows={2}
          value={form.launchNotes}
          placeholder="What must be true before this market goes live?"
          onChange={(e) => setForm({ ...form, launchNotes: e.target.value })}
        />
      </div>

      {error && (
        <div style={{ marginTop: '0.75rem', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={submit} disabled={disabled}>
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> SAVING…
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> {isNew ? 'CREATE MARKET' : 'SAVE CHANGES'}
            </>
          )}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          CANCEL
        </button>
        {isNew && !form.governorateId && (
          <span style={{ fontSize: '0.72rem', color: '#b45309' }}>
            Pick a governorate — a market must belong to a place.
          </span>
        )}
      </div>
    </div>
  );
}

function CompoundForm({
  market,
  draft,
  onClose,
  onSaved,
}: {
  market: string;
  draft?: CompoundRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(draft?.id);
  const [form, setForm] = useState({
    nameEn: draft?.nameEn || '',
    nameAr: draft?.nameAr || '',
    developerName: draft?.developerName || '',
    deliveryYear: draft?.deliveryYear ? String(draft.deliveryYear) : '',
    status: draft?.status || 'under_construction',
    pageBusinessId: draft?.pageBusinessId || '',
  });
  const [candidates, setCandidates] = useState<{ id: string; name: string; name_ar: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The page business is chosen from this market's own listings. The write path
  // enforces the same rule again, so a stale list cannot attach another market's
  // business as this compound's front page.
  useEffect(() => {
    let live = true;
    fetch(`/api/jana/businesses?market=${encodeURIComponent(market)}&light=1`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (live && Array.isArray(rows)) setCandidates(rows);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [market]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/jana/developments', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editing ? { id: draft?.id, ...form } : { ...form, market }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the compound');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save the compound');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '2px solid #D4AF37',
        borderRadius: '10px',
        padding: '1rem',
        margin: '0.75rem 0',
      }}
    >
      <h5 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>
        <i className="fas fa-city"></i> {editing ? 'EDIT' : 'NEW'} COMPOUND IN {market}
      </h5>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div>
          <label style={LABEL}>NAME (ENGLISH) *</label>
          <input
            className="form-control"
            value={form.nameEn}
            placeholder="Marassi"
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>NAME (ARABIC)</label>
          <input
            className="form-control"
            value={form.nameAr}
            placeholder="مراسي"
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>DEVELOPER</label>
          <input
            className="form-control"
            value={form.developerName}
            onChange={(e) => setForm({ ...form, developerName: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>DELIVERY YEAR</label>
          <input
            className="form-control"
            value={form.deliveryYear}
            placeholder="2027"
            onChange={(e) => setForm({ ...form, deliveryYear: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </div>
        <div>
          <label style={LABEL}>STATUS</label>
          <select
            className="form-control"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="announced">announced</option>
            <option value="under_construction">under_construction</option>
            <option value="delivered">delivered</option>
            <option value="sold_out">sold_out</option>
          </select>
        </div>
        <div>
          <label style={LABEL}>PAGE BUSINESS</label>
          <select
            className="form-control"
            value={form.pageBusinessId}
            onChange={(e) => setForm({ ...form, pageBusinessId: e.target.value })}
          >
            <option value="">— none: structural page —</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name_ar ? `${candidate.name_ar} · ${candidate.name}` : candidate.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <div style={{ marginTop: '0.6rem', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem' }}>
        <button className="btn btn-primary" onClick={submit} disabled={saving || !form.nameEn}>
          {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'CREATE COMPOUND'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

function VillaForm({
  market,
  compoundId,
  compounds,
  types,
  tiers,
  locations,
  marketPath,
  onClose,
  onCreated,
}: {
  market: string;
  compoundId: string;
  compounds: CompoundRow[];
  types: TypeRow[];
  tiers: TierRow[];
  locations: GeoOptionRow[];
  marketPath: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [parentId, setParentId] = useState('');
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    type_id: '',
    development_id: compoundId,
    location_id: '',
    subscription_tier: tiers[0]?.id || 'free',
    phone: '',
    status: 'active',
    url_style: 'root',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childTypes = types
    .filter((type) => !type.is_parent && type.parent_id && type.id !== 'SECTION_TEMPLATE')
    .filter((type) => type.active !== false && Number(type.active) !== 0)
    .filter((type) => !type.market_id || type.market_id === market)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const parents = types
    .filter((type) => childTypes.some((child) => String(child.parent_id) === String(type.id)))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  // Only places inside the market's own subtree — its city and everything below
  // it, plus the areas that name this market — can hold its listings. A Siwa
  // villa is never filed on Hurghada's coast.
  const placeable = locations.filter(
    (option) =>
      option.depth >= 3 &&
      (!marketPath ||
        option.path === marketPath ||
        option.path.startsWith(`${marketPath}/`) ||
        option.marketId === market)
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/jana/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          name_ar: form.name_ar || null,
          type_id: form.type_id,
          market_id: market,
          development_id: form.development_id || null,
          location_id: form.location_id || null,
          subscription_tier: form.subscription_tier,
          phone: form.phone,
          status: form.status,
          url_style: form.url_style,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the listing');
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not create the listing');
    } finally {
      setSaving(false);
    }
  };

  const slugPreview = (form.name || 'villa-name')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <div
      style={{
        background: '#eff6ff',
        border: '2px solid #93c5fd',
        borderRadius: '10px',
        padding: '1rem',
        margin: '0.75rem 0',
      }}
    >
      <h5 style={{ margin: '0 0 0.75rem 0', color: '#1e40af' }}>
        <i className="fas fa-house-chimney"></i> NEW LISTING IN {market}
      </h5>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div>
          <label style={LABEL}>VILLA NAME *</label>
          <input
            className="form-control"
            value={form.name}
            placeholder="Villa 12 — Marassi"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>ARABIC NAME</label>
          <input
            className="form-control"
            dir="rtl"
            value={form.name_ar}
            placeholder="فيلا ١٢ — مراسي"
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>PARENT CATEGORY</label>
          <select
            className="form-control"
            value={parentId}
            onChange={(e) => {
              setParentId(e.target.value);
              setForm({ ...form, type_id: '' });
            }}
          >
            <option value="">— select —</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>TYPOLOGY *</label>
          <select
            className="form-control"
            value={form.type_id}
            disabled={!parentId}
            onChange={(e) => setForm({ ...form, type_id: e.target.value })}
          >
            <option value="">{parentId ? '— select —' : 'pick a parent first'}</option>
            {childTypes
              .filter((type) => String(type.parent_id) === String(parentId))
              .map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>COMPOUND</label>
          <select
            className="form-control"
            value={form.development_id}
            onChange={(e) => setForm({ ...form, development_id: e.target.value })}
          >
            <option value="">— stands on its own —</option>
            {compounds
              .filter((compound) => compound.marketId === market)
              .map((compound) => (
                <option key={compound.id} value={compound.id}>
                  {compound.nameEn}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>LOCATION</label>
          <select
            className="form-control"
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
          >
            <option value="">
              — inherits {market}&apos;s city
            </option>
            {placeable.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div style={HINT}>
            {placeable.length} place(s) inside this market
          </div>
        </div>
        <div>
          <label style={LABEL}>TIER</label>
          <select
            className="form-control"
            value={form.subscription_tier}
            onChange={(e) => setForm({ ...form, subscription_tier: e.target.value })}
          >
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))
            ) : (
              <option value="free">Free</option>
            )}
          </select>
        </div>
        <div>
          <label style={LABEL}>PUBLIC ADDRESS</label>
          <select
            className="form-control"
            value={form.url_style}
            onChange={(e) => setForm({ ...form, url_style: e.target.value })}
          >
            <option value="root">{'siwify.com/{slug} — short address (default)'}</option>
            <option value="market">{`siwify.com/${market}/{slug} — inside the market`}</option>
          </select>
          <div style={HINT}>
            The address only: the listing stays filed in this market either way.
          </div>
        </div>
        <div>
          <label style={LABEL}>PHONE / WHATSAPP</label>
          <input
            className="form-control"
            value={form.phone}
            placeholder="+20 100 123 4567"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>STATUS</label>
          <select
            className="form-control"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">active — renders publicly</option>
            <option value="pending">pending — intake queue</option>
          </select>
        </div>
      </div>
      {error && (
        <div style={{ marginTop: '0.6rem', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={saving || !form.name || !form.type_id}
        >
          {saving ? 'SAVING…' : 'CREATE LISTING'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          CANCEL
        </button>
        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
          Address: /{market}/{slugPreview}
        </span>
      </div>
    </div>
  );
}

/* ─── Geography panel ─────────────────────────────────────────────────────── */

/** Mirrors `CHILD_TYPES` in `src/lib/geo-admin.ts`; the server is the authority. */
const GEO_CHILDREN: Record<string, string[]> = {
  country: ['governorate'],
  governorate: ['city', 'town', 'area'],
  city: ['district', 'town', 'area', 'neighborhood'],
  district: ['area', 'neighborhood'],
  town: ['area', 'neighborhood'],
  area: ['neighborhood'],
  neighborhood: [],
};

const GEO_TYPE_LABEL: Record<string, string> = {
  country: 'COUNTRY',
  governorate: 'GOVERNORATE',
  city: 'CITY',
  district: 'DISTRICT',
  town: 'TOWN',
  area: 'AREA',
  neighborhood: 'NEIGHBORHOOD',
};

const GEO_ICON: Record<string, string> = {
  country: 'fas fa-globe',
  governorate: 'fas fa-map',
  city: 'fas fa-city',
  district: 'fas fa-layer-group',
  town: 'fas fa-house',
  area: 'fas fa-location-dot',
  neighborhood: 'fas fa-map-pin',
};

type LocationDraft = { mode: 'new'; parent: GeoNodeRow } | { mode: 'edit'; node: GeoNodeRow };

/**
 * Add a place under a parent, or rename one. The type is only offered when
 * creating: changing a level afterwards would mean rewriting every path below
 * it, which is not a rename — it is a different place.
 */
function LocationForm({
  draft,
  markets,
  onClose,
  onSaved,
}: {
  draft: LocationDraft;
  markets: MarketRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = draft.mode === 'new';
  const node = draft.mode === 'edit' ? draft.node : null;
  const parent = draft.mode === 'new' ? draft.parent : null;
  const allowed = parent ? GEO_CHILDREN[parent.type] || [] : [];

  const [form, setForm] = useState({
    nameEn: node?.nameEn || '',
    nameAr: node?.nameAr || '',
    type: node?.type || allowed[0] || 'city',
    slug: node?.slug || '',
    lat: node?.lat === null || node?.lat === undefined ? '' : String(node.lat),
    lng: node?.lng === null || node?.lng === undefined ? '' : String(node.lng),
    marketId: node?.marketId || '',
    active: node ? node.active : true,
    sortOrder: String(node?.sortOrder ?? 100),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        nameEn: form.nameEn,
        nameAr: form.nameAr,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
        marketId: form.marketId || null,
        active: form.active,
        sortOrder: Number(form.sortOrder),
      };

      if (isNew && parent) {
        payload.parentId = parent.id;
        payload.type = form.type;
        payload.slug = form.slug;
      } else if (node) {
        payload.id = node.id;
        if (form.slug && form.slug !== node.slug) payload.slug = form.slug;
      }

      const res = await fetch('/api/jana/locations', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the place');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save the place');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#f0fdf4',
        border: '2px solid #86efac',
        borderRadius: '10px',
        padding: '1rem',
        margin: '0.75rem 0',
      }}
    >
      <h5 style={{ margin: '0 0 0.75rem 0', color: '#166534' }}>
        <i className="fas fa-location-dot"></i>{' '}
        {isNew ? `NEW PLACE INSIDE ${parent?.nameEn}` : `EDIT ${node?.nameEn}`}
      </h5>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div>
          <label style={LABEL}>NAME (EN) *</label>
          <input
            className="form-control"
            value={form.nameEn}
            placeholder="Hurghada"
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>NAME (AR)</label>
          <input
            className="form-control"
            value={form.nameAr}
            placeholder="الغردقة"
            dir="rtl"
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </div>
        {isNew && (
          <div>
            <label style={LABEL}>LEVEL *</label>
            <select
              className="form-control"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {allowed.map((type) => (
                <option key={type} value={type}>
                  {GEO_TYPE_LABEL[type] || type}
                </option>
              ))}
            </select>
            <div style={HINT}>
              {parent?.type === 'country' ? 'A country only holds governorates.' : `Path: ${parent?.path}/${form.slug || '…'}`}
            </div>
          </div>
        )}
        <div>
          <label style={LABEL}>SLUG</label>
          <input
            className="form-control"
            value={form.slug}
            placeholder="hurghada"
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <div style={HINT}>
            {isNew ? 'Empty = derived from the English name.' : 'Renaming rewrites every path below it.'}
          </div>
        </div>
        <div>
          <label style={LABEL}>MARKET</label>
          <select
            className="form-control"
            value={form.marketId}
            onChange={(e) => setForm({ ...form, marketId: e.target.value })}
          >
            <option value="">— belongs to no market —</option>
            {markets.map((row) => (
              <option key={row.slug} value={row.slug}>
                {row.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>LATITUDE</label>
          <input
            className="form-control"
            value={form.lat}
            placeholder="27.2579"
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>LONGITUDE</label>
          <input
            className="form-control"
            value={form.lng}
            placeholder="33.8116"
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>SORT ORDER</label>
          <input
            className="form-control"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </div>
        <div>
          <label style={LABEL}>VISIBLE</label>
          <select
            className="form-control"
            value={form.active ? '1' : '0'}
            onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
          >
            <option value="1">active — offered in selectors</option>
            <option value="0">hidden — kept, not offered</option>
          </select>
        </div>
      </div>
      {error && (
        <div style={{ marginTop: '0.6rem', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={submit} disabled={saving || !form.nameEn}>
          {saving ? 'SAVING…' : isNew ? 'CREATE PLACE' : 'SAVE CHANGES'}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

export default function MarketsHierarchyPage() {
  const { notify } = useAdmin();
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [compounds, setCompounds] = useState<CompoundRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [marketForm, setMarketForm] = useState<MarketRow | 'new' | null>(null);
  const [compoundFor, setCompoundFor] = useState<string | null>(null);
  const [compoundEdit, setCompoundEdit] = useState<CompoundRow | null>(null);
  const [villaFor, setVillaFor] = useState<{ market: string; compoundId: string } | null>(null);
  const [view, setView] = useState<'markets' | 'geography'>('markets');
  const [geoTree, setGeoTree] = useState<GeoNodeRow[]>([]);
  const [geoOptions, setGeoOptions] = useState<GeoOptionRow[]>([]);
  const [openGeo, setOpenGeo] = useState<Record<string, boolean>>({});
  const [locationDraft, setLocationDraft] = useState<LocationDraft | null>(null);

  const load = useCallback(async () => {
    try {
      const [treeRes, typesRes, tiersRes, geoRes] = await Promise.all([
        fetch('/api/jana/markets', { cache: 'no-store' }),
        fetch('/api/jana/types', { cache: 'no-store' }),
        fetch('/api/jana/tiers', { cache: 'no-store' }),
        fetch('/api/jana/locations', { cache: 'no-store' }),
      ]);

      if (treeRes.ok) {
        const tree = await treeRes.json();
        setMarkets(tree.markets || []);
        setCompounds(tree.compounds || []);
        setListings(tree.listings || []);
        setGovernorates(tree.governorates || []);
      } else {
        const data = await treeRes.json().catch(() => ({}));
        notify(data.error || 'Could not load the market hierarchy', 'error');
      }

      if (typesRes.ok) {
        const payload = await typesRes.json();
        setTypes(Array.isArray(payload) ? payload : payload.types || []);
      }
      if (tiersRes.ok) {
        const payload = await tiersRes.json();
        setTiers(Array.isArray(payload) ? payload : payload.tiers || []);
      }

      if (geoRes.ok) {
        const geo = await geoRes.json();
        setGeoTree(geo.tree || []);
        setGeoOptions(geo.options || []);
      } else {
        const data = await geoRes.json().catch(() => ({}));
        notify(data.error || 'Could not load the geography tree', 'error');
      }
    } catch {
      notify('Could not load the market hierarchy', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
    // Load once on mount; every mutation reloads explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchMarket = async (slug: string, patch: Record<string, any>, message: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/jana/markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      notify(message, 'success');
      await load();
    } catch (e: any) {
      notify(e.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeMarket = async (market: MarketRow) => {
    if (
      !confirm(
        `Delete the market "${market.nameEn}"? This only works while it holds no listings and no compounds.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/jana/markets?slug=${encodeURIComponent(market.slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      notify(`Market "${market.nameEn}" deleted`, 'success');
      await load();
    } catch (e: any) {
      notify(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeCompound = async (compound: CompoundRow) => {
    if (!confirm(`Delete the compound "${compound.nameEn}"? Move its listings out first.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jana/developments?id=${encodeURIComponent(compound.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      notify(`Compound "${compound.nameEn}" deleted`, 'success');
      await load();
    } catch (e: any) {
      notify(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const listingsIn = (marketSlug: string, developmentId: string | null) =>
    listings.filter(
      (listing) =>
        listing.marketId === marketSlug && (listing.developmentId || null) === developmentId
    );

  const renderListing = (listing: ListingRow, marketSlug: string) => (
    <div
      key={listing.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.6rem',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '0.35rem',
        flexWrap: 'wrap',
      }}
    >
      <i className={listing.typeIcon || 'fas fa-circle'} style={{ color: '#94a3b8', width: '14px' }}></i>
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{listing.name}</div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
          {listing.typeName || 'no typology'} · /{marketSlug}/{listing.slug}
        </div>
      </div>
      <Badge tone={listing.status === 'active' ? 'live' : 'warn'}>{listing.status.toUpperCase()}</Badge>
      <Badge tone="muted">{listing.tier.toUpperCase()}</Badge>
      <Link
        href={`/${marketSlug}/${listing.slug}`}
        target="_blank"
        className="btn btn-xs btn-outline"
        style={{ color: '#10b981', borderColor: '#10b981' }}
      >
        <i className="fas fa-external-link-alt"></i>
      </Link>
      <Link href={`/jana/businesses/${listing.id}/orchestrate`} className="btn btn-xs btn-premium">
        <i className="fas fa-wand-magic-sparkles"></i> BUILD
      </Link>
    </div>
  );

  const removeLocation = async (node: GeoNodeRow) => {
    if (
      !confirm(
        `Delete "${node.nameEn}" (${node.path})? A place that still has children, a market or a listing on it cannot be removed.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/jana/locations?id=${encodeURIComponent(node.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      notify(`"${node.nameEn}" deleted`, 'success');
      await load();
    } catch (e: any) {
      notify(e.message || 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  /** One row per place; children recurse, so the depth is visible by indentation. */
  const renderGeo = (node: GeoNodeRow, depth: number): React.ReactNode => {
    const isCountry = node.type === 'country';
    const canAddChild = (GEO_CHILDREN[node.type] || []).length > 0;
    const hasChildren = node.children.length > 0;
    const isOpen = openGeo[node.id] ?? depth === 0;

    return (
      <div key={node.id} style={{ marginLeft: depth === 0 ? 0 : '0.9rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            padding: '0.4rem 0.6rem',
            background: isCountry ? '#0f172a' : '#fff',
            color: isCountry ? '#f8fafc' : '#0f172a',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${isCountry ? '#D4AF37' : node.marketId ? '#8b5cf6' : '#cbd5e1'}`,
            borderRadius: '8px',
            marginBottom: '0.3rem',
            fontSize: '0.8rem',
          }}
        >
          {hasChildren ? (
            <button
              className="btn btn-xs btn-outline"
              style={{ color: '#475569', borderColor: '#cbd5e1' }}
              onClick={() => setOpenGeo({ ...openGeo, [node.id]: !isOpen })}
            >
              <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
            </button>
          ) : (
            <span style={{ width: '26px' }}></span>
          )}

          <i
            className={GEO_ICON[node.type] || 'fas fa-circle'}
            style={{ color: isCountry ? '#D4AF37' : '#94a3b8' }}
          ></i>
          <strong>{node.nameEn}</strong>
          <span style={{ fontSize: '0.7rem', color: isCountry ? '#cbd5e1' : '#94a3b8' }}>
            {node.nameAr}
          </span>
          <code style={{ fontSize: '0.6rem', color: isCountry ? '#e2e8f0' : '#94a3b8' }}>
            {node.path}
          </code>
          <Badge tone="muted">{GEO_TYPE_LABEL[node.type] || node.type}</Badge>
          {!node.active && <Badge tone="dark">HIDDEN</Badge>}
          {node.marketId && <Badge tone="live">{node.marketId}</Badge>}
          {node.markets > 0 && <Badge tone="warn">{node.markets} MARKET</Badge>}
          {node.listings > 0 && <Badge tone="muted">{node.listings} LISTINGS</Badge>}

          <div style={{ flex: 1 }}></div>

          {canAddChild && (
            <button
              className="btn btn-xs btn-outline"
              style={{ color: '#2563eb', borderColor: '#93c5fd' }}
              onClick={() => setLocationDraft({ mode: 'new', parent: node })}
            >
              <i className="fas fa-plus"></i> ADD
            </button>
          )}
          <button
            className="btn btn-xs btn-outline"
            onClick={() => setLocationDraft({ mode: 'edit', node })}
          >
            <i className="fas fa-pen"></i>
          </button>
          <button
            className="btn btn-xs btn-outline"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
            disabled={busy}
            onClick={() => removeLocation(node)}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>

        {isOpen && node.children.map((child) => renderGeo(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="card-header">
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>
            <i className="fas fa-sitemap"></i> Markets &amp; Expansion
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
            Country → governorate → city → market → compound → villa. The listing is the only level
            that renders publicly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${view === 'markets' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('markets')}
          >
            <i className="fas fa-sitemap"></i> MARKETS
          </button>
          <button
            className={`btn ${view === 'geography' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('geography')}
          >
            <i className="fas fa-globe"></i> GEOGRAPHY
          </button>
          {/* The form renders inside the market panel, so open that panel first. */}
          <button
            className="btn btn-primary"
            onClick={() => {
              setView('markets');
              setMarketForm('new');
            }}
          >
            <i className="fas fa-plus"></i> NEW MARKET
          </button>
        </div>
      </div>

      {/* The market side of the tree. Geography renders in its own panel below. */}
      <div style={{ display: view === 'geography' ? 'none' : undefined }}>

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: '#475569',
          lineHeight: 1.6,
        }}
      >
        <strong>A new market is reachable without a deploy.</strong> The URL segment is read from
        this table, so creating <code>hurghada</code> opens <code>/hurghada</code> within a couple of
        minutes. Creating it here also writes its city row and links the two directions. A{' '}
        <strong>dark</strong> market keeps its rows but answers 404 — that is what El Alamein is
        today.
      </div>

      {marketForm && (
        <MarketForm
          initial={marketForm}
          governorates={governorates}
          geoTree={geoTree}
          onClose={() => setMarketForm(null)}
          onSaved={() => {
            notify(marketForm === 'new' ? 'Market created' : 'Market updated', 'success');
            load();
          }}
        />
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {markets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            No market rows yet. Create one to start.
          </div>
        )}

        {markets.map((market) => {
          const marketCompounds = compounds.filter((compound) => compound.marketId === market.slug);
          const standalone = listingsIn(market.slug, null);
          const isOpen = Boolean(open[market.slug]);

          return (
            <div
              key={market.slug}
              style={{
                border: `1px solid ${market.active ? '#bbf7d0' : '#e2e8f0'}`,
                borderLeft: `4px solid ${market.themeAccent || '#94a3b8'}`,
                borderRadius: '10px',
                padding: '0.9rem 1rem',
                marginBottom: '0.75rem',
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-xs btn-outline"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                  onClick={() => setOpen({ ...open, [market.slug]: !isOpen })}
                >
                  <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </button>

                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>
                    {market.nameEn}{' '}
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{market.nameAr}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                    /{market.slug}
                    {market.host ? ` · ${market.host}` : ''} · {market.defaultLocale.toUpperCase()} ·{' '}
                    {market.currency}
                  </div>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: market.locationPath ? '#475569' : '#b45309',
                      marginTop: '0.15rem',
                    }}
                  >
                    <i className="fas fa-location-dot" style={{ marginRight: '0.25rem' }}></i>
                    {market.locationPath
                      ? `${market.locationLabel || market.locationId} · ${market.locationPath}`
                      : 'No city row attached'}
                  </div>
                </div>

                <Badge tone={market.active ? 'live' : 'dark'}>{market.active ? 'LIVE' : 'DARK'}</Badge>
                <Badge tone="muted">{market.listings} listings</Badge>
                <Badge tone="muted">{market.compounds} compounds</Badge>
                <Badge tone="muted">{market.revenueModel}</Badge>

                <div style={{ flex: 1 }}></div>

                <button
                  className="btn btn-xs btn-outline"
                  disabled={busy}
                  style={{
                    color: market.active ? '#b45309' : '#166534',
                    borderColor: market.active ? '#fcd34d' : '#86efac',
                  }}
                  onClick={() =>
                    patchMarket(
                      market.slug,
                      { active: !market.active },
                      market.active ? `${market.nameEn} is now dark` : `${market.nameEn} is live`
                    )
                  }
                >
                  <i className={`fas ${market.active ? 'fa-eye-slash' : 'fa-rocket'}`}></i>{' '}
                  {market.active ? 'MAKE DARK' : 'ACTIVATE'}
                </button>
                <button className="btn btn-xs btn-outline" onClick={() => setMarketForm(market)}>
                  <i className="fas fa-pen"></i> EDIT
                </button>
                <button
                  className="btn btn-xs btn-outline"
                  style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                  onClick={() => {
                    setOpen({ ...open, [market.slug]: true });
                    setCompoundFor(market.slug);
                  }}
                >
                  <i className="fas fa-city"></i> COMPOUND
                </button>
                <button
                  className="btn btn-xs btn-outline"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  disabled={busy}
                  onClick={() => removeMarket(market)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              {market.launchNotes && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: '#64748b',
                    fontStyle: 'italic',
                  }}
                >
                  {market.launchNotes}
                </div>
              )}

              {isOpen && (
                <div style={{ marginTop: '0.9rem', paddingLeft: '1.1rem', borderLeft: '2px dashed #e2e8f0' }}>
                  {compoundFor === market.slug && (
                    <CompoundForm
                      market={market.slug}
                      onClose={() => setCompoundFor(null)}
                      onSaved={() => {
                        notify('Compound created', 'success');
                        load();
                      }}
                    />
                  )}

                  {marketCompounds.length === 0 && standalone.length === 0 && compoundFor !== market.slug && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem 0' }}>
                      No supply yet. Add a compound, or a villa that stands on its own.
                    </div>
                  )}

                  {marketCompounds.map((compound) => {
                    const inside = listingsIn(market.slug, compound.id);
                    return (
                      <div
                        key={compound.id}
                        style={{
                          marginBottom: '0.9rem',
                          padding: '0.7rem',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <i className="fas fa-city" style={{ color: '#8b5cf6' }}></i>
                          <strong style={{ fontSize: '0.85rem' }}>{compound.nameEn}</strong>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {compound.slug}
                            {compound.developerName ? ` · ${compound.developerName}` : ''}
                            {compound.deliveryYear ? ` · ${compound.deliveryYear}` : ''}
                          </span>
                          <Badge tone={compound.active ? 'muted' : 'dark'}>{compound.status}</Badge>
                          <Badge tone="muted">{inside.length} villas</Badge>
                          <div style={{ flex: 1 }}></div>
                          <button
                            className="btn btn-xs btn-outline"
                            style={{ color: '#2563eb', borderColor: '#93c5fd' }}
                            onClick={() =>
                              setVillaFor({ market: market.slug, compoundId: compound.id })
                            }
                          >
                            <i className="fas fa-house-chimney"></i> VILLA
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            style={{ color: '#0f766e', borderColor: '#5eead4' }}
                            onClick={() =>
                              setCompoundEdit(compoundEdit?.id === compound.id ? null : compound)
                            }
                          >
                            <i className="fas fa-pen"></i> EDIT
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            style={{ color: '#ef4444', borderColor: '#ef4444' }}
                            onClick={() => removeCompound(compound)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>

                        {compoundEdit?.id === compound.id && (
                          <CompoundForm
                            market={market.slug}
                            draft={compound}
                            onClose={() => setCompoundEdit(null)}
                            onSaved={() => {
                              notify('Compound updated', 'success');
                              load();
                            }}
                          />
                        )}

                        <div style={{ marginTop: '0.6rem' }}>
                          {inside.length === 0 ? (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              No villas in this compound yet.
                            </div>
                          ) : (
                            inside.map((listing) => renderListing(listing, market.slug))
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div
                    style={{
                      padding: '0.7rem',
                      background: '#fff',
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <i className="fas fa-location-dot" style={{ color: '#10b981' }}></i>
                      <strong style={{ fontSize: '0.85rem' }}>Standalone villas &amp; listings</strong>
                      <Badge tone="muted">{standalone.length}</Badge>
                      <div style={{ flex: 1 }}></div>
                      <button
                        className="btn btn-xs btn-outline"
                        style={{ color: '#2563eb', borderColor: '#93c5fd' }}
                        onClick={() => setVillaFor({ market: market.slug, compoundId: '' })}
                      >
                        <i className="fas fa-plus"></i> VILLA
                      </button>
                    </div>
                    <div style={{ marginTop: '0.6rem' }}>
                      {standalone.length === 0 ? (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Nothing outside a compound.
                        </div>
                      ) : (
                        standalone.map((listing) => renderListing(listing, market.slug))
                      )}
                    </div>
                  </div>

                  {villaFor && villaFor.market === market.slug && (
                    <VillaForm
                      market={villaFor.market}
                      compoundId={villaFor.compoundId}
                      compounds={compounds}
                      types={types}
                      tiers={tiers}
                      locations={geoOptions}
                      marketPath={market.locationPath}
                      onClose={() => setVillaFor(null)}
                      onCreated={() => {
                        notify('Listing created', 'success');
                        load();
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {view === 'geography' && (
        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              fontSize: '0.75rem',
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            <strong>Country → governorate → city → town → area → neighborhood.</strong> This is the
            place side of the tree: a market points at one city row, and every listing inherits that
            row unless it names a place of its own. Egypt and its 27 governorates are seeded — add the
            cities and the areas beneath them. A place created here is immediately selectable as a
            market&apos;s location, and nothing that a market or a listing depends on can be deleted.
          </div>

          {locationDraft && (
            <LocationForm
              draft={locationDraft}
              markets={markets}
              onClose={() => setLocationDraft(null)}
              onSaved={() => {
                notify('Place saved', 'success');
                load();
              }}
            />
          )}

          {geoTree.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No places in the tree. Run{' '}
              <code>migrations/20261026_geo_country_complete.sql</code> to seed Egypt, its
              governorates and the coastal cities.
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem' }}>
              {geoTree.map((country) => renderGeo(country, 0))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
