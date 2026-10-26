import { createHmac, randomInt, randomUUID } from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { getJwtSecret } from '@/lib/jwt-secret';

/**
 * Phone-first vendor identity.
 *
 * A vendor's account IS their phone number. This module issues a short one-time
 * code, delivers it over WhatsApp, verifies it, and resolves (or creates) the
 * vendor account the number owns. Nothing here logs a plain code, and only a
 * keyed hash of the code is ever stored.
 */

// Time rules run on the DATABASE clock (NOW()), not the web server's wall clock or
// a client timezone, so a code can never be judged expired/valid by the wrong clock.
const OTP_TTL_MINUTES = 5;            // a code lives 5 minutes
const OTP_WINDOW_HOURS = 1;           // rate-limit horizon: 1 hour
const OTP_MAX_PER_WINDOW = 5;         // at most 5 codes per number per hour

export function normalizePhone(value: unknown): string {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Egyptian local 01XXXXXXXXX -> international 201XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('01')) digits = `2${digits}`;
  return digits;
}

/** A phone as it is displayed/stored for a vendor: +<international digits>. */
export function plusPhone(digits: string): string {
  return digits ? `+${digits}` : '';
}

function pepper(): Uint8Array {
  return getJwtSecret() ?? new TextEncoder().encode('siwa-otp-dev-pepper');
}

function hashCode(target: string, code: string): string {
  return createHmac('sha256', pepper()).update(`${target}:${code}`).digest('hex');
}

export class OtpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Issue a fresh login code for a phone. Consumes any previous active code and
 * enforces a per-number rate limit. Returns the plain code so the CALLER decides
 * how to deliver it (WhatsApp in prod, response body only in dev).
 */
export async function issuePhoneOtp(rawPhone: unknown): Promise<{ id: string; code: string; digits: string }> {
  const digits = normalizePhone(rawPhone);
  if (digits.length < 8 || digits.length > 15) {
    throw new OtpError('أدخل رقم هاتف صحيح بصيغة دولية.', 400);
  }

  const recent = await queryOne<any>(
    `SELECT COUNT(*) AS n FROM vendor_otps
      WHERE target = ? AND purpose = 'login'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${OTP_WINDOW_HOURS} HOUR)`,
    [digits]
  );
  if (Number(recent?.n || 0) >= OTP_MAX_PER_WINDOW) {
    throw new OtpError('محاولات كثيرة، انتظر شوية قبل ما تطلب كود تاني.', 429);
  }

  // Only one active code per number: retire any earlier unconsumed one.
  await execute(
    `UPDATE vendor_otps SET consumed_at = NOW()
      WHERE target = ? AND purpose = 'login' AND consumed_at IS NULL`,
    [digits]
  );

  const code = String(randomInt(100000, 1000000));
  const id = randomUUID();

  await execute(
    `INSERT INTO vendor_otps (id, target, channel, purpose, code_hash, max_attempts, expires_at)
     VALUES (?, ?, 'whatsapp', 'login', ?, 5, DATE_ADD(NOW(), INTERVAL ${OTP_TTL_MINUTES} MINUTE))`,
    [id, digits, hashCode(digits, code)]
  );

  return { id, code, digits };
}

/**
 * Verify a code and consume it. Fails closed on unknown/expired/over-attempt
 * codes and never reveals which check failed beyond a generic Arabic message.
 */
