import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomUUID } from 'crypto';

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS vendor_contacts (
      id VARCHAR(36) PRIMARY KEY,
      vendor_id VARCHAR(36) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(100) DEFAULT NULL,
      job_title VARCHAR(150) DEFAULT NULL,
      contact_role VARCHAR(100) DEFAULT 'general',
      is_primary BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor_contacts_vendor (vendor_id),
      CONSTRAINT fk_vendor_contacts_vendor FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `);
}

function errorResponse(error: any) {
  const message = error?.message || 'Vendor contact request failed';
  const status = message.includes('Not authenticated') ? 401 : message.includes('Admin access required') ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();
    const vendorId = new URL(request.url).searchParams.get('vendorId');
    const params: string[] = [];
    let sql = `
      SELECT c.*, p.display_name AS vendor_name, p.email AS vendor_email
      FROM vendor_contacts c
      INNER JOIN profiles p ON p.id = c.vendor_id
    `;
    if (vendorId) {
      sql += ' WHERE c.vendor_id = ?';
      params.push(vendorId);
    }
    sql += ' ORDER BY c.is_primary DESC, c.full_name ASC';
    return NextResponse.json(await query(sql, params));
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();
    const body = await request.json();
    const { vendorId, fullName, email, phone, jobTitle, contactRole = 'general', isPrimary = false, notes } = body;
    if (!vendorId || !String(fullName || '').trim()) {
      return NextResponse.json({ error: 'vendorId and fullName are required' }, { status: 400 });
    }
    const vendor = await query('SELECT id FROM profiles WHERE id = ? AND role = \'vendor\' LIMIT 1', [vendorId]);
    if (!vendor.length) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    if (isPrimary) await execute('UPDATE vendor_contacts SET is_primary = FALSE WHERE vendor_id = ?', [vendorId]);
    const id = randomUUID();
    await execute(
      `INSERT INTO vendor_contacts (id, vendor_id, full_name, email, phone, job_title, contact_role, is_primary, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vendorId, String(fullName).trim().slice(0, 255), email || null, phone || null, jobTitle || null, String(contactRole).slice(0, 100), Boolean(isPrimary), notes || null]
    );
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();
    const body = await request.json();
    const { id, fullName, email, phone, jobTitle, contactRole, isPrimary, isActive, notes } = body;
    if (!id) return NextResponse.json({ error: 'Contact id is required' }, { status: 400 });
    const existing = await query<any>('SELECT vendor_id FROM vendor_contacts WHERE id = ? LIMIT 1', [id]);
    if (!existing.length) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    if (isPrimary) await execute('UPDATE vendor_contacts SET is_primary = FALSE WHERE vendor_id = ?', [existing[0].vendor_id]);
    await execute(
      `UPDATE vendor_contacts SET full_name = COALESCE(?, full_name), email = ?, phone = ?, job_title = ?, contact_role = COALESCE(?, contact_role), is_primary = COALESCE(?, is_primary), is_active = COALESCE(?, is_active), notes = ? WHERE id = ?`,
      [fullName ? String(fullName).trim().slice(0, 255) : null, email || null, phone || null, jobTitle || null, contactRole ? String(contactRole).slice(0, 100) : null, typeof isPrimary === 'boolean' ? isPrimary : null, typeof isActive === 'boolean' ? isActive : null, notes || null, id]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Contact id is required' }, { status: 400 });
    await execute('DELETE FROM vendor_contacts WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}
