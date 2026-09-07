import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(`
      SELECT b.id, b.name, b.slug, b.subscription_tier, b.status, b.published, b.is_published,
             b.template_id, mt.name AS template_name, p.email AS vendor_email, p.display_name AS vendor_name,
             COALESCE(vsc.qr_enabled, 1) AS qr_enabled,
             COALESCE(vsc.allow_section_label_edit, 0) AS allow_section_label_edit,
             COALESCE(vsc.minisite_status, IF(b.status = 'active', 'active', 'suspended')) AS minisite_status,
             vsc.services_expires_at, vsc.admin_note
      FROM businesses b
      LEFT JOIN profiles p ON p.id = b.vendor_id
      LEFT JOIN minisite_templates mt ON mt.id = b.template_id
      LEFT JOIN vendor_service_controls vsc ON vsc.business_id = b.id
      ORDER BY b.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { businessId, qrEnabled, allowSectionLabelEdit, minisiteStatus, servicesExpiresAt, adminNote } = body;
    if (!businessId) return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    if (minisiteStatus && !['active', 'suspended', 'expired'].includes(minisiteStatus)) {
      return NextResponse.json({ error: 'Invalid minisite status' }, { status: 400 });
    }

    await execute(
      `INSERT INTO vendor_service_controls (business_id, qr_enabled, allow_section_label_edit, minisite_status, services_expires_at, admin_note, updated_by)
       VALUES (?, COALESCE(?, TRUE), COALESCE(?, FALSE), COALESCE(?, 'active'), ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         qr_enabled = COALESCE(VALUES(qr_enabled), qr_enabled),
         allow_section_label_edit = COALESCE(VALUES(allow_section_label_edit), allow_section_label_edit),
         minisite_status = COALESCE(VALUES(minisite_status), minisite_status),
         services_expires_at = VALUES(services_expires_at),
         admin_note = VALUES(admin_note),
         updated_by = VALUES(updated_by)`,
      [businessId, typeof qrEnabled === 'boolean' ? (qrEnabled ? 1 : 0) : null, typeof allowSectionLabelEdit === 'boolean' ? (allowSectionLabelEdit ? 1 : 0) : null, minisiteStatus || null, servicesExpiresAt || null, adminNote || null, admin.id]
    );

    try {
      await execute(
        'INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), admin.id, admin.email, admin.role, 'update_vendor_services', `Updated service controls for business: ${businessId}`]
      );
    } catch (auditError) {
      console.warn('Audit logging skipped for vendor services update');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
