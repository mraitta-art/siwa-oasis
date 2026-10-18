import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();

    // 1. Fetch parent business types
    const parentTypes = await query<any>(
      `SELECT id, name, icon, icon_color, description, sort_order 
       FROM business_types 
       WHERE (is_parent = TRUE OR parent_id IS NULL) AND active != FALSE 
       ORDER BY sort_order, name`
    ).catch(() => []);

    // 2. Fetch child business types
    const childTypes = await query<any>(
      `SELECT id, name, parent_id, icon, icon_color, description 
       FROM business_types 
       WHERE (is_parent = FALSE OR is_parent IS NULL) AND parent_id IS NOT NULL AND active != FALSE 
       ORDER BY sort_order, name`
    ).catch(() => []);

    // 3. Fetch all active registered businesses
    let bizSql = `
      SELECT b.id, b.name, b.slug, b.type_id, b.phone, b.whatsapp, b.is_trusted,
             bt.name AS type_name, bt.parent_id AS parent_type_id
      FROM businesses b
      LEFT JOIN business_types bt ON bt.id = b.type_id
      WHERE b.name IS NOT NULL AND b.name != ''
    `;
    const params: any[] = [];

    if (search) {
      bizSql += ` AND (LOWER(b.name) LIKE ? OR LOWER(b.slug) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    bizSql += ` ORDER BY b.is_trusted DESC, b.name ASC LIMIT 300`;

    const businesses = await query<any>(bizSql, params).catch(() => []);

    return NextResponse.json({
      success: true,
      parents: Array.isArray(parentTypes) ? parentTypes : [],
      children: Array.isArray(childTypes) ? childTypes : [],
      businesses: Array.isArray(businesses) ? businesses : [],
    });
  } catch (err: any) {
    console.error('Failed to fetch businesses hierarchy:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch businesses hierarchy' },
      { status: 500 }
    );
  }
}
