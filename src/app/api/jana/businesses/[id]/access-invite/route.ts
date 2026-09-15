import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getPublicMinisiteUrl, getPublicAppUrl } from '@/lib/public-url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Siwa-${digits}!${rand}`;
}

function normalizeTrialUnit(unit?: string | null): 'hours' | 'days' | 'months' {
  if (unit === 'days' || unit === 'months') return unit;
  return 'hours';
}

function normalizeTrialValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getTrialExpiry(unit: 'hours' | 'days' | 'months', value: number, baseDate = new Date()): string {
  const d = new Date(baseDate);
  if (unit === 'hours') d.setHours(d.getHours() + value);
  if (unit === 'days') d.setDate(d.getDate() + value);
  if (unit === 'months') d.setMonth(d.getMonth() + value);
  return d.toISOString();
}

function resolveTrialConfig(source: Record<string, any> | undefined, reqUrl?: URL): {
  unit: 'hours' | 'days' | 'months';
  value: number;
  expiresAt: string;
  startedAt: string;
  active: boolean;
} {
  const urlParams = reqUrl?.searchParams;
  const requestedUnit = normalizeTrialUnit(
    urlParams?.get('trialUnit') || urlParams?.get('durationUnit') || source?.trial_unit || source?.duration_unit || 'hours'
  );
  const requestedValue = normalizeTrialValue(
    urlParams?.get('trialValue') ?? urlParams?.get('durationValue') ?? source?.trial_value ?? source?.duration_value ?? 12,
    12
  );

  const startedAtIso = source?.trial_started_at || source?.access_started_at || new Date().toISOString();
  const expiresAtIso = source?.trial_expires_at || source?.access_expires_at || getTrialExpiry(requestedUnit, requestedValue, new Date(startedAtIso));

  return {
    unit: requestedUnit,
    value: requestedValue,
    startedAt: startedAtIso,
    expiresAt: expiresAtIso,
    active: source?.dashboard_access_active !== false
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const biz = await queryOne<any>(
      `SELECT b.*, 
              p.id as profile_id, 
              p.email as vendor_email, 
              p.phone as vendor_phone, 
              p.metadata as profile_metadata
       FROM businesses b
       LEFT JOIN profiles p ON b.vendor_id = p.id
       WHERE b.id = ?`,
      [id]
    );

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let customData: Record<string, any> = {};
    try {
      customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : (biz.custom_data || {});
    } catch {
      customData = {};
    }

    let profileMetadata: Record<string, any> = {};
    try {
      profileMetadata = typeof biz.profile_metadata === 'string' ? JSON.parse(biz.profile_metadata) : (biz.profile_metadata || {});
    } catch {
      profileMetadata = {};
    }

    const reqUrl = new URL(req.url);
    const trialConfig = resolveTrialConfig(customData?.temp_credentials || profileMetadata, reqUrl);

    // Resolve Contact Phone (e.g. from basic info or profile)
    const phone = biz.vendor_phone || customData?.basic?.phone || customData?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    let username = '';
    let tempPassword = '';
    let profileId = biz.profile_id;

    // Check if we already have an active vendor profile and existing temp password
    const hasVendorProfile = biz.vendor_id && biz.vendor_id !== 'anonymous' && biz.profile_id;
    const existingTempPassword = customData?.temp_credentials?.temp_password || profileMetadata?.temp_password;

    if (hasVendorProfile && existingTempPassword) {
      username = biz.vendor_email || customData?.temp_credentials?.username;
      tempPassword = existingTempPassword;
    } else if (hasVendorProfile && !existingTempPassword) {
      // Vendor exists, but no recorded temp password -> generate one and update password_hash
      username = biz.vendor_email;
      tempPassword = generateRandomPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      const updatedMeta = { ...profileMetadata, temp_password: tempPassword, temp_password_created_at: new Date().toISOString() };
      
      await execute('UPDATE profiles SET password_hash = ?, metadata = ? WHERE id = ?', [hash, JSON.stringify(updatedMeta), profileId]);

      customData.temp_credentials = {
        username,
        temp_password: tempPassword,
        trial_unit: trialConfig.unit,
        trial_value: trialConfig.value,
        trial_started_at: trialConfig.startedAt,
        trial_expires_at: trialConfig.expiresAt,
        dashboard_access_active: true,
        public_minisite_active: true,
        updated_at: new Date().toISOString()
      };
      await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(customData), id]);
    } else {
      // No vendor profile yet -> automatically create a dedicated vendor login
      const cleanSlug = biz.slug || biz.id.slice(0, 8);
      const generatedEmail = customData?.basic?.email || `owner.${cleanSlug}@siwify.com`;
      
      // Check if email already exists in profiles
      const existingUser = await queryOne<any>('SELECT id FROM profiles WHERE LOWER(email) = ?', [generatedEmail.toLowerCase()]);
      username = existingUser ? `owner.${cleanSlug}.${Math.floor(100 + Math.random() * 900)}@siwify.com` : generatedEmail;
      
      tempPassword = generateRandomPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      profileId = uuidv4();
      
      const newMetadata = {
        temp_password: tempPassword,
        created_by_admin: true,
        temp_password_created_at: new Date().toISOString()
      };

      await execute(
        `INSERT INTO profiles 
           (id, email, password_hash, role, display_name, phone, business_id, subscription_tier, active, approval_status, metadata, created_at)
         VALUES (?, ?, ?, 'vendor', ?, ?, ?, ?, 1, 'approved', ?, NOW())`,
        [
          profileId,
          username,
          hash,
          `${biz.name} Owner`,
          phone || null,
          biz.id,
          biz.subscription_tier || 'free',
          JSON.stringify(newMetadata)
        ]
      );

      customData.temp_credentials = {
        username,
        temp_password: tempPassword,
        trial_unit: trialConfig.unit,
        trial_value: trialConfig.value,
        trial_started_at: trialConfig.startedAt,
        trial_expires_at: trialConfig.expiresAt,
        dashboard_access_active: true,
        public_minisite_active: true,
        created_at: new Date().toISOString()
      };

      await execute(
        `UPDATE businesses SET vendor_id = ?, is_claimed = 1, custom_data = ? WHERE id = ?`,
        [profileId, JSON.stringify(customData), id]
      );
    }

    const publicAppUrl = getPublicAppUrl().replace(/\/$/, '');
    const minisiteUrl = getPublicMinisiteUrl(biz.slug || biz.id);
    const barcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(minisiteUrl)}&color=000000&bgcolor=ffffff`;
    const loginUrl = `${publicAppUrl}/login`;
    const trialExpiresAt = new Date(trialConfig.expiresAt);
    const trialExpiryLabel = trialExpiresAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    const trialExpiryLabelAr = trialExpiresAt.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

    // Format English WhatsApp Message
    const whatsappMessageEn = `🌴 *Welcome to SiWiFy Oasis Registry!*

