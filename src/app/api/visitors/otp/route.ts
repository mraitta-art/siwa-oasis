import { NextResponse } from 'next/server';
import { generateOTP, verifyOTP } from '@/lib/otp';

/**
 * POST /api/visitors/otp
 * - action: 'request' -> send OTP to email/phone (stub; in production use email/SMS service)
 * - action: 'verify' -> verify OTP code
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, phone, code } = body;

    if (action === 'request') {
      if (!email && !phone) {
        return NextResponse.json({ error: 'email or phone required' }, { status: 400 });
      }
      const contact = email || phone;
      const otp = generateOTP(contact);
      // TODO: In production, send via email/SMS service
      console.log(`[OTP Stub] ${contact}: ${otp}`);
      return NextResponse.json({ ok: true, message: `OTP sent to ${contact}`, otp: process.env.NODE_ENV === 'development' ? otp : undefined });
    }

    if (action === 'verify') {
      if (!email && !phone) {
        return NextResponse.json({ error: 'email or phone required' }, { status: 400 });
      }
      if (!code) {
        return NextResponse.json({ error: 'code required' }, { status: 400 });
      }
      const contact = email || phone;
      const ok = verifyOTP(contact, code);
      return NextResponse.json({ ok });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
