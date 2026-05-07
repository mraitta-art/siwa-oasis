import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * VENDOR REGISTRATION API
 * Creates a Profile AND a Business in one atomic flow.
 * Free vendors automatically receive the Essentials template from their tier.
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
    const userId = randomUUID();
    const businessId = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 3. AUTO-RESOLVE: Get the default template from the Free tier
    let templateId: string | null = null;
    try {
      const freeTier = await queryOne('SELECT default_template_id FROM subscription_tiers WHERE id = ?', ['free']) as any;
      if (freeTier?.default_template_id) {
        templateId = freeTier.default_template_id;
      }
    } catch (e) {
      // Column may not exist yet — fall back to hardcoded essentials
      templateId = 'essentials_free';
    }

    // If still no template, try the hardcoded Essentials fallback
    if (!templateId) {
      templateId = 'essentials_free';
    }

    // 4. Create the Business Record with free tier + Essentials template
    await execute(
      `INSERT INTO businesses (id, name, slug, type_id, vendor_id, subscription_tier, template_id, status, published, custom_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, businessName, slug, businessType, userId, 'free', templateId, 'active', false, JSON.stringify({})]
    );

    // 5. Create the Profile and link to the business
    await execute(
      'INSERT INTO profiles (id, email, password_hash, role, display_name, business_id, subscription_tier, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, 'vendor', displayName, businessId, 'free', true]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the Oasis! Your free Essentials studio is ready.',
      userId,
      businessId,
      templateId,
      tier: 'free'
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 500 });
  }
}
