'use client';

import React, { useMemo, useState } from 'react';

/**
 * Properties Tours — the site's own facilitated service, living under
 * `/properties`. A buyer picks developments they are curious about and books a
 * curated tour: we arrange the visits to the sales offices and sites and put the
 * buyer in the room with the developer.
 *
 * Phase 1 is honest about what it is: a lead capture with no scheduling backend
 * yet. The form composes a WhatsApp deep-link and hands it to the operator, so a
 * real conversation starts the moment someone submits. Payment and calendar
 * automation are a later phase; nothing here pretends to book anything itself.
 */

// Where a tour request lands. The operator can point it at a real business line
// via NEXT_PUBLIC_LEAD_WHATSAPP without a code change; the fallback is the same
// support number the rest of the product already shows.
const LEAD_NUMBER = process.env.NEXT_PUBLIC_LEAD_WHATSAPP || '201000000000';

export default function PropertiesTours({
  ar,
  accent = '#0F4C81',
  projects = [],
}: {
  ar: boolean;
  accent?: string;
  /** Optional development names to prefill the chooser, from the server page. */
  projects?: string[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');

  const message = useMemo(() => {
    const t = ar
      ? {
          head: 'طلب جولة عقارية عبر Siwify',
          name: 'الاسم',
          phone: 'الهاتف',
          interest: 'المشروع محل الاهتمام',
          when: 'الموعد المفضّل',
          note: 'ملاحظات',
        }
      : {
          head: 'Property viewing tour request via Siwify',
          name: 'Name',
          phone: 'Phone',
          interest: 'Project of interest',
          when: 'Preferred date',
          note: 'Notes',
        };
    const lines = [
      t.head,
      `${t.name}: ${name || '—'}`,
      `${t.phone}: ${phone || '—'}`,
      `${t.interest}: ${interest || '—'}`,
      `${t.when}: ${when || '—'}`,
    ];
    if (note.trim()) lines.push(`${t.note}: ${note.trim()}`);
    return lines.join('\n');
  }, [ar, name, phone, interest, when, note]);

  const href = `https://wa.me/${LEAD_NUMBER}?text=${encodeURIComponent(message)}`;
  const ready = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 8;

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.8rem 0.9rem',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text)',
    fontSize: '0.92rem',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    marginBottom: '0.35rem',
  };

  return (
    <section
      id="properties-tours"
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: `linear-gradient(160deg, ${accent}14 0%, #ffffff 60%)`,
        border: `1px solid ${accent}33`,
        borderRadius: 24,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* What the service is */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '3px', color: accent, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            <i className="fas fa-car-side" aria-hidden="true" />
            <span>{ar ? 'جولة عقارية' : 'Property tours'}</span>
          </div>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
            {ar ? 'زر المشاريع والتقى المطوّرين وجهًا لوجه' : 'Visit the projects. Meet the developers in person.'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8 }}>
            {ar
              ? 'نرتّب لك جولة موجَّهة إلى المشروعات التي تهمّك: نزورك في مكاتب البيع والمواقع، ونجلسك مع المطوّر مباشرة لتسأل عن الأسعار وخطط السداد قبل أي التزام.'
              : 'We arrange a guided tour of the developments you shortlist — sales offices and sites — and put you face to face with the developer, so you can ask about prices and payment plans before any commitment.'}
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '1.3rem 0 0', display: 'grid', gap: '0.7rem' }}>
            {(ar
              ? [
                  ['fa-map-location-dot', 'اختَر المشروعات اللي مهتمّة بيها'],
                  ['fa-building-flag', 'نزورك في مكتب البيع والموقع'],
                  ['fa-handshake-angle', 'قابل المطوّر واسأل بلا وسيط'],
                ]
              : [
                  ['fa-map-location-dot', 'Shortlist the projects you like'],
                  ['fa-building-flag', 'We host you at the office and the site'],
                  ['fa-handshake-angle', 'Sit with the developer, no middleman'],
                ]
            ).map(([icon, text]) => (
              <li key={text} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', color: 'var(--text)', fontSize: '0.9rem' }}>
                <i className={`fas ${icon}`} aria-hidden="true" style={{ color: accent, marginTop: '0.15rem' }} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lead capture */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 'clamp(1.1rem, 3vw, 1.6rem)', boxShadow: 'var(--shadow-sm)', display: 'grid', gap: '0.9rem' }}>
          <div>
            <label style={labelStyle} htmlFor="pt-name">{ar ? 'الاسم' : 'Name'}</label>
            <input id="pt-name" style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder={ar ? 'اسمك الكامل' : 'Your full name'} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="pt-phone">{ar ? 'رقم الواتساب' : 'WhatsApp number'}</label>
            <input id="pt-phone" style={fieldStyle} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder={ar ? '‎+20 1xx xxx xxxx' : '+20 1xx xxx xxxx'} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="pt-interest">{ar ? 'المشروع محل الاهتمام (اختياري)' : 'Project of interest (optional)'}</label>
            {projects.length > 0 ? (
              <select id="pt-interest" style={fieldStyle} value={interest} onChange={e => setInterest(e.target.value)}>
                <option value="">{ar ? 'أي مشروع / أي وجهة' : 'Any project / destination'}</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input id="pt-interest" style={fieldStyle} value={interest} onChange={e => setInterest(e.target.value)} placeholder={ar ? 'مثال: العلمين، راس الحكمة' : 'e.g. El Alamein, Ras El Hekma'} />
            )}
          </div>
          <div>
            <label style={labelStyle} htmlFor="pt-when">{ar ? 'الموعد المفضّل (اختياري)' : 'Preferred date (optional)'}</label>
            <input id="pt-when" style={fieldStyle} value={when} onChange={e => setWhen(e.target.value)} placeholder={ar ? 'نهاية الأسبوع القادم' : 'Next weekend'} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="pt-note">{ar ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
            <textarea id="pt-note" style={{ ...fieldStyle, minHeight: 76, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder={ar ? 'ميزانيتك، نوع الوحدة، أسئلتك...' : 'Budget, unit type, questions...'} />
          </div>

          <a
            href={ready ? href : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            onClick={e => { if (!ready) e.preventDefault(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.2rem',
              borderRadius: 12,
              fontWeight: 900,
              fontSize: '0.95rem',
              textDecoration: 'none',
              background: ready ? '#25D366' : 'var(--border)',
              color: ready ? '#04231a' : 'var(--text-light)',
              cursor: ready ? 'pointer' : 'not-allowed',
              pointerEvents: ready ? 'auto' : 'none',
            }}
          >
            <i className="fab fa-whatsapp" aria-hidden="true" />
            {ar ? 'اطلب جولتك على واتساب' : 'Request my tour on WhatsApp'}
          </a>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
            {ar
              ? 'نفتح واتساب برسالتك جاهزة. لا نحصّل أي عمولة على الزيارات.'
              : 'Opens WhatsApp with your message ready. We take no commission on viewings.'}
          </p>
        </div>
      </div>
    </section>
  );
}
