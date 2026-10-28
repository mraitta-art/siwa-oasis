/**
 * The developer as a browsable entity.
 *
 * A development always carried a free-text `developer_name`, but strings are not
 * relationships: "sodic" and "Sodic" were two developers to the database. This
 * library reads the `developers` row a development now points at, so an investor
 * can open one developer and see their whole portfolio compared side by side —
 * the thing a raw string could never give us.
 *
 * `slugifyDeveloper` MUST stay byte-for-byte compatible with the SQL backfill in
 * migrations/20261107_developers.sql, or a project linked by the migration and a
 * developer looked up by the admin screen would drift to different slugs.
 */

import crypto from 'crypto';
import { query, queryOne, execute } from '@/lib/db';
import { businessPublicPath } from '@/lib/public-url';

export interface Developer {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
  about: string | null;
  aboutAr: string | null;
}

const DEVELOPER_COLUMNS = 'id, slug, name, name_ar, logo_url, about, about_ar';

function toDeveloper(row: any): Developer {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name ?? row.slug),
    nameAr: row.name_ar ? String(row.name_ar) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    about: row.about ? String(row.about) : null,
    aboutAr: row.about_ar ? String(row.about_ar) : null,
  };
}

/**
 * Canonical developer slug. lower -> collapse non-alphanumerics to '-' -> trim
 * '-'. Mirrors the REGEXP_REPLACE chain in the migration exactly.
 */
