import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireVendor();
    const requestedBusinessId = new URL(request.url).searchParams.get('businessId') || '';
    const businessId = user.role === 'vendor' ? String(user.businessId || '') : requestedBusinessId;
    if (!businessId) return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
    if (user.role === 'vendor' && requestedBusinessId && requestedBusinessId !== businessId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const announcements = await query<any>(
      `SELECT a.id, a.kind, a.title_ar, a.title_en, a.body_ar, a.body_en,
              a.cta_text_ar, a.cta_text_en, a.cta_url, a.published_at, a.expires_at
       FROM crm_announcements a
       JOIN crm_group_members gm ON gm.group_id = a.group_id
       WHERE gm.member_type = 'business' AND gm.member_id = ?
         AND a.status = 'published'
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
       ORDER BY a.published_at DESC
       LIMIT 20`,
      [businessId]
    );
    return NextResponse.json({ announcements });
  } catch (error: any) {
    const message = String(error?.message || 'Unable to load dashboard announcements.');
    const status = message === 'Not authenticated' ? 401 : message.includes('access required') ? 403 : 500;
    if (status === 500) console.error('[vendor/crm-announcements]', error);
    return NextResponse.json({ error: message }, { status });
  }
}
