'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import UnitTermsFields, { EMPTY_UNIT_TERMS, termsOf, termsPayload } from '@/components/UnitTermsFields';

/**
 * A vendor's own inventory.
 *
 * The market desk used to be the only hand that could type a project's offer
 * terms, so a developer with forty chalets had to send a spreadsheet and wait.
 * Everything here writes the same `units` columns the admin panel writes, behind
 * the same publish gate, through an endpoint that only lets a vendor touch their
 * own rows.
 */

interface UnitRow {
  id: string;
  titleAr: string;
  titleEn: string | null;
  unitType: string | null;
  listingKind: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  price: number | null;
  currency: string;
  deposit: number | null;
  depositMonths: number | null;
  minStayNights: number | null;
  availableFrom: string | null;
  amenities: string[];
  status: string;
  active: boolean;
  pricePerSqm?: number | null;
  downPaymentPct?: number | null;
  installmentYears?: number | null;
  deliveryYear?: number | null;
  finishing?: string | null;
  furnished?: boolean | null;
}

const BLANK_UNIT = {
  titleAr: '',
  titleEn: '',
  unitType: '',
  listingKind: 'rent_month',
  bedrooms: '',
  bathrooms: '',
  areaSqm: '',
  price: '',
  deposit: '',
  depositMonths: '',
  minStayNights: '',
  availableFrom: '',
  amenities: '',
  status: 'available',
};

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6rem',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.03em',
  marginBottom: '0.2rem',
};

const BOX: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '1rem',
};

const GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '0.6rem',
};

const KIND_LABELS: Record<string, string> = {
  rent_night: 'rent / night',
  rent_month: 'rent / month',
  sale: 'for sale',
};

