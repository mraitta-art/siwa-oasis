import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/jana/types/verify/duplicates
 * Check for duplicate type names and dependencies
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Get all types
    const types = await query('SELECT id, name, is_parent, parent_id FROM business_types ORDER BY name');

    // Check for duplicate names
    const nameMap = new Map<string, string[]>();
    types.forEach((t: any) => {
      if (!nameMap.has(t.name)) {
        nameMap.set(t.name, []);
      }
      nameMap.get(t.name)!.push(t.id);
    });

    const duplicates = Array.from(nameMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, ids, count: ids.length }));

    // Check for orphaned children (children without parent)
    const orphaned = types.filter((t: any) => !t.is_parent && !types.some((p: any) => p.id === t.parent_id));

    // Get dependency counts for each type
    const typeDeps = await Promise.all(
      types.map(async (t: any) => {
        const businessCount = await query('SELECT COUNT(*) as count FROM businesses WHERE type_id = ?', [t.id]);
        const childCount = types.filter((child: any) => child.parent_id === t.id).length;
        return {
          id: t.id,
          name: t.name,
          isParent: t.is_parent,
          parentId: t.parent_id,
          businesses: businessCount[0]?.count || 0,
          children: childCount
        };
      })
    );

    return NextResponse.json({
      total: types.length,
      duplicates: duplicates.length > 0 ? duplicates : [],
      orphaned: orphaned.length > 0 ? orphaned : [],
      dependencies: typeDeps,
      allTypes: types
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
