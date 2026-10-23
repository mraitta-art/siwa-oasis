import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TARGET_SCOPES = ['parent_only', 'children_only', 'both'];
const CTA_TYPES = ['claim_profile', 'preview_minisite', 'register'];

function errorResponse(error: any) {
  const message = String(error?.message || 'Outreach template request failed');
  const status = message === 'Not authenticated'
    ? 401
    : message.includes('Admin access required')
      ? 403
      : 500;
  return NextResponse.json({ error: message }, { status });
}

/** Accept an array or a newline/comma separated string; store a clean JSON array. */
function normalizeFeatures(value: unknown): string | null {
  let list: string[] = [];
  if (Array.isArray(value)) {
    list = value.map((f) => String(f).trim()).filter(Boolean);
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        list = parsed.map((f: any) => String(f).trim()).filter(Boolean);
      } else {
        list = value.split(/[\n,]+/).map((f) => f.trim()).filter(Boolean);
      }
    } catch {
      list = value.split(/[\n,]+/).map((f) => f.trim()).filter(Boolean);
    }
  }
  return list.length > 0 ? JSON.stringify(list) : null;
}

function parseJsonField(value: any) {
  if (typeof value !== 'string') return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * GET /api/jana/outreach/templates
 * List outreach templates. Optional filters: business_type_id, include_inactive=1.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessTypeId = searchParams.get('business_type_id');
    const includeInactive = searchParams.get('include_inactive') === '1';

    const conditions: string[] = [];
    const params: any[] = [];
    if (!includeInactive) conditions.push('t.is_active = 1');
    if (businessTypeId) {
      conditions.push('t.business_type_id = ?');
      params.push(businessTypeId);
    }

    const rows = await query<any>(
      `SELECT t.id, t.business_type_id, t.target_scope, t.template_name,
              t.message_subject_en, t.message_subject_ar,
              t.message_body_en, t.message_body_ar,
              t.included_features, t.cta_type, t.minisite_template_id,
              t.is_active, t.created_by, t.created_at, t.updated_at,
              bt.name AS business_type_name, bt.parent_id AS business_type_parent_id,
              mt.name AS minisite_template_name,
              usage_stats.times_used, usage_stats.last_used_at
       FROM outreach_templates t
       LEFT JOIN business_types bt ON bt.id = t.business_type_id
       LEFT JOIN minisite_templates mt ON mt.id = t.minisite_template_id
       LEFT JOIN (
         SELECT JSON_UNQUOTE(JSON_EXTRACT(h.layout, '$.outreach.template_id')) AS template_id,
                COUNT(*) AS times_used,
                MAX(h.updated_at) AS last_used_at
         FROM minisite_vendor_handoffs h
         WHERE JSON_EXTRACT(h.layout, '$.outreach.template_id') IS NOT NULL
         GROUP BY JSON_UNQUOTE(JSON_EXTRACT(h.layout, '$.outreach.template_id'))
       ) usage_stats ON usage_stats.template_id = t.id
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY t.updated_at DESC
       LIMIT 500`,
      params
    );

    return NextResponse.json({
      templates: rows.map((row: any) => ({
        ...row,
        included_features: parseJsonField(row.included_features) || [],
        times_used: Number(row.times_used || 0),
      })),
    });
  } catch (error: any) {
    console.error('[jana/outreach/templates GET]', error);
    return errorResponse(error);
  }
}

