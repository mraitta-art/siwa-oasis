import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, slug, vendorPhone, vendorEmail, vendorName, agreeBioLink, agreeSocialSync } = body;

    if (!businessId && !slug) {
      return NextResponse.json({ error: 'Missing business identifier' }, { status: 400 });
    }

    // Lookup business
    const biz = await queryOne<any>(
      `SELECT * FROM businesses WHERE id = ? OR slug = ? LIMIT 1`,
      [businessId || '', slug || '']
    );

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Parse existing custom_data
    let customData: Record<string, any> = {};
    try {
      customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data || {};
    } catch {
      customData = {};
    }

    // Record claim & acceptance details
    const claimRecord = {
      claimed_at: new Date().toISOString(),
      vendor_phone: vendorPhone || biz.vendor_phone,
      vendor_email: vendorEmail || biz.vendor_email,
      vendor_name: vendorName || biz.name,
      agreed_bio_link: agreeBioLink !== false,
      agreed_social_sync: agreeSocialSync !== false,
      verification_status: 'verified_partner',
      vip_pass_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30-day VIP pass
    };

    customData.claim_record = claimRecord;
    customData.social_bridge_enabled = true;
    customData.is_verified_partner = true;

    // Update business status to active / published and attach claim data
    await execute(
      `UPDATE businesses 
       SET is_published = 1, 
           custom_data = ?, 
           vendor_phone = COALESCE(?, vendor_phone)
       WHERE id = ?`,
      [
        JSON.stringify(customData),
        vendorPhone || null,
        biz.id
      ]
    );

    try {
      invalidateCache.all();
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Business claimed and activated successfully!',
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        vanityUrl: `https://siwify.com/${biz.slug}`,
        claimRecord,
      }
    });
  } catch (error: any) {
    console.error('Error claiming business:', error);
    return NextResponse.json({ error: error?.message || 'Failed to claim business' }, { status: 500 });
  }
}
