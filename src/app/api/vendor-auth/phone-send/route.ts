import { NextRequest, NextResponse } from 'next/server';
import {
  issuePhoneOtp,
  sendWhatsAppOtp,
  isOtpWhatsAppConfigured,
  OtpError,
} from '@/lib/vendor-phone-auth';

/**
 * POST /api/vendor-auth/phone-send  { phone }
 * Issues a login code and delivers it on WhatsApp. Public (no session yet).
 * In production the code goes only to WhatsApp; in development the code is also
 * returned once so the flow can be exercised without a live Meta template.
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const { code, digits } = await issuePhoneOtp(phone);

    const isProduction = process.env.NODE_ENV === 'production';
    const canSend = isOtpWhatsAppConfigured();

    if (canSend) {
      await sendWhatsAppOtp(digits, code);
    } else if (isProduction) {
      return NextResponse.json(
        { error: 'خدمة الكود مش متفعّلة دلوقتي. استخدم تسجيل الدخول بالكلمة السرية أو كلّم دعم SiWiFy.' },
        { status: 503 }
      );
    }

    // Never leak the code in production; only echo it for local/dev testing.
    const debugOtp = isProduction || canSend ? undefined : code;
    return NextResponse.json({
      ok: true,
      sent: canSend,
      maskedPhone: `+${digits.slice(0, 4)}•••${digits.slice(-3)}`,
      ...(debugOtp ? { debugOtp } : {}),
    });
  } catch (error: any) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[VENDOR OTP SEND]', error?.message || error);
    return NextResponse.json({ error: 'حصلت مشكلة، حاول تاني.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
