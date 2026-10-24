/**
 * Free-period model ("service trial").
 *
 * The free tier is not a reduced product: it is the full service with real
 * public existence, limited only in quantity, for a period SiWiFy decides.
 * The period itself lives in the tier policy
 * (`subscription_tiers.features.trial_days`), so an admin can change it in the
 * Tiers screen without a deploy.
 *
 * State is kept in `businesses.custom_data.trial` — same place as the consent
 * ledger and the visibility pledge — so this feature needs no schema migration
 * and cannot drift from the database.
 *
 * When the period ends nothing is deleted and the minisite stays online (the
 * pledge promises that). Editing pauses and the growth services wait for a
 * paid plan; `canEdit` is the single flag every write path should respect.
 */

export const VENDOR_TRIAL_VERSION = '2026-10-24-v1';
/** Used only when the tier policy has no `trial_days` of its own. */
export const DEFAULT_TRIAL_DAYS = 90;
/** From this many days left the dashboard warns instead of reporting normally. */
export const TRIAL_ENDING_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialStatus = 'none' | 'active' | 'ending' | 'ended';

export type TrialVia = 'minisite_acceptance' | 'business_creation' | 'vendor_dashboard' | 'admin_dashboard';

export interface VendorTrial {
  version: string;
  trial_started_at: string;
  trial_expires_at: string;
  trial_days: number;
  via: TrialVia;
}

export interface EvaluatedTrial {
  status: TrialStatus;
  started_at: string | null;
  expires_at: string | null;
  days_total: number;
  days_remaining: number;
  /** True while the vendor may still change content. */
  can_edit: boolean;
  /** Public existence is never turned off by this model. */
  minisite_stays_online: true;
}

export interface TrialQuotaView {
  photos: number | null;
  slides: number | null;
  videos: number | null;
  youtube: number | null;
  storageMB: number | null;
}

function asObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, any>) : {};
  } catch {
    return {};
  }
}

function validDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function readVendorTrial(customData: unknown): VendorTrial | null {
  const raw = asObject(asObject(customData).trial);
  const started = validDate(raw.trial_started_at);
  const expires = validDate(raw.trial_expires_at);
  if (!started || !expires || expires.getTime() <= started.getTime()) return null;

  const via = ['minisite_acceptance', 'business_creation', 'vendor_dashboard', 'admin_dashboard'].includes(raw.via)
    ? (raw.via as TrialVia)
    : 'admin_dashboard';

  return {
    version: typeof raw.version === 'string' ? raw.version : VENDOR_TRIAL_VERSION,
    trial_started_at: started.toISOString(),
    trial_expires_at: expires.toISOString(),
    trial_days: Math.max(1, Math.round((expires.getTime() - started.getTime()) / DAY_MS)),
    via,
  };
}

export function buildVendorTrial(input: { days: number; via: TrialVia; at?: Date }): VendorTrial {
  const days = Number.isFinite(input.days) && input.days > 0 ? Math.floor(input.days) : DEFAULT_TRIAL_DAYS;
  const started = input.at instanceof Date && !Number.isNaN(input.at.getTime()) ? input.at : new Date();
  return {
    version: VENDOR_TRIAL_VERSION,
    trial_started_at: started.toISOString(),
    trial_expires_at: addDays(started, days).toISOString(),
    trial_days: days,
    via: input.via,
  };
}

/** Pushes the end date out; keeps the original start so history stays truthful. */
export function extendVendorTrial(trial: VendorTrial, days: number, from?: Date): VendorTrial {
  const base = from && from.getTime() > new Date(trial.trial_expires_at).getTime()
    ? from
    : new Date(trial.trial_expires_at);
  const expires = addDays(base, Math.max(1, Math.floor(days)));
  return {
    ...trial,
    trial_expires_at: expires.toISOString(),
    trial_days: Math.max(1, Math.round((expires.getTime() - new Date(trial.trial_started_at).getTime()) / DAY_MS)),
  };
}

/**
 * Evaluated on every read rather than stored, so "expired" can never go stale.
 * A business with no trial record is unrestricted: legacy vendors must not be
 * locked out by a feature they never opted into.
 */
