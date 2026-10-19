export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

/** Ensure the onboard_invites table exists */
async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS onboard_invites (
      token VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(100) NOT NULL,
      business_name VARCHAR(255),
      business_slug VARCHAR(100),
      parent_type_id VARCHAR(100),
      parent_type_name VARCHAR(255),
      child_type_id VARCHAR(100),
      child_type_name VARCHAR(255),
      child_type_regulations TEXT,
      subscription_tier VARCHAR(30) DEFAULT 'free',
      dispatch_mode VARCHAR(20) DEFAULT 'direct',
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      accepted_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      admin_notes TEXT
    )
  `);
}

/**
 * POST /api/onboard/invite
 * Creates a tokenized invite for a business. Admin only.
 * Body: { business_id, subscription_tier?, dispatch_mode?, admin_notes? }
 * Returns: { success, token, onboard_url, expires_at }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureTable();

    const body = await request.json();
    const {
      business_id,
      subscription_tier = 'free',
      dispatch_mode = 'direct',
      admin_notes,
    } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    // Fetch business + type info
    const biz = await queryOne(
      `SELECT b.id, b.name, b.slug,
              b.type_id,
              bt.name        AS child_type_name,
              bt.description AS child_type_regulations,
              bt.parent_id   AS parent_type_id,
              pt.name        AS parent_type_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.type_id = bt.id
       LEFT JOIN business_types pt ON bt.parent_id = pt.id
       WHERE b.id = ?`,
      [business_id]
    ) as any;

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Generate a unique 48-char hex token
    const token = crypto.randomBytes(24).toString('hex');

    // Expires in 30 days
    const expiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expires_at = expiresDate.toISOString().slice(0, 19).replace('T', ' ');

    await execute(
      `INSERT INTO onboard_invites
         (token, business_id, business_name, business_slug,
          parent_type_id, parent_type_name,
          child_type_id, child_type_name, child_type_regulations,
          subscription_tier, dispatch_mode, expires_at, admin_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token,
        biz.id, biz.name, biz.slug,
        biz.parent_type_id, biz.parent_type_name,
        biz.type_id, biz.child_type_name, biz.child_type_regulations || '',
        subscription_tier, dispatch_mode,
        expires_at,
        admin_notes || null,
      ]
    );

    // For direct mode: pre-assign the tier on the business immediately
    if (dispatch_mode === 'direct') {
      await execute(
        `UPDATE businesses SET subscription_tier = ? WHERE id = ?`,
        [subscription_tier, business_id]
      );
    }

    const origin = request.headers.get('origin') || 'https://siwify.com';
    const onboard_url = `${origin}/onboard/${token}`;

    return NextResponse.json({ success: true, token, onboard_url, expires_at });
  } catch (e: any) {
    console.error('[onboard/invite POST] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
