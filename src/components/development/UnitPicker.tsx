'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * Unit picker above the comparison table.
 *
 * Sibling of `ProjectPicker`. Same URL-as-state shape (ticking boxes rewrites
 * `?ids=…` so the shortlist is shareable and back-button friendly), but with
 * two extras the units surface needs and projects does not:
 *   - `?kind=` narrows the catalog to one listing kind, because lining a
 *     nightly stay against a 20-year sale plan is not a comparison.
 *   - Group names are compound titles rather than market slugs — the reader
 *     scanning "702 · Garden Lakes · 2 BR" needs the compound, not the country.
 *
 * Selection is capped at `max` (default 4) — past four columns a comparison
 * stops being one. Any unit beyond the cap is a search problem.
 */

export interface UnitPickerItem {
  id: string;
  /** Display title in the active locale. */
  name: string;
  /** Compound or business the unit lives in, shown as a muted suffix. */
  groupName: string;
  /** Free-form unit type badge: "Apartment", "Villa", "Studio", "Chalet". */
  unitType?: string | null;
  /** Listing kind for the badge color + row filter. */
  kind: 'sale' | 'rent_month' | 'rent_night';
  /** Locale-normalized kind badge text (already translated upstream). */
  kindBadge: string;
  /** Accent from LISTING_KIND_SPEC — teal for month, coral for night, gold for sale. */
  kindAccent: string;
}

const L = {
  ar: {
    title: 'اختر الوحدات للمقارنة',
    search: 'ابحث باسم الوحدة أو المشروع…',
    full: (max: number) => `يمكن مقارنة ${max} كحد أقصى`,
    clear: 'مسح الكل',
    kindAll: 'كل الأنواع',
    kind: { sale: 'للبيع', rent_month: 'إيجار شهرى', rent_night: 'إقامة قصيرة' } as Record<string, string>,
  },
  en: {
    title: 'Choose units to compare',
    search: 'Search by unit or project…',
    full: (max: number) => `Up to ${max} at a time`,
    clear: 'Clear all',
    kindAll: 'All kinds',
    kind: { sale: 'For sale', rent_month: 'Monthly', rent_night: 'Short stay' } as Record<string, string>,
  },
};

const box: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.55rem',
  padding: '0.45rem 0.6rem',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#0F172A',
  cursor: 'pointer',
  background: '#FFFFFF',
};

export default function UnitPicker({
  catalog,
  selected,
  ar = false,
  max = 4,
  activeKind,
}: {
  catalog: UnitPickerItem[];
  selected: string[];
  ar?: boolean;
  max?: number;
  /** Pre-selected `?kind=` filter, if the URL carries one. Undefined means "all". */
  activeKind?: 'sale' | 'rent_month' | 'rent_night' | null;
}) {
  const t = L[ar ? 'ar' : 'en'];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [chosen, setChosen] = useState<string[]>(selected.slice(0, max));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'sale' | 'rent_month' | 'rent_night' | null>(activeKind ?? null);

  const pushUrl = (ids: string[], nextKind: 'sale' | 'rent_month' | 'rent_night' | null) => {
    const sp = new URLSearchParams(params?.toString() ?? '');
    if (ids.length) sp.set('ids', ids.join(','));
    else sp.delete('ids');
    if (nextKind) sp.set('kind', nextKind);
    else sp.delete('kind');
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggle = (id: string) => {
    setChosen((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= max ? prev : [...prev, id];
      pushUrl(next, kind);
      return next;
    });
  };

  const changeKind = (next: 'sale' | 'rent_month' | 'rent_night' | null) => {
    setKind(next);
    // A kind change narrows the catalog; drop any chosen unit that no longer
    // appears. Otherwise the URL keeps ids the reader can no longer see and
    // the table renders rows the picker did not offer.
    const stillVisible = chosen.filter((id) => !next || catalog.find((u) => u.id === id)?.kind === next);
    setChosen(stillVisible);
    pushUrl(stillVisible, next);
  };

  const clear = () => {
    setChosen([]);
    pushUrl([], kind);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q)
        || item.groupName.toLowerCase().includes(q)
        || (item.unitType || '').toLowerCase().includes(q)
      );
    });
  }, [catalog, query, kind]);

  const kindChips: Array<{ value: 'sale' | 'rent_month' | 'rent_night' | null; label: string; accent?: string }> = [
    { value: null, label: t.kindAll },
    { value: 'sale', label: t.kind.sale, accent: '#D4AF37' },
    { value: 'rent_month', label: t.kind.rent_month, accent: '#2DD4BF' },
    { value: 'rent_night', label: t.kind.rent_night, accent: '#F97373' },
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ border: '1px solid #E2E8F0', borderRadius: 16, padding: '1rem', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F172A' }}>{t.title}</strong>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: chosen.length >= max ? '#B45309' : '#94A3B8' }}>
          {chosen.length}/{max} · {t.full(max)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        {kindChips.map((chip) => {
          const on = chip.value === kind;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => changeKind(chip.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 999,
                border: `1px solid ${on ? chip.accent || '#0F4C81' : '#E2E8F0'}`,
                background: on ? (chip.accent ? `${chip.accent}22` : '#E8F1F8') : '#FFFFFF',
                color: on ? (chip.accent || '#0F4C81') : '#475569',
                fontSize: '0.72rem',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: '0.85rem', marginBottom: '0.7rem', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
        {filtered.map((item) => {
          const on = chosen.includes(item.id);
          return (
            <label
              key={item.id}
              style={{
                ...box,
                background: on ? '#E8F1F8' : '#FFFFFF',
                borderColor: on ? '#0F4C81' : '#E2E8F0',
              }}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(item.id)}
                disabled={!on && chosen.length >= max}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {item.name}
                {item.groupName ? <span style={{ color: '#94A3B8', fontWeight: 700 }}> · {item.groupName}</span> : null}
                {item.unitType ? <span style={{ color: '#CBD5E1', fontWeight: 700 }}> · {item.unitType}</span> : null}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 999,
                  background: `${item.kindAccent}22`,
                  color: item.kindAccent,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.kindBadge}
              </span>
            </label>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <button
          onClick={clear}
          style={{ marginTop: '0.7rem', fontSize: '0.75rem', fontWeight: 800, color: '#0F4C81', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.clear}
        </button>
      )}
    </div>
  );
}