export function evaluateVendorTrial(trial: VendorTrial | null, now: Date = new Date()): EvaluatedTrial {
  if (!trial) {
    return {
      status: 'none',
      started_at: null,
      expires_at: null,
      days_total: 0,
      days_remaining: 0,
      can_edit: true,
      minisite_stays_online: true,
    };
  }

  const expires = new Date(trial.trial_expires_at);
  const remainingMs = expires.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / DAY_MS));
  const active = remainingMs > 0;

  return {
    status: !active ? 'ended' : daysRemaining <= TRIAL_ENDING_DAYS ? 'ending' : 'active',
    started_at: trial.trial_started_at,
    expires_at: trial.trial_expires_at,
    days_total: trial.trial_days,
    days_remaining: daysRemaining,
    can_edit: active,
    minisite_stays_online: true,
  };
}

/** Admin-set period, read from the tier policy with a safe fallback. */
export function resolveTrialDays(features: Record<string, any> | null | undefined): number {
  const raw = Number(features?.trial_days ?? features?.trialDays);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TRIAL_DAYS;
  return Math.min(3650, Math.floor(raw));
}

/**
 * Quantity limits that apply during the trial — full service, finite amount.
 *
 * Big-ticket media are "try one" features: one hero slide, one uploaded video,
 * one YouTube embed. `trial_max_slides` is deliberately separate from
 * `maxSlides`, because `maxSlides` also caps what the public hero renders —
 * lowering it would hide slides a vendor already has.
 */
export function resolveTrialQuota(features: Record<string, any> | null | undefined): TrialQuotaView {
  const asLimit = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  };
  return {
    photos: asLimit(features?.maxImages),
    slides: asLimit(features?.trial_max_slides ?? features?.maxSlides),
    videos: asLimit(features?.max_videos),
    youtube: asLimit(features?.max_youtube),
    storageMB: asLimit(features?.maxStorageMB),
  };
}

const YOUTUBE_LINK = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i;

/** Counts distinct YouTube links anywhere in a nested profile payload. */
export function countYoutubeLinks(value: unknown, budget = 400): number {
  const found = new Set<string>();

  const walk = (node: unknown, depth: number) => {
    if (!node || depth > 5 || found.size >= budget) return;
    if (typeof node === 'string') {
      if (YOUTUBE_LINK.test(node)) found.add(node.trim().slice(0, 300));
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry, depth + 1);
      return;
    }
    if (typeof node === 'object') {
      for (const entry of Object.values(node as Record<string, unknown>)) walk(entry, depth + 1);
    }
  };

  walk(value, 0);
  return found.size;
}

/**
 * Which catalog services are live right now. During the trial everything is on
 * (that is what "real existence" means); after it, only the public presence
 * survives, and the growth tools wait for a plan.
 */
export function resolveServiceStates(
  trial: EvaluatedTrial,
  features: Record<string, any> | null | undefined,
): Record<string, 'active' | 'upgrade'> {
  const states: Record<string, 'active' | 'upgrade'> = {};

  if (trial.status === 'ended') {
    states.minisite = 'active';
    states.qr = 'active';
    states.contact = enabled(features, ['allow_direct_contact']) ? 'active' : 'upgrade';
    for (const key of ['branding', 'captions', 'section-blog', 'minisite-carousel', 'main-carousel', 'marketplace', 'journeys', 'analytics', 'media']) {
      states[key] = 'upgrade';
    }
    return states;
  }

  for (const key of ['minisite', 'qr', 'branding', 'media', 'captions', 'section-blog', 'minisite-carousel', 'main-carousel', 'contact', 'marketplace', 'journeys', 'analytics']) {
    states[key] = 'active';
  }
  return states;
}

function enabled(features: Record<string, any> | null | undefined, keys: string[]): boolean {
  if (!features) return false;
  return keys.some(key => {
    const value = features[key];
    return value === true || (typeof value === 'number' && value > 0) || (Array.isArray(value) && value.length > 0);
  });
}
