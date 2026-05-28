import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
const mysql = require('mysql2/promise');

async function getConnection() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa'
  });
  return conn;
}

export async function GET(request: Request) {
  const auth = requireAdmin(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });
  try {
    const conn = await getConnection();
    // Find emails that appear in more than one journey_request
    const [rows] = await conn.execute("SELECT customer_email AS email, COUNT(*) AS cnt FROM journey_requests WHERE customer_email IS NOT NULL AND customer_email != '' GROUP BY customer_email HAVING cnt>1 ORDER BY cnt DESC LIMIT 200");
    const emails = (rows as any[]).map((r: any) => r.email);
    const groups = [];
    for (const email of emails) {
      // find any existing visitor_profiles containing this email
      const [profiles] = await conn.execute('SELECT id, primary_name, emails, phones FROM visitor_profiles WHERE JSON_CONTAINS(emails, JSON_QUOTE(?))', [email]);
      groups.push({ email, count: undefined, profiles });
    }
    await conn.end();
    return NextResponse.json({ duplicates: groups });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdmin(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const body = await request.json();
    const { email, targetProfileId, mergeProfileIds } = body;
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const conn = await getConnection();

    // Ensure target profile: create if not provided
    let targetId = targetProfileId;
    if (!targetId) {
      const uuid = require('uuid').v4();
      const emailsJson = JSON.stringify([email]);
      await conn.execute('INSERT INTO visitor_profiles (id, primary_name, emails, phones, metadata) VALUES (?, ?, ?, ?, ?)', [uuid, null, emailsJson, JSON.stringify([]), JSON.stringify({ created_by: 'admin_merge' })]);
      targetId = uuid;
    }

    // Merge profiles: collect emails and phones
    const profileIds = Array.isArray(mergeProfileIds) ? mergeProfileIds.filter(id => id !== targetId) : [];
    let combinedEmails = new Set();
    let combinedPhones = new Set();

    // include target existing
    const [trows] = await conn.execute('SELECT emails, phones FROM visitor_profiles WHERE id = ?', [targetId]);
    if (trows.length > 0) {
      try { (JSON.parse(trows[0].emails) || []).forEach((e: any) => combinedEmails.add(e)); } catch {}
      try { (JSON.parse(trows[0].phones) || []).forEach((p: any) => combinedPhones.add(p)); } catch {}
    }

    for (const id of profileIds) {
      const [r] = await conn.execute('SELECT emails, phones FROM visitor_profiles WHERE id = ?', [id]);
      if (r.length === 0) continue;
      try { (JSON.parse(r[0].emails) || []).forEach((e: any) => combinedEmails.add(e)); } catch {}
      try { (JSON.parse(r[0].phones) || []).forEach((p: any) => combinedPhones.add(p)); } catch {}
    }

    // ensure the request email included
    if (email) combinedEmails.add(email);

    const emailsJson = JSON.stringify(Array.from(combinedEmails));
    const phonesJson = JSON.stringify(Array.from(combinedPhones));

    // update target profile
    await conn.execute('UPDATE visitor_profiles SET emails = ?, phones = ? WHERE id = ?', [emailsJson, phonesJson, targetId]);

    // update requests to point to target
    await conn.execute('UPDATE journey_requests SET visitor_id = ? WHERE customer_email = ?', [targetId, email]);

    // remove merged profiles
    if (profileIds.length > 0) {
      await conn.execute('DELETE FROM visitor_profiles WHERE id IN (' + profileIds.map(()=>'?').join(',') + ')', profileIds);
    }

    // audit
    await conn.execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [require('uuid').v4(), null, 'admin', 'admin', 'merge_profiles', JSON.stringify({ email, targetId, merged: profileIds })]);

    await conn.end();
    return NextResponse.json({ ok: true, targetId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
