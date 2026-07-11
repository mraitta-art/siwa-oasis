export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const sections = await query(
      'SELECT id, name, business_type_id FROM sections WHERE business_type_id IS NOT NULL AND business_type_id != "" AND business_type_id NOT IN (SELECT id FROM business_types)'
    );

    if (sections.length > 0) {
      await execute(
        'DELETE FROM sections WHERE business_type_id IS NOT NULL AND business_type_id != "" AND business_type_id NOT IN (SELECT id FROM business_types)'
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${sections.length} orphaned sections.`,
      orphans: sections
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
