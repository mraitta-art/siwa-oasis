import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    await requireAdmin();
    const templates = await query<any>(
      `SELECT mt.id, mt.name, mt.category_id, mt.tier, mt.settings,
              GROUP_CONCAT(DISTINCT sta.tier_id) AS eligible_tiers
       FROM minisite_templates mt
       LEFT JOIN minisite_template_tier_access sta ON sta.template_id = mt.id
       GROUP BY mt.id, mt.name, mt.category_id, mt.tier, mt.settings
       ORDER BY mt.name`
    );
    return NextResponse.json(templates.map(template => ({
      ...template,
      settings: typeof template.settings === 'string' ? JSON.parse(template.settings) : template.settings || {},
      eligible_tiers: template.eligible_tiers ? template.eligible_tiers.split(',') : [],
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { templateId, tierIds, tierId, businessId, featureGroups } = body;
    if (!templateId) return NextResponse.json({ error: 'templateId is required' }, { status: 400 });

    if (Array.isArray(featureGroups)) {
      const current = await query<any>('SELECT settings FROM minisite_templates WHERE id = ?', [templateId]);
      const currentSettings = current[0]?.settings;
      const settings = typeof currentSettings === 'string' ? JSON.parse(currentSettings) : currentSettings || {};
      await execute('UPDATE minisite_templates SET settings = ? WHERE id = ?', [JSON.stringify({ ...settings, feature_groups: featureGroups }), templateId]);
    }

    if (Array.isArray(tierIds)) {
      await execute('DELETE FROM minisite_template_tier_access WHERE template_id = ?', [templateId]);
      for (const tierId of tierIds) {
        await execute('INSERT INTO minisite_template_tier_access (template_id, tier_id) VALUES (?, ?)', [templateId, tierId]);
      }
    }

    if (tierId) {
      await execute('INSERT IGNORE INTO minisite_template_tier_access (template_id, tier_id) VALUES (?, ?)', [templateId, tierId]);
    }

    if (businessId) {
      await execute(
        `INSERT INTO vendor_template_assignments (business_id, template_id, assignment_source, assigned_by)
         VALUES (?, ?, 'admin', ?)
         ON DUPLICATE KEY UPDATE template_id = VALUES(template_id), assignment_source = 'admin', assigned_by = VALUES(assigned_by), assigned_at = CURRENT_TIMESTAMP`,
        [businessId, templateId, admin.id]
      );
      await execute('UPDATE businesses SET template_id = ? WHERE id = ?', [templateId, businessId]);
    }

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), admin.id, admin.email, admin.role, 'update_template_governance', `Updated template governance for ${templateId}`
      ]);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
