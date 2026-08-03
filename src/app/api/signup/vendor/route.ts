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
 * Returns businesses available for vendor signup (is_shared = 1, admin-created open listings only).
 * Self-registered (is_shared = 0) businesses are LOCKED and not shown here.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');

    if (!typeId) {
      return NextResponse.json({ error: 'typology type_id is required' }, { status: 400 });
    }

    // Only return admin-created open listings (is_shared = 1)
    const list = await query(
      `SELECT id, name, slug FROM businesses 
       WHERE type_id = ? AND is_shared = 1
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
 * Two registration modes:
 *
 * MODE A — "Select Existing" (businessId provided):
 *   - Business must exist, type must match, and is_shared must = 1
 *   - If no primary vendor yet: sets this user as primary owner
 *   - If already has primary vendor: creates a team co-vendor profile linked to the business
 *
 * MODE B — "Register New Name" (newBusinessName provided):
 *   - Creates a brand-new business record with is_shared = 0 (LOCKED to single owner)
 *   - Only this registering vendor can ever manage it
 *   - No other vendor can claim or join it via signup
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

    const userId        = randomUUID();
    const hashedPw      = await bcrypt.hash(password, 10);
    let   targetBizId   = businessId;
    let   templateId    = 'essentials_free';
    let   tier          = 'free';

    /* ─────────────────────────────────────────────────────────
       MODE B — Register a brand-new independent business name
    ───────────────────────────────────────────────────────── */
    if (!targetBizId && newBusinessName) {
      targetBizId = randomUUID();

      const rawSlug = slugify(newBusinessName) || `biz-${Date.now().toString(36)}`;
      let finalSlug = rawSlug;

      // Ensure slug uniqueness
      const slugCheck = (await query('SELECT id FROM businesses WHERE slug = ?', [rawSlug])) as any[];
      if (slugCheck.length > 0) {
        finalSlug = `${rawSlug}-${Date.now().toString(36).slice(-4)}`;
      }

      // Create the business: is_shared = 0 → locked to single owner forever
      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, status, is_shared, created_at)
         VALUES (?, ?, ?, ?, ?, 'free', 'active', 0, NOW())`,
        [targetBizId, newBusinessName.trim(), finalSlug, businessType, userId]
      );

      // Create the vendor profile
      await execute(
        'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, email, hashedPw, 'vendor', displayName, targetBizId, 'free', true]
      );

      return NextResponse.json({
        success: true,
        message: 'Welcome to Siwa Oasis! Your independent vendor studio is ready.',
        userId,
        businessId: targetBizId,
        templateId: 'essentials_free',
        tier: 'free',
        ownership: 'independent'
      });
    }

    /* ─────────────────────────────────────────────────────────
       MODE A — Join an existing shared (admin-created) listing
    ───────────────────────────────────────────────────────── */

    // 2. Validate business: must exist, correct type, AND is_shared = 1
    const businessRow = (await queryOne(
      'SELECT id, name, vendor_id, subscription_tier, template_id, is_shared FROM businesses WHERE id = ? AND type_id = ?',
      [targetBizId, businessType]
    )) as any;

    if (!businessRow) {
      return NextResponse.json({ error: 'Selected business not found or category mismatch' }, { status: 404 });
    }

    // Block joining a locked independent business
    if (!businessRow.is_shared) {
      return NextResponse.json({
        error: 'This business is independently registered and cannot be joined by other vendors.'
      }, { status: 403 });
    }

    templateId = businessRow.template_id || 'essentials_free';
    tier       = businessRow.subscription_tier || 'free';

    // 3. Create vendor profile linked to this shared business
    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPw, 'vendor', displayName, targetBizId, tier, true]
    );

    // 4. If no primary vendor yet, claim primary ownership
    if (!businessRow.vendor_id || businessRow.vendor_id === '' || businessRow.vendor_id === 'anonymous') {
      await execute(
        `UPDATE businesses SET vendor_id = ?, status = 'active' WHERE id = ?`,
        [userId, targetBizId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome to Siwa Oasis! Your vendor account has been created.',
      userId,
      businessId: targetBizId,
      templateId,
      tier,
      ownership: businessRow.vendor_id ? 'co-vendor' : 'primary'
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
