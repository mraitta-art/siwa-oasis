/**
 * Root vanity resolution — the routing half of the admin's "upper hand".
 *
 * When an admin places a project or a developer at siwify.com/{slug} directly
 * (instead of the /{market}/{slug} or /developers/{slug} rule), the flat [slug]
 * router needs one place to ask: "does anything claim this address at the root?"
 * This is that place.
 *
 * Precedence and safety:
 *   - It is only consulted for a market-less, single-segment URL.
 *   - It is called LAST by the router, after business, CMS page, compound and
 *     zone all had their turn — so a vanity can only ever claim an address that
 *     nothing else already owns. No live URL changes hands because a flag flipped.
 *   - A project wins over a developer at the same slug; the write paths refuse a
 *     reserved slug at the root, so neither can shadow an app route.
 */

import { getRootDevelopment, type Development } from '@/lib/developments';
import { getRootDeveloper, type Developer } from '@/lib/developers';

export type VanityTarget =
  | { kind: 'development'; development: Development }
  | { kind: 'developer'; developer: Developer };

export async function resolveVanityRoot(slug: string): Promise<VanityTarget | null> {
  const target = String(slug || '').trim();
  if (!target) return null;

  const development = await getRootDevelopment(target);
  if (development) return { kind: 'development', development };

  const developer = await getRootDeveloper(target);
  if (developer) return { kind: 'developer', developer };

  return null;
}
