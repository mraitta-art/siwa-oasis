import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * VENDOR REGISTRATION API
 * Creates a Profile AND a Business in one atomic flow.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, businessName, businessType } = await req.json();

    if (!email || !password || !businessName || !businessType) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // 1. Check if email exists
    const existing = (await query('SELECT id FROM profiles WHERE email = ?', [email])) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 2. Prepare IDs
    const userId = uuidv4();
    const businessId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the Business Record first
    await execute(
      'INSERT INTO businesses (id, name, type_id, vendor_id, status, published, custom_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [businessId, businessName, businessType, userId, 'active', false, JSON.stringify({})]
    );

    // 4. Create the Profile and link to the business
    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, 'vendor', displayName, businessId, true]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the Oasis! Your studio is ready.',
      userId,
      businessId
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 500 });
  }
}