export async function verifyPhoneOtp(rawPhone: unknown, rawCode: unknown): Promise<void> {
  const digits = normalizePhone(rawPhone);
  const code = String(rawCode || '').trim();
  if (!digits || !/^\d{6}$/.test(code)) {
    throw new OtpError('الكود غير صحيح.', 400);
  }

  const row = await queryOne<any>(
    `SELECT * FROM vendor_otps
      WHERE target = ? AND purpose = 'login' AND consumed_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1`,
    [digits]
  );
  if (!row) throw new OtpError('الكود غير صحيح أو انتهت صلاحيته.', 400);

  if (Number(row.attempts) >= Number(row.max_attempts)) {
    await execute('UPDATE vendor_otps SET consumed_at = NOW() WHERE id = ?', [row.id]);
    throw new OtpError('محاولات كثيرة للكود ده، اطلب كود جديد.', 400);
  }

  if (hashCode(digits, code) !== row.code_hash) {
    await execute('UPDATE vendor_otps SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    throw new OtpError('الكود غير صحيح.', 400);
  }

  await execute('UPDATE vendor_otps SET consumed_at = NOW(), attempts = attempts + 1 WHERE id = ?', [row.id]);
}

export interface ResolvedVendor {
  id: string;
  phone: string;
  role: string;
  displayName: string | null;
  businessId: string | null;
  subscriptionTier: string;
}

/**
 * Resolve the vendor a verified phone owns, or create the account on the spot.
 * If the number matches an existing unclaimed business, the vendor is linked and
 * that business is auto-claimed for them (the product decision behind "instant").
 */
export async function resolveVendorByPhone(rawPhone: unknown): Promise<ResolvedVendor> {
  const digits = normalizePhone(rawPhone);

  const existing = await queryOne<any>(
    `SELECT id, phone, role, display_name, business_id, subscription_tier
       FROM profiles
      WHERE REPLACE(REPLACE(COALESCE(phone, ''), '+', ''), ' ', '') = ?
      LIMIT 1`,
    [digits]
  );
  if (existing) {
    if (existing.role !== 'vendor') {
      throw new OtpError('الرقم ده مسجّل كحساب إدارة. استخدم تسجيل دخول الإدارة.', 403);
    }
    // Mark the number proven and backfill the linked business if the account
    // was created before it had one.
    await execute('UPDATE profiles SET phone_verified_at = NOW() WHERE id = ?', [existing.id]);
    if (!existing.business_id) {
      const linked = await findLinkableBusiness(digits);
      if (linked) await linkVendorToBusiness(existing.id, linked.id);
    }
    const fresh = existing.business_id ? existing : await queryOne<any>(
      'SELECT id, phone, role, display_name, business_id, subscription_tier FROM profiles WHERE id = ?',
      [existing.id]
    );
    return toVendor(fresh ?? existing);
  }

  // First time this number proves itself: create the account.
  const id = randomUUID();
  await execute(
    `INSERT INTO profiles
       (id, email, password_hash, phone, role, display_name, business_id,
        subscription_tier, active, approval_status, verification_status, phone_verified_at)
     VALUES (?, NULL, NULL, ?, 'vendor', NULL, NULL, 'free', 1, 'approved', 'pending', NOW())`,
    [id, plusPhone(digits)]
  );

  const linkable = await findLinkableBusiness(digits);
  if (linkable) await linkVendorToBusiness(id, linkable.id);

  const created = await queryOne<any>(
    'SELECT id, phone, role, display_name, business_id, subscription_tier FROM profiles WHERE id = ?',
    [id]
  );
  return toVendor(created);
}

async function findLinkableBusiness(digits: string): Promise<{ id: string; slug: string; name: string } | null> {
  // Match a business whose recorded vendor phone is this number and that no one
  // has claimed yet. Prefer the most recently created such row. vendor_phone is
  // the canonical contact column every send path writes.
  return await queryOne<any>(
    `SELECT id, slug, name FROM businesses
      WHERE is_claimed = 0
        AND REPLACE(REPLACE(COALESCE(vendor_phone, ''), '+', ''), ' ', '') = ?
      ORDER BY created_at DESC LIMIT 1`,
    [digits]
  );
}

async function linkVendorToBusiness(profileId: string, businessId: string): Promise<void> {
  await execute('UPDATE businesses SET vendor_id = ?, is_claimed = 1 WHERE id = ?', [profileId, businessId]);
  await execute('UPDATE profiles SET business_id = ? WHERE id = ?', [businessId, profileId]);
}

function toVendor(row: any): ResolvedVendor {
  return {
    id: row.id,
    phone: row.phone,
    role: row.role,
    displayName: row.display_name ?? null,
    businessId: row.business_id ?? null,
    subscriptionTier: row.subscription_tier ?? 'free',
  };
}

/* ── WhatsApp delivery ─────────────────────────────────────────────────────── */

type OtpWhatsAppEnv = {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  apiVersion: string;
  languageCode: string;
};

/**
 * OTP delivery needs a Meta-approved template whose body carries one variable —
 * the code. Absent any of these, we cannot send in production.
 */
export function readOtpWhatsAppEnv(): OtpWhatsAppEnv | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  if (!accessToken || !phoneNumberId || !templateName || !apiVersion) return null;
  return {
    accessToken,
    phoneNumberId,
    templateName,
    apiVersion,
    languageCode: process.env.WHATSAPP_OTP_LANGUAGE || process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  };
}

export function isOtpWhatsAppConfigured(): boolean {
  return readOtpWhatsAppEnv() !== null;
}

/** Send the login code via a WhatsApp template message. Throws on provider error. */
export async function sendWhatsAppOtp(digits: string, code: string): Promise<void> {
  const env = readOtpWhatsAppEnv();
  if (!env) {
    throw new OtpError('خدمة الأونرة لسه غير مفعّلة على سيرفر الواتساب.', 503);
  }
  const response = await fetch(
    `https://graph.facebook.com/${env.apiVersion}/${env.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: digits,
        type: 'template',
        template: {
          name: env.templateName,
          language: { code: env.languageCode },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      }),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[OTP WHATSAPP SEND FAILED]', response.status, detail.slice(0, 200));
    throw new OtpError('حصلت مشكلة في إرسال الكود، حاول تاني بعد دقيقة.', 502);
  }
}
