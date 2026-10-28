import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { createBusinessEntity } from '@/lib/business-creation';
import { AdminDataError, createCompound, createMarket } from '@/lib/markets-admin';
import { createLocation } from '@/lib/geo-admin';

export const dynamic = 'force-dynamic';

/**
 * The orchestrator's single write path.
 *
 * It replaces two things: the market-less `/api/jana/businesses` POST the wizard
 * used (which silently dropped a compound into the default market) and the
 * divergent legacy `/api/jana/orchestrator/register` route. Everything here flows
 * through the same guards the rest of the platform relies on — `createBusinessEntity`
 * validates the market, the typology-in-market and the location-in-market and
 * resolves the template; `createCompound` validates the container and inherits the
 * market's geography. A development is created after its page business so the
 * container's `page_business_id` points at a row already confirmed to live in the
 * same market.
 *
 * It is now intent-aware: the same funnel drives every initiation journey the
 * admin can start from the wizard — launch a market, add a place/zone/village,
 * create a development container, or list a business. Each branch reuses the
 * guarded creator that owns that object, so the interconnection invariants
 * (typology-in-market, location-in-market, same-market page business, town
 * auto-place-link, root-vanity/reserved-slug block) are enforced here on the
 * server, never trusted from the UI.
 */

function failure(error: any) {
  if (error instanceof AdminDataError) {
    return NextResponse.json({ error: error.message, rule: error.rule }, { status: error.status });
  }
  const message = error?.message || 'Unexpected error';
  if (/not authenticated|admin access required/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.json({ error: message, rule: error?.rule }, { status: 500 });
}

const INTENTS = ['business', 'development', 'market', 'place'] as const;
type Intent = (typeof INTENTS)[number];

function readIntent(body: any): Intent {
  const raw = String(body?.intent || '').trim().toLowerCase();
  if ((INTENTS as readonly string[]).includes(raw)) return raw as Intent;
  // Back-compat: the wizard used to send only `containerKind`. Map it so any
  // existing caller keeps working without an `intent` field.
  if (body?.containerKind === 'development') return 'development';
  return 'business';
}

/** A listing is filed inside its own market; optionally inside a container. */
async function provisionBusiness(body: any, user: { id: string }) {
  const market = String(body?.market || '').trim().toLowerCase();
  if (!market) {
    throw new AdminDataError('A market is required before anything can be listed.', 400);
  }
  const business = await createBusinessEntity({
    ...body,
    market_id: market,
    development_id: body?.existingDevelopmentId || null,
    actor_id: user.id,
    source: 'admin_orchestrator',
  });
  return { business, development: null };
}

/**
 * A development container. The container row (`developments`) is the source of
 * truth and needs no business typology, so this branch no longer forces one.
 * When the operator explicitly supplies a typology we still mint the page
 * business and link it (a compound with a full sectional minisite front page);
 * otherwise the container stands on its own.
 */
async function provisionDevelopment(body: any, user: { id: string }) {
  const market = String(body?.market || '').trim().toLowerCase();
  if (!market) {
    throw new AdminDataError('A market is required before a project can be placed.', 400);
  }
  const dev = body?.development || {};
  const hasTypology = Boolean(body?.type_id);

  let business: any = null;
  if (hasTypology) {
    business = await createBusinessEntity({
      ...body,
      market_id: market,
      development_id: null,
      actor_id: user.id,
      source: 'admin_orchestrator',
    });
  }

  const development = await createCompound({
    market,
    kind: dev.kind || 'compound',
    nameEn: dev.nameEn || business?.name || body?.name,
    nameAr: dev.nameAr || business?.name_ar || dev.nameEn || body?.nameAr || body?.name,
    slug: dev.slug || undefined,
    locationId: dev.locationId || business?.location_id || null,
    developerName: dev.developerName || business?.name || dev.nameEn || body?.name,
    deliveryYear: dev.deliveryYear,
    status: dev.status,
    placeAtRoot: dev.placeAtRoot === true || dev.placeAtRoot === 1,
    pageBusinessId: business?.id || dev.pageBusinessId || null,
    active: true,
  });

  if (business) {
    await execute('UPDATE businesses SET development_id = ? WHERE id = ?', [development.id, business.id]);
  }

  return { business, development };
}

/**
 * Launch a new market. `createMarket` creates the city location row from the
 * chosen governorate, so the geography comes with the market. When the operator
 * also filled a first container, it is created inside the brand-new market so a
 * single launch seeds the whole branch.
 */
async function provisionMarket(body: any, user: { id: string }) {
  const created = await createMarket({
    ...body,
    actor_id: user.id,
  });

  let development = null;
  const container = body?.container;
  if (container && String(container.nameEn || container.name || '').trim()) {
    development = await createCompound({
      market: created.slug,
      kind: container.kind || 'compound',
      nameEn: container.nameEn || container.name,
      nameAr: container.nameAr || container.nameEn || container.name,
      developerName: container.developerName || container.nameEn || container.name,
      deliveryYear: container.deliveryYear,
      status: container.status,
      active: true,
    });
  }

  return { business: null, development, market: created };
}

/** Add a place / zone / village row under an existing parent in the geography tree. */
async function provisionPlace(body: any) {
  const created = await createLocation({
    ...body,
    marketId: body?.marketId || body?.market || undefined,
  });
  return { business: null, development: null, location: created };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => ({}));

    const intent = readIntent(body);
    const result =
      intent === 'market'
        ? await provisionMarket(body, user)
        : intent === 'place'
          ? await provisionPlace(body)
          : intent === 'development'
            ? await provisionDevelopment(body, user)
            : await provisionBusiness(body, user);

    return NextResponse.json({ success: true, intent, ...result }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
