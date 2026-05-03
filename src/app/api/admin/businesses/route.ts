import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

// GET all businesses
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const business = await queryOne(`
        SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
               p.email as vendor_email, p.display_name as vendor_name
        FROM businesses b
        LEFT JOIN business_types bt ON b.type_id = bt.id
        LEFT JOIN profiles p ON b.vendor_id = p.id
        WHERE b.id = ?
      `, [id]);
      
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      
      // Parse JSON fields
      const biz = business as any;
      if (biz.custom_data) biz.custom_data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
      if (biz.curation_data) biz.curation_data = typeof biz.curation_data === 'string' ? JSON.parse(biz.curation_data) : biz.curation_data;
      
      return NextResponse.json(biz);
    }

    const businesses = await query(`
      SELECT b.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color,
             p.email as vendor_email, p.display_name as vendor_name
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      LEFT JOIN profiles p ON b.vendor_id = p.id
      ORDER BY b.created_at DESC
    `);
    return NextResponse.json(businesses);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message.includes('authenticated') ? 401 : 500 });
  }
}

// POST create a new business
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    let { name, type_id, subscription_tier = 'free', vendor_id = null, custom_data = {}, status = 'active' } = body;

    // Sanitize: Treat empty string as null for foreign key compliance
    if (vendor_id === '') vendor_id = null;

    if (!name || !type_id) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO businesses (id, name, type_id, subscription_tier, vendor_id, custom_data, status, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type_id, subscription_tier, vendor_id, JSON.stringify(custom_data), status, 1]
    );

    // Background Logging (Non-blocking)
    try {
      await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [
        `Business created: ${name}`, user.email
      ]);
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'create_business', `Created business: ${name} (${type_id})`
      ]);
    } catch (logErr) {
      console.warn('Logging failure, but business was created:', logErr);
    }

    return NextResponse.json({ id, name, type_id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE a business
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const biz = await queryOne('SELECT name FROM businesses WHERE id = ?', [id]);
    await execute('DELETE FROM businesses WHERE id = ?', [id]);

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'delete_business', `Deleted: ${biz?.name || id}`
      ]);
    } catch (e) {
      console.warn('Audit Logging skipped for delete_business');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT update a business
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'type_id', 'subscription_tier', 'status', 'published', 'vendor_id', 'approved_by_vendor'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(value);
      }
      if (['custom_data', 'draft_data'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      }
    }

    if (sets.length) {
      params.push(id);
      await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    try {
      await execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [
        crypto.randomUUID(), user.id, user.email, user.role, 'update_business', `Updated business: ${id}`
      ]);
    } catch (e) {
       console.warn('Audit Logging skipped for update_business');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
