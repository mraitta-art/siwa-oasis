import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { FIELD_TYPES } from '@/lib/governance/constants';
import { getFieldDefinitions, invalidateCache } from '@/lib/cache';

// Smart Registry: Bidirectional Sync between Library and Forms
export async function GET() {
  const fields = await getFieldDefinitions() as any[];
  
  // Self-Healing Governance: If registry is empty, seed it with master definitions
  if (fields.length === 0) {
    for (const [id, def] of Object.entries(FIELD_TYPES)) {
      await execute(
        'INSERT INTO field_definitions (id, name, icon, category, has_options, validation_type, search_mapping) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, def.name, def.icon, 'Standard', def.hasOptions ? 1 : 0, 'text', 'filter']
      );
    }
    
    // Invalidate and refetch
    invalidateCache.fieldDefinitions();
    return NextResponse.json(await getFieldDefinitions());
  }
  
  return NextResponse.json(fields);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, icon, category, has_options, validation_type, search_mapping } = body;
  
  await execute(
    'INSERT INTO field_definitions (id, name, icon, category, has_options, validation_type, search_mapping) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, icon, category || 'Standard', has_options ? 1 : 0, validation_type || 'text', search_mapping || 'none']
  );
  
  // Invalidate cache after mutation
  invalidateCache.fieldDefinitions();
  
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  
  await execute(`UPDATE field_definitions SET ${sets} WHERE id = ?`, [...values, id]);
  
  // Invalidate cache after mutation
  invalidateCache.fieldDefinitions();
  
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await execute('DELETE FROM field_definitions WHERE id = ?', [id]);
  
  // Invalidate cache after mutation
  invalidateCache.fieldDefinitions();
  
  return NextResponse.json({ success: true });
}
