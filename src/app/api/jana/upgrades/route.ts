import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role === 'vendor') {
      const requests = await query('SELECT * FROM upgrade_requests WHERE business_id = ?', [user.businessId]);
      return NextResponse.json(requests);
    }
    const adminRoles = ['super_admin', 'sales_manager', 'content_admin'];
    if (adminRoles.includes(user.role)) {
      const requests = await query(`
        SELECT ur.*, b.name as business_name, p.email as reviewer_email 
        FROM upgrade_requests ur
        JOIN businesses b ON ur.business_id = b.id
        LEFT JOIN profiles p ON ur.reviewed_by = p.id
        ORDER BY ur.created_at DESC
      `);
      return NextResponse.json(requests);
    }
    return NextResponse.json([]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { business_id, client_name, requested_tier, requested_features } = body;
    
    if (user.role === 'vendor' && user.businessId !== business_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO upgrade_requests (id, business_id, client_name, requested_tier, requested_features, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, business_id, client_name, requested_tier, JSON.stringify(requested_features || {})]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
