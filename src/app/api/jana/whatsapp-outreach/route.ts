import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function extractContactFromCustomData(customData: any): { whatsapp: string; phone: string } {
  if (!customData || typeof customData !== 'object') {
    return { whatsapp: '', phone: '' };
  }

  const whatsapp =
    customData.basic?.whatsapp ||
    customData.sec_1_identity?.whatsapp ||
    customData.whatsapp ||
    customData.contact_whatsapp ||
    '';

  const phone =
    customData.basic?.phone ||
    customData.sec_1_identity?.phone ||
    customData.phone ||
    customData.contact_phone ||
    '';

  return {
    whatsapp: String(whatsapp || '').trim(),
    phone: String(phone || '').trim(),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const businesses = await query<any>(`
      SELECT b.id, b.name, b.slug, b.subscription_tier, b.published, b.is_claimed, b.custom_data, b.created_at,
             bt.name as type_name, bt.icon as type_icon
      FROM businesses b
      LEFT JOIN business_types bt ON b.type_id = bt.id
      ORDER BY b.created_at DESC
    `);

    const list = (businesses || []).map((biz) => {
      let customData = biz.custom_data;
      if (typeof customData === 'string') {
        try {
          customData = JSON.parse(customData);
        } catch {
          customData = {};
        }
      }

      const contacts = extractContactFromCustomData(customData);
      const effectiveSlug = biz.slug || biz.id;

      return {
        id: biz.id,
        name: biz.name,
        slug: effectiveSlug,
        type_name: biz.type_name || 'Business',
        type_icon: biz.type_icon || 'fa-building',
        subscription_tier: biz.subscription_tier || 'free',
        published: !!biz.published,
        is_claimed: !!biz.is_claimed,
        whatsapp: contacts.whatsapp,
        phone: contacts.phone,
        has_whatsapp: !!(contacts.whatsapp || contacts.phone),
        vanityUrl: `https://siwify.com/${effectiveSlug}`,
        socialToolkitUrl: `https://siwify.com/vendor/social-toolkit?slug=${effectiveSlug}`,
        claimUrl: `https://siwify.com/vendor/claim?slug=${effectiveSlug}`,
      };
    });

    const totalCount = list.length;
    const withWhatsappCount = list.filter((b) => b.has_whatsapp).length;
    const missingWhatsappCount = totalCount - withWhatsappCount;
    const claimedCount = list.filter((b) => b.is_claimed).length;

    return NextResponse.json({
      stats: {
        total: totalCount,
        withWhatsapp: withWhatsappCount,
        missingWhatsapp: missingWhatsappCount,
        claimed: claimedCount,
      },
      businesses: list,
    });
  } catch (err: any) {
    console.error('WhatsApp outreach API error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { businessId, whatsapp, phone } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const rows = await query<any>(`SELECT id, custom_data FROM businesses WHERE id = ?`, [businessId]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData = rows[0].custom_data;
    if (typeof customData === 'string') {
      try {
        customData = JSON.parse(customData);
      } catch {
        customData = {};
      }
    } else if (!customData || typeof customData !== 'object') {
      customData = {};
    }

    // Update contacts across standard locations
    if (!customData.basic) customData.basic = {};
    if (!customData.sec_1_identity) customData.sec_1_identity = {};

    const cleanWhatsapp = String(whatsapp || '').trim();
    const cleanPhone = String(phone || cleanWhatsapp || '').trim();

    customData.basic.whatsapp = cleanWhatsapp;
    customData.basic.phone = cleanPhone;
    customData.sec_1_identity.whatsapp = cleanWhatsapp;
    customData.sec_1_identity.phone = cleanPhone;
    customData.whatsapp = cleanWhatsapp;
    customData.phone = cleanPhone;

    await execute(
      `UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(customData), businessId]
    );

    return NextResponse.json({
      success: true,
      message: 'Business WhatsApp & contact updated successfully',
      whatsapp: cleanWhatsapp,
      phone: cleanPhone,
    });
  } catch (err: any) {
    console.error('Update contact error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update contact' }, { status: 500 });
  }
}
