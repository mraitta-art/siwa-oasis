'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface VersionRow {
  id: string;
  business_id: string;
  revision: number;
  status: string;
  role: 'published' | 'working' | 'archived';
  track: 'free' | 'paid';
  registration_paid: boolean;
  registration_ref: string | null;
  business_slug?: string;
  business_name?: string;
  updated_at?: string;
}

interface Props {
  businessId: string;
  businessName?: string;
  activeHandoffId?: string;
  lang?: 'en' | 'ar';
}

const L = {
  en: {
    title: 'Versions · Free vs Paid',
    sub: 'Every vendor has a FREE page on Siwify automatically. Build a paid premium copy privately, then publish it to replace the free one.',
    freeTitle: 'Free presence (always live)',
    freeIsLive: 'Currently live: the free auto-generated page.',
    freeSuperseded: 'Superseded by the live paid version below.',
    freeHint: 'This baseline exists for free as part of the platform. It returns automatically if the paid version is reverted.',
    liveTitle: 'Paid version · Live now',
    liveHint: 'What visitors see. Tier + template rules apply. Reverting reveals the free page again.',
    workingTitle: 'Private paid drafts (unlimited, not public)',
    workingHint: 'Negotiate the premium copy here. Nothing is capped or shown publicly until published.',
    archivedTitle: 'Archived (recoverable)',
    archivedHint: 'Superseded versions stay here. Restore to keep editing, or publish to go live again.',
    publish: 'Publish (replace free)',
    revert: 'Revert to free',
    archive: 'Archive',
    restore: 'Restore',
    viewLive: 'View live',
    paidQ: 'Template registration paid? (optional — tracked, does not block publish)',
    refPh: 'Payment / invoice reference',
    confirm: 'Confirm publish',
    cancel: 'Cancel',
    trackQ: 'Version type',
    paidOpt: 'PAID — unlocks the full multi-section site',
    freeOpt: 'FREE — single flat page (no sections)',
    paidTag: 'PAID · sectioned',
    freeTag: 'FREE · flat',
    publishedMsg: 'Published — this version is now live; the previous version was archived (recoverable).',
    revertedMsg: 'Reverted — the free page is live again; the paid version is archived.',
    doneMsg: 'Done.',
    loadErr: 'Could not load versions.',
    none: 'No paid versions yet — the free page is live.',
    convertBtn: 'Preview as Sectional (draft)',
    convertPub: 'Publish Sectional Draft',
    converting: 'Converting…',
    convertDone: 'Saved a DRAFT sectional manifest — nothing is public yet.',
    pubDone: 'Sectional manifest published (overlays resolvable sections only).',
    reportTitle: 'Sectional readiness report',
    noMap: 'This draft has no mappable builder components.',
    rSection: 'Section', rLive: 'Renders now', rGap: 'Blocker / next step',
  },
  ar: {
    title: 'الإصدارات · المجاني مقابل المدفوع',
    sub: 'لكل تاجر صفحة مجانية تلقائية على سيويفاي. أنشئ نسخة مدفوعة مميزة بخصوصية، ثم انشرها لتحل محل المجانية.',
    freeTitle: 'الوجود المجاني (مباشر دائمًا)',
    freeIsLive: 'المباشر حاليًا: الصفحة المجانية المولّدة تلقائيًا.',
    freeSuperseded: 'تم استبدالها بالنسخة المدفوعة المباشرة أدناه.',
    freeHint: 'هذا الأساس موجود مجانًا كجزء من المنصة. يعود تلقائيًا إذا تراجعت عن النسخة المدفوعة.',
    liveTitle: 'النسخة المدفوعة · مباشرة الآن',
    liveHint: 'ما يراه الزوار. تُطبَّق قواعد الباقة والقالب. التراجع يُظهر الصفحة المجانية مجددًا.',
    workingTitle: 'مسودات مدفوعة خاصة (غير محدودة، غير عامة)',
    workingHint: 'تفاوض على النسخة المميزة هنا. لا شيء محدود أو معروض للعامة قبل النشر.',
    archivedTitle: 'مؤرشف (قابل للاستعادة)',
    archivedHint: 'تبقى الإصدارات المستبدلة هنا. استعد للتحرير أو انشر لإعادتها مباشرة.',
    publish: 'نشر (استبدال المجاني)',
    revert: 'التراجع إلى المجاني',
    archive: 'أرشفة',
    restore: 'استعادة',
    viewLive: 'عرض المباشر',
    paidQ: 'هل تم دفع تسجيل القالب؟ (اختياري — للتتبّع، ولا يمنع النشر)',
    refPh: 'مرجع الدفع / الفاتورة',
    confirm: 'تأكيد النشر',
    cancel: 'إلغاء',
    trackQ: 'نوع الإصدار',
    paidOpt: 'مدفوع — يفتح الموقع متعدد الأقسام بالكامل',
    freeOpt: 'مجاني — صفحة واحدة مسطحة (بدون أقسام)',
    paidTag: 'مدفوع · متعدد الأقسام',
    freeTag: 'مجاني · مسطح',
    publishedMsg: 'تم النشر — تستبدل النسخة المدفوعة الصفحة المجانية، وأُرشفت النسخة السابقة (قابلة للاستعادة).',
    revertedMsg: 'تم التراجع — الصفحة المجانية مباشرة مجددًا، والنسخة المدفوعة مؤرشفة.',
    doneMsg: 'تم.',
    loadErr: 'تعذّر تحميل الإصدارات.',
    none: 'لا توجد نسخ مدفوعة بعد — الصفحة المجانية مباشرة.',
    convertBtn: 'معاينة كأقسام (مسودة)',
    convertPub: 'نشر مسودة الأقسام',
    converting: 'جارٍ التحويل…',
    convertDone: 'تم حفظ مسودة الأقسام — لا شيء عام بعد.',
    pubDone: 'تم نشر مسودة الأقسام (تُطبَّق فقط على الأقسام القابلة للعرض).',
    reportTitle: 'تقرير جاهزية الأقسام',
    noMap: 'لا توجد مكوّنات قابلة للتحويل في هذه المسودة.',
    rSection: 'القسم', rLive: 'يظهر الآن', rGap: 'العائق / الخطوة التالية',
  },
};

