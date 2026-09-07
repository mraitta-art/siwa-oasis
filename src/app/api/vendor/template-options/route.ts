import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor' || !user.businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await query<any>(
      `SELECT b.id, b.template_id, b.subscription_tier, bt.parent_id
       FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id WHERE b.id = ?`, [user.businessId]
    );
    if (!business[0]) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    const options = await query<any>(
      `SELECT mt.id, mt.name, mt.category_id, mt.tier, mt.components, mt.settings,
              EXISTS(SELECT 1 FROM minisite_template_tier_access a WHERE a.template_id = mt.id AND a.tier_id = ?) AS tier_eligible
       FROM minisite_templates mt
       WHERE mt.category_id IS NULL OR mt.category_id = ?
       ORDER BY mt.tier = 'free' DESC, mt.name`,
      [business[0].subscription_tier || 'free', business[0].parent_id]
    );
    let trial: any = null;
    try {
      const trials = await query<any>('SELECT trial_ends_at, selected_template_id FROM vendor_template_trials WHERE business_id = ?', [user.businessId]);
      trial = trials[0] || null;
    } catch {}
    return NextResponse.json({ business: business[0], trial, templates: options.map(option => ({ ...option, settings: typeof option.settings === 'string' ? JSON.parse(option.settings) : option.settings || {} })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor' || !user.businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { templateId } = await request.json();
    if (!templateId) return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    const candidates = await query<any>(
      `SELECT mt.id FROM minisite_templates mt
       JOIN businesses b ON b.id = ? LEFT JOIN business_types bt ON bt.id = b.type_id
       WHERE mt.id = ? AND (mt.category_id IS NULL OR mt.category_id = bt.parent_id)`, [user.businessId, templateId]
    );
    if (!candidates[0]) return NextResponse.json({ error: 'This template is not available for your business category.' }, { status: 403 });
    await execute('UPDATE businesses SET template_id = ?, updated_at = NOW() WHERE id = ?', [templateId, user.businessId]);
    try {
      await execute('UPDATE vendor_template_trials SET selected_template_id = ? WHERE business_id = ?', [templateId, user.businessId]);
    } catch {}
    return NextResponse.json({ success: true, templateId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
