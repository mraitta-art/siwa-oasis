import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { createBusinessEntity } from '@/lib/business-creation';
import { AdminDataError, createCompound } from '@/lib/markets-admin';

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => ({}));

    const containerKind = body?.containerKind === 'development' ? 'development' : 'business';
    const market = String(body?.market || '').trim().toLowerCase();
    if (!market) {
      return NextResponse.json({ error: 'A market is required before anything can be listed.' }, { status: 400 });
    }

    // 1. The page business, filed inside its own market. When it is a plain listing
    //    the operator may have chosen an existing container to sit in; when it is a
    //    development the container does not exist yet, so it is created without one
    //    and linked in the step below.
    const business = await createBusinessEntity({
      ...body,
      market_id: market,
      development_id: containerKind === 'business' ? (body?.existingDevelopmentId || null) : null,
      actor_id: user.id,
      source: 'admin_orchestrator',
    });

    // 2. A development is the container the page speaks for. `createCompound`
    //    refuses a `page_business_id` from another market, which is exactly the
    //    guarantee we want here, and the business already exists, so the two ends
    //    of the link are valid the moment they are written.
    let development = null;
    if (containerKind === 'development') {
      const dev = body?.development || {};
      development = await createCompound({
        market,
        kind: dev.kind || 'compound',
        nameEn: dev.nameEn || business.name,
        nameAr: dev.nameAr || business.name_ar || dev.nameEn || business.name,
        locationId: dev.locationId || business.location_id || null,
        developerName: dev.developerName || business.name,
        deliveryYear: dev.deliveryYear,
        status: dev.status,
        pageBusinessId: business.id,
        active: true,
      });
      await execute('UPDATE businesses SET development_id = ? WHERE id = ?', [development.id, business.id]);
    }

    return NextResponse.json(
      {
        success: true,
        business: { ...business, development_id: development?.id ?? business.development_id },
        development,
      },
      { status: 201 }
    );
  } catch (error) {
    return failure(error);
  }
}
