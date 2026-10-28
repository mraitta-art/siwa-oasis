/**
 * Admin reads and writes for the `developers` entity.
 *
 * The public read lives in `developers.ts`; this file is the dashboard's write
 * side and never shares a contract with the storefront, so it can answer for
 * inactive developers too. Keeping it separate (rather than inside
 * `markets-admin.ts`) avoids an import cycle: `markets-admin` imports
 * `ensureDeveloperId` from `developers`, and this file imports the shared error
 * type from `markets-admin`.
 *
 * THE STABILITY RULE, stated once here because everything else depends on it:
 * a developer's slug is chosen at creation and then FROZEN. Editing the display
 * name never moves the URL. The slug changes only when the admin edits the slug
 * field on purpose — that is the deliberate, warned "upper hand", and it breaks
 * the old link, exactly like renaming a market.
 */

import crypto from 'crypto';
import { query, queryOne, execute } from '@/lib/db';
import { AdminDataError } from '@/lib/markets-admin';
import { slugifyDeveloper } from '@/lib/developers';
import { isReservedSlug } from '@/lib/market-routes';

export interface AdminDeveloper {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
  about: string | null;
  aboutAr: string | null;
  active: boolean;
  placeAtRoot: boolean;
  /** How many projects currently point at this developer. */
  projects: number;
  /** The linked corporate businesses row, if the admin set one. */
  businessId: string | null;
  businessName: string | null;
}

const ADMIN_COLUMNS = `d.id, d.slug, d.name, d.name_ar, d.logo_url, d.about, d.about_ar, d.active, d.place_at_root`;

function toAdminDeveloper(row: any): AdminDeveloper {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name ?? row.slug),
    nameAr: row.name_ar ? String(row.name_ar) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    about: row.about ? String(row.about) : null,
    aboutAr: row.about_ar ? String(row.about_ar) : null,
    active: Boolean(Number(row.active)),
    placeAtRoot: Boolean(Number(row.place_at_root)),
    projects: Number(row.projects) || 0,
    businessId: null,
    businessName: null,
  };
}

/**
 * Accept a businesses reference as either its id or its slug and return the id,
 * or null for a blank / unknown reference (which clears the link). Reads only
 * `businesses`, so it never depends on the developer link column existing yet.
 */
async function resolveBusinessId(ref: unknown): Promise<string | null> {
  const clean = String(ref ?? '').trim();
  if (!clean) return null;
  try {
    const byId = (await queryOne('SELECT id FROM businesses WHERE id = ? LIMIT 1', [clean])) as any;
    if (byId?.id) return String(byId.id);
    const bySlug = (await queryOne('SELECT id FROM businesses WHERE slug = ? LIMIT 1', [clean])) as any;
    if (bySlug?.id) return String(bySlug.id);
  } catch {
    /* a lookup failure is simply "no match" — never block the developer save */
  }
  return null;
}

/** A slug is a URL segment: lowercase words joined by single hyphens. */
function assertValidSlug(slug: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AdminDataError('Slug must be lowercase letters, digits and single hyphens — for example "sodic".');
  }
}

/** Every developer, active or not; the screen sorts and filters client-side. */
export async function listDevelopersAdmin(): Promise<AdminDeveloper[]> {
  try {
    const rows = await query(
      `SELECT ${ADMIN_COLUMNS},
              (SELECT COUNT(*) FROM developments dev WHERE dev.developer_id = d.id) AS projects
       FROM developers d
       ORDER BY d.name`
    );
    const list = (rows as any[]).map(toAdminDeveloper);
    // Best-effort corporate-link enrichment kept OUT of the main query on purpose:
    // the business_id column is added by migration 20261109, and a list must keep
    // rendering (with no links) even if that migration has not landed yet.
    try {
      const links = await query(
        `SELECT d.id, d.business_id, b.name AS bname, b.name_ar AS bname_ar
         FROM developers d
         LEFT JOIN businesses b ON b.id = d.business_id
         WHERE d.business_id IS NOT NULL`
      );
      const byId = new Map(
        (links as any[]).map((l) => [
          String(l.id),
          {
            id: String(l.business_id),
            name: [l.bname ? String(l.bname) : '', l.bname_ar ? String(l.bname_ar) : ''].filter(Boolean).join(' · ') || null,
          },
        ])
      );
      for (const d of list) {
        const hit = byId.get(d.id);
        if (hit) {
          d.businessId = hit.id;
          d.businessName = hit.name;
        }
      }
    } catch {
      /* column not present yet — leave the links null, the list is still valid */
    }
    return list;
  } catch {
    return [];
  }
}

