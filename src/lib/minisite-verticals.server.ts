/**
 * Server-side property bundle for a Properties minisite.
 *
 * The theme itself (`minisite-verticals.ts`) is client-safe and carries only the
 * shape of the data. Everything that actually reads the database lives here, so
 * importing the verticals module into `VanityBusinessClient` can never drag
 * `@/lib/developments`, `@/lib/developers` or `@/lib/db` into the browser.
 *
 * The route calls this only when the resolved vertical is `properties`. When the
 * business has no linked development it answers `null`, and the minisite keeps
 * just the navy skin — no empty unit or payment panels.
 */

import {
  buildDevelopmentFacts,
  getDevelopmentById,
  getDevelopmentByPageBusinessId,
  listDevelopments,
  listUnits,
} from '@/lib/developments';
import { slugifyDeveloper } from '@/lib/developers';
import type { PropertyBundle } from '@/lib/minisite-verticals';

/**
 * Load the development a business speaks for, either through its own
 * `development_id` or the compound that names this business as its page.
 */
export async function getMinisitePropertyBundle(
  business: { id?: string | null; development_id?: string | null },
  marketSlug: string,
  ar: boolean
): Promise<PropertyBundle | null> {
  if (!business || (!business.development_id && !business.id)) return null;

  const development = business.development_id
    ? await getDevelopmentById(business.development_id)
    : await getDevelopmentByPageBusinessId(String(business.id));
  if (!development) return null;

  const [units, siblings] = await Promise.all([
    listUnits({ developmentId: development.id, limit: 60 }),
    // The market's own projects, so the compare link pre-loads competitors and
    // the site-visit chooser can offer nearby projects to look at.
    listDevelopments(marketSlug || development.marketId, 'compound'),
  ]);

  const facts = buildDevelopmentFacts(development, units, siblings);

  const developerSlug = !facts.place && development.developerName ? slugifyDeveloper(development.developerName) : '';

  // The client is locale-agnostic here, so the compare link is prefixed at the
  // edge exactly the way the compound page prefixes its own links.
  const compareHref = ar ? facts.compareQueryString : `/en${facts.compareQueryString}`;

  const selfName = ar
    ? development.nameAr || development.nameEn
    : development.nameEn || development.nameAr;
  const projects = [
    selfName,
    ...siblings
      .filter((sibling) => sibling.id !== development.id)
      .map((sibling) => (ar ? sibling.nameAr || sibling.nameEn : sibling.nameEn || sibling.nameAr)),
  ]
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    developmentId: development.id,
    nameAr: development.nameAr,
    nameEn: development.nameEn,
    place: facts.place,
    facilities: development.facilities,
    plans: facts.plans,
    bestPlan: facts.bestPlan,
    cheapest: facts.cheapest,
    calcSeed: facts.calcSeed,
    currency: facts.currency,
    hasFacts: facts.hasFacts,
    dataVerifiedAt: development.dataVerifiedAt,
    compareHref,
    developerSlug,
    units,
    projects,
  };
}
