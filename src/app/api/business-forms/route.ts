export const dynamic = 'force-dynamic';

import { query, queryOne, execute } from '@/lib/db';

interface BusinessForm {
  id: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at?: string;
}

// GET: Retrieve business forms
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let sql = 'SELECT id, business_name, business_type, email, phone, description, status, created_at, submitted_at FROM business_forms ORDER BY created_at DESC';
    
    if (status) {
      sql = `SELECT id, business_name, business_type, email, phone, description, status, created_at, submitted_at FROM business_forms WHERE status = ? ORDER BY created_at DESC`;
      const results = await query(sql, [status]);
      return Response.json(results);
    }

    const results = await query(sql);
    return Response.json(results);
  } catch (error: any) {
    console.error('GET business-forms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or handle actions
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_name, business_type, email, phone, description, status, action } = body;

    // Create new form
    if (!action) {
      const id = `bf_${Date.now()}`;
      
      const sql = `
        INSERT INTO business_forms (id, business_name, business_type, email, phone, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await execute(sql, [id, business_name, business_type, email, phone || null, description || null, status || 'draft']);

      return Response.json({
        success: true,
        id,
        message: 'Business form created'
      });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('POST business-forms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update form status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updateSql = `
      UPDATE business_forms 
      SET status = ?, submitted_at = ? 
      WHERE id = ?
    `;

    const submittedAt = status === 'submitted' ? new Date() : null;
    await execute(updateSql, [status, submittedAt, id]);

    return Response.json({
      success: true,
      message: `Form status updated to ${status}`
    });
  } catch (error: any) {
    console.error('PATCH business-forms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove form
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    await execute('DELETE FROM business_forms WHERE id = ?', [id]);

    return Response.json({
      success: true,
      message: 'Form deleted'
    });
  } catch (error: any) {
    console.error('DELETE business-forms error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
