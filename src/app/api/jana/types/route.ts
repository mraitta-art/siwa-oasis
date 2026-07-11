export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBusinessTypes, getBusinessTypeById, invalidateCache } from '@/lib/cache';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'jana_errors.log');
const log = (msg: string) => {
  console.log(msg); // Always log to console for Vercel/Railway
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    // Ignore EROFS (Read-only file system on Vercel)
  }
};

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
    const { id, name, icon, icon_color, description, is_parent, parent_id, sections = [], own_sections = [] } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    // ✅ VALIDATION: Check for duplicate names
    const existingWithName = await query(
      'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    
    if (existingWithName.length > 0) {
      return NextResponse.json({
        error: `Type name "${name}" already exists as "${existingWithName[0].id}". Type names must be unique! Either use a different name or consolidate the types.`,
        existing_id: existingWithName[0].id
      }, { status: 400 });
    }

    await execute(
      `INSERT INTO business_types (id, name, icon, icon_color, description, is_parent, parent_id, sections, own_sections, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, icon || 'fas fa-building', icon_color || '#8b5cf6', description || '', is_parent ? 1 : 0, is_parent ? null : (parent_id || null), JSON.stringify(sections), JSON.stringify(own_sections), 99]
    );
    
    // Invalidate cache after mutation
    invalidateCache.businessTypes();
    
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) {
    const errorMsg = e.message || String(e);
    log(`[TYPES POST ERROR] ${errorMsg} ${e.stack || ''}`);
    
    if (errorMsg.includes('ER_DUP_ENTRY') || errorMsg.includes('Duplicate entry')) {
      return NextResponse.json({ 
        error: "DUPLICATE ID ALARM: This typology ID already exists! Please change the 'Database ID' manually to something unique." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    log(`[TYPES PUT] Attempt: ${JSON.stringify(body)}`);
    const { id, name, icon, icon_color, description, is_parent, parent_id, active, sections, own_sections } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // ✅ VALIDATION: Check for duplicate names (excluding current type)
    if (name) {
      const existingWithName = await query(
        'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?) AND id != ?',
        [name, id]
      );
      
      if (existingWithName.length > 0) {
        return NextResponse.json({
          error: `Type name "${name}" already exists as "${existingWithName[0].id}". Type names must be unique! Either use a different name or consolidate the types.`,
          existing_id: existingWithName[0].id
        }, { status: 400 });
      }
    }

    await execute(
      `UPDATE business_types SET name=?, icon=?, icon_color=?, description=?, is_parent=?, parent_id=?, active=?, sections=?, own_sections=? WHERE id=?`,
      [name, icon, icon_color, description, is_parent ? 1 : 0, is_parent ? null : (parent_id || null), active ? 1 : 0, JSON.stringify(sections || []), JSON.stringify(own_sections || []), id]
    );
    
    // Invalidate cache after mutation
    invalidateCache.businessTypes();
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const errorMsg = e.message || String(e);
    log(`[TYPES PUT ERROR] ${errorMsg} ${e.stack || ''}`);
    
    if (errorMsg.includes('ER_DUP_ENTRY') || errorMsg.includes('Duplicate entry')) {
      return NextResponse.json({ 
        error: "DUPLICATE ID ALARM: This typology ID already exists! Please change the 'Database ID' manually to something unique." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check if this is a parent type
    const [typeRow] = await query('SELECT is_parent FROM business_types WHERE id = ?', [id]);
    const isParent = typeRow && (typeRow.is_parent === 1 || typeRow.is_parent === true);

    if (isParent) {
      // 1. Get all children of this parent
      const children = await query('SELECT id FROM business_types WHERE parent_id = ?', [id]);
      for (const child of children) {
        // Cascade delete each child's form fields and sections first
        await execute('DELETE FROM form_fields WHERE business_type_id = ?', [child.id]);
        await execute('DELETE FROM sections WHERE business_type_id = ?', [child.id]);
      }
      // 2. Delete all children
      await execute('DELETE FROM business_types WHERE parent_id = ?', [id]);
    }

    // 3. Delete associated form fields of the type itself
    await execute('DELETE FROM form_fields WHERE business_type_id = ?', [id]);

    // 4. Delete associated sections of the type itself
    await execute('DELETE FROM sections WHERE business_type_id = ?', [id]);

    // 5. Remove this type's ID from sections/own_sections JSON arrays of ALL other types
    const allTypes = await query('SELECT id, sections, own_sections FROM business_types');
    for (const t of allTypes) {
      let secs = typeof t.sections === 'string' ? JSON.parse(t.sections || '[]') : (t.sections || []);
      let ownSecs = typeof t.own_sections === 'string' ? JSON.parse(t.own_sections || '[]') : (t.own_sections || []);
      const newSecs = secs.filter((s: string) => s !== id);
      const newOwnSecs = ownSecs.filter((s: string) => s !== id);
      if (newSecs.length !== secs.length || newOwnSecs.length !== ownSecs.length) {
        await execute(
          'UPDATE business_types SET sections = ?, own_sections = ? WHERE id = ?',
          [JSON.stringify(newSecs), JSON.stringify(newOwnSecs), t.id]
        );
      }
    }

    // 6. Delete the business type itself
    await execute('DELETE FROM business_types WHERE id = ?', [id]);

    // Invalidate all relevant caches
    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();

    return NextResponse.json({ 
      success: true, 
      message: isParent ? 'Parent and all children deleted.' : 'Type deleted.' 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