Your public minisite for *${biz.name}* is live and ready to review.

🌐 *Public Minisite Link:*
${minisiteUrl}

📲 *Minisite QR Barcode (Scan / Download):*
${barcodeUrl}

🔑 *Vendor Dashboard Access (Private / Separate from QR):*
• *Login Portal:* ${loginUrl}
• *Username / Email:* ${username}
• *Temporary Password:* ${tempPassword}
• *Trial Access Active Until:* ${trialExpiryLabel}

⚠️ *Important:* the QR opens the public minisite only. Dashboard access is sent separately and is time-limited.

💡 _Use the QR to review the public page. Use the login details above to manage the dashboard during the trial period._`;

    // Format Arabic WhatsApp Message
    const whatsappMessageAr = `🌴 *مرحباً بك في منصة سيوة الرسمية (SiWiFy)!*

تم تجهيز الصفحة العامة لمشروعك *${biz.name}* بنجاح، ويمكنك معاينة المحتوى العام مباشرة.

🌐 *رابط الصفحة العامة (Minisite):*
${minisiteUrl}

📲 *باركود الصفحة العامة (QR Code):*
${barcodeUrl}

🔑 *دخول لوحة التحكم (خاص ولا يرسل داخل الباركود):*
• *بوابة الدخول:* ${loginUrl}
• *اسم المستخدم / البريد:* ${username}
• *كلمة المرور المؤقتة:* ${tempPassword}
• *تاريخ انتهاء التجربة:* ${trialExpiryLabelAr}

