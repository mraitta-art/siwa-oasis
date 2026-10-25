export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBusinessTypes, getBusinessTypeById, invalidateCache } from '@/lib/cache';
import { normalizeSectionIds } from '@/lib/section-registry';
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

/**
 * A category used to be global. `market_id` scopes it to one market, and ''
 * (what a <select> sends for "shared") has to read as NULL rather than as an
 * empty market slug.
 */
async function resolveMarketScope(value: unknown): Promise<string | null> {
  const scope = String(value ?? '').trim().toLowerCase();
  if (!scope) return null;
  const market = await query('SELECT slug FROM markets WHERE slug = ? LIMIT 1', [scope]);
  if (!market.length) {
    const error: any = new Error(`Market "${scope}" does not exist — create it under Markets first.`);
    error.status = 400;
    throw error;
  }
  return scope;
}

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
    const { id, name, name_ar, market_id, icon, icon_color, description, is_parent, parent_id, sections, own_sections = [], default_template_id = null } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });
    if (!is_parent && (!parent_id || parent_id === id)) {
      return NextResponse.json({ error: 'A child typology must be assigned to a valid parent category.' }, { status: 400 });
    }
    if (!is_parent) {
      const parent = await query('SELECT id, is_parent, active FROM business_types WHERE id = ?', [parent_id]);
      if (!parent.length || !parent[0].is_parent || !parent[0].active || parent_id === 'SECTION_TEMPLATE') {
        return NextResponse.json({ error: 'Selected parent category is not active or does not exist.' }, { status: 400 });
      }
    }

    const marketScope = await resolveMarketScope(market_id);
    const nameAr = String(name_ar ?? '').trim() || null;

    // ✅ VALIDATION: Check for duplicate names inside the same scope. "Villa" can
    // exist once per market, exactly like a listing slug.
    const existingWithName = await query(
      marketScope
        ? 'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?) AND market_id = ?'
        : 'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?) AND market_id IS NULL',
      marketScope ? [name, marketScope] : [name]
    );
    
    if (existingWithName.length > 0) {
      return NextResponse.json({
        error: `Type name "${name}" already exists as "${existingWithName[0].id}". Type names must be unique inside a market scope! Either use a different name or consolidate the types.`,
        existing_id: existingWithName[0].id
      }, { status: 400 });
    }

    // Auto-add default_template_id column if not present (self-healing)
    try {
      await execute(`ALTER TABLE business_types ADD COLUMN IF NOT EXISTS default_template_id VARCHAR(100) DEFAULT NULL`);
    } catch (e) { /* column may already exist */ }

    const assignedSections = is_parent ? normalizeSectionIds(sections, true) : normalizeSectionIds(sections);
    const assignedOwnSections = normalizeSectionIds(own_sections);
    await execute(
      `INSERT INTO business_types (id, name, name_ar, market_id, icon, icon_color, description, is_parent, parent_id, sections, own_sections, sort_order, default_template_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, nameAr, marketScope, icon || 'fas fa-building', icon_color || '#8b5cf6', description || '', is_parent ? 1 : 0, is_parent ? null : (parent_id || null), JSON.stringify(assignedSections), JSON.stringify(assignedOwnSections), 99, is_parent ? (default_template_id || null) : null]
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
    
    return NextResponse.json({ error: errorMsg }, { status: (e as any)?.status || 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    log(`[TYPES PUT] Attempt: ${JSON.stringify(body)}`);
    const {
      id, name, name_ar, market_id, icon, icon_color, description,
      is_parent, parent_id, active, sections, own_sections, default_template_id,
    } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const currentRows = await query('SELECT * FROM business_types WHERE id = ? LIMIT 1', [id]);
    const current: any = (currentRows as any[])[0];
    if (!current) return NextResponse.json({ error: 'Type not found' }, { status: 404 });

    // A partial PUT (the orphan-repair button sends only id/parent_id/is_parent)
    // must not blank the columns it never mentioned.
    const nextIsParent = is_parent !== undefined ? Boolean(is_parent) : Boolean(current.is_parent);
    const nextParent = parent_id !== undefined ? (parent_id || null) : current.parent_id;
    if (!nextIsParent && (!nextParent || nextParent === id)) {
      return NextResponse.json({ error: 'A child typology must be assigned to a valid parent category.' }, { status: 400 });
    }
    if (!nextIsParent) {
      const parent = await query('SELECT id, is_parent, active FROM business_types WHERE id = ?', [nextParent]);
      if (!parent.length || !parent[0].is_parent || !parent[0].active || nextParent === 'SECTION_TEMPLATE') {
        return NextResponse.json({ error: 'Selected parent category is not active or does not exist.' }, { status: 400 });
      }
    }

    const nextName = name !== undefined ? String(name) : String(current.name);
    const nextScope = market_id !== undefined ? await resolveMarketScope(market_id) : (current.market_id || null);

    // ✅ VALIDATION: Check for duplicate names (excluding current type)
    if (name) {
      const existingWithName = await query(
        nextScope
          ? 'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?) AND id <> ? AND market_id = ?'
          : 'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?) AND id <> ? AND market_id IS NULL',
        nextScope ? [name, id, nextScope] : [name, id]
      );
      
      if (existingWithName.length > 0) {
        return NextResponse.json({
          error: `Type name "${name}" already exists as "${existingWithName[0].id}". Type names must be unique! Either use a different name or consolidate the types.`,
          existing_id: existingWithName[0].id
        }, { status: 400 });
      }
    }

    // Auto-add default_template_id column if not present (self-healing)
    try {
      await execute(`ALTER TABLE business_types ADD COLUMN IF NOT EXISTS default_template_id VARCHAR(100) DEFAULT NULL`);
    } catch (e) { /* column may already exist */ }

    const sets: string[] = [];
    const params: any[] = [];
    const set = (column: string, value: any) => {
      sets.push(`${column} = ?`);
      params.push(value);
    };

    set('name', nextName);
    set('is_parent', nextIsParent ? 1 : 0);
    set('parent_id', nextIsParent ? null : nextParent);
    if (name_ar !== undefined) set('name_ar', String(name_ar ?? '').trim() || null);
    if (market_id !== undefined) set('market_id', nextScope);
    if (icon !== undefined) set('icon', icon || 'fas fa-building');
    if (icon_color !== undefined) set('icon_color', icon_color || '#8b5cf6');
    if (description !== undefined) set('description', description || '');
    if (active !== undefined) set('active', active ? 1 : 0);
    if (sections !== undefined) {
      set('sections', JSON.stringify(nextIsParent ? normalizeSectionIds(sections, true) : normalizeSectionIds(sections)));
    }
    if (own_sections !== undefined) set('own_sections', JSON.stringify(normalizeSectionIds(own_sections)));
    if (default_template_id !== undefined || is_parent !== undefined) {
      set('default_template_id', nextIsParent ? (default_template_id || null) : null);
    }

    params.push(id);
    await execute(`UPDATE business_types SET ${sets.join(', ')} WHERE id = ?`, params);
    
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
    
    return NextResponse.json({ error: errorMsg }, { status: (e as any)?.status || 500 });
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
