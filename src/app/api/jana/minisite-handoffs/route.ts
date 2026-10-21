import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { execute, query, queryOne, transaction } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';
import { getPublicAppUrl } from '@/lib/public-url';
import { getBusinessTier, getTierRules, validateMinisiteLayout } from '@/lib/minisite-governance';
import { MINISITE_LAYOUT_KEY, type MinisiteLayout } from '@/lib/minisite-layout';
import { saveMinisiteDraft } from '@/lib/minisite-drafts';
import {
  ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT,
  ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT_VERSION,
} from '@/lib/minisite-admin-publication';

export const dynamic = 'force-dynamic';

function responseError(error: any) {
  const message = error?.message || 'Minisite handoff request failed';
  const status = Number.isInteger(error?.status)
    ? error.status
    : message === 'Not authenticated' ? 401 : message.includes('Admin access required') ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

function parseJson(value: any, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizePhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('01')) digits = `2${digits}`;
  return digits;
}

async function addEvent(handoffId: string, eventType: string, payload: object, actorId?: string) {
  await execute(
    'INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id) VALUES (?, ?, ?, ?)',
    [handoffId, eventType, JSON.stringify(payload), actorId || null]
  );
}

async function getBusinessPreview(businessId: string) {
  const business = await queryOne<any>(
    `SELECT b.id, b.name, b.slug, b.type_id, b.custom_data, b.vendor_phone, bt.name AS type_name
     FROM businesses b LEFT JOIN business_types bt ON bt.id = b.type_id WHERE b.id = ? LIMIT 1`,
    [businessId]
  );
  if (!business) return null;

  const customData = parseJson(business.custom_data);
  const [gallery, blogs, products] = await Promise.all([
    query<any>(
      `SELECT id, url, caption, is_hero FROM vendor_gallery
       WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
       ORDER BY is_hero DESC, id DESC`,
      [businessId]
    ).catch(() => []),
    query<any>(
      `SELECT id, title, content, excerpt, cover_image FROM section_blogs
       WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1
       ORDER BY published_at DESC`,
      [businessId]
    ).catch(() => []),
    query<any>(
      `SELECT id, title, price, duration, image_url, category, description, is_featured
       FROM tour_products WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1
       ORDER BY is_featured DESC, created_at DESC`,
      [businessId]
    ).catch(() => []),
  ]);

  return {
    id: business.id,
    slug: business.slug || business.id,
    name: business.name,
    type_id: business.type_id,
    type_name: business.type_name || '',
    custom_data: customData,
    gallery,
    blogs,
    tourProducts: products,
    vendorPhone: business.vendor_phone || '',
    siteSettings: {},
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const handoffId = searchParams.get('handoffId');
    const businessId = searchParams.get('businessId');

    if (handoffId) {
      const handoff = await queryOne<any>(
        'SELECT id, business_id, revision, status, layout, vendor_phone, token_expires_at, whatsapp_message_id, whatsapp_error, agreement_version, accepted_name, accepted_at, changes_requested_note, created_at, updated_at FROM minisite_vendor_handoffs WHERE id = ?',
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Minisite draft not found' }, { status: 404 });
      const business = await getBusinessPreview(handoff.business_id);
      const events = await query<any>(
        'SELECT id, event_type, payload, actor_id, created_at FROM minisite_vendor_handoff_events WHERE handoff_id = ? ORDER BY created_at DESC LIMIT 100',
        [handoffId]
      );
      return NextResponse.json({
        ...handoff,
        layout: parseJson(handoff.layout),
        business,
        events: events.map((event: any) => ({ ...event, payload: parseJson(event.payload) })),
      });
    }

    const rows = await query<any>(
      `SELECT h.id, h.business_id, h.revision, h.status, h.vendor_phone, h.whatsapp_error,
              h.agreement_version, h.accepted_name, h.accepted_at, h.changes_requested_note,
              h.created_at, h.updated_at, b.name AS business_name, b.slug AS business_slug
       FROM minisite_vendor_handoffs h
       LEFT JOIN businesses b ON b.id = h.business_id
       ${businessId ? 'WHERE h.business_id = ?' : ''}
       ORDER BY h.updated_at DESC LIMIT 300`,
      businessId ? [businessId] : []
    );
    return NextResponse.json({ handoffs: rows });
  } catch (error: any) {
    return responseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || '');

    if (action === 'save_draft') {
      const saved = await saveMinisiteDraft({
        businessId: String(body.businessId || ''),
        layout: body.layout,
        vendorPhone: body.vendorPhone,
        createdBy: admin.id,
      });
      return NextResponse.json({ success: true, ...saved, status: 'draft' });
    }

    if (action === 'send_invitation') {
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>(
        `SELECT h.*, b.name AS business_name, b.slug AS business_slug
         FROM minisite_vendor_handoffs h JOIN businesses b ON b.id = h.business_id WHERE h.id = ?`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      if (['accepted', 'published'].includes(handoff.status)) {
        return NextResponse.json({ error: 'This revision has already been accepted or published.' }, { status: 409 });
      }

      const phone = normalizePhone(body.vendorPhone || handoff.vendor_phone);
      if (!phone || phone.length < 8 || phone.length > 15) {
        return NextResponse.json({ error: 'Enter the vendor WhatsApp number in international format.' }, { status: 400 });
      }
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const templateName = process.env.WHATSAPP_MINISITE_REVIEW_TEMPLATE;
      const apiVersion = process.env.WHATSAPP_API_VERSION;
      const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
      if (!accessToken || !phoneNumberId || !templateName || !apiVersion) {
        return NextResponse.json({
          error: 'WhatsApp Business API is not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_MINISITE_REVIEW_TEMPLATE, and WHATSAPP_API_VERSION.',
        }, { status: 503 });
      }

      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const reviewUrl = `${getPublicAppUrl().replace(/\/$/, '')}/vendor/minisite-review/${token}`;
      await execute(
        `UPDATE minisite_vendor_handoffs SET status = 'draft', vendor_phone = ?, token_hash = ?,
           token_expires_at = ?, whatsapp_message_id = NULL, whatsapp_error = NULL
         WHERE id = ?`,
        [phone, tokenHash, expiresAt, handoffId]
      );

      let providerResponse: any;
      try {
        const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: String(handoff.business_name).slice(0, 255) },
                  { type: 'text', text: reviewUrl },
                ],
              }],
            },
          }),
          signal: AbortSignal.timeout(15000),
        });
        providerResponse = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = providerResponse?.error?.message || `WhatsApp provider returned HTTP ${response.status}`;
          throw new Error(message);
        }
      } catch (error: any) {
        await execute(
          `UPDATE minisite_vendor_handoffs SET status = 'failed', token_hash = NULL, token_expires_at = NULL, whatsapp_error = ? WHERE id = ?`,
          [String(error?.message || 'WhatsApp send failed').slice(0, 2000), handoffId]
        );
        await addEvent(handoffId, 'send_failed', { message: String(error?.message || 'WhatsApp send failed').slice(0, 500) }, admin.id);
        throw error;
      }

      const messageId = providerResponse?.messages?.[0]?.id;
      if (!messageId) throw new Error('WhatsApp accepted the request without returning a message ID.');
      await execute(
        `UPDATE minisite_vendor_handoffs SET status = 'sent', whatsapp_message_id = ?, whatsapp_error = NULL WHERE id = ?`,
        [messageId, handoffId]
      );
      await addEvent(handoffId, 'whatsapp_sent', { message_id: messageId, recipient: phone }, admin.id);
      return NextResponse.json({ success: true, status: 'sent', messageId, expiresAt: expiresAt.toISOString() });
    }

    if (action === 'publish_admin') {
      const handoffId = String(body.handoffId || '');
      if (!handoffId || body.ownershipAcknowledged !== true) {
        return NextResponse.json({
          error: 'Confirm the admin publication responsibility statement before publishing.',
        }, { status: 400 });
      }

      const handoff = await queryOne<any>(
        `SELECT h.id, h.business_id, h.revision, h.status, h.layout, b.slug, b.name
         FROM minisite_vendor_handoffs h
         JOIN businesses b ON b.id = h.business_id
         WHERE h.id = ? LIMIT 1`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      if (handoff.status !== 'draft') {
        return NextResponse.json({ error: 'Only a saved admin draft can be published through this flow.' }, { status: 409 });
      }

      const layout = parseJson(handoff.layout, null);
      if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
        return NextResponse.json({ error: 'The saved draft has no publishable layout components.' }, { status: 400 });
      }

      const business = await queryOne<any>(
        'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
        [handoff.business_id]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const allowed = await getTierRules(getBusinessTier(business));
      const components = validateMinisiteLayout(layout.components, allowed);
      if (components.length === 0) {
        return NextResponse.json({ error: 'No components in this draft are allowed for the business tier.' }, { status: 400 });
      }

      const publishedAt = new Date().toISOString();
      const publishedLayout: MinisiteLayout = {
        mode: layout.mode === 'untied' ? 'untied' : 'replace',
        components,
        site_settings: layout.site_settings || {},
        updated_at: publishedAt,
        updated_by: admin.id,
      };
      const publicSlug = handoff.slug || handoff.business_id;

      await transaction(async connection => {
        const [updateResult] = await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'published', layout = ?, token_hash = NULL, token_expires_at = NULL
           WHERE id = ? AND business_id = ? AND status = 'draft'`,
          [JSON.stringify(publishedLayout), handoffId, handoff.business_id]
        );
        if (!(updateResult as { affectedRows?: number }).affectedRows) {
          const conflict = new Error('This draft changed before it could be published.');
          Object.assign(conflict, { status: 409 });
          throw conflict;
        }
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status = 'published' AND id <> ?`,
          [handoff.business_id, handoffId]
        );
        await connection.execute(
          `INSERT INTO website_configs (type, config)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE config = VALUES(config)`,
          [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
        );
        await connection.execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
           VALUES (?, 'admin_published', ?, ?)`,
          [
            handoffId,
            JSON.stringify({
              revision: handoff.revision,
              business_name: handoff.name,
              acknowledgment_version: ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT_VERSION,
              acknowledgment_text: ADMIN_MINISITE_PUBLICATION_ACKNOWLEDGMENT,
              acknowledged_at: publishedAt,
            }),
            admin.id,
          ]
        );
      });

      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({
        success: true,
        status: 'published',
        slug: publicSlug,
        revision: handoff.revision,
      });
    }

    if (action === 'publish') {
      const handoffId = String(body.handoffId || '');
      const handoff = await queryOne<any>(
        `SELECT h.id, h.business_id, h.revision, h.status, h.layout, b.slug, b.name
         FROM minisite_vendor_handoffs h JOIN businesses b ON b.id = h.business_id WHERE h.id = ?`,
        [handoffId]
      );
      if (!handoff) return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      if (handoff.status !== 'accepted') {
        return NextResponse.json({ error: 'The vendor must accept this revision before it can be published.' }, { status: 409 });
      }
      const layout = parseJson(handoff.layout, null);
      if (!layout || !Array.isArray(layout.components) || layout.components.length === 0) {
        return NextResponse.json({ error: 'The accepted revision has no publishable layout components.' }, { status: 400 });
      }

      const business = await queryOne<any>(
        'SELECT id, slug, type_id, subscription_tier, is_master FROM businesses WHERE id = ? LIMIT 1',
        [handoff.business_id]
      );
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const allowed = await getTierRules(getBusinessTier(business));
      const components = validateMinisiteLayout(layout.components, allowed);
      if (components.length === 0) {
        return NextResponse.json({ error: 'No components in this revision are allowed for the business tier.' }, { status: 400 });
      }

      const publishedAt = new Date().toISOString();
      const publishedLayout: MinisiteLayout = {
        mode: layout.mode === 'untied' ? 'untied' : 'replace',
        components,
        site_settings: layout.site_settings || {},
        updated_at: publishedAt,
        updated_by: admin.id,
      };
      const publicSlug = handoff.slug || handoff.business_id;

      await transaction(async connection => {
        await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'expired', token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND status = 'published' AND id <> ?`,
          [handoff.business_id, handoffId]
        );
        await connection.execute(
          `INSERT INTO website_configs (type, config)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE config = VALUES(config)`,
          [MINISITE_LAYOUT_KEY(publicSlug), JSON.stringify(publishedLayout)]
        );
        const [updateResult] = await connection.execute(
          `UPDATE minisite_vendor_handoffs
           SET status = 'published', layout = ?, token_hash = NULL, token_expires_at = NULL
           WHERE business_id = ? AND id = ? AND status = 'accepted'`,
          [JSON.stringify(publishedLayout), handoff.business_id, handoffId]
        );
        if (!(updateResult as { affectedRows?: number }).affectedRows) {
          const conflict = new Error('This accepted revision changed before it could be published.');
          Object.assign(conflict, { status: 409 });
          throw conflict;
        }
        await connection.execute(
          `INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id)
           VALUES (?, 'published', ?, ?)`,
          [handoffId, JSON.stringify({ revision: handoff.revision }), admin.id]
        );
      });
      invalidateCache.websiteSettings();
      revalidatePath(`/${publicSlug}`);
      revalidatePath('/[slug]', 'page');
      return NextResponse.json({ success: true, status: 'published', slug: publicSlug });
    }

    if (action === 'update_status') {
      const handoffId = String(body.handoffId || '');
      const status = String(body.status || '');
      if (!['followup_due', 'replied'].includes(status)) {
        return NextResponse.json({ error: 'Unsupported CRM status' }, { status: 400 });
      }
      const handoff = await queryOne<any>('SELECT id, status FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1', [handoffId]);
      if (!handoff) return NextResponse.json({ error: 'Handoff not found' }, { status: 404 });
      if (['accepted', 'published', 'expired'].includes(handoff.status)) {
        return NextResponse.json({ error: 'This handoff is already complete.' }, { status: 409 });
      }
      await execute('UPDATE minisite_vendor_handoffs SET status = ? WHERE id = ?', [status, handoffId]);
      await addEvent(handoffId, status, { note: String(body.note || '').slice(0, 500) }, admin.id);
      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('[jana/minisite-handoffs]', error);
    return responseError(error);
  }
}
