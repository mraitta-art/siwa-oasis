'use client';

import React from 'react';
import { UNIT_FINISHING_OPTIONS } from '@/lib/unit-terms';

/**
 * The buyer-side numbers of a unit: price per m², the payment plan, the handover
 * year, the finishing and whether it comes furnished.
 *
 * The admin inventory panel and the vendor's own inventory screen render this one
 * component rather than two copies of the same inputs, because these fields are
 * already stored in the same columns and a vendor left out of one of them would
 * simply retype them badly.
 */

export interface UnitTerms {
  pricePerSqm: string;
  downPaymentPct: string;
  installmentYears: string;
  deliveryYear: string;
  finishing: string;
  /** `''` means the vendor never said, which is not the same as "no". */
  furnished: string;
}

export const EMPTY_UNIT_TERMS: UnitTerms = {
  pricePerSqm: '',
  downPaymentPct: '',
  installmentYears: '',
  deliveryYear: '',
  finishing: '',
  furnished: '',
};

function text(value: any): string {
  return value === null || value === undefined ? '' : String(value);
}

/** From a saved unit (camelCase) or a draft back to the form shape. */
export function termsOf(source: any): UnitTerms {
  if (!source) return { ...EMPTY_UNIT_TERMS };
  return {
    pricePerSqm: text(source.pricePerSqm ?? source.price_per_sqm),
    downPaymentPct: text(source.downPaymentPct ?? source.down_payment_pct),
    installmentYears: text(source.installmentYears ?? source.installment_years),
    deliveryYear: text(source.deliveryYear ?? source.delivery_year),
    finishing: text(source.finishing),
    furnished:
      source.furnished === null || source.furnished === undefined
        ? ''
        : Number(source.furnished) === 0
          ? '0'
          : '1',
  };
}

/** An empty box is a null column, never a 0 the page would print as free. */
export function termsPayload(terms: UnitTerms): Record<string, any> {
  const number = (value: string) => (String(value ?? '').trim() === '' ? null : value);
  return {
    pricePerSqm: number(terms.pricePerSqm),
    downPaymentPct: number(terms.downPaymentPct),
    installmentYears: number(terms.installmentYears),
    deliveryYear: number(terms.deliveryYear),
    finishing: String(terms.finishing ?? '').trim() || null,
    furnished:
      String(terms.furnished ?? '') === '' ? null : String(terms.furnished) === '1' ? 1 : 0,
  };
}

const DEFAULT_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6rem',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.02em',
  marginBottom: '0.2rem',
};

export default function UnitTermsFields({
  kind,
  currency,
  value,
  onChange,
  labelStyle = DEFAULT_LABEL,
}: {
  kind: string;
  currency: string;
  value: UnitTerms;
  onChange: (patch: Partial<UnitTerms>) => void;
  labelStyle?: React.CSSProperties;
}) {
  const digits = (onlyIntegers: boolean) => (raw: string) =>
    raw.replace(onlyIntegers ? /[^0-9]/g : /[^0-9.]/g, '');

  const selling = kind === 'sale';

  return (
    <>
      <div>
        <label style={labelStyle}>PRICE PER m² ({currency})</label>
        <input
          className="form-control"
          value={value.pricePerSqm}
          placeholder="45000"
          onChange={(e) => onChange({ pricePerSqm: digits(false)(e.target.value) })}
        />
      </div>

      {selling && (
        <>
          <div>
            <label style={labelStyle}>DOWN PAYMENT (%)</label>
            <input
              className="form-control"
              value={value.downPaymentPct}
              placeholder="10"
              onChange={(e) => onChange({ downPaymentPct: digits(false)(e.target.value) })}
            />
          </div>
          <div>
            <label style={labelStyle}>INSTALLMENTS (YEARS)</label>
            <input
              className="form-control"
              value={value.installmentYears}
              placeholder="6"
              onChange={(e) => onChange({ installmentYears: digits(true)(e.target.value) })}
            />
          </div>
          <div>
            <label style={labelStyle}>HANDOVER YEAR</label>
            <input
              className="form-control"
              value={value.deliveryYear}
              placeholder="2028"
              onChange={(e) => onChange({ deliveryYear: digits(true)(e.target.value) })}
            />
          </div>
        </>
      )}

      <div>
        <label style={labelStyle}>FINISHING</label>
        <select
          className="form-control"
          value={value.finishing}
          onChange={(e) => onChange({ finishing: e.target.value })}
        >
          <option value="">— not stated</option>
          {UNIT_FINISHING_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.en} — {option.ar}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>FURNISHED</label>
        <select
          className="form-control"
          value={value.furnished}
          onChange={(e) => onChange({ furnished: e.target.value })}
        >
          <option value="">— not stated</option>
          <option value="1">furnished</option>
          <option value="0">unfurnished</option>
        </select>
      </div>
    </>
  );
}
