import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: businessId } = await params;

    const controls = await query(
      'SELECT * FROM business_section_controls WHERE business_id = ?',
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

    await execute(
      `INSERT INTO business_section_controls (id, business_id, section_id, admin_locked_label, admin_hidden, admin_disabled, cta_phone) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       admin_locked_label = ?, 
       admin_hidden = ?, 
       admin_disabled = ?,
       cta_phone = ?`,
      [
        businessId, sectionId,
        adminLockedLabel ? 1 : 0,
        adminHidden ? 1 : 0,
        adminDisabled ? 1 : 0,
        ctaPhone || null,
        // ON DUPLICATE KEY values
        adminLockedLabel ? 1 : 0,
        adminHidden ? 1 : 0,
        adminDisabled ? 1 : 0,
        ctaPhone || null,
      ]
    );

    return NextResponse.json({ success: true, message: 'Section controls updated' });
  } catch (error: any) {
    console.error('Admin Update Section Controls Error:', error);
    return NextResponse.json(
      { error: error.message === 'Not authenticated' ? 'Unauthorized' : 'Internal Server Error' },
      { status: error.message === 'Not authenticated' ? 401 : 500 }
    );
  }
}