export function slugifyDeveloper(name: string): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getDeveloperBySlug(slug: string): Promise<Developer | null> {
  const target = String(slug || '').trim();
  if (!target) return null;
  try {
    const rows = await query(
      `SELECT ${DEVELOPER_COLUMNS} FROM developers WHERE active = 1 AND slug = ? LIMIT 1`,
      [target]
    );
    return rows && rows.length > 0 ? toDeveloper(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * The developer an admin chose to place at siwify.com/{slug} instead of the
 * /developers/{slug} rule. Routing reads this only for a bare, market-less URL
 * and only after every other branch, so a vanity can never take an address that
 * already resolves today.
 */
export async function getRootDeveloper(slug: string): Promise<Developer | null> {
  const target = String(slug || '').trim();
  if (!target) return null;
  try {
    const rows = await query(
      `SELECT ${DEVELOPER_COLUMNS} FROM developers WHERE active = 1 AND place_at_root = 1 AND slug = ? LIMIT 1`,
      [target]
    );
    return rows && rows.length > 0 ? toDeveloper(rows[0]) : null;
  } catch {
    return null;
  }
}

/**
 * A brand's corporate presence, when the admin has linked one.
 *
 * The developer row itself stays thin; its offices, contacts and full identity
 * live on a linked businesses row and are published through that business's own
 * minisite and field-visibility rules. This returns just enough to surface a
 * corporate band on the developer page and point at the full site, resolving the
 * canonical address (root or market) for the link.
 *
 * Reads `business_id` through a dedicated, guarded query so the whole developer
 * feature keeps working even before migration 20261109 adds the column: no link
 * column, or no active business behind it, simply means no corporate band.
 */
export interface DeveloperCorporate {
  businessId: string;
  name: string;
  nameAr: string | null;
  path: string;
}

export async function getDeveloperCorporate(developerSlug: string): Promise<DeveloperCorporate | null> {
  const target = String(developerSlug || '').trim();
  if (!target) return null;
  try {
    const dev = (await queryOne(
      'SELECT business_id FROM developers WHERE active = 1 AND slug = ? LIMIT 1',
      [target]
    )) as any;
    const businessId = dev?.business_id ? String(dev.business_id) : '';
    if (!businessId) return null;
    const biz = (await queryOne(
      `SELECT id, name, name_ar, slug, market_id, url_style
       FROM businesses WHERE id = ? AND status = 'active' LIMIT 1`,
      [businessId]
    )) as any;
    if (!biz) return null;
    return {
      businessId: String(biz.id),
      name: String(biz.name ?? ''),
      nameAr: biz.name_ar ? String(biz.name_ar) : null,
      path: businessPublicPath({ slug: biz.slug, market_id: biz.market_id, url_style: biz.url_style }),
    };
  } catch {
    return null;
  }
}

/** Every active developer, for an index screen. */
export async function listDevelopers(): Promise<Developer[]> {
  try {
    const rows = await query(
      `SELECT ${DEVELOPER_COLUMNS} FROM developers WHERE active = 1 ORDER BY name`
    );
    return (rows || []).map(toDeveloper);
  } catch {
    return [];
  }
}

/**
 * The developers active in one market — for a market or zone page that wants to
 * say "these brands build here". It reads through `developments` (which carries
 * both market_id and developer_id), so it needs no new table and stays correct
 * after migration 20261107 alone. Dark markets pass an id too; the caller shows
 * the door only where it should.
 */
export interface MarketDeveloper {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
  /** How many of the developer's active projects sit in this market. */
  projects: number;
}

export async function listDevelopersByMarket(marketSlug: string): Promise<MarketDeveloper[]> {
  const target = String(marketSlug || '').trim();
  if (!target) return [];
  try {
    const rows = await query(
      `SELECT d.id, d.slug, d.name, d.name_ar, d.logo_url, COUNT(dev.id) AS projects
       FROM developers d
       JOIN developments dev ON dev.developer_id = d.id
       WHERE d.active = 1 AND dev.active = 1 AND dev.market_id = ?
       GROUP BY d.id, d.slug, d.name, d.name_ar, d.logo_url
       ORDER BY projects DESC, d.name`,
      [target]
    );
    return (rows || []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name ?? row.slug),
      nameAr: row.name_ar ? String(row.name_ar) : null,
      logoUrl: row.logo_url ? String(row.logo_url) : null,
      projects: Number(row.projects) || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * The developers building in one zone. A compound itself carries no zone — only
 * its listings are filed under a district — so this walks zone -> listings ->
 * compound -> developer. Zone membership is the same hierarchical path match the
 * zone listing query uses (`l.path = zone.path OR under it`), never a flat id,
 * or a listing in a child district would be missed. `projects` counts the
 * compounds with a live listing in the zone.
 */
export async function listDevelopersByZone(marketSlug: string, zonePath: string): Promise<MarketDeveloper[]> {
  const market = String(marketSlug || '').trim();
  const path = String(zonePath || '').trim();
  if (!market || !path) return [];
  try {
    const rows = await query(
      `SELECT d.id, d.slug, d.name, d.name_ar, d.logo_url,
              COUNT(DISTINCT dev.id) AS projects
       FROM developers d
       JOIN developments dev ON dev.developer_id = d.id AND dev.active = 1
       JOIN businesses b ON b.development_id = dev.id AND b.status = 'active' AND b.market_id = ?
       JOIN locations l ON l.id = b.location_id
       WHERE d.active = 1 AND (l.path = ? OR l.path LIKE CONCAT(?, '/%'))
       GROUP BY d.id, d.slug, d.name, d.name_ar, d.logo_url
       ORDER BY projects DESC, d.name`,
      [market, path, path]
    );
    return (rows || []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name ?? row.slug),
      nameAr: row.name_ar ? String(row.name_ar) : null,
      logoUrl: row.logo_url ? String(row.logo_url) : null,
      projects: Number(row.projects) || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Find the developer for a name, creating the row on first sight.
 *
 * Called from the compound write path so a developer record exists the moment an
 * admin types the name — the portfolio page is never a dead link because the
 * entity was "not created yet". Returns null for a blank name so the caller can
 * clear `developer_id`.
 */
export async function ensureDeveloperId(name: unknown): Promise<string | null> {
  const clean = String(name ?? '').trim();
  const slug = slugifyDeveloper(clean);
  if (!slug) return null;
  try {
    // 1. Same canonical slug -> the same developer. Never recompute on save.
    const bySlug = (await queryOne('SELECT id FROM developers WHERE slug = ? LIMIT 1', [slug])) as any;
    if (bySlug?.id) return String(bySlug.id);
    // 2. A name that only differs by case/spacing already has a row -> reuse it.
    //    This is what keeps a "sodic" vs "Sodic" vs "SODIC" typo from minting a
    //    second developer (and a second, orphanable URL).
    const byName = (await queryOne(
      'SELECT id FROM developers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
      [clean]
    )) as any;
    if (byName?.id) return String(byName.id);
    // 3. A genuinely new developer name -> create it once; the slug then freezes.
    const id = crypto.randomUUID();
    await execute(
      'INSERT INTO developers (id, slug, name, active) VALUES (?, ?, ?, 1)',
      [id, slug, clean]
    );
    return id;
  } catch {
    // Never let a developer-bookkeeping failure break the compound save.
    return null;
  }
}
