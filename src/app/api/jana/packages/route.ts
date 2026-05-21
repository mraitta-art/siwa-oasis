import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const pkg = await query('SELECT * FROM experience_packages WHERE id = ?', [id]);
      if (pkg.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      return NextResponse.json(pkg[0]);
    }

    const packages = await query('SELECT * FROM experience_packages ORDER BY created_at DESC');
    return NextResponse.json(packages);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, description, business_ids, pricing, active } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const result = await execute(
      `INSERT INTO experience_packages (name, description, business_ids, pricing, active) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        name, 
        description || '', 
        JSON.stringify(business_ids || []), 
        JSON.stringify(pricing || {}), 
        active !== undefined ? active : 1
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, description, business_ids, pricing, active } = body;

    if (!id || !name) return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });

    await execute(
      `UPDATE experience_packages 
       SET name = ?, description = ?, business_ids = ?, pricing = ?, active = ? 
       WHERE id = ?`,
      [
        name, 
        description || '', 
        JSON.stringify(business_ids || []), 
        JSON.stringify(pricing || {}), 
        active !== undefined ? active : 1,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await execute('DELETE FROM experience_packages WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
