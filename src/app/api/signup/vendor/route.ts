import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
}

/**
 * VENDOR REGISTRATION API - GET
 * Returns a list of all businesses for a specific typology ID available for vendor registration/co-ownership.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'typology type_id is required' }, { status: 400 });
    }

    // Query all businesses of this type available for vendor account registration
    const list = await query(
      `SELECT id, name, slug FROM businesses 
       WHERE type_id = ? 
       ORDER BY name ASC`,
      [typeId]
    );

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching businesses for registration:', error);
    return NextResponse.json({ error: 'Failed to retrieve available businesses.' }, { status: 500 });
  }
}

/**
 * VENDOR REGISTRATION API - POST
 * Links a new vendor Profile to an existing or newly created Business record under the selected category.
 * Supports multi-vendor registration / co-ownership per business and custom business name registration.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, businessId, newBusinessName, businessType } = await req.json();

    if (!email || !password || (!businessId && !newBusinessName) || !businessType) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // 1. Check if email exists
    const existing = (await query('SELECT id FROM profiles WHERE email = ?', [email])) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    let targetBusinessId = businessId;
    let templateId = 'essentials_free';
    let tier = 'free';

    // 2. If vendor entered a custom new business name, create a new business record under this category
    if (!targetBusinessId && newBusinessName) {
      targetBusinessId = randomUUID();
      const rawSlug = slugify(newBusinessName) || `biz-${Date.now().toString(36)}`;
      let finalSlug = rawSlug;

      // Ensure unique slug
      const slugCheck = (await query('SELECT id FROM businesses WHERE slug = ?', [rawSlug])) as any[];
      if (slugCheck.length > 0) {
        finalSlug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }

      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, subscription_tier, status, created_at)
         VALUES (?, ?, ?, ?, 'free', 'active', NOW())`,
        [targetBusinessId, newBusinessName.trim(), finalSlug, businessType]
      );
    } else {
      // Validate existing business
      const businessRow = (await queryOne(
        'SELECT id, name, vendor_id, subscription_tier, template_id FROM businesses WHERE id = ? AND type_id = ?',
        [targetBusinessId, businessType]
      )) as any;

      if (!businessRow) {
        return NextResponse.json({ error: 'Selected business not found or category mismatch' }, { status: 404 });
      }
      templateId = businessRow.template_id || 'essentials_free';
      tier = businessRow.subscription_tier || 'free';

      // 3. If existing business has no primary vendor, claim it
      if (!businessRow.vendor_id || businessRow.vendor_id === '' || businessRow.vendor_id === 'anonymous') {
        const primaryUserId = randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);

        await execute(
          'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [primaryUserId, email, hashedPassword, 'vendor', displayName, targetBusinessId, tier, true]
        );

        await execute(
          `UPDATE businesses SET vendor_id = ?, status = 'active' WHERE id = ?`,
          [primaryUserId, targetBusinessId]
        );

        return NextResponse.json({
          success: true,
          message: 'Welcome to Siwa Oasis! Your studio is ready.',
          userId: primaryUserId,
          businessId: targetBusinessId,
          templateId,
          tier
        });
      }
    }

    // 4. Create the Profile linked to the selected business_id
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, 'vendor', displayName, targetBusinessId, tier, true]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to Siwa Oasis! Your vendor account has been created.',
      userId,
      businessId: targetBusinessId,
      templateId,
      tier
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