export default function VendorInventoryPage() {
  const [business, setBusiness] = useState<any>(null);
  const [development, setDevelopment] = useState<any>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...BLANK_UNIT, terms: { ...EMPTY_UNIT_TERMS } });
  const [containerForm, setContainerForm] = useState({
    nameEn: '',
    nameAr: '',
    kind: 'compound',
    deliveryYear: '',
  });

  const currency = String(business?.market_currency || 'EGP');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not load your inventory.');
        return;
      }
      setBusiness(data.business || null);
      setDevelopment(data.development || null);
      setUnits(Array.isArray(data.units) ? data.units : []);
    } catch {
      setError('Could not reach the market.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openContainer() {
    if (!containerForm.nameEn.trim() && !containerForm.nameAr.trim()) {
      setError('A project needs a name — the Arabic one is what the /ar page prints.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/vendor/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'container', ...containerForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open the project.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Could not open the project.');
    } finally {
      setBusy(false);
    }
  }

  async function addUnit() {
    if (!form.titleAr.trim()) {
      setError('An Arabic title is required — the English one is optional.');
      return;
    }
    setBusy(true);
    setError(null);
    setWarnings([]);
    try {
      const { terms, ...rest } = form;
      const res = await fetch('/api/vendor/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, ...termsPayload(terms), currency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add the unit.');
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setForm({ ...BLANK_UNIT, terms: { ...EMPTY_UNIT_TERMS } });
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'Could not add the unit.');
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, changes: Record<string, any>): Promise<boolean> {
    setBusy(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await fetch('/api/vendor/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update the unit.');
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      await load();
      return true;
    } catch (e: any) {
      setError(e.message || 'Could not update the unit.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this unit? It leaves the page immediately.')) return;
    setBusy(true);
    await fetch(`/api/vendor/inventory?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
    setBusy(false);
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Loading your inventory…</div>;
  }

  return (
    <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
          <i className="fas fa-building" style={{ color: '#0369a1', marginRight: '0.5rem' }}></i>
          MY INVENTORY
        </h1>
        <Link href="/vendor" className="btn btn-xs btn-outline">
          <i className="fas fa-arrow-left"></i> DASHBOARD
        </Link>
        <div style={{ flex: 1 }}></div>
        {business && (
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
            {business.name_ar || business.name}
            {business.market_name ? ` · ${business.market_name}` : ''} · {currency}
          </span>
        )}
      </div>

      {!business && (
        <div style={{ ...BOX, color: '#b45309', fontWeight: 700, fontSize: '0.8rem' }}>
          This account is not linked to a business page yet, so there is nothing to file
          inventory against. Ask the market desk to attach your page.
        </div>
      )}

      {business && !development && (
        <div style={BOX}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            OPEN A PROJECT
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.7rem' }}>
            Your units need a container to sit in. Opening one here keeps it switched off until
            the market desk reviews it, then it appears at its own address.
          </div>
          <div style={GRID}>
            <div>
              <label style={LABEL}>NAME (ENGLISH) *</label>
              <input
                className="form-control"
                value={containerForm.nameEn}
                placeholder="Marina View Compound"
                onChange={(e) => setContainerForm({ ...containerForm, nameEn: e.target.value })}
              />
            </div>
            <div>
              <label style={LABEL}>NAME (ARABIC)</label>
              <input
                className="form-control"
                dir="rtl"
                value={containerForm.nameAr}
                placeholder="مجمع مارينا فيو"
                onChange={(e) => setContainerForm({ ...containerForm, nameAr: e.target.value })}
              />
            </div>
            <div>
              <label style={LABEL}>TYPE</label>
              <select
                className="form-control"
                value={containerForm.kind}
                onChange={(e) => setContainerForm({ ...containerForm, kind: e.target.value })}
              >
                <option value="compound">compound</option>
                <option value="resort">resort</option>
                <option value="town">town</option>
                <option value="village">village</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>HANDOVER YEAR</label>
              <input
                className="form-control"
                value={containerForm.deliveryYear}
                placeholder="2028"
                onChange={(e) =>
                  setContainerForm({ ...containerForm, deliveryYear: e.target.value.replace(/[^0-9]/g, '') })
                }
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={openContainer} disabled={busy}>
                {busy ? 'SAVING…' : 'OPEN PROJECT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {development && (
        <div style={{ ...BOX, display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong dir="rtl" style={{ fontSize: '0.9rem' }}>
            {development.name_ar}
          </strong>
          {development.name_en && development.name_en !== development.name_ar && (
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{development.name_en}</span>
          )}
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
            {development.kind}
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: 999,
              color: Number(development.active) ? '#166534' : '#b45309',
              background: Number(development.active) ? '#dcfce7' : '#fef3c7',
            }}
          >
            {Number(development.active) ? 'LIVE' : 'AWAITING MARKET DESK REVIEW'}
          </span>
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-xs btn-outline" onClick={() => setOpen(!open)}>
            <i className={`fas ${open ? 'fa-xmark' : 'fa-plus'}`}></i> {open ? 'CLOSE' : 'ADD UNIT'}
          </button>
        </div>
      )}

      {open && development && (
        <div style={{ ...BOX, display: 'grid', gap: '0.6rem' }}>
          <div style={GRID}>
            <div>
              <label style={LABEL}>TITLE (ARABIC) *</label>
              <input
                className="form-control"
                dir="rtl"
                value={form.titleAr}
                placeholder="شاليه ٣ غرف"
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
              />
            </div>
            <div>
              <label style={LABEL}>TITLE (ENGLISH)</label>
              <input
                className="form-control"
                value={form.titleEn}
                placeholder="3-bedroom chalet"
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              />
            </div>
            <div>
              <label style={LABEL}>TYPE</label>
              <input
                className="form-control"
                value={form.unitType}
                placeholder="chalet"
                onChange={(e) => setForm({ ...form, unitType: e.target.value })}
              />
            </div>
            <div>
              <label style={LABEL}>LISTING</label>
              <select
                className="form-control"
                value={form.listingKind}
                onChange={(e) => setForm({ ...form, listingKind: e.target.value })}
              >
                <option value="rent_night">rent / night</option>
                <option value="rent_month">rent / month</option>
                <option value="sale">sale</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>BEDROOMS</label>
              <input
                className="form-control"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </div>
            <div>
              <label style={LABEL}>BATHROOMS</label>
              <input
                className="form-control"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </div>
            <div>
              <label style={LABEL}>AREA (m²)</label>
              <input
                className="form-control"
                value={form.areaSqm}
                onChange={(e) => setForm({ ...form, areaSqm: e.target.value.replace(/[^0-9.]/g, '') })}
              />
            </div>
            <div>
              <label style={LABEL}>PRICE ({currency})</label>
              <input
                className="form-control"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, '') })}
              />
            </div>
            {form.listingKind !== 'sale' && (
              <>
                <div>
                  <label style={LABEL}>DEPOSIT ({currency})</label>
                  <input
                    className="form-control"
                    value={form.deposit}
                    onChange={(e) => setForm({ ...form, deposit: e.target.value.replace(/[^0-9.]/g, '') })}
                  />
                </div>
                <div>
                  <label style={LABEL}>DEPOSIT (MONTHS)</label>
                  <input
                    className="form-control"
                    value={form.depositMonths}
                    onChange={(e) => setForm({ ...form, depositMonths: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                </div>
                <div>
                  <label style={LABEL}>MIN STAY (NIGHTS)</label>
                  <input
                    className="form-control"
                    value={form.minStayNights}
                    onChange={(e) => setForm({ ...form, minStayNights: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                </div>
                <div>
                  <label style={LABEL}>AVAILABLE FROM</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.availableFrom}
                    onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                  />
                </div>
              </>
            )}
            <div>
              <label style={LABEL}>AMENITIES</label>
              <input
                className="form-control"
                value={form.amenities}
                placeholder="pool, private garden, ac"
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              />
            </div>
            <UnitTermsFields
              kind={form.listingKind}
              currency={currency}
              value={form.terms}
              onChange={(patch) => setForm({ ...form, terms: { ...form.terms, ...patch } })}
              labelStyle={LABEL}
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={addUnit} disabled={busy || !form.titleAr.trim()}>
              {busy ? 'SAVING…' : 'ADD UNIT'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>{error}</div>
      )}
      {warnings.length > 0 && (
        <div style={{ color: '#b45309', fontSize: '0.74rem', fontWeight: 700, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
          Saved. The page will still not answer: {warnings.join(' · ')}.
        </div>
      )}

      {development && units.length === 0 && !open && (
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          No units yet. ADD UNIT and buyers will see them on your page as soon as they pass the
          publish check.
        </div>
      )}

      {units.length > 0 && (
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {units.map((unit) => (
            <div key={unit.id} style={{ display: 'grid', gap: '0.4rem' }}>
              <div
                style={{
                  ...BOX,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.75rem',
                }}
              >
                <strong dir="rtl">{unit.titleAr}</strong>
                {unit.titleEn && unit.titleEn !== unit.titleAr && (
                  <span style={{ color: '#64748b' }}>{unit.titleEn}</span>
                )}
                <span style={{ color: '#94a3b8' }}>
                  {unit.unitType ? `${unit.unitType} · ` : ''}
                  {KIND_LABELS[unit.listingKind] || unit.listingKind}
                  {unit.bedrooms ? ` · ${unit.bedrooms} BR` : ''}
                  {unit.areaSqm ? ` · ${unit.areaSqm} m²` : ''}
                  {unit.price ? ` · ${Number(unit.price).toLocaleString('en-US')} ${unit.currency}` : ' · no price'}
                  {unit.pricePerSqm ? ` · ${Number(unit.pricePerSqm).toLocaleString('en-US')} ${unit.currency}/m²` : ''}
                  {unit.downPaymentPct ? ` · ${unit.downPaymentPct}% down` : ''}
                  {unit.installmentYears ? ` · ${unit.installmentYears}y` : ''}
                  {unit.deliveryYear ? ` · handover ${unit.deliveryYear}` : ''}
                </span>
                <div style={{ flex: 1 }}></div>
                <select
                  className="form-control"
                  style={{ width: 120 }}
                  value={unit.status}
                  disabled={busy}
                  onChange={(e) => patch(unit.id, { status: e.target.value })}
                >
                  <option value="available">available</option>
                  <option value="reserved">reserved</option>
                  <option value="sold">sold</option>
                  <option value="rented">rented</option>
                  <option value="inactive">inactive</option>
                </select>
                <button
                  className="btn btn-xs btn-outline"
                  disabled={busy}
                  title="Only published units appear on your page"
                  style={{ color: unit.active ? '#047857' : '#94a3b8', borderColor: unit.active ? '#047857' : '#cbd5e1' }}
                  onClick={() => patch(unit.id, { active: !unit.active })}
                >
                  {unit.active ? 'LIVE' : 'HIDDEN'}
                </button>
                <button
                  className="btn btn-xs btn-outline"
                  disabled={busy}
                  onClick={() =>
                    setEditing(
                      editing?.id === unit.id
                        ? null
                        : {
                            id: unit.id,
                            titleAr: unit.titleAr || '',
                            titleEn: unit.titleEn || '',
                            unitType: unit.unitType || '',
                            listingKind: unit.listingKind || 'rent_month',
                            bedrooms: unit.bedrooms == null ? '' : String(unit.bedrooms),
                            bathrooms: unit.bathrooms == null ? '' : String(unit.bathrooms),
                            areaSqm: unit.areaSqm == null ? '' : String(unit.areaSqm),
                            price: unit.price == null ? '' : String(unit.price),
                            deposit: unit.deposit == null ? '' : String(unit.deposit),
                            depositMonths: unit.depositMonths == null ? '' : String(unit.depositMonths),
                            minStayNights: unit.minStayNights == null ? '' : String(unit.minStayNights),
                            availableFrom: unit.availableFrom || '',
                            amenities: Array.isArray(unit.amenities) ? unit.amenities.join(', ') : '',
                            terms: termsOf(unit),
                          }
                    )
                  }
                >
                  <i className={`fas ${editing?.id === unit.id ? 'fa-xmark' : 'fa-pen'}`}></i>
                </button>
                <button
                  className="btn btn-xs btn-outline"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  disabled={busy}
                  onClick={() => remove(unit.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              {editing?.id === unit.id && (
                <div style={{ ...BOX, display: 'grid', gap: '0.6rem', background: '#f8fafc' }}>
                  <div style={GRID}>
                    <div>
                      <label style={LABEL}>TITLE (ARABIC) *</label>
                      <input
                        className="form-control"
                        dir="rtl"
                        value={editing.titleAr}
                        onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>TITLE (ENGLISH)</label>
                      <input
                        className="form-control"
                        value={editing.titleEn}
                        onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>TYPE</label>
                      <input
                        className="form-control"
                        value={editing.unitType}
                        onChange={(e) => setEditing({ ...editing, unitType: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>LISTING</label>
                      <select
                        className="form-control"
                        value={editing.listingKind}
                        onChange={(e) => setEditing({ ...editing, listingKind: e.target.value })}
                      >
                        <option value="rent_night">rent / night</option>
                        <option value="rent_month">rent / month</option>
                        <option value="sale">sale</option>
                      </select>
                    </div>
                    <div>
                      <label style={LABEL}>BEDROOMS</label>
                      <input
                        className="form-control"
                        value={editing.bedrooms}
                        onChange={(e) => setEditing({ ...editing, bedrooms: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>BATHROOMS</label>
                      <input
                        className="form-control"
                        value={editing.bathrooms}
                        onChange={(e) => setEditing({ ...editing, bathrooms: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>AREA (m²)</label>
                      <input
                        className="form-control"
                        value={editing.areaSqm}
                        onChange={(e) => setEditing({ ...editing, areaSqm: e.target.value.replace(/[^0-9.]/g, '') })}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>PRICE ({unit.currency})</label>
                      <input
                        className="form-control"
                        value={editing.price}
                        onChange={(e) => setEditing({ ...editing, price: e.target.value.replace(/[^0-9.]/g, '') })}
                      />
                    </div>
                    {editing.listingKind !== 'sale' && (
                      <>
                        <div>
                          <label style={LABEL}>DEPOSIT ({unit.currency})</label>
                          <input
                            className="form-control"
                            value={editing.deposit}
                            onChange={(e) => setEditing({ ...editing, deposit: e.target.value.replace(/[^0-9.]/g, '') })}
                          />
                        </div>
                        <div>
                          <label style={LABEL}>DEPOSIT (MONTHS)</label>
                          <input
                            className="form-control"
                            value={editing.depositMonths}
                            onChange={(e) => setEditing({ ...editing, depositMonths: e.target.value.replace(/[^0-9]/g, '') })}
                          />
                        </div>
                        <div>
                          <label style={LABEL}>MIN STAY (NIGHTS)</label>
                          <input
                            className="form-control"
                            value={editing.minStayNights}
                            onChange={(e) => setEditing({ ...editing, minStayNights: e.target.value.replace(/[^0-9]/g, '') })}
                          />
                        </div>
                        <div>
                          <label style={LABEL}>AVAILABLE FROM</label>
                          <input
                            className="form-control"
                            type="date"
                            value={editing.availableFrom}
                            onChange={(e) => setEditing({ ...editing, availableFrom: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={LABEL}>AMENITIES</label>
                      <input
                        className="form-control"
                        value={editing.amenities}
                        onChange={(e) => setEditing({ ...editing, amenities: e.target.value })}
                      />
                    </div>
                    <UnitTermsFields
                      kind={editing.listingKind}
                      currency={unit.currency}
                      value={editing.terms || EMPTY_UNIT_TERMS}
                      onChange={(p) =>
                        setEditing({ ...editing, terms: { ...(editing.terms || EMPTY_UNIT_TERMS), ...p } })
                      }
                      labelStyle={LABEL}
                    />
                  </div>
                  <div>
                    <button
                      className="btn btn-primary"
                      disabled={busy || !String(editing.titleAr).trim()}
                      onClick={async () => {
                        const saved = await patch(editing.id, {
                          titleAr: String(editing.titleAr).trim(),
                          titleEn: String(editing.titleEn).trim() || null,
                          unitType: String(editing.unitType).trim() || null,
                          listingKind: editing.listingKind,
                          bedrooms: editing.bedrooms === '' ? null : editing.bedrooms,
                          bathrooms: editing.bathrooms === '' ? null : editing.bathrooms,
                          areaSqm: editing.areaSqm === '' ? null : editing.areaSqm,
                          price: editing.price === '' ? null : editing.price,
                          deposit: editing.deposit === '' ? null : editing.deposit,
                          depositMonths: editing.depositMonths === '' ? null : editing.depositMonths,
                          minStayNights: editing.minStayNights === '' ? null : editing.minStayNights,
                          availableFrom: editing.availableFrom || null,
                          amenities: String(editing.amenities || '').trim() || null,
                          ...termsPayload(editing.terms || EMPTY_UNIT_TERMS),
                        });
                        if (saved) setEditing(null);
                      }}
                    >
                      {busy ? 'SAVING…' : 'SAVE UNIT'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
