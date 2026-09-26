import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

async function syncBusinessPrimaryPhone(businessId: string, phone: string | null) {
  const normalizedPhone = phone?.trim() ? phone.trim() : null;

  const business = await queryOne<any>('SELECT id, custom_data, vendor_id FROM businesses WHERE id = ?', [businessId]);
  if (!business) return;

  let customData: any = {};
  try {
    customData = typeof business.custom_data === 'string' ? JSON.parse(business.custom_data) : (business.custom_data || {});
  } catch {
    customData = {};
  }

  const nextData = { ...customData };
  const basic = { ...(nextData.basic || {}) };
  const businessInfo = { ...(nextData.business_info || {}) };
  const identity = { ...(nextData.sec_1_identity || {}) };

  if (normalizedPhone) {
    basic.phone = normalizedPhone;
    businessInfo.phone = normalizedPhone;
    identity.phone = normalizedPhone;
    nextData.phone = normalizedPhone;
    nextData.basic = basic;
    nextData.business_info = businessInfo;
    nextData.sec_1_identity = identity;
  } else {
    delete basic.phone;
    delete businessInfo.phone;
    delete identity.phone;
    delete nextData.phone;
    if (Object.keys(basic).length > 0) nextData.basic = basic; else delete nextData.basic;
    if (Object.keys(businessInfo).length > 0) nextData.business_info = businessInfo; else delete nextData.business_info;
    if (Object.keys(identity).length > 0) nextData.sec_1_identity = identity; else delete nextData.sec_1_identity;
  }

  await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(nextData), businessId]);
  await execute('UPDATE profiles SET phone = ? WHERE business_id = ? AND role = ?', [normalizedPhone, businessId, 'vendor']);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: businessId } = await params;

    const controls = await query(
      `SELECT * FROM business_section_controls
       WHERE id IN (
         SELECT MAX(id)
         FROM business_section_controls
         WHERE business_id = ?
         GROUP BY section_id
       )
       ORDER BY section_id`,
      [businessId]
    );

    return NextResponse.json({ success: true, controls });
  } catch (error: any) {
    console.error('Admin Fetch Section Controls Error:', error);
    return NextResponse.json(
      { error: error.message === 'Not authenticated' ? 'Unauthorized' : 'Internal Server Error' },
      { status: error.message === 'Not authenticated' ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: businessId } = await params;
    const body = await req.json();
    const { sectionId, adminLockedLabel, adminHidden, adminDisabled, ctaPhone } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
    }

    const nextValues = {
      admin_locked_label: adminLockedLabel ? 1 : 0,
      admin_hidden: adminHidden ? 1 : 0,
      admin_disabled: adminDisabled ? 1 : 0,
      cta_phone: ctaPhone || null,
    };

    const existing = await query(
      'SELECT id FROM business_section_controls WHERE business_id = ? AND section_id = ? ORDER BY id DESC LIMIT 1',
      [businessId, sectionId]
    ) as any[];

    if (existing.length > 0) {
      await execute(
        `UPDATE business_section_controls
         SET admin_locked_label = ?, admin_hidden = ?, admin_disabled = ?, cta_phone = ?
         WHERE business_id = ? AND section_id = ?`,
        [
          nextValues.admin_locked_label,
          nextValues.admin_hidden,
          nextValues.admin_disabled,
          nextValues.cta_phone,
          businessId,
          sectionId,
        ]
      );

      await execute(
        `DELETE FROM business_section_controls
         WHERE business_id = ? AND section_id = ? AND id != ?`,
        [businessId, sectionId, existing[0].id]
      );
    } else {
      await execute(
        `INSERT INTO business_section_controls (id, business_id, section_id, admin_locked_label, admin_hidden, admin_disabled, cta_phone)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          sectionId,
          nextValues.admin_locked_label,
          nextValues.admin_hidden,
          nextValues.admin_disabled,
          nextValues.cta_phone,
        ]
      );
    }

    await syncBusinessPrimaryPhone(businessId, nextValues.cta_phone);

    return NextResponse.json({ success: true, message: 'Section controls updated' });
  } catch (error: any) {
    console.error('Admin Update Section Controls Error:', error);
    return NextResponse.json(
      { error: error.message === 'Not authenticated' ? 'Unauthorized' : 'Internal Server Error' },
      { status: error.message === 'Not authenticated' ? 401 : 500 }
    );
  }
}
