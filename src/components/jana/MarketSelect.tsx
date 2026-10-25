'use client';

import React, { useState } from 'react';
import { useMarkets } from '@/lib/use-markets';

/**
 * The market picker for admin forms. The options are the registry itself —
 * live and dark — so a market that was created five seconds ago can be chosen
 * immediately instead of after a launch.
 *
 * The last option creates a market without leaving the form: name, Arabic
 * name, slug and the governorate it sits in. The row is created dark, which is
 * the whole point — file its shops, restaurants and clubs first, publish it
 * from /jana/markets when it has supply.
 */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const HINT: React.CSSProperties = { fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.25rem' };

export default function MarketSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  const { markets, governorates, loading, error, reload } = useMarkets();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ nameEn: '', nameAr: '', slug: '', governorateId: '' });
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const known = markets.some((market) => market.slug === value);

  async function create() {
    setBusy(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/jana/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: draft.slug || slugify(draft.nameEn),
          nameEn: draft.nameEn,
          nameAr: draft.nameAr,
          governorateId: draft.governorateId,
          active: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the market');
      await reload();
      onChange(String(data.slug || draft.slug || slugify(draft.nameEn)));
      setCreating(false);
      setDraft({ nameEn: '', nameAr: '', slug: '', governorateId: '' });
    } catch (e: any) {
      setCreateError(e?.message || 'Could not create the market');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <select
        className="form-control"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === '__new__') {
            setCreating(true);
            setCreateError(null);
            return;
          }
          onChange(e.target.value);
        }}
      >
        <option value="">
          {loading ? 'Loading markets…' : error ? error : '— pick a market —'}
        </option>
        {value && !known && <option value={value}>{value} (not in the registry)</option>}
        {markets.map((market) => (
          <option key={market.slug} value={market.slug}>
            {market.nameEn} · {market.nameAr} — {market.active ? 'live' : 'dark'} ·{' '}
            {market.listings} listing{market.listings === 1 ? '' : 's'}
          </option>
        ))}
        <option value="__new__">＋ ADD NEW MARKET…</option>
      </select>

      <div style={HINT}>
        {value && !known
          ? 'This market is not in the registry yet — recreate it below or pick a live one.'
          : 'Live and dark markets are both listed. A new market is created dark.'}
      </div>

      {creating && (
        <div
          style={{
            border: '1px dashed #D4AF37',
            borderRadius: '8px',
            padding: '0.6rem',
            marginTop: '0.4rem',
            background: '#fffbeb',
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e', marginBottom: '0.3rem' }}>
            NEW MARKET (DARK UNTIL YOU PUBLISH IT)
          </div>
          <input
            className="form-control"
            placeholder="English name (Aswan)"
            value={draft.nameEn}
            onChange={(e) => {
              const nameEn = e.target.value;
              setDraft({ ...draft, nameEn, slug: draft.slug || slugify(nameEn) });
            }}
          />
          <input
            className="form-control"
            placeholder="Arabic name (أسوان)"
            style={{ marginTop: '0.3rem' }}
            value={draft.nameAr}
            onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
          />
          <input
            className="form-control"
            placeholder="slug (aswan)"
            style={{ marginTop: '0.3rem' }}
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
          />
          <select
            className="form-control"
            style={{ marginTop: '0.3rem' }}
            value={draft.governorateId}
            onChange={(e) => setDraft({ ...draft, governorateId: e.target.value })}
          >
            <option value="">— governorate (country: Egypt) —</option>
            {governorates.map((governorate) => (
              <option key={governorate.id} value={governorate.id}>
                {governorate.nameEn} · {governorate.nameAr}
              </option>
            ))}
          </select>
          {draft.governorateId && draft.slug && (
            <div style={HINT}>
              New place: {governorates.find((g) => g.id === draft.governorateId)?.path}/{draft.slug}
            </div>
          )}
          {createError && (
            <div style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.25rem' }}>{createError}</div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
            <button
              className="btn btn-xs btn-primary"
              style={{ flex: 1 }}
              disabled={busy || !draft.nameEn || !draft.nameAr || !draft.governorateId}
              onClick={create}
            >
              <i className="fas fa-plus"></i> {busy ? 'CREATING…' : 'CREATE MARKET'}
            </button>
            <button
              className="btn btn-xs btn-outline"
              disabled={busy}
              onClick={() => {
                setCreating(false);
                setCreateError(null);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
