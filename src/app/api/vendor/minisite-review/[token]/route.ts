import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import {
  getVendorAgreementText,
  VENDOR_AGREEMENT_VERSION,
  VENDOR_MINISITE_RESPONSIBILITY_ACKNOWLEDGMENT,
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
        vendorPhone: handoff.vendor_phone || '',
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
    const handoff = await findHandoff(token);
    if (!handoff || !handoff.token_expires_at || new Date(handoff.token_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This review link is invalid or expired.' }, { status: 410 });
    }
    if (!['sent', 'delivered', 'read', 'changes_requested'].includes(handoff.status)) {
      return NextResponse.json({ error: 'This revision cannot accept another response.' }, { status: 409 });
    }

    const body = await request.json();
    const action = body.action;
    const actorName = String(body.name || '').trim().slice(0, 255);
    const acceptedLanguage: VendorAgreementLanguage | null =
      body.language === 'ar' || body.language === 'en' ? body.language : null;

    if (action === 'request_changes') {
      const note = String(body.note || '').trim().slice(0, 2000);
      if (!note) return NextResponse.json({ error: 'Please describe the changes you are requesting.' }, { status: 400 });
      await execute(
        `UPDATE minisite_vendor_handoffs SET status = 'changes_requested', changes_requested_note = ? WHERE id = ?`,
        [note, handoff.id]
      );
      await execute(
        `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload)
         VALUES (?, 'changes_requested', ?)`,
        [handoff.id, JSON.stringify({ note })]
      );
      return NextResponse.json({ success: true, status: 'changes_requested' });
    }

    if (action !== 'accept') return NextResponse.json({ error: 'Unsupported response' }, { status: 400 });
    if (
      !actorName ||
      body.authorized !== true ||
      body.responsibilityAcknowledged !== true ||
      body.agreementAccepted !== true ||
      !acceptedLanguage
    ) {
      return NextResponse.json({
        error: 'Enter your name, confirm your authority and minisite responsibilities, and accept the current agreement.',
      }, { status: 400 });
    }
    if (body.agreementVersion !== VENDOR_AGREEMENT_VERSION) {
      return NextResponse.json({ error: 'The agreement has changed. Reload the page and review the current version.' }, { status: 409 });
    }

    const acceptedAt = new Date();
    const acceptedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const agreementHash = createHash('sha256')
      .update(getVendorAgreementText(acceptedLanguage), 'utf8')
      .digest('hex');
    await execute(
      `UPDATE minisite_vendor_handoffs
       SET status = 'accepted', agreement_version = ?, agreement_language = ?, agreement_hash = ?,
           accepted_name = ?, accepted_at = ?, accepted_ip = ?, acceptance_user_agent = ?,
           acceptance_authority = 1, changes_requested_note = NULL
       WHERE id = ?`,
      [
        VENDOR_AGREEMENT_VERSION,
        acceptedLanguage,
        agreementHash,
        actorName,
        acceptedAt,
        acceptedIp,
        String(request.headers.get('user-agent') || '').slice(0, 500),
        handoff.id,
      ]
    );
    await execute(
      `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload)
       VALUES (?, 'vendor_accepted', ?)`,
      [handoff.id, JSON.stringify({
        name: actorName,
        language: acceptedLanguage,
        agreement_version: VENDOR_AGREEMENT_VERSION,
        agreement_hash: agreementHash,
        responsibility_acknowledged: true,
        responsibility_acknowledgment: VENDOR_MINISITE_RESPONSIBILITY_ACKNOWLEDGMENT[acceptedLanguage],
        accepted_at: acceptedAt.toISOString(),
        accepted_ip: acceptedIp,
      })]
    );
    return NextResponse.json({
      success: true,
      status: 'accepted',
      businessId: handoff.business_id,
      businessType: handoff.type_id,
      message: 'Thank you. Your acceptance is recorded. Continue with vendor account registration to manage this business.',
    });
  } catch (error: any) {
    console.error('[vendor/minisite-review POST]', error);
    return NextResponse.json({ error: 'Unable to record your response. Please try again.' }, { status: 500 });
  }
}