export default function VersionsPanel({ businessId, businessName, activeHandoffId, lang = 'en' }: Props) {
  const t = L[lang] || L.en;
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [publishTarget, setPublishTarget] = useState('');
  const [paid, setPaid] = useState(false);
  const [ref, setRef] = useState('');
  const [track, setTrack] = useState<'paid' | 'free'>('paid');
  const [convertBusy, setConvertBusy] = useState('');
  const [convertReport, setConvertReport] = useState<any>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jana/minisite-handoffs?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.loadErr);
      setRows(Array.isArray(data?.handoffs) ? data.handoffs : []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || t.loadErr });
    } finally {
      setLoading(false);
    }
  }, [businessId, t.loadErr]);

  useEffect(() => { load(); setPublishTarget(''); setPaid(false); setRef(''); setTrack('paid'); setConvertReport(null); }, [load]);

  const act = async (payload: Record<string, any>, okText?: string) => {
    setBusy(String(payload.handoffId || ''));
    setMsg(null);
    try {
      const res = await fetch('/api/jana/minisite-handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setMsg({ type: 'success', text: okText || t.doneMsg });
      setPublishTarget(''); setPaid(false); setRef(''); setTrack('paid');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Request failed' });
    } finally {
      setBusy('');
    }
  };

  const runConvert = async (handoffId: string, action: 'convert_to_sectional' | 'publish_sectional_draft') => {
    setConvertBusy(handoffId);
    setMsg(null);
    try {
      const res = await fetch('/api/jana/minisite-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, handoffId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Convert failed');
      setConvertReport({ ...data, _action: action });
      setMsg({ type: 'success', text: action === 'convert_to_sectional' ? t.convertDone : t.pubDone });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Convert failed' });
    } finally {
      setConvertBusy('');
    }
  };

  const livePaid = rows.filter(r => r.role === 'published');
  const working = rows.filter(r => r.role === 'working');
  const archived = rows.filter(r => r.role === 'archived');
  const freeIsLive = livePaid.length === 0;
  const slug = livePaid[0]?.business_slug || rows[0]?.business_slug || businessId;

  const card: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 0.85rem', background: '#ffffff' };
  const head: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' };
  const label: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' };
  const hint: React.CSSProperties = { fontSize: '0.72rem', color: '#64748b', margin: '0.15rem 0 0.5rem' };
  const btn = (bg: string, fg: string): React.CSSProperties => ({ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: bg, color: fg, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' });
  const Rev = ({ r }: { r: VersionRow }) => (
    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#334155' }}>
      #{r.revision}{activeHandoffId === r.id ? ' · (open)' : ''}{r.registration_paid ? ' · ✓ paid' : ''}
    </span>
  );

  return (
    <section style={{ margin: '0 0 1.25rem', padding: '1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>🗂 {t.title}{businessName ? ` — ${businessName}` : ''}</div>
          <div style={hint}>{t.sub}</div>
        </div>
        <button onClick={load} style={btn('#ffffff', '#0f172a')} disabled={loading}>↻</button>
      </div>

      {msg && (
        <div style={{ padding: '0.5rem 0.7rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.78rem', fontWeight: 700, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {msg.text}
        </div>
      )}

      {convertReport && Array.isArray(convertReport.report) && (
        <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.7rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #c7d2fe' }}>
          <div style={{ fontWeight: 900, fontSize: '0.75rem', color: '#3730a3', marginBottom: '0.4rem' }}>
            🧩 {t.reportTitle}
            {convertReport.draftRevision != null ? ` · draft #${convertReport.draftRevision}` : ''}
            {convertReport.publishedRevision != null ? ` · published #${convertReport.publishedRevision}` : ''}
          </div>
          {convertReport.report.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.noMap}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '2px 4px' }}>{t.rSection}</th>
                  <th style={{ padding: '2px 4px', width: '5rem' }}>{t.rLive}</th>
                  <th style={{ padding: '2px 4px' }}>{t.rGap}</th>
                </tr>
              </thead>
              <tbody>
                {convertReport.report.map((row: any) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #eef2ff' }}>
                    <td style={{ padding: '3px 4px', fontWeight: 800, color: '#0f172a' }}>{row.id}</td>
                    <td style={{ padding: '3px 4px' }}>
                      {row.renderableNow
                        ? <span style={{ color: '#15803d', fontWeight: 900 }}>✓</span>
                        : <span style={{ color: '#b45309', fontWeight: 900 }}>✕</span>}
                    </td>
                    <td style={{ padding: '3px 4px', color: row.gap ? '#b45309' : '#64748b' }}>
                      {row.gap || (row.fieldCount > 0 ? 'ready — publish to overlay onto the live section' : 'ready, but no form fields mapped for this type')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {convertReport.note && <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#64748b' }}>{convertReport.note}</div>}
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {/* Free baseline (virtual) */}
        <div style={{ ...card, borderColor: freeIsLive ? '#bae6fd' : '#e2e8f0', background: freeIsLive ? '#f0f9ff' : '#ffffff' }}>
          <div style={head}>
            <span style={{ ...label, color: freeIsLive ? '#0369a1' : '#64748b' }}>{t.freeTitle}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: freeIsLive ? '#0369a1' : '#94a3b8' }}>{freeIsLive ? '● ' + t.freeIsLive : t.freeSuperseded}</span>
          </div>
          <p style={hint}>{t.freeHint}</p>
          {freeIsLive && <Link href={`/${slug}`} target="_blank" rel="noopener" style={btn('#0369a1', '#ffffff')}>{t.viewLive} ↗</Link>}
        </div>

        {/* Live paid version */}
        {livePaid.map(r => (
          <div key={r.id} style={{ ...card, borderColor: '#bbf7d0', background: '#f7fdf9' }}>
            <div style={head}><span style={{ ...label, color: r.track === 'paid' ? '#15803d' : '#0369a1' }}>{t.liveTitle} · {r.track === 'paid' ? t.paidTag : t.freeTag}</span><Rev r={r} /></div>
            <p style={hint}>{t.liveHint}</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Link href={`/${r.business_slug || r.business_id}`} target="_blank" rel="noopener" style={btn('#15803d', '#ffffff')}>{t.viewLive} ↗</Link>
              <button style={btn('#fff7ed', '#c2410c')} disabled={busy === r.id} onClick={() => act({ action: 'revert_to_free', handoffId: r.id }, t.revertedMsg)}>{t.revert}</button>
            </div>
          </div>
        ))}

        {/* Private working drafts */}
        <div style={card}>
          <div style={head}><span style={{ ...label, color: '#d97706' }}>{t.workingTitle}</span></div>
          <p style={hint}>{t.workingHint}</p>
          {working.length === 0 && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.none}</div>}
          {working.map(r => (
            <div key={r.id} style={{ borderTop: '1px dashed #e2e8f0', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Rev r={r} />
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button style={btn('#D4AF37', '#0f172a')} disabled={busy === r.id} onClick={() => { setPublishTarget(r.id); setPaid(false); setRef(''); setTrack('paid'); }}>{t.publish}</button>
                  <button style={btn('#eef2ff', '#3730a3')} disabled={convertBusy === r.id} onClick={() => runConvert(r.id, 'convert_to_sectional')}>{convertBusy === r.id ? t.converting : t.convertBtn}</button>
                  <button style={btn('#ecfdf5', '#047857')} disabled={convertBusy === r.id} onClick={() => runConvert(r.id, 'publish_sectional_draft')}>{t.convertPub}</button>
                  <button style={btn('#f8fafc', '#0f172a')} disabled={busy === r.id} onClick={() => act({ action: 'archive_version', handoffId: r.id })}>{t.archive}</button>
                </div>
              </div>
              {publishTarget === r.id && (
                <div style={{ marginTop: '0.5rem', padding: '0.6rem', borderRadius: '8px', background: '#fffdf5', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>{t.trackQ}</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                      <input type="radio" name={`track-${r.id}`} checked={track === 'paid'} onChange={() => setTrack('paid')} />
                      {t.paidOpt}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                      <input type="radio" name={`track-${r.id}`} checked={track === 'free'} onChange={() => setTrack('free')} />
                      {t.freeOpt}
                    </label>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
                    <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
                    {t.paidQ}
                  </label>
                  <input value={ref} onChange={e => setRef(e.target.value)} placeholder={t.refPh} style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.4rem', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '0.78rem' }} />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <button style={btn('#D4AF37', '#0f172a')} disabled={busy === r.id} onClick={() => act({ action: 'publish_version', handoffId: r.id, track, registrationPaid: paid, registrationRef: ref }, t.publishedMsg)}>{t.confirm}</button>
                    <button style={btn('#ffffff', '#0f172a')} onClick={() => setPublishTarget('')}>{t.cancel}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Archived */}
        {archived.length > 0 && (
          <div style={card}>
            <div style={head}><span style={{ ...label, color: '#64748b' }}>{t.archivedTitle}</span></div>
            <p style={hint}>{t.archivedHint}</p>
            {archived.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.35rem 0' }}>
                <Rev r={r} />
                <button style={btn('#f8fafc', '#0f172a')} disabled={busy === r.id} onClick={() => act({ action: 'restore_version', handoffId: r.id })}>{t.restore}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
