import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const [rows] = await pool.execute('SELECT * FROM minisite_templates ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, description, components, tier = 'free' } = body;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const id = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO minisite_templates (id, name, components, settings, tier) VALUES (?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(components), JSON.stringify({ description }), tier]
    );
    
    return NextResponse.json({ id, success: true });
  } catch (e: any) {
    console.error('Error saving template:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

