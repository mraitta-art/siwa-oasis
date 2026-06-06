import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * PUBLIC Business Types API — for vendor signup only.
 * No authentication required.
 * Returns all active types (parents + children) for category selection.
 */
export async function GET() {
  try {
    const types = await query(
      `SELECT id, name, icon, icon_color, description, is_parent, parent_id
       FROM business_types
       WHERE active = TRUE
       ORDER BY is_parent DESC, sort_order ASC, name ASC`
    );

    // Parse JSON icon_color if needed and return clean shape
    const clean = (types as any[]).map((t) => ({
      id:          t.id,
      name:        t.name,
      icon:        t.icon        || 'fas fa-building',
      icon_color:  t.icon_color  || '#D4AF37',
      description: t.description || '',
      is_parent:   !!t.is_parent,
      parent_id:   t.parent_id  || null,
    }));

    return NextResponse.json(clean);
  } catch (error: any) {
    console.error('[signup/types] Error:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
