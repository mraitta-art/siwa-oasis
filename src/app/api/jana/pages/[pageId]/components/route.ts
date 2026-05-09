import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: Get all components assigned to a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;

    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType') || 'website';

    const components = await query(
      `SELECT pc.*, cl.name as component_name, cl.type as component_type, 
              cl.category, cl.thumbnail, cl.description, cl.config as base_config
       FROM page_components pc
       JOIN component_library cl ON pc.component_library_id = cl.id
       WHERE pc.page_id = ? AND pc.page_type = ? AND pc.is_active = TRUE
       ORDER BY pc.section, pc.position`,
      [resolvedParams.pageId, pageType]
    );

    return NextResponse.json(components);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Assign component to page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const body = await request.json();
    const {
      component_library_id,
      section = 'body',
      position = 0,
      custom_overrides = {},
      page_type = 'website'
    } = body;

    if (!component_library_id) {
      return NextResponse.json(
        { error: 'component_library_id is required' },
        { status: 400 }
      );
    }

    // Check if component exists
    const component = await query(
      'SELECT * FROM component_library WHERE id = ? AND is_active = TRUE',
      [component_library_id]
    );

    if (component.length === 0) {
      return NextResponse.json(
        { error: 'Component not found or inactive' },
        { status: 404 }
      );
    }

    // Insert assignment
    const result = await query(
      `INSERT INTO page_components 
       (page_id, page_type, component_library_id, section, position, custom_overrides)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resolvedParams.pageId, page_type, component_library_id, section, position, JSON.stringify(custom_overrides)]
    );

    // Update usage count
    await query(
      'UPDATE component_library SET usage_count = usage_count + 1 WHERE id = ?',
      [component_library_id]
    );

    // Log assignment
    await query(
      `INSERT INTO component_usage_log (component_library_id, page_id, action)
       VALUES (?, ?, 'assigned')`,
      [component_library_id, resolvedParams.pageId]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Component assigned to page'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update component assignment (position, overrides)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const body = await request.json();
    const { assignment_id, position, custom_overrides, section } = body;

    if (!assignment_id) {
      return NextResponse.json(
        { error: 'assignment_id is required' },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (position !== undefined) {
      fields.push('position = ?');
      values.push(position);
    }
    if (custom_overrides !== undefined) {
      fields.push('custom_overrides = ?');
      values.push(JSON.stringify(custom_overrides));
    }
    if (section !== undefined) {
      fields.push('section = ?');
      values.push(section);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(assignment_id);

    await query(
      `UPDATE page_components SET ${fields.join(', ')} WHERE id = ? AND page_id = ?`,
      [...values, resolvedParams.pageId]
    );

    return NextResponse.json({ success: true, message: 'Component assignment updated' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove component from page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'assignmentId query parameter is required' },
        { status: 400 }
      );
    }

    // Get component_library_id before deleting
    const assignment = await query(
      'SELECT component_library_id FROM page_components WHERE id = ? AND page_id = ?',
      [assignmentId, resolvedParams.pageId]
    );

    if (assignment.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete assignment
    await query('DELETE FROM page_components WHERE id = ? AND page_id = ?', [assignmentId, resolvedParams.pageId]);

    // Update usage count
    await query(
      'UPDATE component_library SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
      [assignment[0].component_library_id]
    );

    // Log removal
    await query(
      `INSERT INTO component_usage_log (component_library_id, page_id, action)
       VALUES (?, ?, 'removed')`,
      [assignment[0].component_library_id, resolvedParams.pageId]
    );

    return NextResponse.json({ success: true, message: 'Component removed from page' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
