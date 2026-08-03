import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * VENDOR REGISTRATION API - GET
 * Returns ALL businesses for a given category type.
 * Every business is joinable — vendors register a new name OR join an existing one.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'typology type_id is required' }, { status: 400 });
    }

    // Return ALL businesses in this category (both admin-created and vendor-registered)
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
 *
 * MODE A — "Select Existing" (businessId provided):
 *   - Any existing business can be joined by multiple vendor accounts (team access)
 *   - First vendor to register becomes the primary owner
 *   - Subsequent vendors become co-vendors (team members)
 *
 * MODE B — "Register New Name" (newBusinessName provided):
 *   - Creates a brand-new business record (is_shared = 1, open for team access)
 *   - Registering vendor becomes primary owner
 *   - Team members can later join by selecting it from the "Select Existing" list
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, businessId, newBusinessName, businessType } = await req.json();

    if (!email || !password || (!businessId && !newBusinessName) || !businessType) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    // 1. Check email uniqueness
    const existing = (await query('SELECT id FROM profiles WHERE email = ?', [email])) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const userId   = randomUUID();
    const hashedPw = await bcrypt.hash(password, 10);

    /* ─────────────────────────────────────────────────────────
       MODE B — Register a brand-new business name
       is_shared = 1 so team members can join later
    ───────────────────────────────────────────────────────── */
    if (!businessId && newBusinessName) {
      const targetBizId = randomUUID();
      const rawSlug     = slugify(newBusinessName) || `biz-${Date.now().toString(36)}`;
      let   finalSlug   = rawSlug;

      // Ensure slug uniqueness
      const slugCheck = (await query('SELECT id FROM businesses WHERE slug = ?', [rawSlug])) as any[];
      if (slugCheck.length > 0) {
        finalSlug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }

      // Create the business — is_shared = 1 (open for team access)
      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, status, is_shared, created_at)
         VALUES (?, ?, ?, ?, ?, 'free', 'active', 1, NOW())`,
        [targetBizId, newBusinessName.trim(), finalSlug, businessType, userId]
      );

      // Create the vendor profile as primary owner
      await execute(
        'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, email, hashedPw, 'vendor', displayName, targetBizId, 'free', true]
      );

      return NextResponse.json({
        success:    true,
        message:    'Welcome to Siwa Oasis! Your business is registered and your studio is ready.',
        userId,
        businessId: targetBizId,
        templateId: 'essentials_free',
        tier:       'free',
        ownership:  'primary'
      });
    }

    /* ─────────────────────────────────────────────────────────
       MODE A — Join an existing business listing
    ───────────────────────────────────────────────────────── */

    // 2. Validate business exists and type matches
    const businessRow = (await queryOne(
      'SELECT id, name, vendor_id, subscription_tier, template_id FROM businesses WHERE id = ? AND type_id = ?',
      [businessId, businessType]
    )) as any;

    if (!businessRow) {
      return NextResponse.json({ error: 'Selected business not found or category mismatch' }, { status: 404 });
    }

    const templateId = businessRow.template_id || 'essentials_free';
    const tier       = businessRow.subscription_tier || 'free';
    const isPrimary  = !businessRow.vendor_id || businessRow.vendor_id === '' || businessRow.vendor_id === 'anonymous';

    // 3. Create the vendor profile linked to this business
    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPw, 'vendor', displayName, businessId, tier, true]
    );

    // 4. Claim primary ownership if not yet taken
    if (isPrimary) {
      await execute(
        `UPDATE businesses SET vendor_id = ?, status = 'active' WHERE id = ?`,
        [userId, businessId]
      );
    }

    return NextResponse.json({
      success:    true,
      message:    isPrimary
        ? 'Welcome to Siwa Oasis! You are now the primary owner of this business.'
        : 'Welcome to Siwa Oasis! You have joined the team for this business.',
      userId,
      businessId,
      templateId,
      tier,
      ownership: isPrimary ? 'primary' : 'co-vendor'
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
