import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'type_id required' }, { status: 400 });
    }

    const typeRows = await query<any>(
      'SELECT id, is_parent FROM business_types WHERE id = ? LIMIT 1',
      [typeId]
    );

    let sql = `
      SELECT b.id, b.name, b.type_id,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.description')),
          JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.about')),
          ''
        ) AS description,
        bt.name AS type_name,
        bt.parent_id AS parent_id
      FROM businesses b
      LEFT JOIN business_types bt ON bt.id = b.type_id
      WHERE b.type_id = ?
      ORDER BY b.name
      LIMIT 200
    `;

    if (typeRows[0]?.is_parent) {
      sql = `
        SELECT b.id, b.name, b.type_id,
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.description')),
            JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.about')),
            ''
          ) AS description,
          bt.name AS type_name,
          bt.parent_id AS parent_id
        FROM businesses b
        LEFT JOIN business_types bt ON bt.id = b.type_id
        WHERE b.type_id IN (
          SELECT id FROM business_types WHERE parent_id = ?
        )
        ORDER BY b.name
        LIMIT 200
      `;
    }

    const businesses = await query<any>(sql, [typeId]);

    return NextResponse.json(
      businesses.map((business) => ({
        id: business.id,
        name: business.name,
        type_id: business.type_id,
        type_name: business.type_name,
        description: business.description || '',
        parent_id: business.parent_id || null,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
