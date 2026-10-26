import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoneOtp, resolveVendorByPhone, OtpError } from '@/lib/vendor-phone-auth';
import { createToken, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isMobileRequest(userAgent: string): boolean {
  return /android|iphone|ipad|ipod|mobile|windows phone/i.test(userAgent || '');
}

/**
 * POST /api/vendor-auth/phone-verify  { phone, code }
 * Verifies the WhatsApp code and, on success, signs the vendor in.
 *
 * Phone-first login is deliberately bound to the owner's phone. Desktop is not
 * granted a session yet — the email second-factor path is a planned next step —
 * so a non-mobile client is answered with an Arabic "use your phone" notice.
 */
export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (!isMobileRequest(ua)) {
    return NextResponse.json(
      {
        status: 'phone_only',
        error:
          'تسجيل دخول الشريك بالرقم متاح حاليًا من الموبايل فقط. افتح siwify.com من موبايلك وسجّل برقمك.',
      },
      { status: 403 }
    );
  }

  try {
    const { phone, code } = await request.json();
    await verifyPhoneOtp(phone, code);
    const vendor = await resolveVendorByPhone(phone);

    const token = await createToken({
      id: vendor.id,
      email: '',
      role: 'vendor',
      displayName: vendor.displayName,
      businessId: vendor.businessId,
      subscriptionTier: vendor.subscriptionTier,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      status: 'authenticated',
      businessId: vendor.businessId,
    });
  } catch (error: any) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[VENDOR OTP VERIFY]', error?.message || error);
    return NextResponse.json({ error: 'حصلت مشكلة، حاول تاني.' }, { status: 500 });
  }
}
