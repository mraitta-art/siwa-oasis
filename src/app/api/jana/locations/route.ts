import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AdminDataError } from '@/lib/markets-admin';
import {
  createLocation,
  deleteLocation,
  flattenGeo,
  listGeoTree,
  updateLocation,
} from '@/lib/geo-admin';

export const dynamic = 'force-dynamic';

// Geography is the level above a market, so it never appears on the storefront
// as data: the public site only ever sees the `path` of the place it renders.
// Every handler here is admin-only for that reason.

function failure(error: any) {
  if (error instanceof AdminDataError) {
    return NextResponse.json({ error: error.message, rule: error.rule }, { status: error.status });
  }
  const message = error?.message || 'Unexpected error';
  if (/not authenticated|admin access required/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (error?.code === 'ER_DUP_ENTRY') {
    return NextResponse.json(
      { error: 'That path or id is already taken by another place.' },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

/** The full country tree plus the flat form a `<select>` can use. */
export async function GET() {
  try {
    await requireAdmin();
    const tree = await listGeoTree();
    return NextResponse.json({ tree, options: flattenGeo(tree) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const created = await createLocation(body);
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
    await updateLocation(id, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id');
    await deleteLocation(id || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
