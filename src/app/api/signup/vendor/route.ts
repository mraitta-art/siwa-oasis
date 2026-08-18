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

/** Read vendor_registration_mode from admin_settings */
async function getRegistrationMode(): Promise<'open' | 'approval_required'> {
  try {
    const row = (await queryOne(
      `SELECT config FROM website_configs WHERE type = 'admin_settings' LIMIT 1`
    )) as any;
    if (!row) return 'approval_required';
    const cfg = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    return cfg?.vendor_registration_mode === 'open' ? 'open' : 'approval_required';
  } catch {
    return 'approval_required';
  }
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

    // Return only UNCLAIMED businesses (one-vendor policy: already-owned are not joinable)
    const list = await query(
      `SELECT id, name, slug FROM businesses 
       WHERE type_id = ?
         AND is_master = 0
         AND (vendor_id IS NULL OR vendor_id = '' OR vendor_id = 'anonymous')
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
 * One-vendor-per-business policy is enforced:
 *
 * MODE A — "Select Existing" (businessId provided):
 *   - Only UNCLAIMED listings are selectable (GET filters them)
 *   - If already claimed, returns 409 — no sharing allowed
 *   - Claiming vendor becomes the sole primary owner
 *
 * MODE B — "Register New Name" (newBusinessName provided):
 *   - Creates a brand-new business record (is_shared = 0, one vendor only)
 *   - Registering vendor becomes the sole primary owner
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, phone, businessId, newBusinessName, businessType, termsAccepted } = await req.json();

    if (!email || !password || !phone || (!businessId && !newBusinessName) || !businessType) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ error: 'You must accept the Vendor Responsibility Agreement to register' }, { status: 400 });
    }

    const acceptedAt = new Date();
    const acceptedIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '0.0.0.0';

    // 1. Check email uniqueness
    const existing = (await query('SELECT id FROM profiles WHERE email = ?', [email])) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 1b. Check phone uniqueness
    const existingPhone = (await query('SELECT id FROM profiles WHERE phone = ?', [phone.trim()])) as any[];
    if (existingPhone.length > 0) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    // 1c. Enforce child-only business type requirement
    const typeCheck = (await query('SELECT is_parent, name FROM business_types WHERE id = ?', [businessType])) as any[];
    if (typeCheck.length === 0) {
      return NextResponse.json({ error: 'Selected business category does not exist' }, { status: 400 });
    }
    if (typeCheck[0].is_parent) {
      return NextResponse.json(
        { error: 'Please select a specific subcategory (e.g. Ecolodge, Siwan Kitchen) rather than an industry parent category.' },
        { status: 400 }
      );
    }

    const userId   = randomUUID();
    const hashedPw = await bcrypt.hash(password, 10);

    // Check global registration mode set by admin
    const regMode        = await getRegistrationMode();
    const needsApproval  = regMode === 'approval_required';
    const approvalStatus = needsApproval ? 'pending' : 'approved';
    const isActive       = !needsApproval; // inactive until admin approves

    /* ─────────────────────────────────────────────────────────
       MODE B — Register a brand-new business name
       is_shared = 0 — one vendor only, no team access
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

      // 1. Create vendor profile FIRST — prevents orphaned business if this fails
      await execute(
        'INSERT INTO profiles (id, email, phone, password_hash, role, display_name, business_id, subscription_tier, active, approval_status, terms_accepted_at, terms_accepted_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, email, phone.trim(), hashedPw, 'vendor', displayName, targetBizId, 'free', isActive, approvalStatus, acceptedAt, acceptedIp]
      );

      // 2. Create the business — is_shared = 0 (one vendor only policy)
      const isClaimedVal = needsApproval ? 0 : 1;
      await execute(
        `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, status, is_shared, is_claimed, approved_by_vendor, created_at)
         VALUES (?, ?, ?, ?, ?, 'free', 'active', 0, ?, ?, NOW())`,
        [targetBizId, newBusinessName.trim(), finalSlug, businessType, userId, isClaimedVal, isClaimedVal]
      );

      if (needsApproval) {
        return NextResponse.json({
          success:  true,
          pending:  true,
          message:  'Your registration request has been submitted. The admin will review and approve your account shortly.',
          userId,
          businessId: targetBizId,
        }, { status: 202 });
      }

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

    // One-vendor-per-business policy: block if already claimed by a real vendor
    if (!isPrimary) {
      return NextResponse.json(
        { error: 'This business is already registered by another vendor. Each business can only have one owner.' },
        { status: 409 }
      );
    }

    // 3. Create the vendor profile linked to this business
    await execute(
      'INSERT INTO profiles (id, email, phone, password_hash, role, display_name, business_id, subscription_tier, active, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, phone.trim(), hashedPw, 'vendor', displayName, businessId, tier, isActive, approvalStatus]
    );

    // 4. Claim primary ownership if not yet taken (only if approved)
    if (isPrimary && !needsApproval) {
      await execute(
        `UPDATE businesses SET vendor_id = ?, status = 'active', is_claimed = 1, approved_by_vendor = 1 WHERE id = ?`,
        [userId, businessId]
      );
    }

    if (needsApproval) {
      return NextResponse.json({
        success: true,
        pending: true,
        message: 'Your registration request has been submitted. The admin will review and approve your account shortly.',
        userId,
        businessId,
      }, { status: 202 });
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
      ? (error.message?.includes('phone') ? 'An account with this phone number already exists.' : 'An account with this email already exists.')
      : error.code === 'ER_NO_REFERENCED_ROW_2'
      ? 'Business reference error — please try again.'
      : 'Registration failed. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
