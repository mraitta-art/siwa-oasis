import Link from 'next/link';
import type { UnitComparison } from '@/lib/unit-compare';
import { UNIT_COMPARE_LABELS, MIXED_KIND_NOTICE } from '@/lib/unit-compare';
import type { ListingKind } from '@/lib/listing-kind';
import { LISTING_KIND_SPEC } from '@/lib/listing-kind';

/**
 * Header link resolver.
 *
 * A unit page does not exist yet — the compound page renders its units inline
 * through `UnitsBoard`. When a per-unit route ships, `unitHrefFor()` becomes
 * the one place that knows its shape and the column header starts linking
 * without touching this file's rendering logic. Returning `null` is what tells
 * the header to print plain text instead of a dead link.
 */
function unitHrefFor(_u: UnitComparison): string | null {
  return null;
}

/**
 * Side-by-side unit table. One column per unit, one row per comparison axis.
 *
 * A best-value row is marked with a ★ so a visitor scanning four apartments
 * sees, instantly, which is cheapest per m², which has the longest term, which
 * hands over first. The marks are precomputed by `unit-compare.ts`; this
 * component only draws them.
 *
 * Row visibility depends on the shortlist:
 *   - Homogeneous sale set: plan rows (down, term, monthly, delivery) show.
 *   - Homogeneous rent_month: deposit and available-from show; plan rows hide.
 *   - Homogeneous rent_night: min-stay and available-from show; deposit shows.
 *   - Mixed: every row shows, and a kind that does not carry a value prints
 *     "—" rather than lying with a zero. A bilingual notice above the table
 *     explains that a sale-plan monthly obligation and a 30-night projection
 *     are not the same contract.
 */

type Row = {
  label: string;
  render: (u: UnitComparison) => { text: string; best?: boolean; sub?: string };
  /** Empty array or undefined = always show. Non-empty = show only when at
   *  least one unit in the shortlist matches one of these kinds. */
  when?: ListingKind[];
};

