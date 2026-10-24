import { createHash, randomBytes } from 'crypto';
import { execute, queryOne } from '@/lib/db';
import { getPublicAppUrl } from '@/lib/public-url';
import { applyVendorServiceLevel } from '@/lib/vendor-service-levels';

/**
 * The one place that issues a vendor review token and (optionally) delivers it.
 *
 * Both entry points use this: the L2 pipeline board (`send_invitation`) and the
 * prospect intake (`baseline_send`). Keeping the token + Graph + audit writes
 * here means a prospect cannot be invited through a different, weaker path —
 * the acceptance evidence stays identical no matter who started the deal.
 */

const TOKEN_TTL_DAYS = 7;

export function normalizeInvitationPhone(value: unknown): string {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('01')) digits = `2${digits}`;
  return digits;
}

function fail(message: string, status: number): never {
  throw Object.assign(new Error(message), { status });
}

export async function addHandoffEvent(
  handoffId: string,
  eventType: string,
  payload: object,
  actorId?: string
) {
  await execute(
    'INSERT INTO minisite_vendor_handoff_events (handoff_id, event_type, payload, actor_id) VALUES (?, ?, ?, ?)',
    [handoffId, eventType, JSON.stringify(payload), actorId || null]
  );
}

type InvitationEnv = {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  apiVersion: string;
  languageCode: string;
};

export function readInvitationEnv(): InvitationEnv | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_MINISITE_REVIEW_TEMPLATE;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  if (!accessToken || !phoneNumberId || !templateName || !apiVersion) return null;
  return {
    accessToken,
    phoneNumberId,
    templateName,
    apiVersion,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  };
}

export interface IssuedToken {
  token: string;
  reviewUrl: string;
  expiresAt: Date;
  phone: string;
}