export async function createDeveloper(input: any): Promise<{ id: string; slug: string }> {
  const name = String(input?.name || '').trim();
  if (!name) throw new AdminDataError('A developer needs a name.');

  // The slug defaults to the canonical form of the name; an admin may set it
  // explicitly to claim a nicer or branded address.
  const slug = String(input?.slug || '').trim() ? String(input.slug).trim().toLowerCase() : slugifyDeveloper(name);
  assertValidSlug(slug);
  const placeAtRoot = Boolean(Number(input?.placeAtRoot ?? 0));
  // A root vanity lives at siwify.com/{slug}; it must not shadow a route the app
  // owns. The /developers/{slug} rule is safe regardless, so only block a root.
  if (placeAtRoot && isReservedSlug(slug)) {
    throw new AdminDataError(`"${slug}" is reserved by the app and cannot be a root address.`);
  }
  if (await queryOne('SELECT id FROM developers WHERE slug = ? LIMIT 1', [slug])) {
    throw new AdminDataError(`A developer with the slug "${slug}" already exists.`, 409, 'SLUG_TAKEN');
  }

  const id = crypto.randomUUID();
  const businessId = await resolveBusinessId(input?.businessSlug ?? input?.businessId);
  // Columns built dynamically so a developer without a corporate link saves with
  // no reference to business_id at all — creation still works before migration
  // 20261109 lands, and only a deliberate link needs the column present.
  const cols = ['id', 'slug', 'name', 'name_ar', 'logo_url', 'about', 'about_ar', 'active', 'place_at_root'];
  const vals: any[] = [
    id,
    slug,
    name,
    String(input?.nameAr || '').trim() || null,
    String(input?.logoUrl || '').trim() || null,
    String(input?.about || '').trim() || null,
    String(input?.aboutAr || '').trim() || null,
    input?.active === false ? 0 : 1,
    placeAtRoot ? 1 : 0,
  ];
  if (businessId) {
    cols.push('business_id');
    vals.push(businessId);
  }
  await execute(
    `INSERT INTO developers (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    vals
  );
  return { id, slug };
}

export async function updateDeveloper(id: string, patch: any): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Developer id is required.');
  const current = (await queryOne(
    'SELECT id, slug, place_at_root FROM developers WHERE id = ? LIMIT 1',
    [target]
  )) as any;
  if (!current) throw new AdminDataError('Developer not found.', 404);

  const sets: string[] = [];
  const params: any[] = [];

  // The display name may change freely; the slug deliberately does NOT follow it.
  if ('name' in patch) {
    const name = String(patch.name || '').trim();
    if (!name) throw new AdminDataError('A developer keeps its name.');
    sets.push('name = ?');
    params.push(name);
  }
  if ('nameAr' in patch) {
    sets.push('name_ar = ?');
    params.push(String(patch.nameAr || '').trim() || null);
  }
  if ('logoUrl' in patch) {
    sets.push('logo_url = ?');
    params.push(String(patch.logoUrl || '').trim() || null);
  }
  if ('about' in patch) {
    sets.push('about = ?');
    params.push(String(patch.about || '').trim() || null);
  }
  if ('aboutAr' in patch) {
    sets.push('about_ar = ?');
    params.push(String(patch.aboutAr || '').trim() || null);
  }
  if ('active' in patch) {
    sets.push('active = ?');
    params.push(patch.active ? 1 : 0);
  }
  // The URL moves ONLY when the admin edits the slug field on purpose.
  let nextSlug = String(current.slug);
  if ('slug' in patch) {
    const next = String(patch.slug || '').trim().toLowerCase();
    assertValidSlug(next);
    if (next !== String(current.slug)) {
      const clash = (await queryOne(
        'SELECT id FROM developers WHERE slug = ? AND id <> ? LIMIT 1',
        [next, target]
      )) as any;
      if (clash) throw new AdminDataError(`A developer with the slug "${next}" already exists.`, 409, 'SLUG_TAKEN');
      sets.push('slug = ?');
      params.push(next);
      nextSlug = next;
    }
  }

  // Whether this developer will answer at the site root once the update lands:
  // either the patch turns the flag now, or it is already on and the patch does
  // not turn it off. A root slug may not shadow an app route.
  const rootAfter =
    'placeAtRoot' in patch
      ? Boolean(Number(patch.placeAtRoot ?? 0))
      : Number(current.place_at_root) === 1;
  if ('placeAtRoot' in patch) {
    if (rootAfter && isReservedSlug(nextSlug)) {
      throw new AdminDataError(`"${nextSlug}" is reserved by the app and cannot be a root address.`);
    }
    sets.push('place_at_root = ?');
    params.push(rootAfter ? 1 : 0);
  } else if (rootAfter && nextSlug !== String(current.slug) && isReservedSlug(nextSlug)) {
    // Slug changed on a developer already living at the root.
    throw new AdminDataError(`"${nextSlug}" is reserved by the app and cannot be a root address.`);
  }

  // The corporate link follows the same deliberate rule as the slug: it moves
  // only when the admin sends the field. A blank or unknown reference clears it.
  if ('businessSlug' in patch || 'businessId' in patch) {
    const resolved = await resolveBusinessId(patch.businessId ?? patch.businessSlug);
    sets.push('business_id = ?');
    params.push(resolved);
  }

  if (sets.length === 0) return;
  params.push(target);
  await execute(`UPDATE developers SET ${sets.join(', ')} WHERE id = ?`, params);
}

/**
 * Delete a developer. The FK is ON DELETE SET NULL, so their projects survive
 * and simply lose the developer link — deleting a company never erases a build.
 */
export async function deleteDeveloper(id: string): Promise<void> {
  const target = String(id || '').trim();
  if (!target) throw new AdminDataError('Developer id is required.');
  if (!(await queryOne('SELECT id FROM developers WHERE id = ? LIMIT 1', [target]))) {
    throw new AdminDataError('Developer not found.', 404);
  }
  await execute('DELETE FROM developers WHERE id = ?', [target]);
}
