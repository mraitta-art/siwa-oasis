import { NextResponse } from 'next/server';
const mysql = require('mysql2/promise');

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa'
  });
}

/**
 * GET /api/visitors/profile?email=user@example.com
 * - Returns visitor profile (read-only)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');
    const id = url.searchParams.get('id');

    if (!email && !phone && !id) {
      return NextResponse.json({ error: 'Provide email, phone, or id' }, { status: 400 });
    }

    const conn = await getConnection();
    let query = 'SELECT id, primary_name, emails, phones, metadata FROM visitor_profiles WHERE ';
    let params: any[] = [];

    if (id) {
      query += 'id = ?';
      params = [id];
    } else if (email) {
      query += 'JSON_CONTAINS(emails, JSON_QUOTE(?))';
      params = [email];
    } else if (phone) {
      query += 'JSON_CONTAINS(phones, JSON_QUOTE(?))';
      params = [phone];
    }

    const [rows] = await conn.execute(query, params);
    const profile = rows.length > 0 ? rows[0] : null;

    if (profile) {
      profile.emails = JSON.parse(profile.emails || '[]');
      profile.phones = JSON.parse(profile.phones || '[]');
      profile.metadata = JSON.parse(profile.metadata || '{}');
    }

    await conn.end();
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
