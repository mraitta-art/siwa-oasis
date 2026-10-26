'use client';

import React, { useMemo, useState } from 'react';
import type { UnitSummary } from '@/lib/developments';

/**
 * The inventory of one container, with the two questions a visitor actually
 * asks first: is it for rent or for sale, and how many bedrooms.
 *
 * The filters live here and not in the page because the page is a server
 * component: a URL per combination would be 4 kinds × 5 bedroom counts × 2
 * orders of links, and every one of them would be a page nobody indexes. The
 * data is already on the client, so the chips are just a filter over it.
 */

const TEXT = {
  en: {
    all: 'All',
    rent_night: 'Per night',
    rent_month: 'Per month',
    sale: 'For sale',
    any: 'Any rooms',
    rooms: 'rooms',
    deposit: 'Deposit',
    months: 'months',
    minStay: 'Min stay',
    nights: 'nights',
    availableFrom: 'Available from',
    perNight: '/ night',
    perMonth: '/ month',
    priceAsc: 'Price ↑',
    priceDesc: 'Price ↓',
    showing: 'units',
    empty: 'No units match these filters yet.',
    amenities: 'Amenities',
  },
  ar: {
    all: 'الكل',
    rent_night: 'إيجار ليلي',
    rent_month: 'إيجار شهري',
    sale: 'للبيع',
    any: 'كل الغرف',
    rooms: 'غرف',
    deposit: 'تأمين',
    months: 'شهور',
    minStay: 'أقل مدة',
    nights: 'ليالٍ',
    availableFrom: 'متاح من',
    perNight: '/ الليلة',
    perMonth: '/ الشهر',
    priceAsc: 'السعر ↑',
    priceDesc: 'السعر ↓',
    showing: 'وحدة',
    empty: 'لا توجد وحدات مطابقة لهذه الاختيارات بعد.',
    amenities: 'المرافق',
  },
};

const KINDS: Array<UnitSummary['listingKind']> = ['rent_night', 'rent_month', 'sale'];

function money(value: number, currency: string): string {
  return `${value.toLocaleString('en-US')} ${currency}`;
}

export default function UnitsBoard({ units, ar }: { units: UnitSummary[]; ar: boolean }) {
  const t = TEXT[ar ? 'ar' : 'en'];
  const [kind, setKind] = useState<'all' | UnitSummary['listingKind']>('all');
  const [beds, setBeds] = useState(0);
  const [descending, setDescending] = useState(false);

  // Only offer a filter the data can answer: an empty chip is a dead button.
  const kinds = useMemo(() => KINDS.filter((entry) => units.some((unit) => unit.listingKind === entry)), [units]);
  const bedsOptions = useMemo(() => {
    const counts = units.map((unit) => unit.bedrooms || 0).filter((count) => count > 0);
    if (counts.length === 0) return [];
    const max = Math.min(Math.max(...counts), 5);
    return Array.from({ length: max }, (_, index) => index + 1);
  }, [units]);

  const visible = useMemo(() => {
    const filtered = units.filter(
      (unit) => (kind === 'all' || unit.listingKind === kind) && (beds === 0 || (unit.bedrooms || 0) >= beds)
    );
    return filtered.sort((a, b) => {
      // A unit without a price goes last in both directions: it is not cheap,
      // it is unquoted.
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return descending ? b.price - a.price : a.price - b.price;
    });
  }, [units, kind, beds, descending]);

  const chip = (active: boolean) =>
    ({
      padding: '0.35rem 0.8rem',
      borderRadius: 999,
      fontSize: '0.75rem',
      fontWeight: 800,
      cursor: 'pointer',
      border: `1px solid ${active ? '#0F172A' : '#E2E8F0'}`,
      background: active ? '#0F172A' : '#FFFFFF',
      color: active ? '#FFFFFF' : '#475569',
      fontFamily: 'inherit',
    }) as React.CSSProperties;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <button type="button" style={chip(kind === 'all')} onClick={() => setKind('all')}>
          {t.all}
        </button>
        {kinds.map((entry) => (
          <button key={entry} type="button" style={chip(kind === entry)} onClick={() => setKind(entry)}>
            {t[entry]}
          </button>
        ))}
        {bedsOptions.length > 0 && <span style={{ width: 1, background: '#E2E8F0', margin: '0 0.2rem' }} />}
        {bedsOptions.length > 0 && (
          <button type="button" style={chip(beds === 0)} onClick={() => setBeds(0)}>
            {t.any}
          </button>
        )}
        {bedsOptions.map((count) => (
          <button key={count} type="button" style={chip(beds === count)} onClick={() => setBeds(count)}>
            {`${count}+ ${t.rooms}`}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" style={chip(false)} onClick={() => setDescending((value) => !value)}>
          {descending ? t.priceDesc : t.priceAsc}
        </button>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.6rem', fontWeight: 700 }}>
        {visible.length} {t.showing}
      </div>

      {visible.length === 0 ? (
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{t.empty}</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {visible.map((unit) => {
            const period =
              unit.listingKind === 'rent_night' ? t.perNight : unit.listingKind === 'rent_month' ? t.perMonth : '';
            const facts = [
              unit.unitType,
              unit.bedrooms ? `${unit.bedrooms} ${t.rooms}` : null,
              unit.areaSqm ? `${unit.areaSqm} m²` : null,
            ].filter(Boolean) as string[];

            return (
              <div
                key={unit.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  display: 'grid',
                  gap: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800 }}>{ar ? unit.titleAr : unit.titleEn || unit.titleAr}</span>
                  <span style={{ fontWeight: 900, color: '#0F4C81', whiteSpace: 'nowrap' }}>
                    {unit.price === null ? '—' : money(unit.price, unit.currency)}
                    {period && <span style={{ fontWeight: 700, color: '#94A3B8' }}> {period}</span>}
                  </span>
                </div>

                {facts.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{facts.join(' · ')}</div>
                )}

                {(unit.deposit !== null || unit.minStayNights !== null || unit.availableFrom) && (
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
                    {unit.deposit !== null && (
                      <span>
                        {t.deposit} {money(unit.deposit, unit.currency)}
                      </span>
                    )}
                    {unit.depositMonths !== null && (
                      <span>
                        {unit.depositMonths} {t.months}
                      </span>
                    )}
                    {unit.minStayNights !== null && (
                      <span>
                        {t.minStay} {unit.minStayNights} {t.nights}
                      </span>
                    )}
                    {unit.availableFrom && (
                      <span>
                        {t.availableFrom} {unit.availableFrom}
                      </span>
                    )}
                  </div>
                )}

                {unit.amenities.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                    {unit.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#475569',
                          background: '#F1F5F9',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 999,
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
