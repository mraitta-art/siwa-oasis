import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * VENDOR REGISTRATION API - GET
 * Returns a list of all unassigned businesses for a specific typology ID.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'typology type_id is required' }, { status: 400 });
    }

    // Query businesses of this type that don't have a vendor_id assigned yet
    const unassigned = await query(
      `SELECT id, name, slug FROM businesses 
       WHERE type_id = ? AND (vendor_id IS NULL OR vendor_id = '') 
       ORDER BY name ASC`,
      [typeId]
    );

    return NextResponse.json(unassigned);
  } catch (error: any) {
    console.error('Error fetching unassigned businesses:', error);
    return NextResponse.json({ error: 'Failed to retrieve available businesses.' }, { status: 500 });
  }
}

/**
 * VENDOR REGISTRATION API - POST
 * Links a new vendor Profile to an existing admin-created Business record.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, businessId, businessType } = await req.json();

    if (!email || !password || !businessId || !businessType) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // 1. Check if email exists
    const existing = (await query('SELECT id FROM profiles WHERE email = ?', [email])) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 2. Validate that the business exists under the correct type and is unassigned
    const businessRow = await queryOne(
      'SELECT id, name, vendor_id, subscription_tier, template_id FROM businesses WHERE id = ? AND type_id = ?',
      [businessId, businessType]
    ) as any;

    if (!businessRow) {
      return NextResponse.json({ error: 'Selected business not found or category mismatch' }, { status: 404 });
    }

    if (businessRow.vendor_id) {
      return NextResponse.json({ error: 'This business has already been claimed by another vendor.' }, { status: 400 });
    }

    // 3. Prepare IDs and hashing
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the Profile FIRST — must exist before businesses can reference it via FK
    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, 'vendor', displayName, businessId, businessRow.subscription_tier || 'free', true]
    );

    // 5. Now link the business to the new vendor profile (FK constraint: vendor_id → profiles.id)
    await execute(
      `UPDATE businesses SET vendor_id = ?, status = 'active' WHERE id = ?`,
      [userId, businessId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the Oasis! Your heritage studio is ready.',
      userId,
      businessId,
      templateId: businessRow.template_id || 'essentials_free',
      tier: businessRow.subscription_tier || 'free'
    });

  } catch (error: any) {
    console.error('Registration Error:', error.message || error);
    const msg = error.code === 'ER_DUP_ENTRY'
      ? 'An account with this email already exists.'
      : error.code === 'ER_NO_REFERENCED_ROW_2'
      ? 'Business reference error — please try again.'
      : 'Registration failed. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