/**
 * POST /api/jana/outreach/templates
 * Create an outreach template.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const businessTypeId = String(body.business_type_id || '').trim();
    const templateName = String(body.template_name || '').trim().slice(0, 255);
    const targetScope = String(body.target_scope || 'both').trim();
    const ctaType = String(body.cta_type || 'claim_profile').trim();

    if (!businessTypeId) {
      return NextResponse.json({ error: 'business_type_id is required' }, { status: 400 });
    }
    if (!templateName) {
      return NextResponse.json({ error: 'template_name is required' }, { status: 400 });
    }
    if (!TARGET_SCOPES.includes(targetScope)) {
      return NextResponse.json({ error: `target_scope must be one of: ${TARGET_SCOPES.join(', ')}` }, { status: 400 });
    }
    if (!CTA_TYPES.includes(ctaType)) {
      return NextResponse.json({ error: `cta_type must be one of: ${CTA_TYPES.join(', ')}` }, { status: 400 });
    }

    const businessType = await queryOne<any>(
      'SELECT id FROM business_types WHERE id = ? LIMIT 1',
      [businessTypeId]
    );
    if (!businessType) {
      return NextResponse.json({ error: 'Business type not found' }, { status: 404 });
    }

    const minisiteTemplateId = String(body.minisite_template_id || '').trim() || null;
    if (minisiteTemplateId) {
      const minisiteTemplate = await queryOne<any>(
        'SELECT id FROM minisite_templates WHERE id = ? LIMIT 1',
        [minisiteTemplateId]
      );
      if (!minisiteTemplate) {
        return NextResponse.json({ error: 'Linked minisite template not found' }, { status: 404 });
      }
    }

    const id = randomUUID();
    await execute(
      `INSERT INTO outreach_templates
         (id, business_type_id, target_scope, template_name,
          message_subject_en, message_subject_ar, message_body_en, message_body_ar,
          included_features, cta_type, minisite_template_id, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        businessTypeId,
        targetScope,
        templateName,
        String(body.message_subject_en || '').trim() || null,
        String(body.message_subject_ar || '').trim() || null,
        String(body.message_body_en || '').trim() || null,
        String(body.message_body_ar || '').trim() || null,
        normalizeFeatures(body.included_features),
        ctaType,
        minisiteTemplateId,
        body.is_active === 0 || body.is_active === false ? 0 : 1,
        admin.id,
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    console.error('[jana/outreach/templates POST]', error);
    return errorResponse(error);
  }
}

/**
 * PUT /api/jana/outreach/templates
 * Update an existing outreach template. Body must include id.
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await queryOne<any>(
      'SELECT id FROM outreach_templates WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing) {
      return NextResponse.json({ error: 'Outreach template not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (body.business_type_id !== undefined) {
      const businessTypeId = String(body.business_type_id || '').trim();
      if (!businessTypeId) {
        return NextResponse.json({ error: 'business_type_id cannot be empty' }, { status: 400 });
      }
      const businessType = await queryOne<any>(
        'SELECT id FROM business_types WHERE id = ? LIMIT 1',
        [businessTypeId]
      );
      if (!businessType) {
        return NextResponse.json({ error: 'Business type not found' }, { status: 404 });
      }
      updates.push('business_type_id = ?');
      params.push(businessTypeId);
    }

    if (body.template_name !== undefined) {
      const templateName = String(body.template_name || '').trim().slice(0, 255);
      if (!templateName) {
        return NextResponse.json({ error: 'template_name cannot be empty' }, { status: 400 });
      }
      updates.push('template_name = ?');
      params.push(templateName);
    }

    if (body.target_scope !== undefined) {
      const targetScope = String(body.target_scope || '').trim();
      if (!TARGET_SCOPES.includes(targetScope)) {
        return NextResponse.json({ error: `target_scope must be one of: ${TARGET_SCOPES.join(', ')}` }, { status: 400 });
      }
      updates.push('target_scope = ?');
      params.push(targetScope);
    }

    if (body.cta_type !== undefined) {
      const ctaType = String(body.cta_type || '').trim();
      if (!CTA_TYPES.includes(ctaType)) {
        return NextResponse.json({ error: `cta_type must be one of: ${CTA_TYPES.join(', ')}` }, { status: 400 });
      }
      updates.push('cta_type = ?');
      params.push(ctaType);
    }

    if (body.minisite_template_id !== undefined) {
      const minisiteTemplateId = String(body.minisite_template_id || '').trim() || null;
      if (minisiteTemplateId) {
        const minisiteTemplate = await queryOne<any>(
          'SELECT id FROM minisite_templates WHERE id = ? LIMIT 1',
          [minisiteTemplateId]
        );
        if (!minisiteTemplate) {
          return NextResponse.json({ error: 'Linked minisite template not found' }, { status: 404 });
        }
      }
      updates.push('minisite_template_id = ?');
      params.push(minisiteTemplateId);
    }

    if (body.message_subject_en !== undefined) {
      updates.push('message_subject_en = ?');
      params.push(String(body.message_subject_en || '').trim() || null);
    }
    if (body.message_subject_ar !== undefined) {
      updates.push('message_subject_ar = ?');
      params.push(String(body.message_subject_ar || '').trim() || null);
    }
    if (body.message_body_en !== undefined) {
      updates.push('message_body_en = ?');
      params.push(String(body.message_body_en || '').trim() || null);
    }
    if (body.message_body_ar !== undefined) {
      updates.push('message_body_ar = ?');
      params.push(String(body.message_body_ar || '').trim() || null);
    }
    if (body.included_features !== undefined) {
      updates.push('included_features = ?');
      params.push(normalizeFeatures(body.included_features));
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active === 0 || body.is_active === false ? 0 : 1);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    params.push(id);
    await execute(
      `UPDATE outreach_templates SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[jana/outreach/templates PUT]', error);
    return errorResponse(error);
  }
}

/**
 * DELETE /api/jana/outreach/templates?id=...
 * Soft-delete: deactivate the template so historic sends stay traceable.
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await execute(
      'UPDATE outreach_templates SET is_active = 0 WHERE id = ?',
      [id]
    );
    if (!result.affectedRows) {
      return NextResponse.json({ error: 'Outreach template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[jana/outreach/templates DELETE]', error);
    return errorResponse(error);
  }
}
