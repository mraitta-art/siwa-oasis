/**
 * The comparable-offer layer: deciding what a price may honestly be compared to.
 *
 * `units` answers "what is this unit listed at". A comparison table needs a
 * different question — "is this figure about the same product?" — and lining a
 * 2-bedroom semi-finished apartment beside a 3-bedroom finished villa is the
 * failure mode that makes the rest of the table meaningless. `unit_offers` and
 * `price_snapshots` hold that answer; this file is the pure reading of it, with
 * no database and no React, so the server engine, the browser and `node --test`
 * all reason about offers the same way.
 *
 * Two rules hold throughout:
 * - An unpublished row is invisible here unless the caller *asks* for it. The
 *   public path filters `published = 1` in SQL; this is the second lock, so a
 *   future caller cannot leak a figure an admin never approved.
 * - Absence is never a number. A band with no area limits returns null rather
 *   than 0, and an offer with no captured price is not comparable at all.
 */

/** One capture of one source's figure. Append-only in the database. */
export interface OfferSnapshot {
  id: string;
  offerId: string;
  /** EGP per built m². `ppmMid` is the figure we print; min/max are the band. */
  ppmMin: number | null;
  ppmMid: number | null;
  ppmMax: number | null;
  currency: string;
  /** DEVELOPER_PRICE_LIST | PORTAL_LISTING | NEWS, or a word a source used. */
  sourceType: string;
  sourceUrl: string;
  note: string | null;
  /** When the figure was read, which is not when the row was written. */
  capturedAt: string;
  published: boolean;
}

/** One (project × unit type × finishing) band. */
export interface UnitOffer {
  id: string;
  developmentId: string;
  unitType: string;
  /** '' = the project does not state a grade, so the offer mixes them. */
  finishing: string;
  areaMinSqm: number | null;
  areaMaxSqm: number | null;
  /** null = the band spans every bedroom count. */
  bedrooms: number | null;
  published: boolean;
  snapshots: OfferSnapshot[];
}

export interface OfferOptions {
  /** Admin surfaces pass true; every public call leaves it false. */
  includeUnpublished?: boolean;
}

function positive(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Newest first, so `snapshots[0]` is the figure a reader should be shown. */
function byCaptureDate(a: OfferSnapshot, b: OfferSnapshot): number {
  const ta = Date.parse(a.capturedAt);
  const tb = Date.parse(b.capturedAt);
  // An unparseable date sorts last rather than winning: a source we cannot time
  // is not allowed to look like the most recent one.
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

function usableSnapshot(snapshot: OfferSnapshot, includeUnpublished: boolean): boolean {
  return includeUnpublished || snapshot.published ? positive(snapshot.ppmMid) : false;
}

/**
 * The most recent capture that actually carries a price.
 *
 * "Latest" means latest *with a figure*: a snapshot recording that a source went
 * silent is real provenance but is not something to print in a price cell.
 */
export function latestSnapshot(offer: UnitOffer, options: OfferOptions = {}): OfferSnapshot | null {
  const candidates = (offer.snapshots || [])
    .filter((snapshot) => usableSnapshot(snapshot, Boolean(options.includeUnpublished)))
    .sort(byCaptureDate);
  return candidates[0] ?? null;
}

/** Every capture of this offer, newest first, including the price-less ones. */
export function snapshotHistory(offer: UnitOffer, options: OfferOptions = {}): OfferSnapshot[] {
  return (offer.snapshots || [])
    .filter((snapshot) => options.includeUnpublished || snapshot.published)
    .sort(byCaptureDate);
}

/** Does this offer's area band cover `areaSqm`? An unlimited band covers all. */
export function bandCovers(offer: UnitOffer, areaSqm: number | null | undefined): boolean {
  const area = Number(areaSqm);
  if (!Number.isFinite(area) || area <= 0) return true;
  if (positive(offer.areaMinSqm) && area < Number(offer.areaMinSqm)) return false;
  if (positive(offer.areaMaxSqm) && area > Number(offer.areaMaxSqm)) return false;
  return true;
}

/** Does this offer answer the bedroom question? A null band answers every one. */
export function bedroomsMatch(offer: UnitOffer, bedrooms: number | null | undefined): boolean {
  const wanted = Number(bedrooms);
  if (!Number.isFinite(wanted) || wanted < 0) return true;
  if (offer.bedrooms === null || offer.bedrooms === undefined) return true;
  return Number(offer.bedrooms) === wanted;
}

function published(offer: UnitOffer, includeUnpublished: boolean): boolean {
  return includeUnpublished || offer.published;
}

/**
 * The offer a selection should be read against.
 *
 * Order matters and is the whole honesty of the pick:
 * 1. the exact (unit type × finishing) the buyer asked for;
 * 2. failing that, the same unit type with no stated grade — the project's mixed
 *    band, which the caller must then flag with `finishingBadge`;
 * 3. otherwise nothing. A different unit type is never borrowed as a substitute,
 *    because "close enough" is exactly how a comparison table lies.
 */
export function pickOffer(
  offers: UnitOffer[],
  unitType: string,
  finishing: string,
  options: OfferOptions & { areaSqm?: number | null; bedrooms?: number | null } = {}
): UnitOffer | null {
  const includeUnpublished = Boolean(options.includeUnpublished);
  const type = String(unitType ?? '').trim();
  const grade = String(finishing ?? '').trim();

  const pool = (offers || []).filter(
    (offer) =>
      published(offer, includeUnpublished) &&
      String(offer.unitType ?? '').trim() === type &&
      bandCovers(offer, options.areaSqm) &&
      bedroomsMatch(offer, options.bedrooms)
  );
  if (pool.length === 0) return null;

  if (grade) {
    const exact = pool.find((offer) => String(offer.finishing ?? '').trim() === grade);
    if (exact) return exact;
  }

  // '' is the documented "the project does not state a grade" value, so an exact
  // request for no grade and a fallback land on the same row.
  const mixed = pool.find((offer) => String(offer.finishing ?? '').trim() === '');
  if (mixed) return mixed;

  // Nothing for this type states a grade, but other grades of the same type do:
  // still the closest honest answer, and `finishingBadge` will call it mixed.
  return grade ? null : (pool[0] ?? null);
}

/**
 * How much the offer's finishing claim is worth.
 *
 * `'mixed'` is not a warning about the project; it is a warning about *us*
 * comparing grades we cannot separate. The UI prints `finishingMixed` beside the
 * price whenever it sees it, so the row never reads as a like-for-like figure.
 */
export function finishingBadge(offer: UnitOffer | null | undefined): 'mixed' | 'stated' {
  if (!offer) return 'mixed';
  return String(offer.finishing ?? '').trim() ? 'stated' : 'mixed';
}

/** Is there a figure here at all to put beside another project's? */
export function isComparable(offer: UnitOffer | null | undefined, options: OfferOptions = {}): boolean {
  if (!offer) return false;
  if (!published(offer, Boolean(options.includeUnpublished))) return false;
  return latestSnapshot(offer, options) !== null;
}

/** Offers grouped by project, for the engine that loads a whole selection at once. */
export function offersByDevelopment(offers: UnitOffer[]): Record<string, UnitOffer[]> {
  const grouped: Record<string, UnitOffer[]> = {};
  for (const offer of offers || []) {
    const key = String(offer.developmentId ?? '');
    (grouped[key] ||= []).push(offer);
  }
  return grouped;
}
