import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const prefix = businessId ? `website_business_${businessId}_` : '';
    const results = await query(
      businessId
        ? 'SELECT type FROM website_configs WHERE type LIKE ? ORDER BY type ASC'
        : 'SELECT type FROM website_configs WHERE type LIKE "website_%" OR type LIKE "website_search_%" ORDER BY type ASC',
      businessId ? [`${prefix}website_%`] : []
    );
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
