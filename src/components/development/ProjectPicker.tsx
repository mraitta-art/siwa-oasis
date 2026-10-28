'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * The project picker above the comparison table.
 *
 * Selection is a URL, not server state: ticking boxes rewrites `?ids=…` so the
 * page is shareable, bookmarkable and back-button friendly, and the server
 * component re-renders the table from those ids. Capped at `max` (default 4) —
 * past four columns a comparison stops being a comparison.
 */

export interface PickerItem {
  id: string;
  name: string;
  groupName: string;
}

const L = {
  ar: {
    title: 'اختر المشروعات للمقارنة',
    search: 'ابحث…',
    full: (max: number) => `يمكن مقارنة ${max} كحد أقصى`,
    clear: 'مسح الكل',
    count: 'المحدد',
  },
  en: {
    title: 'Choose projects to compare',
    search: 'Search…',
    full: (max: number) => `Up to ${max} at a time`,
    clear: 'Clear all',
    count: 'selected',
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
};

export default function ProjectPicker({
  catalog,
  selected,
  basePath,
  title,
  ar = false,
  max = 4,
}: {
  catalog: PickerItem[];
  selected: string[];
  /** Base path to rewrite `?ids=` onto; defaults to the live pathname so the
   *  `/ar` locale prefix (added by middleware) is preserved untouched. */
  basePath?: string;
  /** Heading override, so the same picker reads correctly above a market table. */
  title?: string;
  ar?: boolean;
  max?: number;
}) {
  const t = L[ar ? 'ar' : 'en'];
  const router = useRouter();
  const pathname = usePathname();
  const base = basePath ?? pathname;
  const [chosen, setChosen] = useState<string[]>(selected.slice(0, max));
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((item) => item.name.toLowerCase().includes(q) || item.groupName.toLowerCase().includes(q));
  }, [catalog, query]);

  const toggle = (id: string) => {
    setChosen((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= max ? prev : [...prev, id];
      router.replace(next.length ? `${base}?ids=${next.join(',')}` : base, { scroll: false });
      return next;
    });
  };

  const clear = () => {
    setChosen([]);
    router.replace(base, { scroll: false });
  };

  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ border: '1px solid #E2E8F0', borderRadius: 16, padding: '1rem', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
        <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F172A' }}>{title ?? t.title}</strong>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: chosen.length >= max ? '#B45309' : '#94A3B8' }}>
          {chosen.length}/{max} · {t.full(max)}
        </span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: '0.85rem', marginBottom: '0.7rem', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map((item) => {
          const on = chosen.includes(item.id);
          return (
            <label key={item.id} style={{ ...box, background: on ? '#E8F1F8' : '#FFFFFF', borderColor: on ? '#0F4C81' : '#E2E8F0' }}>
              <input type="checkbox" checked={on} onChange={() => toggle(item.id)} disabled={!on && chosen.length >= max} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
                {item.groupName ? <span style={{ color: '#94A3B8', fontWeight: 700 }}> · {item.groupName}</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <button onClick={clear} style={{ marginTop: '0.7rem', fontSize: '0.75rem', fontWeight: 800, color: '#0F4C81', background: 'none', border: 'none', cursor: 'pointer' }}>
          {t.clear}
        </button>
      )}
    </div>
  );
}
