import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AdminDataError } from '@/lib/markets-admin';
import {
  createDeveloper,
  deleteDeveloper,
  listDevelopersAdmin,
  updateDeveloper,
} from '@/lib/developers-admin';

export const dynamic = 'force-dynamic';

// The developer write side lives under the dashboard namespace, exactly like
// `/api/jana/developments`. A public read is not exposed here: the storefront
// resolves a developer by slug through `developers.ts`, so this contract stays
// free to answer for inactive developers and root placements.

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

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ developers: await listDevelopersAdmin() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const created = await createDeveloper(body);
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
    await updateDeveloper(id, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id');
    await deleteDeveloper(id || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
