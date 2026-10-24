// Minisite version model — free-vs-paid duality.
//
// Design (per decisions):
//  * The FREE minisite presence is the auto-generated baseline that
//    /api/public/minisite/[slug] already returns for any business with no custom
//    published layout. It is NOT stored as its own row (no schema change, no
//    backfill). "Paid replaces free" simply means a handoff revision is published.
//  * Every stored version lives in minisite_vendor_handoffs and carries a role
//    derived from its status, plus an optional track tag stored inside the
//    layout JSON (layout.meta.track). No new columns, no ENUM change.

export type VersionTrack = 'free' | 'paid';
export type VersionRole = 'published' | 'working' | 'archived';

export const PUBLISHED_STATUS = 'published';
// 'expired' is the recoverable ARCHIVE state (already in the status ENUM).
// 'archived'/'deleted' are kept in the set defensively so a future value never
// leaks into the "working" bucket, but today archive == 'expired'.
export const ARCHIVED_STATUSES = new Set(['expired', 'archived', 'deleted']);

export interface VersionMeta {
  track: VersionTrack;
  registration_paid: boolean;
  registration_ref: string | null;
}

/** Map a raw handoff status to the dual-version role the chooser shows. */
export function versionRole(status: string): VersionRole {
  if (status === PUBLISHED_STATUS) return 'published';
  if (ARCHIVED_STATUSES.has(status)) return 'archived';
  return 'working';
}

/** Read the lightweight meta that publish_version stamps into layout.meta. */
export function readVersionMeta(layout: unknown): VersionMeta {
  const meta = (layout as any)?.meta || {};
  return {
    track: meta.track === 'free' ? 'free' : 'paid',
    registration_paid: meta.registration_paid === true,
    registration_ref: typeof meta.registration_ref === 'string' ? meta.registration_ref : null,
  };
}
