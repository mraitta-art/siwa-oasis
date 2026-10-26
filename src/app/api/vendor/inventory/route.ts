import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { AdminDataError, createCompound } from '@/lib/markets-admin';
import {
  createUnit,
  deleteUnit,
  listUnitsForBusiness,
  unitAdvisories,
  updateUnit,
} from '@/lib/units-admin';

export const dynamic = 'force-dynamic';

/**
 * A vendor's own inventory.
 *
 * Until now the offer terms of a project could only be typed by the market desk
 * (`/api/jana/units` is admin-only), which meant a developer with forty chalets
 * had to send a spreadsheet. This route is the same table with a fence around
 * it: a vendor sees and writes the units that carry their own `business_id`,
 * plus the units inside the container their page speaks for.
 */

interface Scope {
  businessId: string;
  business: any;
  development: any | null;
}

async function resolveScope(user: any, requestedBusinessId?: string | null): Promise<Scope> {
  const isAdmin = ['super_admin', 'content_admin'].includes(String(user?.role || ''));
  // An admin may open somebody else's inventory to fix it; a vendor never can.
  const businessId =
    isAdmin && String(requestedBusinessId || '').trim()
      ? String(requestedBusinessId).trim()
      : String(user?.businessId || '').trim();
  if (!businessId) throw new AdminDataError('This account is not linked to a business page yet.', 403);

  const business = (await queryOne(
    `SELECT b.id, b.slug, b.name, b.name_ar, b.type_id, b.market_id, b.development_id,
            bt.name AS type_name, bt.name_ar AS type_name_ar,
            m.currency AS market_currency, m.default_locale AS market_locale, m.name_en AS market_name
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.type_id
       LEFT JOIN markets m ON m.id = b.market_id
      WHERE b.id = ?
      LIMIT 1`,
    [businessId]
  )) as any;
  if (!business) throw new AdminDataError('The business behind this account no longer exists.', 404);

  // Two ways a page can own a container: the wizard filed the listing inside it
  // (`businesses.development_id`), or the page is the one that speaks for it
  // (`developments.page_business_id`). A developer hits the second, a broker the
  // first, and both should land on the same inventory.
  const development = (await queryOne(
    `SELECT d.id, d.slug, d.name_ar, d.name_en, d.kind, d.market_id, d.active, d.page_business_id
       FROM developments d
      WHERE d.id = ? OR d.page_business_id = ?
      LIMIT 1`,
    [String(business.development_id || ''), businessId]
  )) as any;

  return { businessId, business, development: development || null };
}

/** The unit must be mine, or sit inside my container. */
async function assertUnitOwnership(id: string, scope: Scope): Promise<any> {
  const unit = (await queryOne(
    'SELECT id, business_id, development_id FROM units WHERE id = ? LIMIT 1',
    [String(id || '').trim()]
  )) as any;
  if (!unit) throw new AdminDataError('Unit not found.', 404);
  const mine =
    String(unit.business_id || '') === scope.businessId ||
    (scope.development && String(unit.development_id || '') === String(scope.development.id));
  if (!mine) throw new AdminDataError('That unit belongs to another page.', 403);
  return unit;
}

function failure(error: any) {
  if (error instanceof AdminDataError) {
    return NextResponse.json({ error: error.message, rule: error.rule }, { status: error.status });
  }
  const message = error?.message || 'Unexpected error';
  if (/not authenticated|vendor access required/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();
    const scope = await resolveScope(user, request.nextUrl.searchParams.get('business'));
    const units = await listUnitsForBusiness(scope.businessId, scope.development?.id);
    return NextResponse.json({ business: scope.business, development: scope.development, units });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVendor();
    const body = await request.json().catch(() => ({}));
    const scope = await resolveScope(user, body?.business);

    if (body?.action === 'container') {
      if (scope.development) {
        return NextResponse.json(
          { error: 'This page already has a project. Ask the market desk to edit it.' },
          { status: 409 }
        );
      }
      // The container is created switched off: a vendor can prepare a project,
      // but only the market desk opens its public page.
      const created = await createCompound({
        market: body?.market || scope.business.market_id,
        nameEn: body?.nameEn,
        nameAr: body?.nameAr,
        kind: body?.kind || 'compound',
        developerName: body?.developerName || scope.business.name,
        deliveryYear: body?.deliveryYear,
        status: body?.status,
        pageBusinessId: scope.businessId,
        active: false,
      });
      return NextResponse.json({ success: true, ...created, pending_review: true }, { status: 201 });
    }

    if (!scope.development) {
      return NextResponse.json(
        {
          error:
            'Add the project this unit belongs to first — a unit needs a container to sit in.',
          rule: 'NO_CONTAINER',
        },
        { status: 400 }
      );
    }

    const created = await createUnit({
      ...body,
      developmentId: String(scope.development.id),
      // Every unit written here is signed to the page that wrote it.
      businessId: scope.businessId,
    });
    const row = await queryOne(
      `SELECT listing_kind, price, unit_type, bedrooms, area_sqm, deposit, deposit_months,
              price_per_sqm, down_payment_pct, installment_years, delivery_year
         FROM units WHERE id = ? LIMIT 1`,
      [created.id]
    );
    return NextResponse.json({ success: true, ...created, warnings: unitAdvisories(row) }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireVendor();
    const body = await request.json().catch(() => ({}));
    const { id, business: requestedBusiness, action, ...patch } = body || {};
    const scope = await resolveScope(user, requestedBusiness);
    if (action) {
      return NextResponse.json({ error: 'Unknown inventory action.' }, { status: 400 });
    }
    await assertUnitOwnership(id, scope);
    // The container and the signature are never editable from here: a vendor
    // cannot hand their units to another page, or move them into a project.
    delete patch.developmentId;
    delete patch.development_id;
    delete patch.businessId;
    delete patch.business_id;
    await updateUnit(id, patch);
    const row = await queryOne(
      `SELECT listing_kind, price, unit_type, bedrooms, area_sqm, deposit, deposit_months,
              price_per_sqm, down_payment_pct, installment_years, delivery_year
         FROM units WHERE id = ? LIMIT 1`,
      [String(id)]
    );
    return NextResponse.json({ success: true, warnings: unitAdvisories(row) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireVendor();
    const scope = await resolveScope(user, request.nextUrl.searchParams.get('business'));
    const id = request.nextUrl.searchParams.get('id') || '';
    await assertUnitOwnership(id, scope);
    await deleteUnit(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
