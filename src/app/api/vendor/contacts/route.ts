import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

interface ContactInput {
  id?: string;
  full_name?: string;
  job_title?: string;
  phone?: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const contacts = await query('SELECT id, full_name, job_title, phone, is_primary, is_active FROM vendor_contacts WHERE vendor_id = ? AND is_active = TRUE ORDER BY is_primary DESC, created_at ASC', [user.id]);
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const contacts: ContactInput[] = Array.isArray(body.contacts) ? body.contacts : [];
    const cleaned = contacts.map(contact => ({
      full_name: String(contact.full_name || '').trim(),
      job_title: String(contact.job_title || '').trim(),
      phone: String(contact.phone || '').trim(),
    })).filter(contact => contact.full_name || contact.job_title || contact.phone);

    if (cleaned.length < 3) return NextResponse.json({ error: 'At least three mobile contacts are required for the free minisite.' }, { status: 400 });
    if (cleaned.some(contact => !contact.full_name || !contact.job_title || !contact.phone)) {
      return NextResponse.json({ error: 'Each contact needs a name, title, and mobile phone number.' }, { status: 400 });
    }
    if (new Set(cleaned.map(contact => contact.phone)).size !== cleaned.length) {
      return NextResponse.json({ error: 'Each contact must use a different phone number.' }, { status: 400 });
    }

    await execute('UPDATE vendor_contacts SET is_active = FALSE WHERE vendor_id = ?', [user.id]);
    for (const [index, contact] of cleaned.entries()) {
      await execute(
        'INSERT INTO vendor_contacts (id, vendor_id, full_name, job_title, phone, contact_role, is_primary, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
        [crypto.randomUUID(), user.id, contact.full_name, contact.job_title, contact.phone, 'offer_messaging', index === 0 ? 1 : 0]
      );
    }
    return NextResponse.json({ success: true, contacts: cleaned });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
