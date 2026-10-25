import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  AdminDataError,
  createCompound,
  deleteCompound,
  listCompoundsAdmin,
  updateCompound,
} from '@/lib/markets-admin';

export const dynamic = 'force-dynamic';

// The public read is `/api/developments` (GET only, active markets only). This
// namespace is the dashboard's write side, so it never shares a contract with
// the storefront and can answer for dark markets too.

function failure(error: any) {
  if (error instanceof AdminDataError) {
    return NextResponse.json({ error: error.message, rule: error.rule }, { status: error.status });
  }
  const message = error?.message || 'Unexpected error';
  if (/not authenticated|admin access required/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const market = request.nextUrl.searchParams.get('market');
    const compounds = await listCompoundsAdmin();
    return NextResponse.json({
      compounds: market ? compounds.filter((compound) => compound.marketId === market) : compounds,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const created = await createCompound(body);
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
    await updateCompound(id, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id');
    await deleteCompound(id || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
