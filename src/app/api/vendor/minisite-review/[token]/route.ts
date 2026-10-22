import { createHash, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createToken, hashPassword, setSessionCookie } from '@/lib/auth';
import { execute, query, queryOne, transaction } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { getBusinessTier, getTierRules, validateMinisiteLayout } from '@/lib/minisite-governance';
import { MINISITE_LAYOUT_KEY, type MinisiteLayout } from '@/lib/minisite-layout';
import {
  getVendorAgreementText,
  VENDOR_AGREEMENT_VERSION,
  type VendorAgreementLanguage,
} from '@/lib/vendor-agreement';

function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseJson(value: any, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function findHandoff(token: string) {
  return queryOne<any>(
    `SELECT h.id, h.business_id, h.revision, h.status, h.layout, h.vendor_phone,
            h.token_expires_at, h.agreement_version, b.name AS business_name,
            b.slug AS business_slug, b.type_id, b.custom_data, bt.name AS type_name
     FROM minisite_vendor_handoffs h
     JOIN businesses b ON b.id = h.business_id
     LEFT JOIN business_types bt ON bt.id = b.type_id
     WHERE h.token_hash = ? LIMIT 1`,
    [tokenDigest(token)]
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
      return NextResponse.json({ error: 'This review link is invalid or expired.' }, { status: 404 });
    }
    const handoff = await findHandoff(token);
    if (!handoff || !handoff.token_expires_at || new Date(handoff.token_expires_at).getTime() < Date.now()) {
      if (handoff?.id && handoff.status !== 'accepted' && handoff.status !== 'published') {
        await execute(`UPDATE minisite_vendor_handoffs SET status = 'expired' WHERE id = ?`, [handoff.id]);
      }
      return NextResponse.json({ error: 'This review link is invalid or expired. Please contact SiWiFy for a new invitation.' }, { status: 410 });
    }
    if (['failed', 'published', 'expired'].includes(handoff.status)) {
      return NextResponse.json({ error: 'This review link is no longer active. Please contact SiWiFy.' }, { status: 410 });
    }
    const [gallery, blogs, products] = await Promise.all([
      query<any>(
        `SELECT id, url, caption, is_hero FROM vendor_gallery
         WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
         ORDER BY is_hero DESC, id DESC`,
        [handoff.business_id]
      ).catch(() => []),
      query<any>(
        `SELECT id, title, content, excerpt, cover_image FROM section_blogs
         WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1
         ORDER BY published_at DESC`,
        [handoff.business_id]
      ).catch(() => []),
      query<any>(
        `SELECT id, title, price, duration, image_url, category, description, is_featured
         FROM tour_products WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1
         ORDER BY is_featured DESC, created_at DESC`,
        [handoff.business_id]
      ).catch(() => []),
    ]);
    return NextResponse.json({
      business: {
        id: handoff.business_id,
        name: handoff.business_name,
        slug: handoff.business_slug,
        type_id: handoff.type_id,
        type_name: handoff.type_name,
        custom_data: parseJson(handoff.custom_data),
        gallery,
        blogs,
        tourProducts: products,
        siteSettings: {},
      },
      handoff: {
        id: handoff.id,
        revision: handoff.revision,
        status: handoff.status,
        layout: parseJson(handoff.layout),
      },
      agreementVersion: VENDOR_AGREEMENT_VERSION,
    });
  } catch (error: any) {
    console.error('[vendor/minisite-review GET]', error);
    return NextResponse.json({ error: 'Unable to load this minisite review.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
      return NextResponse.json({ error: 'This review link is invalid or expired.' }, { status: 404 });
    }
    const body = await request.json();
    if (body.action !== 'accept') {
      return NextResponse.json({ error: 'Unsupported response.' }, { status: 400 });
    }
    const acceptedLanguage: VendorAgreementLanguage | null =
      body.language === 'ar' || body.language === 'en' ? body.language : null;
    if (!acceptedLanguage) return NextResponse.json({ error: 'Unable to determine the agreement language. Reload the invitation and try again.' }, { status: 400 });

    const handoff = await findHandoff(token);
    if (!handoff || !handoff.token_expires_at || new Date(handoff.token_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This review link is invalid or expired. Please contact SiWiFy for a new invitation.' }, { status: 410 });
    }
    if (!['sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted'].includes(handoff.status)) {
      return NextResponse.json({ error: 'This invitation is no longer active. Please contact SiWiFy.' }, { status: 409 });
    }

    const business = await queryOne<any>(
      'SELECT id, slug, name, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
      [handoff.business_id]
    );
    if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 404 });

    const layout = parseJson(handoff.layout, null);
    if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
      return NextResponse.json({ error: 'This minisite is not ready to publish. Please contact SiWiFy.' }, { status: 400 });
    }
    const allowed = await getTierRules(getBusinessTier(business));
    const components = validateMinisiteLayout(layout.components, allowed);
    if (components.length === 0) {
      return NextResponse.json({ error: 'This minisite is not available for the business plan.' }, { status: 400 });
    }

    const acceptedAt = new Date();
    const acceptedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const agreementHash = createHash('sha256')
      .update(getVendorAgreementText(acceptedLanguage), 'utf8')
      .digest('hex');
    const phone = String(handoff.vendor_phone || '').replace(/\D/g, '');
    if (phone.length < 8 || phone.length > 15) {
      return NextResponse.json({ error: 'The invitation has no valid WhatsApp contact. Please contact SiWiFy.' }, { status: 409 });
    }
    const publishedLayout: MinisiteLayout = {
      mode: layout.mode === 'untied' ? 'untied' : 'replace',
      components,
      site_settings: layout.site_settings || {},
      updated_at: acceptedAt.toISOString(),
      updated_by: 'vendor_acceptance',
    };

    const user = await transaction(async connection => {
      const [handoffRows] = await connection.execute(
        `SELECT id, business_id, revision, status, token_expires_at
         FROM minisite_vendor_handoffs WHERE id = ? AND token_hash = ? FOR UPDATE`,
        [handoff.id, tokenDigest(token)]
      );
      const currentHandoff = (handoffRows as any[])[0];
      if (
        !currentHandoff ||
        !currentHandoff.token_expires_at ||
        new Date(currentHandoff.token_expires_at).getTime() < Date.now() ||
        !['sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted'].includes(currentHandoff.status)
      ) {
        throw Object.assign(new Error('This invitation has expired or has already been used.'), { status: 409 });
      }

      const [businessRows] = await connection.execute(
        `SELECT id, name, slug, vendor_id, subscription_tier, custom_data
         FROM businesses WHERE id = ? FOR UPDATE`,
        [handoff.business_id]
      );
      const lockedBusiness = (businessRows as any[])[0];
      if (!lockedBusiness) throw Object.assign(new Error('Business not found.'), { status: 404 });
      const publicSlug = lockedBusiness.slug || lockedBusiness.id;

      const [profileRows] = await connection.execute(
        `SELECT id, email, role, display_name, business_id, subscription_tier, active
         FROM profiles
         WHERE role = 'vendor'
           AND (
             phone IN (?, ?)
             OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '') = ?
           )
         LIMIT 2 FOR UPDATE`,
        [phone, `+${phone}`, phone]
      );
      const matchingProfiles = profileRows as any[];
      if (matchingProfiles.length > 1) {
        throw Object.assign(new Error('This WhatsApp number is linked to multiple vendor accounts. Please contact SiWiFy.'), { status: 409 });
      }

      let profile = matchingProfiles[0] || null;
      if (profile && !profile.active) {
        throw Object.assign(new Error('This vendor account is inactive. Please contact SiWiFy.'), { status: 409 });
      }
      if (profile?.business_id && profile.business_id !== lockedBusiness.id) {
        throw Object.assign(new Error('This WhatsApp number is already linked to another business. Please contact SiWiFy.'), { status: 409 });
      }
      if (lockedBusiness.vendor_id && !['anonymous', ''].includes(lockedBusiness.vendor_id) && lockedBusiness.vendor_id !== profile?.id) {
        throw Object.assign(new Error('This business is already linked to another vendor account. Please contact SiWiFy.'), { status: 409 });
      }

      if (!profile) {
        const profileId = randomUUID();
        const email = `owner.${phone}.${randomBytes(6).toString('hex')}@vendor.siwify.com`;
        const passwordHash = await hashPassword(randomBytes(32).toString('base64url'));
        await connection.execute(
          `INSERT INTO profiles
             (id, email, password_hash, role, display_name, phone, business_id, subscription_tier, active, approval_status, metadata, created_at)
           VALUES (?, ?, ?, 'vendor', ?, ?, ?, ?, 1, 'approved', ?, NOW())`,
          [
            profileId,
            email,
            passwordHash,
            lockedBusiness.name,
            `+${phone}`,
            lockedBusiness.id,
            lockedBusiness.subscription_tier || 'free',
            JSON.stringify({ account_created_by_minisite_acceptance: acceptedAt.toISOString() }),
          ]
        );
        profile = {
          id: profileId,
          email,
          role: 'vendor',
          display_name: lockedBusiness.name,
          business_id: lockedBusiness.id,
          subscription_tier: lockedBusiness.subscription_tier || 'free',
        };
      } else {
        await connection.execute(
          `UPDATE profiles SET business_id = ?, active = 1, approval_status = 'approved'
           WHERE id = ?`,
          [lockedBusiness.id, profile.id]
        );
        profile.business_id = lockedBusiness.id;
      }

      const sessionUser = {
        id: profile.id,
        email: profile.email,
        role: 'vendor',
        displayName: profile.display_name || lockedBusiness.name,
        businessId: lockedBusiness.id,
        subscriptionTier: profile.subscription_tier || lockedBusiness.subscription_tier || 'free',
      };
      const customData = parseJson(lockedBusiness.custom_data);
      const updatedCustomData = {
        ...customData,
        whatsapp: `+${phone}`,
        basic: {
          ...(customData.basic || {}),
          whatsapp: `+${phone}`,
        },
      };
      await connection.execute(
        `UPDATE businesses
         SET vendor_id = ?, vendor_phone = ?, custom_data = ?,
             is_claimed = 1, approved_by_vendor = 1, is_published = 1, status = 'active'
         WHERE id = ?`,
        [profile.id, `+${phone}`, JSON.stringify(updatedCustomData), lockedBusiness.id]
      );
      await connection.execute(
        `UPDATE minisite_vendor_handoffs
         SET status = 'expired', token_hash = NULL, token_expires_at = NULL
         WHERE business_id = ? AND status = 'published' AND id <> ?`,
        [lockedBusiness.id, handoff.id]
      );
      await connection.execute(
        `INSERT INTO website_configs (type, config)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE config = VALUES(config)`,
        [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
      );
      const [updateResult] = await connection.execute(
        `UPDATE minisite_vendor_handoffs
         SET status = 'published', layout = ?, agreement_version = ?, agreement_language = ?,
             agreement_hash = ?, accepted_name = 'WhatsApp invitation recipient', accepted_at = ?,
             accepted_ip = ?, acceptance_user_agent = ?, acceptance_authority = 1,
             changes_requested_note = NULL, token_hash = NULL, token_expires_at = NULL
         WHERE id = ? AND business_id = ?
           AND status IN ('sent', 'delivered', 'read', 'followup_due', 'replied', 'changes_requested', 'accepted')`,
        [
          JSON.stringify(publishedLayout),
          VENDOR_AGREEMENT_VERSION,
          acceptedLanguage,
          agreementHash,
          acceptedAt,
          acceptedIp?.slice(0, 64) || null,
          String(request.headers.get('user-agent') || '').slice(0, 500),
          handoff.id,
          lockedBusiness.id,
        ]
      );
      if (!(updateResult as { affectedRows?: number }).affectedRows) {
        throw Object.assign(new Error('This invitation has already been used.'), { status: 409 });
      }
      await connection.execute(
        `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload)
         VALUES (?, 'vendor_accepted_and_published', ?)`,
        [
          handoff.id,
          JSON.stringify({
            phone: `+${phone}`,
            business_id: lockedBusiness.id,
            revision: currentHandoff.revision,
            agreement_version: VENDOR_AGREEMENT_VERSION,
            agreement_language: acceptedLanguage,
            agreement_hash: agreementHash,
            accepted_at: acceptedAt.toISOString(),
            accepted_ip: acceptedIp,
          }),
        ]
      );
      return { user: sessionUser, publicSlug };
    });

    await setSessionCookie(await createToken(user.user));
    invalidateCache.websiteSettings();
    revalidatePath(`/${user.publicSlug}`);
    revalidatePath('/[slug]', 'page');
    return NextResponse.json({
      success: true,
      status: 'published',
      businessId: handoff.business_id,
      slug: user.publicSlug,
      redirect: `/vendor/app?slug=${encodeURIComponent(user.publicSlug)}&welcome=1`,
    });
  } catch (error: any) {
    console.error('[vendor/minisite-review POST]', error);
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? 'Unable to activate your SIWIFY page. Please try again or contact SiWiFy.' : error.message }, { status });
  }
}
