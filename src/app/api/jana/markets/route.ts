import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  AdminDataError,
  createMarket,
  deleteMarket,
  listCompoundsAdmin,
  listGovernorates,
  listListingsAdmin,
  listMarketsAdmin,
  updateMarket,
} from '@/lib/markets-admin';

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
    return NextResponse.json(
      { error: 'That host, slug or location path is already in use.' },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * The whole hierarchy in one read: markets, their compounds, their listings,
 * plus the governorates a new market can be placed in.
 */
export async function GET() {
  try {
    await requireAdmin();
    const [markets, compounds, listings, governorates] = await Promise.all([
      listMarketsAdmin(),
      listCompoundsAdmin(),
      listListingsAdmin(),
      listGovernorates(),
    ]);
    return NextResponse.json({ markets, compounds, listings, governorates });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const created = await createMarket(body);
    return NextResponse.json({ success: true, ...created }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { slug, ...patch } = body || {};
    await updateMarket(slug, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const slug = request.nextUrl.searchParams.get('slug');
    await deleteMarket(slug || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
