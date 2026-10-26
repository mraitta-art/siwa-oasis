'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/context/AdminContext';

/**
 * MARKETING DESK
 *
 * Runs the market-aware AI marketing pack for each business in a market (Siwa,
 * El Alamein, …) and reviews what it produced. Two ways to work:
 *  • Generate for a single business.
 *  • Run a capped batch across a market (10 by default) — validate, then widen.
 *
 * Everything is saved as an UNPUBLISHED draft, so nothing reaches the public
 * minisite until an editor approves it. That is deliberate: generation is a
 * starting point, not an automatic publish.
 */

interface Pack {
  business_name: string;
  market: string;
  generated_by: 'gemini' | 'fallback';
  hero: { title_en: string; title_ar: string; story_en: string; story_ar: string };
  meta_description: string;
  social_captions: Array<{ en: string; ar: string; hashtags_en: string; hashtags_ar: string }>;
  reel_script: { hook_en: string; body_en: string; cta_en: string; hook_ar: string; body_ar: string; cta_ar: string };
  weekly_ideas: Array<{ en: string; ar: string }>;
  cta: { en: string; ar: string };
}

const label: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 900, color: '#d97706', letterSpacing: '1.5px', margin: '0 0 0.35rem', textTransform: 'uppercase' };
const card: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.1rem', background: '#fff', marginBottom: '1rem' };
const btn: React.CSSProperties = { padding: '0.55rem 1rem', borderRadius: 50, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' };
const btnGhost: React.CSSProperties = { ...btn, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' };

async function authFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...init });
  if (res.status === 401 || res.status === 403) {
    window.location.href = `/login?redirect=${encodeURIComponent('/jana/marketing')}`;
    throw new Error('Redirecting to login…');
  }
  return res;
}

/**
 * Renders generated story text safely. AI output (or the offline template) may
 * contain simple <p>/<strong> markup; we never inject raw HTML — we split it
 * into paragraphs and strip tags so React escapes the text itself.
 */
