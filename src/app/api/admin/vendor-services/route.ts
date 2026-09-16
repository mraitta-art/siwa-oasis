import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { normalizeAudienceScopes, normalizePlacements } from '@/lib/vendor-service-policy';
import { randomUUID } from 'crypto';

const STATUSES = ['draft', 'pending_approval', 'published', 'rejected', 'suspended'] as const;
const BOOKING_MODES = ['request', 'book', 'contact'] as const;

function errorResponse(error: any) {
  const message = error?.message || 'Vendor service governance failed';
  const status = message.includes('Not authenticated') ? 401 : message.includes('Admin access required') ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const params = request.nextUrl.searchParams;
    const status = params.get('status');
    const category = params.get('category');
    const businessId = params.get('business_id');
    let sql = `
      SELECT vs.*, b.name AS business_name, b.slug AS business_slug,
              p.display_name AS vendor_name, p.email AS vendor_email,
              (SELECT action FROM vendor_service_audit_log vsa WHERE vsa.service_id = vs.id ORDER BY vsa.created_at DESC LIMIT 1) AS last_audit_action,
              (SELECT note FROM vendor_service_audit_log vsa WHERE vsa.service_id = vs.id ORDER BY vsa.created_at DESC LIMIT 1) AS last_audit_note,
              (SELECT created_at FROM vendor_service_audit_log vsa WHERE vsa.service_id = vs.id ORDER BY vsa.created_at DESC LIMIT 1) AS last_audit_at
      FROM vendor_services vs
      JOIN businesses b ON b.id = vs.business_id
      LEFT JOIN profiles p ON p.id = b.vendor_id
      WHERE 1 = 1`;
    const values: string[] = [];
    if (status && STATUSES.includes(status as any)) { sql += ' AND vs.approval_status = ?'; values.push(status); }
    if (category) { sql += ' AND vs.category = ?'; values.push(category); }
    if (businessId) { sql += ' AND vs.business_id = ?'; values.push(businessId); }
    sql += ' ORDER BY FIELD(vs.approval_status, \'pending_approval\', \'published\', \'draft\', \'rejected\', \'suspended\'), vs.updated_at DESC LIMIT 300';
    const services = await query(sql, values);
    const categories = await query('SELECT id, label, description, active, sort_order FROM vendor_service_categories WHERE active = TRUE ORDER BY sort_order, label');
    return NextResponse.json({ services, categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const serviceId = String(body.id || '');
    if (!serviceId) return NextResponse.json({ error: 'Service id is required' }, { status: 400 });

    const existingRows = await query<any>('SELECT * FROM vendor_services WHERE id = ? LIMIT 1', [serviceId]);
    if (!existingRows.length) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    const existing = existingRows[0];
    const status = STATUSES.includes(body.approval_status) ? body.approval_status : existing.approval_status;
    const bookingMode = BOOKING_MODES.includes(body.booking_mode) ? body.booking_mode : existing.booking_mode;
    const audienceScopes = body.audience_scopes === undefined ? normalizeAudienceScopes(existing.audience_scopes) : normalizeAudienceScopes(body.audience_scopes);
    const placements = body.placements === undefined ? normalizePlacements(existing.placements) : normalizePlacements(body.placements);
    const after = {
      approval_status: status,
      category: body.category || existing.category,
      audience_scopes: audienceScopes,
      placements,
      booking_mode: bookingMode,
      package_eligible: body.package_eligible === undefined ? Boolean(existing.package_eligible) : Boolean(body.package_eligible),
      valid_from: body.valid_from || existing.valid_from || null,
      valid_until: body.valid_until || existing.valid_until || null,
      rejection_note: body.rejection_note || null,
    };

    await execute(
      `UPDATE vendor_services SET approval_status = ?, category = ?, audience_scopes = ?, placements = ?, booking_mode = ?, package_eligible = ?, valid_from = ?, valid_until = ?, rejection_note = ?, approved_by = ?, approved_at = ? WHERE id = ?`,
      [after.approval_status, after.category, JSON.stringify(after.audience_scopes), JSON.stringify(after.placements), after.booking_mode, after.package_eligible ? 1 : 0, after.valid_from, after.valid_until, after.rejection_note, status === 'published' ? admin.id : null, status === 'published' ? new Date() : null, serviceId]
    );
    await execute(
      `INSERT INTO vendor_service_audit_log (id, service_id, admin_id, action, before_data, after_data, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), serviceId, admin.id, 'governance_update', JSON.stringify({ approval_status: existing.approval_status, audience_scopes: normalizeAudienceScopes(existing.audience_scopes), placements: normalizePlacements(existing.placements) }), JSON.stringify(after), body.note || null]
    );
    return NextResponse.json({ success: true, service: { ...existing, ...after } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = String(body.id || '').trim();
    const label = String(body.label || '').trim();
    if (!id || !label) return NextResponse.json({ error: 'Category id and label are required' }, { status: 400 });
    await execute(
      `INSERT INTO vendor_service_categories (id, label, description, sort_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), sort_order = VALUES(sort_order), active = TRUE`,
      [id.toLowerCase().replace(/[^a-z0-9_]+/g, '_'), label, body.description || null, Number(body.sort_order) || 100]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}