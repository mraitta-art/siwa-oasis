/**
 * Distance between two pins, and the honesty about what that distance means.
 *
 * A comparison table that lines two compounds up without saying how far apart
 * they are asks the reader to imagine geography that we actually have. The
 * haversine here is the ordinary one — great-circle, km, earth radius 6371 — and
 * nothing more: it is straight-line distance, not a drive, and no road network or
 * toll bridge is implied by it.
 *
 * `approximate` is the part that matters. `developments.location_verified = 0`
 * means the admin has not checked the pin, so a distance measured between two
 * unchecked pins inherits both errors. The figure is still useful (it is our best
 * number), but the label beside it must be `الموقع تقريبي`, not a clean "3.2 km".
 */

export interface GeoPoint {
  lat: number | null;
  lng: number | null;
  /** Admin-checked coordinates. False, or absent, means the pin is approximate. */
  verified?: boolean;
}

const EARTH_RADIUS_KM = 6371;

function finiteCoordinate(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  // A 0/0 pair is a placeholder, not a point in the Gulf of Guinea.
  if (a === 0 && b === 0) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

/**
 * Great-circle kilometres between two points, or null when either is missing.
 *
 * Null rather than 0: two projects with no coordinates are not next to each
 * other, and a zero would read as the strongest possible claim of proximity.
 */
export function haversineKm(a: GeoPoint | null | undefined, b: GeoPoint | null | undefined): number | null {
  if (!a || !b) return null;
  const from = finiteCoordinate(a.lat, a.lng);
  const to = finiteCoordinate(b.lat, b.lng);
  if (!from || !to) return null;

  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(km * 100) / 100;
}

/** Would this pair's distance be measured against unchecked pins? */
export function isApproximatePair(a: GeoPoint | null | undefined, b: GeoPoint | null | undefined): boolean {
  if (!a || !b) return true;
  return !a.verified || !b.verified;
}

export interface PairDistance {
  a: string;
  b: string;
  km: number | null;
  approximate: boolean;
  /** Both pins sit under the same recorded location, e.g. the same district. */
  sameLocation: boolean;
}

/**
 * Every pair among the given points, for a "how far apart" row.
 *
 * Distances are only computed within the rows on screen — the compared set —
 * because a table cannot show a distance to a project the visitor did not pick.
 */
export function pairwiseDistances(
  points: { id: string; lat: number | null; lng: number | null; verified?: boolean; locationId?: string | null }[]
): PairDistance[] {
  const out: PairDistance[] = [];
  const rows = points || [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      const km = haversineKm(a, b);
      out.push({
        a: a.id,
        b: b.id,
        km,
        approximate: km === null ? true : isApproximatePair(a, b),
        sameLocation: Boolean(a.locationId && b.locationId && a.locationId === b.locationId),
      });
    }
  }
  return out;
}
