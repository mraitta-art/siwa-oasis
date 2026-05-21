import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBusinessTypes, getBusinessTypeById, invalidateCache } from '@/lib/cache';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'jana_errors.log');
const log = (msg: string) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const type = await getBusinessTypeById(id);
      if (!type) return NextResponse.json({ error: 'Type not found' }, { status: 404 });
      return NextResponse.json(type);
    }

    const types = await getBusinessTypes(true);
    return NextResponse.json(types);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    log(`[TYPES POST] Attempt: ${JSON.stringify(body)}`);
    const { id, name, icon, icon_color, description, is_parent, parent_id, sections = [], own_sections = [], blueprint = null } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    await execute(
      `INSERT INTO business_types (id, name, icon, icon_color, description, is_parent, parent_id, sections, own_sections, blueprint, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, icon || 'fas fa-building', icon_color || '#8b5cf6', description || '', is_parent ? 1 : 0, is_parent ? null : (parent_id || null), JSON.stringify(sections), JSON.stringify(own_sections), JSON.stringify(blueprint), 99]
    );
    
    // Invalidate cache after mutation
    invalidateCache.businessTypes();
    
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) {
    log(`[TYPES POST ERROR] ${e.message} ${e.stack}`);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    log(`[TYPES PUT] Attempt: ${JSON.stringify(body)}`);
    const { id, name, icon, icon_color, description, is_parent, parent_id, active, sections, own_sections, blueprint } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await execute(
      `UPDATE business_types SET name=?, icon=?, icon_color=?, description=?, is_parent=?, parent_id=?, active=?, sections=?, own_sections=?, blueprint=? WHERE id=?`,
      [name, icon, icon_color, description, is_parent ? 1 : 0, is_parent ? null : (parent_id || null), active ? 1 : 0, JSON.stringify(sections || []), JSON.stringify(own_sections || []), JSON.stringify(blueprint || null), id]
    );
    
    // Invalidate cache after mutation
    invalidateCache.businessTypes();
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    log(`[TYPES PUT ERROR] ${e.message} ${e.stack}`);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await execute('DELETE FROM business_types WHERE id = ?', [id]);
    
    // Invalidate cache after mutation
    invalidateCache.businessTypes();
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