function money(value: number, ar: boolean, currency: string): string {
  return new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function priceLabelFor(kind: ListingKind, ar: boolean): string {
  if (kind === 'rent_month') return ar ? 'شهرياً' : 'per month';
  if (kind === 'rent_night') return ar ? 'لليلة' : 'per night';
  return ar ? 'إجمالي' : 'total';
}

export default function UnitComparisonTable({
  units,
  ar = false,
  mixedKind = false,
  commonKind = null,
}: {
  units: UnitComparison[];
  ar?: boolean;
  mixedKind?: boolean;
  commonKind?: ListingKind | null;
}) {
  const t = UNIT_COMPARE_LABELS[ar ? 'ar' : 'en'];

  // Which rows are visible depends on the set of kinds actually present. A
  // single-unit compare still shows every relevant row, because the visitor
  // wants the full record — a mixed shortlist is where the per-kind filters
  // earn their keep.
  const presentKinds = new Set<ListingKind>(units.map((u) => u.listingKind));
  const isVisible = (when?: ListingKind[]) => {
    if (!when || when.length === 0) return true;
    for (const k of when) if (presentKinds.has(k)) return true;
    return false;
  };

  const rows: Row[] = [
    {
      label: ar ? 'نوع العرض' : 'Listing kind',
      render: (u) => {
        const spec = LISTING_KIND_SPEC[u.listingKind];
        return { text: spec ? (ar ? spec.badge.ar : spec.badge.en) : u.listingKind };
      },
    },
    {
      label: ar ? 'المشروع' : 'Compound',
      render: (u) => ({ text: u.unitType || t.unknown }),
    },
    {
      label: t.unitType,
      render: (u) => ({ text: u.unitType || t.none }),
    },
    {
      label: t.price,
      render: (u) => {
        const p = u.price === null || u.price === undefined ? null : Number(u.price);
        if (p === null || !Number.isFinite(p)) return { text: t.none };
        return {
          text: `${money(p, ar, u.currency || 'EGP')} · ${priceLabelFor(u.listingKind, ar)}`,
          best: u.bestPrice,
        };
      },
    },
    {
      label: t.ppsqm,
      render: (u) => ({
        text: u.effectivePricePerSqm !== null ? `${money(Math.round(u.effectivePricePerSqm), ar, u.currency || 'EGP')}/${t.sqmUnit}` : t.none,
        best: u.bestPricePerSqm,
      }),
      when: ['sale', 'rent_month'],
    },
    {
      label: t.area,
      render: (u) => ({
        text: u.areaSqm !== null && u.areaSqm > 0 ? `${u.areaSqm} ${t.sqmUnit}` : t.none,
        best: u.biggestArea,
      }),
    },
    {
      label: t.bedrooms,
      render: (u) => ({
        text: u.bedrooms === null ? t.none : String(u.bedrooms),
        best: u.mostBedrooms,
      }),
    },
    {
      label: t.bathrooms,
      render: (u) => ({ text: u.bathrooms === null ? t.none : String(u.bathrooms) }),
    },
    {
      label: t.finishing,
      render: (u) => ({ text: u.finishing || t.none }),
      when: ['sale', 'rent_month'],
    },
    {
      label: t.furnished,
      render: (u) => ({ text: u.furnished === null ? t.unknown : u.furnished ? t.yesLabel : t.noLabel }),
      when: ['rent_month', 'rent_night'],
    },
    {
      label: t.delivery,
      render: (u) => ({ text: u.deliveryYear ? String(u.deliveryYear) : t.none, best: u.earliestHandover }),
      when: ['sale'],
    },
    {
      label: t.down,
      render: (u) => ({
        text: u.downPaymentPct !== null && u.downPaymentPct !== undefined ? `${u.downPaymentPct}%` : t.none,
        best: u.lowestDown,
      }),
      when: ['sale'],
    },
    {
      label: t.term,
      render: (u) => ({
        text: u.installmentYears ? `${u.installmentYears} ${t.yearUnit}` : t.none,
        best: u.longestTerm,
      }),
      when: ['sale'],
    },
    {
      label: mixedKind ? t.monthlyApprox : t.monthly,
      render: (u) => {
        // A sale unit's monthly is the real obligation from the plan.
        if (u.monthlyCost !== null) {
          const value = Math.round(u.monthlyCost);
          return {
            text: `${money(value, ar, u.currency || 'EGP')} · ${ar ? 'شهرى' : 'monthly'}`,
            best: u.cheapestMonthly,
            sub: u.listingKind === 'sale' ? (ar ? 'من خطة السداد' : 'from plan') : (ar ? 'إيجار شهرى' : 'rented monthly'),
          };
        }
        // A nightly row only ever carries the 30-night projection, and it is
        // labelled as such so it is never mistaken for a real month rent.
        if (u.nightlyToMonthlyEquivalent !== null) {
          const value = Math.round(u.nightlyToMonthlyEquivalent);
          return {
            text: `${money(value, ar, u.currency || 'EGP')} · ${ar ? 'تقديرى' : 'est.'}`,
            best: u.cheapestMonthly,
            sub: ar ? 'سعر الليلة × ٣٠' : 'nightly × 30',
          };
        }
        return { text: t.none };
      },
    },
    {
      label: t.deposit,
      render: (u) => ({
        text: u.deposit !== null ? money(Math.round(u.deposit), ar, u.currency || 'EGP') : t.none,
      }),
      when: ['rent_month', 'rent_night'],
    },
    {
      label: ar ? 'شهور التأمين' : 'Deposit months',
      render: (u) => ({ text: u.depositMonths !== null ? String(u.depositMonths) : t.none }),
      when: ['rent_month'],
    },
    {
      label: t.minStay,
      render: (u) => ({ text: u.minStayNights !== null ? `${u.minStayNights} ${ar ? 'ليلة' : 'nights'}` : t.none }),
      when: ['rent_night'],
    },
    {
      label: t.availableFrom,
      render: (u) => ({ text: u.availableFrom || t.none }),
      when: ['rent_month', 'rent_night'],
    },
    {
      label: t.amenities,
      render: (u) => ({
        text: u.amenities.length ? u.amenities.join(' · ') : t.none,
        best: u.mostAmenities,
      }),
    },
    {
      label: t.status,
      render: (u) => ({ text: u.status || t.none }),
    },
  ];

  const visibleRows = rows.filter((r) => isVisible(r.when));
  const notice = mixedKind ? MIXED_KIND_NOTICE[ar ? 'ar' : 'en'] : null;

  return (
    <div dir={ar ? 'rtl' : 'ltr'}>
      {notice && (
        <div
          style={{
            border: '1px solid #FDE68A',
            background: '#FEF3C7',
            color: '#78350F',
            padding: '0.85rem 1rem',
            borderRadius: 12,
            fontSize: '0.82rem',
            lineHeight: 1.6,
            marginBottom: '0.85rem',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 900 }}>{notice.title}</strong>
          {notice.body}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: ar ? 'right' : 'left',
                  padding: '0.9rem 1rem',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  minWidth: 140,
                }}
              />
              {units.map((u) => {
                const name = ar ? u.titleAr || u.titleEn || u.slug : u.titleEn || u.titleAr || u.slug;
                const spec = LISTING_KIND_SPEC[u.listingKind];
                const badge = spec ? (ar ? spec.badge.ar : spec.badge.en) : u.listingKind;
                const accent = spec ? spec.accent : '#94A3B8';
                return (
                  <th
                    key={u.id}
                    style={{
                      textAlign: ar ? 'right' : 'left',
                      padding: '0.9rem 1rem',
                      background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      verticalAlign: 'top',
                      minWidth: 180,
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.35rem' }}>{name}</div>
                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 999,
                        background: `${accent}22`,
                        color: accent,
                        marginBottom: '0.35rem',
                      }}
                    >
                      {badge}
                    </div>
                    <div>
                      {(() => {
                        const href = unitHrefFor(u);
                        if (!href) {
                          return (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>
                              {u.slug}
                            </span>
                          );
                        }
                        return (
                          <Link
                            href={href}
                            style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F4C81', textDecoration: 'none' }}
                          >
                            {t.viewUnit} →
                          </Link>
                        );
                      })()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={row.label} style={{ background: rowIndex % 2 ? '#FCFDFE' : '#FFFFFF' }}>
                <th
                  scope="row"
                  style={{
                    textAlign: ar ? 'right' : 'left',
                    padding: '0.7rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  {row.label}
                </th>
                {units.map((u) => {
                  const cell = row.render(u);
                  return (
                    <td
                      key={u.id}
                      style={{
                        padding: '0.7rem 1rem',
                        fontSize: '0.85rem',
                        color: '#0F172A',
                        borderBottom: '1px solid #F1F5F9',
                        verticalAlign: 'top',
                      }}
                    >
                      {cell.text}
                      {cell.best && cell.text !== t.none ? (
                        <span title={t.best} style={{ marginInlineStart: '0.4rem', color: '#0F4C81', fontWeight: 900 }}>★</span>
                      ) : null}
                      {cell.sub ? (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8' }}>{cell.sub}</div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {commonKind && (
        <div style={{ marginTop: '0.65rem', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
          {ar ? 'كل الوحدات المختارة من نفس نوع العرض، لذا المقارنة مباشرة.' : 'All selected units share the same listing kind, so the comparison is apples-to-apples.'}
        </div>
      )}
    </div>
  );
}
