import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { BlueprintSchema } from '@/lib/governance/blueprint-core';

// GET /api/jana/blueprints/schema?type_id=hotel
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('type_id');
    if (!typeId) return NextResponse.json({ error: 'type_id required' }, { status: 400 });

    const row = await queryOne<{ blueprint_schema: string | null }>(
      'SELECT blueprint_schema FROM business_types WHERE id = ?',
      [typeId]
    );

    if (!row) return NextResponse.json({ error: 'Type not found' }, { status: 404 });

    const schema: BlueprintSchema = row.blueprint_schema
      ? JSON.parse(row.blueprint_schema)
      : { chapters: {} };

    return NextResponse.json(schema);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/jana/blueprints/schema — save blueprint schema for a type
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { type_id, schema }: { type_id: string; schema: BlueprintSchema } = body;
    if (!type_id || !schema) return NextResponse.json({ error: 'type_id and schema required' }, { status: 400 });

    await execute(
      'UPDATE business_types SET blueprint_schema = ? WHERE id = ?',
      [JSON.stringify(schema), type_id]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
