import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_SEED_ATOMS } from '@/lib/governance/blueprint-core';
import { v4 as uuidv4 } from 'uuid';

// GET  /api/jana/blueprints/atoms?chapter=amenities&layer=1&active=true
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const chapter = searchParams.get('chapter');
    const layer = searchParams.get('layer');
    const activeOnly = searchParams.get('active') !== 'false';

    let sql = 'SELECT * FROM blueprint_atoms WHERE 1=1';
    const params: any[] = [];

    if (chapter) { sql += ' AND chapter = ?'; params.push(chapter); }
    if (layer !== null) { sql += ' AND layer_default = ?'; params.push(Number(layer)); }
    if (activeOnly) { sql += ' AND active = 1'; }
    sql += ' ORDER BY chapter, sort_order, id';

    const atoms = await query(sql, params);

    // Parse JSON columns
    const parsed = atoms.map((a: any) => ({
      ...a,
      options: a.options_json ? JSON.parse(a.options_json) : undefined,
      validation: a.validation_json ? JSON.parse(a.validation_json) : undefined,
      tags: a.tags_json ? JSON.parse(a.tags_json) : [],
    }));

    // Count usage per atom
    const usageCounts = await query(
      `SELECT bt.id as type_id, bt.blueprint_schema FROM business_types WHERE blueprint_schema IS NOT NULL`
    );

    const usageMap: Record<string, number> = {};
    for (const row of usageCounts as any[]) {
      try {
        const schema = JSON.parse(row.blueprint_schema);
        const chapters = schema?.chapters || {};
        for (const ch of Object.values(chapters) as any) {
          for (const id of [...(ch.layer1 || []), ...(ch.layer2 || [])]) {
            usageMap[id] = (usageMap[id] || 0) + 1;
          }
        }
      } catch {}
    }

    return NextResponse.json(parsed.map((a: any) => ({ ...a, usage_count: usageMap[a.id] || 0 })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/jana/blueprints/atoms — create new atom
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    // Handle "seed" action
    if (body.action === 'seed') {
      let seeded = 0;
      for (const atom of DEFAULT_SEED_ATOMS) {
        try {
          await execute(
            `INSERT IGNORE INTO blueprint_atoms 
             (id, label, type, chapter, options_json, validation_json, display_hint, icon, layer_default, tags_json, sort_order, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              atom.id, atom.label, atom.type, atom.chapter,
              atom.options ? JSON.stringify(atom.options) : null,
              atom.validation ? JSON.stringify(atom.validation) : null,
              atom.display_hint || null,
              atom.icon || null,
              atom.layer_default ?? 1,
              atom.tags ? JSON.stringify(atom.tags) : null,
              atom.sort_order ?? 0,
            ]
          );
          seeded++;
        } catch {}
      }
      return NextResponse.json({ seeded });
    }

    const { id, label, type, chapter, options, validation, display_hint, icon, layer_default, tags, sort_order } = body;
    if (!id || !label || !type || !chapter) {
      return NextResponse.json({ error: 'id, label, type, chapter are required' }, { status: 400 });
    }

    await execute(
      `INSERT INTO blueprint_atoms 
       (id, label, type, chapter, options_json, validation_json, display_hint, icon, layer_default, tags_json, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id, label, type, chapter,
        options ? JSON.stringify(options) : null,
        validation ? JSON.stringify(validation) : null,
        display_hint || null,
        icon || null,
        layer_default ?? 1,
        tags ? JSON.stringify(tags) : null,
        sort_order ?? 0,
      ]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes('Duplicate entry')) {
      return NextResponse.json({ error: `Atom ID "${(e.message.match(/Duplicate entry '([^']+)'/) || [])[1]}" already exists.` }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/jana/blueprints/atoms — update atom
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, label, type, chapter, options, validation, display_hint, icon, layer_default, tags, sort_order, active } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await execute(
      `UPDATE blueprint_atoms SET
       label=?, type=?, chapter=?, options_json=?, validation_json=?, 
       display_hint=?, icon=?, layer_default=?, tags_json=?, sort_order=?, active=?, updated_at=NOW()
       WHERE id=?`,
      [
        label, type, chapter,
        options ? JSON.stringify(options) : null,
        validation ? JSON.stringify(validation) : null,
        display_hint || null,
        icon || null,
        layer_default ?? 1,
        tags ? JSON.stringify(tags) : null,
        sort_order ?? 0,
        active !== false ? 1 : 0,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/jana/blueprints/atoms?id=wifi — soft delete
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Soft delete — preserve references in existing blueprints
    await execute('UPDATE blueprint_atoms SET active=0, updated_at=NOW() WHERE id=?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
