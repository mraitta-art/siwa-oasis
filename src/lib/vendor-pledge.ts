import { getPublicMinisiteUrl } from '@/lib/public-url';

/**
 * Mutual visibility pledge (free plan).
 *
 * A free minisite is granted in exchange for one visible link back to the
 * minisite from the vendor's own profiles. We can never write that link for
 * them on Instagram/TikTok, so the pledge is captured as an obligation with
 * its own record, and fulfilment is proven by evidence we can actually read:
 *
 *  - Google: the `websiteUri` field of their Maps profile (Places API, read).
 *  - Social: a real referral click arriving from that platform's app/web.
 *
 * Consequence of a broken pledge is limited to perks — the minisite is never
 * removed. See VENDOR_PLEDGE_GRACE_DAYS.
 */

export const VENDOR_PLEDGE_VERSION = '2026-10-24-v1';
export const VENDOR_PLEDGE_GRACE_DAYS = 30;

export const PLEDGE_SOCIAL_SOURCES = ['instagram', 'facebook', 'tiktok'] as const;
export type PledgeSocialSource = (typeof PLEDGE_SOCIAL_SOURCES)[number];

export type PledgeStatus = 'none' | 'pending' | 'verified' | 'expired';

/**
 * Whether the business has a Google Maps profile we could find.
 * `absent` is a normal state, not an error: many small Siwa businesses simply
 * do not have one yet, and the pledge can be satisfied through a social bio.
 */
export type GooglePlaceStatus = 'unknown' | 'linked' | 'absent';

export interface VendorPledge {
  version: string;
  accepted_at: string;
  via: string;
  minisite_url: string;
  google_website_url: string | null;
  google_verified_at: string | null;
  google_place_status: GooglePlaceStatus;
  google_place_checked_at: string | null;
  social_detected: Partial<Record<PledgeSocialSource, string>>;
  reminders_sent: string[];
  last_evaluated_at: string | null;
}

export interface EvaluatedPledge extends VendorPledge {
  status: PledgeStatus;
  grace_ends_at: string;
  days_remaining: number;
  verified_sources: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildVendorPledge(options: {
  slug: string;
  via: string;
  at?: Date;
  minisiteUrl?: string;
}): VendorPledge {
  const at = options.at || new Date();
  return {
    version: VENDOR_PLEDGE_VERSION,
    accepted_at: at.toISOString(),
    via: options.via,
    minisite_url: options.minisiteUrl || (options.slug ? getPublicMinisiteUrl(options.slug) : ''),
    google_website_url: null,
    google_verified_at: null,
    google_place_status: 'unknown',
    google_place_checked_at: null,
    social_detected: {},
    reminders_sent: [],
    last_evaluated_at: null,
  };
}

export function readVendorPledge(customData: unknown): VendorPledge | null {
  if (!customData || typeof customData !== 'object') return null;
  const raw = (customData as Record<string, unknown>).pledge;
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<VendorPledge>;
  if (!candidate.accepted_at || !Number.isFinite(new Date(candidate.accepted_at).getTime())) return null;

  return {
    version: String(candidate.version || VENDOR_PLEDGE_VERSION),
    accepted_at: candidate.accepted_at,
    via: String(candidate.via || 'unknown'),
    minisite_url: String(candidate.minisite_url || ''),
    google_website_url: candidate.google_website_url ? String(candidate.google_website_url) : null,
    google_verified_at: candidate.google_verified_at ? String(candidate.google_verified_at) : null,
    google_place_status: candidate.google_place_status === 'linked' || candidate.google_place_status === 'absent'
      ? candidate.google_place_status
      : 'unknown',
    google_place_checked_at: candidate.google_place_checked_at ? String(candidate.google_place_checked_at) : null,
    social_detected:
      candidate.social_detected && typeof candidate.social_detected === 'object'
        ? (candidate.social_detected as Partial<Record<PledgeSocialSource, string>>)
        : {},
    reminders_sent: Array.isArray(candidate.reminders_sent) ? candidate.reminders_sent.map(String) : [],
    last_evaluated_at: candidate.last_evaluated_at ? String(candidate.last_evaluated_at) : null,
  };
}

/** `host/path` only, so scheme, www, tracking params and trailing slashes don't matter. */
function comparableUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  let raw = value.trim().toLowerCase();
  raw = raw.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
  raw = raw.split('#')[0].split('?')[0];
  return raw.replace(/\/+$/, '');
}

export function minisiteMatchesUrl(url: unknown, minisiteUrl: string): boolean {
  const target = comparableUrl(minisiteUrl);
  if (!target) return false;
  const candidate = comparableUrl(url);
  if (!candidate) return false;
  return candidate === target;
}

export function verifiedPledgeSources(pledge: VendorPledge | null): string[] {
  if (!pledge) return [];
  const sources: string[] = [];
  if (pledge.google_verified_at) sources.push('google');
  for (const source of PLEDGE_SOCIAL_SOURCES) {
    if (pledge.social_detected?.[source]) sources.push(source);
  }
  return sources;
}

export function evaluateVendorPledge(pledge: VendorPledge | null, now: Date = new Date()): EvaluatedPledge | null {
  if (!pledge) return null;

  const acceptedAt = new Date(pledge.accepted_at).getTime();
  const graceEndsAt = acceptedAt + VENDOR_PLEDGE_GRACE_DAYS * DAY_MS;
  const verifiedSources = verifiedPledgeSources(pledge);
  const remaining = Math.max(0, Math.ceil((graceEndsAt - now.getTime()) / DAY_MS));

  const status: PledgeStatus = verifiedSources.length > 0
    ? 'verified'
    : now.getTime() < graceEndsAt
      ? 'pending'
      : 'expired';

  return {
    ...pledge,
    status,
    grace_ends_at: new Date(graceEndsAt).toISOString(),
    days_remaining: remaining,
    verified_sources: verifiedSources,
  };
}

/** Expired pledges lose perks, never the minisite itself. */
export function keepsFreePerks(status: PledgeStatus): boolean {
  return status !== 'expired';
}

/**
 * Classifies an incoming referral as a social platform click. Google search
 * referrals are ignored on purpose — Google is verified through the profile's
 * website field instead.
 */
export function detectSocialSource(input: {
  referrer?: string | null;
  utmSource?: string | null;
}): PledgeSocialSource | null {
  const referrer = String(input.referrer || '').toLowerCase();
  const utm = String(input.utmSource || '').toLowerCase().trim();

  if (utm === 'ig' || utm === 'insta' || utm === 'instagram') return 'instagram';
  if (utm === 'fb' || utm === 'facebook' || utm === 'meta') return 'facebook';
  if (utm === 'tt' || utm === 'tiktok') return 'tiktok';

  if (/instagram\.com|instagr\.am/.test(referrer)) return 'instagram';
  if (/facebook\.com|fb\.me|l\.facebook|fbclid/.test(referrer)) return 'facebook';
  if (/tiktok\.com/.test(referrer)) return 'tiktok';

  return null;
}
