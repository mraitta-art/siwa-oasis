import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/vendor/minisite/publish
 * Body: { published: boolean }
 * Toggles is_published flag on the vendor's business.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.businessId) {
      return NextResponse.json({ error: 'No business linked to this account' }, { status: 404 });
    }

    const { published } = await req.json();

    if (published) {
      const contacts = await query(
        'SELECT COUNT(*) AS count FROM vendor_contacts WHERE vendor_id = ? AND is_active = TRUE AND phone IS NOT NULL AND phone <> "" AND full_name IS NOT NULL AND full_name <> "" AND job_title IS NOT NULL AND job_title <> ""',
        [user.id]
      ) as any[];
      if (Number(contacts[0]?.count || 0) < 3) {
        return NextResponse.json({ error: 'Add at least three named mobile contacts before publishing your free minisite.', requiredContacts: 3 }, { status: 400 });
      }
    }

    await execute(
      'UPDATE businesses SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [published ? 1 : 0, user.businessId]
    );

    return NextResponse.json({
      success: true,
      is_published: !!published,
      message: published ? 'Minisite is now live!' : 'Minisite unpublished',
    });
  } catch (error: any) {
    console.error('[vendor/minisite/publish]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
