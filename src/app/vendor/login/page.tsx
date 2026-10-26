'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phone-first vendor sign-in. Arabic-first, RTL, mobile-only by design.
 * The vendor enters their WhatsApp number, receives a one-time code, and is
 * straight into their dashboard — no email, no password.
 */
export default function VendorLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError('');
    setNotice('');
    if (phone.replace(/\D/g, '').length < 8) {
      setError('اكتب رقم موبايلك كامل، مثالي: 01012345678');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/vendor-auth/phone-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حصلت مشكلة، حاول تاني.');
        return;
      }
      setMaskedPhone(data.maskedPhone || '');
      setStep('code');
      // Dev convenience only: the backend echoes the code when WhatsApp is not live.
      if (data.debugOtp) {
        setCode(String(data.debugOtp));
        setNotice(`وضع التجربة — كودك هو ${data.debugOtp}`);
      } else {
        setNotice('بعتنالك كود على واتساب. دخّله هنا.');
      }
    } catch {
      setError('مفيش اتصال بالسيرفر، حاول تاني.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setError('');
    if (code.replace(/\D/g, '').length !== 6) {
      setError('الكود مكوّن من ٦ أرقام.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/vendor-auth/phone-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.status === 'phone_only') {
        setError(data.error);
        return;
      }
      if (!res.ok || data.status !== 'authenticated') {
        setError(data.error || 'الكود غير صحيح.');
        return;
      }
      router.push('/vendor/app');
    } catch {
      setError('مفيش اتصال بالسيرفر، حاول تاني.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(120% 120% at 50% 0%, #0d1526 0%, #070B12 60%)',
        color: '#fff',
        fontFamily: "'Cairo', 'Noto Sans Arabic', 'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37' }}>SiWiFy</div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            لوحة تحكم الشريك — تسجيل الدخول بالرقم
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 20,
            padding: '1.5rem 1.25rem',
          }}
        >
          {step === 'phone' ? (
            <>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 6 }}>
                رقم موبايلك (واتساب)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="01012345678"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  border: '1px solid #334155',
                  background: '#0b1220',
                  color: '#fff',
                  fontSize: '1.05rem',
                  letterSpacing: '0.05em',
                }}
              />
              <button
                onClick={sendCode}
                disabled={busy}
                style={{
                  width: '100%',
                  marginTop: '1.1rem',
                  padding: '0.9rem',
                  borderRadius: 12,
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '1rem',
                  color: '#0a0f1e',
                  background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? 'بروح نبدّل الكود…' : 'أرسل الكود'}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 10 }}>
                الكود وصلك على واتساب ({maskedPhone})
              </div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="١٢٣٤٥٦"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  border: '1px solid #334155',
                  background: '#0b1220',
                  color: '#fff',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                }}
              />
              <button
                onClick={verifyCode}
                disabled={busy}
                style={{
                  width: '100%',
                  marginTop: '1.1rem',
                  padding: '0.9rem',
                  borderRadius: 12,
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '1rem',
                  color: '#0a0f1e',
                  background: 'linear-gradient(135deg, #D4AF37, #f59e0b)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? 'بروح نتحقق…' : 'دخول'}
              </button>
              <button
                onClick={() => { setStep('phone'); setError(''); setNotice(''); setCode(''); }}
                style={{
                  width: '100%',
                  marginTop: '0.7rem',
                  padding: '0.6rem',
                  background: 'transparent',
                  border: 0,
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                غيّرت رقمك؟ ارجع للخطوة الأولى
              </button>
            </>
          )}

          {notice && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#34d399', textAlign: 'center' }}>
              {notice}
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#fca5a5', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '1.25rem',
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: 1.8,
            textAlign: 'center',
          }}
        >
          النسخة دي مرتبطة برقمك انت وبس — مفيش حد تاني يقدر يدير نشاطك من أي مكان.
          <br />
          عشان تدخل من لابتوب أو جهاز تاني، الوقتي لازم تستخدم موبايلك.
        </div>
      </div>
    </div>
  );
}
