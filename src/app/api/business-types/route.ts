import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isParent = searchParams.get('is_parent');
    const parentIds = searchParams.get('parent_ids');

    if (isParent === 'true') {
      const parentTypes = await query<any>(
        `SELECT * FROM business_types
         WHERE is_parent = TRUE AND active != FALSE
         ORDER BY sort_order, name`
      );

      return NextResponse.json(
        parentTypes.map((type) => ({
          id: type.id,
          name: type.name,
          icon: type.icon || 'fas fa-building',
          icon_color: type.icon_color || '#8b5cf6',
          is_parent: toBoolean(type.is_parent),
          parent_id: type.parent_id || null,
          description: type.description || '',
        }))
      );
    }

    if (parentIds) {
      const parentIdArray = parentIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (parentIdArray.length === 0) {
        return NextResponse.json([]);
      }

      const placeholders = parentIdArray.map(() => '?').join(',');
      const childTypes = await query<any>(
        `SELECT * FROM business_types
         WHERE parent_id IN (${placeholders}) AND active != FALSE
         ORDER BY sort_order, name`,
        parentIdArray
      );

      return NextResponse.json(
        childTypes.map((type) => ({
          id: type.id,
          name: type.name,
          icon: type.icon || 'fas fa-building',
          icon_color: type.icon_color || '#8b5cf6',
          is_parent: toBoolean(type.is_parent),
          parent_id: type.parent_id || null,
          description: type.description || '',
        }))
      );
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Failed to fetch business types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business types', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
