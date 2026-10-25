import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AdminDataError } from '@/lib/markets-admin';
import { createUnit, deleteUnit, listUnitsAdmin, updateUnit } from '@/lib/units-admin';

export const dynamic = 'force-dynamic';

function failure(error: any) {
  if (error instanceof AdminDataError) {
    return NextResponse.json({ error: error.message, rule: error.rule }, { status: error.status });
  }
  const message = error?.message || 'Unexpected error';
  if (/not authenticated|admin access required/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (error?.code === 'ER_DUP_ENTRY') {
    return NextResponse.json({ error: 'That unit slug is already taken.' }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Inventory of one container. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const development = String(request.nextUrl.searchParams.get('development') || '').trim();
    if (!development) {
      return NextResponse.json({ error: 'development is required' }, { status: 400 });
    }
    return NextResponse.json({ units: await listUnitsAdmin(development) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const created = await createUnit(body);
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...patch } = body || {};
    await updateUnit(id, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await deleteUnit(request.nextUrl.searchParams.get('id') || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
