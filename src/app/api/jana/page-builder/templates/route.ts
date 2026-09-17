import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const [rows] = await pool.execute('SELECT * FROM minisite_templates ORDER BY created_at DESC');
    const templates = (rows as any[]).map(row => {
      let components = [];
      let settings: any = {};
      try { components = typeof row.components === 'string' ? JSON.parse(row.components || '[]') : (row.components || []); } catch {}
      try { settings = typeof row.settings === 'string' ? JSON.parse(row.settings || '{}') : (row.settings || {}); } catch {}
      return {
        ...row,
        components: Array.isArray(components) ? components : [],
        description: settings.description || '',
        isActive: settings.isActive !== false,
        allowComponentReorder: settings.allowComponentReorder !== false,
        allowStyleCustomization: settings.allowStyleCustomization !== false,
      };
    });
    return NextResponse.json(templates);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, description, components = [], tier = 'free' } = body;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const id = crypto.randomUUID();
    const settings = {
      description: description || '',
      isActive: true,
      allowComponentReorder: true,
      allowStyleCustomization: true,
    };
    await pool.execute(
      'INSERT INTO minisite_templates (id, name, components, settings, tier) VALUES (?, ?, ?, ?, ?)',
      [id, name, JSON.stringify(components), JSON.stringify(settings), tier]
    );
    
    return NextResponse.json({ id, success: true });
  } catch (e: any) {
    console.error('Error saving template:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