⚠️ *مهم:* الباركود يفتح الصفحة العامة فقط. بيانات الدخول للوحة التحكم تُرسل بشكل منفصل وتكون محددة بمدة التجربة.

💡 _استخدم الباركود لمعاينة الصفحة العامة، واستخدم بيانات الدخول أعلاه لإدارة لوحة التحكم خلال فترة التجربة._`;

    const whatsappLinkEn = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessageEn)}`;
    const whatsappLinkAr = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessageAr)}`;

    return NextResponse.json({
      success: true,
      businessId: biz.id,
      businessName: biz.name,
      slug: biz.slug,
      phone,
      minisiteUrl,
      barcodeUrl,
      username,
      tempPassword,
      loginUrl,
      trialUnit: trialConfig.unit,
      trialValue: trialConfig.value,
      trialExpiresAt: trialConfig.expiresAt,
      dashboardAccessActive: trialConfig.active,
      publicMinisiteActive: true,
      whatsappMessageEn,
      whatsappMessageAr,
      whatsappLinkEn,
      whatsappLinkAr
    });
  } catch (error: any) {
    console.error('Access Invite GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate access credentials' }, { status: 500 });
  }
}

// POST: Regenerate a fresh temporary password
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const biz = await queryOne<any>(
      `SELECT b.*, p.id as profile_id, p.email as vendor_email, p.metadata as profile_metadata FROM businesses b LEFT JOIN profiles p ON b.vendor_id = p.id WHERE b.id = ?`,
      [id]
    );

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const newTempPassword = generateRandomPassword();
    const hash = await bcrypt.hash(newTempPassword, 10);

    let customData: Record<string, any> = {};
    try {
      customData = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : (biz.custom_data || {});
    } catch {
      customData = {};
    }

    let profileMetadata: Record<string, any> = {};
    try {
      profileMetadata = typeof biz.profile_metadata === 'string' ? JSON.parse(biz.profile_metadata) : (biz.profile_metadata || {});
    } catch {
      profileMetadata = {};
    }

    const selectedTrial = resolveTrialConfig({
      ...(customData?.temp_credentials || {}),
      ...(profileMetadata || {}),
      trial_unit: body?.trialUnit || body?.durationUnit || customData?.temp_credentials?.trial_unit || profileMetadata?.trial_unit,
      trial_value: body?.trialValue || body?.durationValue || customData?.temp_credentials?.trial_value || profileMetadata?.trial_value,
    });

    if (biz.profile_id) {
      const updatedMeta = {
        ...profileMetadata,
        temp_password: newTempPassword,
        trial_unit: selectedTrial.unit,
        trial_value: selectedTrial.value,
        trial_started_at: selectedTrial.startedAt,
        trial_expires_at: selectedTrial.expiresAt,
        dashboard_access_active: true,
        regenerated_at: new Date().toISOString()
      };
      await execute('UPDATE profiles SET password_hash = ?, metadata = ? WHERE id = ?', [hash, JSON.stringify(updatedMeta), biz.profile_id]);
    }

    customData.temp_credentials = {
      username: biz.vendor_email || customData?.temp_credentials?.username,
      temp_password: newTempPassword,
      trial_unit: selectedTrial.unit,
      trial_value: selectedTrial.value,
      trial_started_at: selectedTrial.startedAt,
      trial_expires_at: selectedTrial.expiresAt,
      dashboard_access_active: true,
      public_minisite_active: true,
      regenerated_at: new Date().toISOString()
    };
    await execute('UPDATE businesses SET custom_data = ? WHERE id = ?', [JSON.stringify(customData), id]);

    return NextResponse.json({
      success: true,
      tempPassword: newTempPassword,
      trialUnit: selectedTrial.unit,
      trialValue: selectedTrial.value,
      trialExpiresAt: selectedTrial.expiresAt,
      message: 'Temporary password regenerated successfully'
    });
  } catch (error: any) {
    console.error('Access Invite POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to regenerate temporary password' }, { status: 500 });
  }
}
