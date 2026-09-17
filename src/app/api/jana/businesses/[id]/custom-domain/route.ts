import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const allowedRoles = ['super_admin', 'content_admin', 'sales_manager'];
  if (!user || !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const verified = Boolean(body.verified);
  const business = await queryOne<{ custom_domain: string | null }>(
    'SELECT custom_domain FROM businesses WHERE id = ?',
    [id],
  );

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  if (verified && !business.custom_domain) {
    return NextResponse.json({ error: 'Set a custom domain before verifying it' }, { status: 400 });
  }

  await execute(
    'UPDATE businesses SET custom_domain_verified = ?, updated_at = NOW() WHERE id = ?',
    [verified ? 1 : 0, id],
  );

  return NextResponse.json({
    success: true,
    custom_domain: business.custom_domain,
    custom_domain_verified: verified,
  });
}
