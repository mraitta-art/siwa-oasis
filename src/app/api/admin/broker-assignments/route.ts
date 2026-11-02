import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

/**
 * GET /api/admin/broker-assignments
 * Lists broker inventory assignments with joined names.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'content_admin', 'sales_manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');

    let sql = `
      SELECT 
        bia.*,
        p.email AS broker_email,
        p.display_name AS broker_name,
        d.name AS developer_name,
        d.slug AS developer_slug,
        dev.name_en AS development_name,
        dev.slug AS development_slug,
        b.name AS unit_name,
        b.slug AS unit_slug
      FROM broker_inventory_assignments bia
      LEFT JOIN profiles p ON bia.broker_id = p.id
      LEFT JOIN developers d ON bia.developer_id = d.id
      LEFT JOIN developments dev ON bia.development_id = dev.id
      LEFT JOIN businesses b ON bia.unit_business_id = b.id
    `;
    const params: any[] = [];

    if (brokerId) {
      sql += ` WHERE bia.broker_id = ?`;
      params.push(brokerId);
    }

    sql += ` ORDER BY bia.created_at DESC`;

    const assignments = await query(sql, params);

    // Also fetch lists for dropdowns
    const brokers = await query(`
      SELECT id, email, display_name, role 
      FROM profiles 
      WHERE role IN ('vendor', 'salesman') OR active = 1 
      ORDER BY display_name, email
    `);

    const developers = await query(`
      SELECT id, slug, name, name_ar 
      FROM developers 
      WHERE active = 1 
      ORDER BY name
    `);

    const developments = await query(`
      SELECT dev.id, dev.slug, COALESCE(dev.name_en, dev.name_ar, dev.slug) AS name, dev.developer_id, d.name AS developer_name 
      FROM developments dev
      LEFT JOIN developers d ON dev.developer_id = d.id
      WHERE dev.active = 1 
      ORDER BY dev.name_en, dev.name_ar
    `);

    const units = await query(`
      SELECT id, slug, name, development_id 
      FROM businesses 
      WHERE development_id IS NOT NULL 
      ORDER BY name
    `);

    return NextResponse.json({
      assignments,
      options: {
        brokers,
        developers,
        developments,
        units
      }
    });
  } catch (error: any) {
    console.error('[API broker-assignments GET error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/broker-assignments
 * Create or update an assignment.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'content_admin', 'sales_manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      broker_id,
      developer_id,
      development_id,
      unit_business_id,
      assignment_level = 'development',
      commission_rate = 0,
      broker_slug,
      custom_phone,
      custom_whatsapp,
      status = 'active',
      notes
    } = body;

    if (!broker_id) {
      return NextResponse.json({ error: 'Broker ID is required' }, { status: 400 });
    }

    const cleanSlug = (broker_slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    if (!cleanSlug) {
      return NextResponse.json({ error: 'Broker referral slug is required' }, { status: 400 });
    }

    if (id) {
      // Update existing
      await execute(`
        UPDATE broker_inventory_assignments
        SET 
          broker_id = ?,
          developer_id = ?,
          development_id = ?,
          unit_business_id = ?,
          assignment_level = ?,
          commission_rate = ?,
          broker_slug = ?,
          custom_phone = ?,
          custom_whatsapp = ?,
          status = ?,
          notes = ?
        WHERE id = ?
      `, [
        broker_id,
        developer_id || null,
        development_id || null,
        unit_business_id || null,
        assignment_level,
        Number(commission_rate) || 0,
        cleanSlug,
        custom_phone || null,
        custom_whatsapp || null,
        status,
        notes || null,
        id
      ]);

      return NextResponse.json({ success: true, id, updated: true });
    } else {
      // Create new
      const newId = randomUUID();
      await execute(`
        INSERT INTO broker_inventory_assignments (
          id,
          broker_id,
          developer_id,
          development_id,
          unit_business_id,
          assignment_level,
          commission_rate,
          broker_slug,
          custom_phone,
          custom_whatsapp,
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newId,
        broker_id,
        developer_id || null,
        development_id || null,
        unit_business_id || null,
        assignment_level,
        Number(commission_rate) || 0,
        cleanSlug,
        custom_phone || null,
        custom_whatsapp || null,
        status,
        notes || null
      ]);

      return NextResponse.json({ success: true, id: newId, created: true });
    }
  } catch (error: any) {
    console.error('[API broker-assignments POST error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/broker-assignments
 * Revoke or remove assignment.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['super_admin', 'content_admin', 'sales_manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await execute('DELETE FROM broker_inventory_assignments WHERE id = ?', [id]);
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error('[API broker-assignments DELETE error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
