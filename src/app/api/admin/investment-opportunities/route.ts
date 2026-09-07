import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const SECTION_ID = 'investment-opportunity';
const ALLOWED_TYPES = ['equity', 'partnership', 'franchise', 'joint_venture', 'sponsorship'];
const ALLOWED_STATUSES = ['draft', 'published', 'closed', 'funded'];
const ALLOWED_APPROVALS = ['pending', 'approved', 'rejected'];

function parseJson(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  try { return JSON.parse(String(value)); } catch { return {}; }
}

function normalizeOpportunity(row: any, data: Record<string, any>) {
  const status = ALLOWED_STATUSES.includes(data.status) ? data.status :
    data.investment_status === 'funded' ? 'funded' :
    data.investment_status === 'closed' ? 'closed' :
    data.visibility_on_main_site === true ? 'published' : 'draft';
  const approval = ALLOWED_APPROVALS.includes(data.approval_status) ? data.approval_status : 'pending';

  return {
    id: row.id,
    business_id: row.id,
    opportunity_title: data.opportunity_title,
    opportunity_type: ALLOWED_TYPES.includes(data.opportunity_type) ? data.opportunity_type : 'equity',
    business_name: row.business_name,
    investment_amount_min: Number(data.investment_amount_min) || 0,
    investment_amount_max: Number(data.investment_amount_max) || 0,
    expected_roi_percent: Number(data.expected_roi_percent) || 0,
    status,
    approval_status: approval,
    visibility_on_main_site: data.visibility_on_main_site === true,
    show_on_minisite: data.show_on_minisite === true,
    minisite_display_mode: data.minisite_display_mode === 'page' ? 'page' : 'section',
    is_featured: data.is_featured === true,
    investors_current: Number(data.investors_current) || 0,
    target_investors: Number(data.target_investors) || 0,
    inquiries_count: Number(data.inquiries_count) || 0,
    investment_status: data.investment_status || 'open',
    investment_description: data.investment_description || '',
    verification_count: Number(row.verification_count) || 0,
    verification_complete: Number(row.verification_count) === 3,
    responsibility_contacts: row.responsibility_contacts || [],
    updated_at: row.updated_at,
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(`
      SELECT b.id, b.name AS business_name, b.custom_data, b.status AS business_status, b.updated_at,
        COALESCE(v.verification_count, 0) AS verification_count
      FROM businesses b
      LEFT JOIN (
        SELECT business_id, SUM(verified = 1) AS verification_count
        FROM investment_contact_verifications
        GROUP BY business_id
      ) v ON v.business_id = b.id
      WHERE JSON_EXTRACT(b.custom_data, '$."${SECTION_ID}"') IS NOT NULL
      ORDER BY b.updated_at DESC
    `) as any[];

    const items = rows.map(row => {
      const customData = parseJson(row.custom_data);
      const opportunity = parseJson(customData[SECTION_ID]);
      return opportunity.opportunity_title ? normalizeOpportunity(row, opportunity) : null;
    }).filter(Boolean);

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load opportunities' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });

    const rows = await query('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any[];
    if (!rows.length) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const customData = parseJson(rows[0].custom_data);
    const current = parseJson(customData[SECTION_ID]);
    const allowed = ['status', 'approval_status', 'visibility_on_main_site', 'show_on_minisite', 'minisite_display_mode', 'is_featured', 'investment_status', 'approval_notes'];
    const next = { ...current };
    for (const key of allowed) {
      if (updates[key] !== undefined) next[key] = updates[key];
    }

    if (next.approval_status === 'approved') {
      const verified = await query(
        'SELECT COUNT(*) AS count FROM investment_contact_verifications WHERE business_id = ? AND verified = 1 AND contact_name IS NOT NULL AND contact_name <> ""',
        [id]
      ) as any[];
      if (Number(verified[0]?.count) < 3) {
        return NextResponse.json({ error: 'All three registration contacts must be manually verified before approval' }, { status: 409 });
      }
      if (next.status === 'draft') next.status = 'published';
    }
    if (next.approval_status !== 'approved') {
      next.visibility_on_main_site = false;
      next.show_on_minisite = false;
    }
    customData[SECTION_ID] = next;

    await execute('UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(customData), id]);
    return NextResponse.json({ success: true, updated_by: admin.id, item: normalizeOpportunity({ id, business_name: '', updated_at: new Date() }, next) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });

    const rows = await query('SELECT custom_data FROM businesses WHERE id = ?', [id]) as any[];
    if (!rows.length) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    const customData = parseJson(rows[0].custom_data);
    delete customData[SECTION_ID];
    await execute('UPDATE businesses SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(customData), id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete opportunity' }, { status: 500 });
  }
}