function SafeStory({ html, dir }: { html?: string; dir?: 'rtl' | 'ltr' }) {
  const paras = String(html || '')
    .split(/<\/p>\s*<p[^>]*>|<br\s*\/>\s*<br\s*\/>/i)
    .map((p) => p.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  return (
    <div dir={dir} style={{ fontSize: dir === 'rtl' ? '0.95rem' : '0.88rem', lineHeight: dir === 'rtl' ? 1.9 : 1.6 }}>
      {paras.map((text, i) => <p key={i} style={{ margin: '0 0 0.5rem' }}>{text}</p>)}
    </div>
  );
}

export default function MarketingDeskPage() {
  const { notify } = useAdmin();
  const [markets, setMarkets] = useState<any[]>([]);
  const [market, setMarket] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string>('');
  const [batch, setBatch] = useState(10);

  // Markets for the selector. Dark markets are included — the desk can prepare
  // El Alamein content before the storefront door opens.
  useEffect(() => {
    authFetch('/api/jana/markets')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.markets) ? data.markets : [];
        setMarkets(list);
        const first = list.find((m: any) => m.active) || list[0];
        if (first) setMarket(String(first.slug ?? first.id));
      })
      .catch(() => {});
  }, []);

  // Businesses for the chosen market.
  useEffect(() => {
    if (!market) return;
    setLoading(true);
    setPack(null);
    setSelectedId('');
    authFetch(`/api/jana/businesses?market=${encodeURIComponent(market)}`)
      .then((r) => r.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, [market]);

  // Load a stored pack when a business is picked, so past work reopens.
  useEffect(() => {
    if (!selectedId) return;
    authFetch(`/api/jana/marketing/generate?business_id=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => setPack(data?.pack || null))
      .catch(() => setPack(null));
  }, [selectedId]);

  const generate = useCallback(async (businessId: string, action: 'generate' | 'captions') => {
    setBusy(true);
    try {
      const res = await authFetch('/api/jana/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'captions'
            ? { business_id: businessId, save: true, publish_captions: true }
            : { business_id: businessId, save: true }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data?.error || 'Generation failed', 'error');
      } else if (action === 'captions') {
        setPack(data.pack);
        notify(`${data.captions_inserted || 0} captions saved as blog drafts`, 'success');
      } else {
        setPack(data.pack);
        notify('Marketing pack generated', 'success');
      }
    } catch (err: any) {
      notify(err?.message || 'Generation failed', 'error');
    }
    setBusy(false);
  }, [notify]);

  const runBulk = useCallback(async () => {
    if (!market) return;
    setBulkBusy(true);
    setBulkSummary('');
    try {
      const res = await authFetch('/api/jana/marketing/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, limit: batch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data?.error || 'Bulk run failed', 'error');
      } else {
        setBulkSummary(`Processed ${data.processed} / requested ${data.requested} in ${data.market} (drafts saved: ${data.saved}).`);
        notify('Batch complete', 'success');
      }
    } catch (err: any) {
      notify(err?.message || 'Bulk run failed', 'error');
    }
    setBulkBusy(false);
  }, [market, batch, notify]);

  const selectedBiz = businesses.find((b) => String(b.id) === selectedId);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(1rem,3vw,2.5rem)', fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 1150, margin: '0 auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#d97706', letterSpacing: 4 }}>MARKETING DESK</div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, margin: '0.25rem 0 0.5rem' }}>AI Marketing Packs <span style={{ color: '#d97706' }}>per Business</span></h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem', maxWidth: 640 }}>
          Generates a bilingual pack (site story, SEO meta, 5 social captions, reel script, 4 weekly ideas, CTA) using the business&apos;s own market and typology. Saved as drafts.
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <label style={label}>MARKET</label>
          <select value={market} onChange={(e) => setMarket(e.target.value)} style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', background: '#fff' }}>
            {markets.map((m) => (
              <option key={String(m.slug ?? m.id)} value={String(m.slug ?? m.id)}>
                {m.nameEn || String(m.slug ?? m.id)}{m.active ? '' : ' (dark)'}
              </option>
            ))}
          </select>

          <span style={{ width: 12 }} />
          <label style={label}>BATCH</label>
          <input type="number" min={1} max={25} value={batch} onChange={(e) => setBatch(Math.min(Math.max(Number(e.target.value) || 1, 1), 25))} style={{ width: 64, padding: '0.6rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
          <button onClick={runBulk} disabled={bulkBusy || !market} style={{ ...btn, opacity: bulkBusy ? 0.6 : 1 }}>
            {bulkBusy ? 'RUNNING…' : `Run batch for ${market || 'market'}`}
          </button>
        </div>
        {bulkSummary && <div style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 700, margin: '-0.5rem 0 1rem' }}>{bulkSummary}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Business list */}
          <div style={{ position: 'sticky', top: 16, maxHeight: '76vh', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1, color: '#64748b' }}>
              BUSINESSES {loading ? '· loading…' : `· ${businesses.length}`}
            </div>
            <div style={{ padding: '0.5rem' }}>
              {businesses.map((b) => (
                <button key={String(b.id)} onClick={() => setSelectedId(String(b.id))} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 10, border: 'none', background: selectedId === String(b.id) ? '#fffdf5' : 'transparent', cursor: 'pointer', marginBottom: 2, fontWeight: selectedId === String(b.id) ? 800 : 500 }}>
                  <div style={{ fontSize: '0.9rem', color: '#0f172a' }}>{b.name_ar || b.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{b.type_name || '—'}{b.published ? '' : ' · not published'}</div>
                </button>
              ))}
              {!loading && businesses.length === 0 && <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>No businesses in this market yet.</div>}
            </div>
          </div>

          {/* Pack detail */}
          <div>
            {!selectedId && <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>Pick a business on the left, then Generate.</div>}

            {selectedId && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <button onClick={() => generate(selectedId, 'generate')} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>{busy ? 'GENERATING…' : pack ? 'REGENERATE' : 'GENERATE PACK'}</button>
                  {pack && <button onClick={() => generate(selectedId, 'captions')} disabled={busy} style={btnGhost}>Save captions to blog drafts</button>}
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {selectedBiz?.name_ar || selectedBiz?.name || ''} {pack ? `· ${pack.generated_by === 'gemini' ? 'AI (Gemini)' : 'offline template'}` : ''}
                  </span>
                </div>

                {!pack && !busy && <div style={{ ...card, color: '#64748b' }}>No saved pack yet. Click <strong>Generate Pack</strong>.</div>}

                {pack && (
                  <>
                    <div style={card}>
                      <div style={label}>1 · Site Hero Story</div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{pack.hero?.title_en}</div>
                      <SafeStory html={pack.hero?.story_en} />
                      <div style={{ marginTop: '0.75rem', fontWeight: 800 }} dir="rtl">{pack.hero?.title_ar}</div>
                      <SafeStory html={pack.hero?.story_ar} dir="rtl" />
                    </div>

                    <div style={card}>
                      <div style={label}>2 · SEO Meta Description</div>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>{pack.meta_description}</div>
                    </div>

                    <div style={card}>
                      <div style={label}>3 · Social Captions (×5)</div>
                      {(pack.social_captions || []).map((c, i) => (
                        <div key={i} style={{ padding: '0.5rem 0', borderTop: i ? '1px dashed #e2e8f0' : 'none' }}>
                          <div style={{ fontSize: '0.85rem' }}>{c.en}</div>
                          <div dir="rtl" style={{ fontSize: '0.9rem', color: '#475569' }}>{c.ar}</div>
                          <div style={{ fontSize: '0.72rem', color: '#0f766e', fontFamily: 'ui-monospace,monospace' }}>{c.hashtags_en} {c.hashtags_ar}</div>
                        </div>
                      ))}
                    </div>

                    <div style={card}>
                      <div style={label}>4 · Reel / Video Script</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <strong>Hook:</strong> {pack.reel_script?.hook_en}<br />
                        <strong>Body:</strong> {pack.reel_script?.body_en}<br />
                        <strong>CTA:</strong> {pack.reel_script?.cta_en}
                      </div>
                      <div dir="rtl" style={{ fontSize: '0.9rem', lineHeight: 1.8, marginTop: '0.5rem', color: '#475569' }}>
                        <strong>افتتاح:</strong> {pack.reel_script?.hook_ar}<br />
                        <strong>المتن:</strong> {pack.reel_script?.body_ar}<br />
                        <strong>دعوة:</strong> {pack.reel_script?.cta_ar}
                      </div>
                    </div>

                    <div style={card}>
                      <div style={label}>5 · Weekly Ideas (×4)</div>
                      <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                        {(pack.weekly_ideas || []).map((w, i) => (
                          <li key={i}>{w.en} <span dir="rtl" style={{ color: '#94a3b8' }}>— {w.ar}</span></li>
                        ))}
                      </ol>
                    </div>

                    <div style={{ ...card, background: '#fffdf5', borderColor: '#fde68a' }}>
                      <div style={label}>6 · Primary CTA</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{pack.cta?.en}</div>
                      <div dir="rtl" style={{ fontSize: '0.95rem', marginTop: 4 }}>{pack.cta?.ar}</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