/** Writes a fresh review token and returns the URL. Safe to call on its own. */
export async function issueMinisiteToken(input: {
  handoffId: string;
  vendorPhone?: unknown;
}): Promise<IssuedToken> {
  const handoff = await queryOne<any>(
    'SELECT id, vendor_phone FROM minisite_vendor_handoffs WHERE id = ? LIMIT 1',
    [input.handoffId]
  );
  if (!handoff) fail('Draft not found', 404);

  const phone = normalizeInvitationPhone(input.vendorPhone ?? handoff.vendor_phone);
  if (!phone || phone.length < 8 || phone.length > 15) {
    fail('Enter the vendor WhatsApp number in international format.', 400);
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await execute(
    `UPDATE minisite_vendor_handoffs
        SET status = 'draft', vendor_phone = ?, token_hash = ?, token_expires_at = ?,
            whatsapp_message_id = NULL, whatsapp_error = NULL
      WHERE id = ?`,
    [phone, tokenHash, expiresAt, input.handoffId]
  );

  return {
    token,
    reviewUrl: `${getPublicAppUrl().replace(/\/$/, '')}/vendor/minisite-review/${token}`,
    expiresAt,
    phone,
  };
}

export interface InvitationResult {
  messageId: string;
  expiresAt: string;
  reviewUrl: string;
  promotedToCurated: boolean;
}

/** Issues a token and delivers it through the approved WhatsApp template. */
export async function sendMinisiteInvitation(input: {
  handoffId: string;
  vendorPhone?: unknown;
  adminId?: string;
}): Promise<InvitationResult> {
  const handoff = await queryOne<any>(
    `SELECT h.*, b.name AS business_name, b.slug AS business_slug
       FROM minisite_vendor_handoffs h
       JOIN businesses b ON b.id = h.business_id
      WHERE h.id = ? LIMIT 1`,
    [input.handoffId]
  );
  if (!handoff) fail('Draft not found', 404);
  if (['accepted', 'published'].includes(String(handoff.status))) {
    fail('This revision has already been accepted or published.', 409);
  }

  const env = readInvitationEnv();
  if (!env) {
    fail(
      'WhatsApp Business API is not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_MINISITE_REVIEW_TEMPLATE, and WHATSAPP_API_VERSION.',
      503
    );
  }

  const issued = await issueMinisiteToken({
    handoffId: input.handoffId,
    vendorPhone: input.vendorPhone ?? handoff.vendor_phone,
  });

  let providerResponse: any;
  try {
    const response = await fetch(
      `https://graph.facebook.com/${env.apiVersion}/${env.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: issued.phone,
          type: 'template',
          template: {
            name: env.templateName,
            language: { code: env.languageCode },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: String(handoff.business_name || '').slice(0, 255) },
                { type: 'text', text: issued.reviewUrl },
              ],
            }],
          },
        }),
        // Stays inside the Hobby-plan function budget: a slow provider must fail
        // fast so the caller can still return the manual copy fallback.
        signal: AbortSignal.timeout(9000),
      }
    );
    providerResponse = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(providerResponse?.error?.message || `WhatsApp provider returned HTTP ${response.status}`);
    }
  } catch (error: any) {
    const message = String(error?.message || 'WhatsApp send failed').slice(0, 2000);
    await execute(
      `UPDATE minisite_vendor_handoffs
          SET status = 'failed', token_hash = NULL, token_expires_at = NULL, whatsapp_error = ?
        WHERE id = ?`,
      [message, input.handoffId]
    );
    await addHandoffEvent(input.handoffId, 'send_failed', { message: message.slice(0, 500) }, input.adminId);
    fail(message, 502);
  }

  const messageId = providerResponse?.messages?.[0]?.id;
  if (!messageId) fail('WhatsApp accepted the request without returning a message ID.', 502);

  await execute(
    `UPDATE minisite_vendor_handoffs
        SET status = 'sent', whatsapp_message_id = ?, whatsapp_error = NULL
      WHERE id = ?`,
    [messageId, input.handoffId]
  );
  await addHandoffEvent(input.handoffId, 'whatsapp_sent', { message_id: messageId, recipient: issued.phone }, input.adminId);

  // Level 2: a team-prepared package going out promotes the business to
  // 'curated'. Level-1 batch outreach handoffs carry layout.outreach.template_id
  // and stay on 'template' until the vendor claims them.
  let promotedToCurated = false;
  const layout = typeof handoff.layout === 'string'
    ? (() => { try { return JSON.parse(handoff.layout); } catch { return {}; } })()
    : (handoff.layout || {});
  if (!layout?.outreach?.template_id) {
    const levelChange = await applyVendorServiceLevel({
      businessId: handoff.business_id,
      toLevel: 'curated',
      triggeredBy: input.adminId,
      triggerType: 'admin_promotion',
      reason: 'Curated minisite package sent to the vendor for review',
      metadata: { handoff_id: input.handoffId, revision: handoff.revision, source: 'minisite_package_sent' },
    });
    if (levelChange.changed) {
      promotedToCurated = true;
      await addHandoffEvent(input.handoffId, 'level_curated', {
        from_level: levelChange.fromLevel,
        to_level: levelChange.toLevel,
      }, input.adminId);
    }
  }

  return {
    messageId: String(messageId),
    expiresAt: issued.expiresAt.toISOString(),
    reviewUrl: issued.reviewUrl,
    promotedToCurated,
  };
}

/** Manual fallback: no Graph API, the admin sends the link from his own phone. */
export function buildManualWhatsAppLink(phone: string, reviewUrl: string, businessName: string): string {
  const text = [
    `مرحباً ${businessName}،`,
    '',
    'جهّزنا لك صفحة تعريفية مجانية على سيوايفاي تُعرّف زوار سيوة بنشاطك وخدماتك.',
    'الرابط الخاص بك (صالح ٧ أيام):',
    reviewUrl,
    '',
    'بمجرد موافقتك تتوقف الصفحة عن كونها مسودة وننشرها باسمك مجاناً.',
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
