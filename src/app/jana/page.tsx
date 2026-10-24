import React from 'react';
import Link from 'next/link';
import { query as safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * ADMIN COMMAND CENTER (Phase 1 — read-only, no behavior change).
 *
 * Replaces the old promo home with a stage-driven pipeline board that places
 * every business at its CURRENT lifecycle stage, derived purely from existing
 * data (businesses + minisite_vendor_handoffs.status). Each card offers a single
 * "next action" deep-link into the screens that already exist. Nothing here
 * creates, edits, or publishes anything.
 */

type Stage = 'prospect' | 'register' | 'data' | 'build' | 'follow_up' | 'decide' | 'live';

// handoff status → furthest-along stage (rank wins across a business's handoffs).
const HANDOFF_RANK: Record<string, { rank: number; stage: Stage }> = {
  published: { rank: 7, stage: 'live' },
  accepted: { rank: 6, stage: 'decide' },
  sent: { rank: 5, stage: 'follow_up' },
  delivered: { rank: 5, stage: 'follow_up' },
  read: { rank: 5, stage: 'follow_up' },
  replied: { rank: 5, stage: 'follow_up' },
  changes_requested: { rank: 5, stage: 'follow_up' },
  followup_due: { rank: 5, stage: 'follow_up' },
  failed: { rank: 4, stage: 'follow_up' },
  expired: { rank: 4, stage: 'follow_up' },
  draft: { rank: 3, stage: 'build' },
};

const STAGE_ORDER: Stage[] = ['prospect', 'register', 'data', 'build', 'follow_up', 'decide', 'live'];

interface StageMeta {
  label: string;
  hint: string;
  accent: string;
  next: (id: string, slug: string) => { text: string; href: string; external?: boolean };
}

const STAGE_META: Record<Stage, StageMeta> = {
  prospect: { label: '1 · Prospect / Hunt', hint: 'Captured, not yet a registered vendor.', accent: '#64748b',
    next: () => ({ text: 'Register vendor →', href: '/jana/businesses' }) },
  register: { label: '2 · Registered', hint: 'Vendor exists, business data still empty.', accent: '#0ea5e9',
    next: (id) => ({ text: 'Fill business data →', href: `/jana/businesses/${id}` }) },
  data: { label: '3 · Data ready', hint: 'DNA filled — ready to build the minisite.', accent: '#6366f1',
    next: (_id, slug) => ({ text: 'Open builder →', href: `/jana/minisite-builder?slug=${slug}` }) },
  build: { label: '4 · Pitch ready', hint: 'A private draft exists — send the pitch.', accent: '#d97706',
    next: () => ({ text: 'Open pitch board →', href: '/jana/minisite-handoffs' }) },
  follow_up: { label: '5 · Follow-up', hint: 'Sent / read / replied — running the loop.', accent: '#f59e0b',
    next: () => ({ text: 'Open CRM →', href: '/jana/crm' }) },
  decide: { label: '6 · Decide', hint: 'Accepted — keep / minimize / free, then publish.', accent: '#a855f7',
    next: () => ({ text: 'Publish / decide →', href: '/jana/minisite-handoffs' }) },
  live: { label: '7 · Live minisite', hint: 'Approved and public — this is the customer.', accent: '#16a34a',
    next: (_id, slug) => ({ text: 'View live ↗', href: `/${slug}`, external: true }) },
};

function parseStage(business: any, bestRank: number, bestStage: Stage | null): Stage {
  if (bestStage && bestRank >= 3) return bestStage; // build (draft) or beyond comes from a handoff
  const hasVendor = !!business.vendor_id;
  const hasData = Number(business.cd_len || 0) > 40;
  if (!hasVendor) return 'prospect';
  return hasData ? 'data' : 'register';
}

const BASE_SELECT = `
  SELECT b.id, b.name, b.slug, b.type_id, b.vendor_id, b.subscription_tier, b.status,
         b.approved_by_vendor,
         COALESCE(OCTET_LENGTH(CAST(b.custom_data AS CHAR)), 0) AS cd_len,
         bt.name AS type_name
  FROM businesses b
  LEFT JOIN business_types bt ON bt.id = b.type_id
  WHERE (b.status IS NULL OR b.status <> 'deleted')`;

async function loadBusinesses(): Promise<any[]> {
  try { return await safeQuery(`${BASE_SELECT} ORDER BY b.updated_at DESC LIMIT 500`); }
  catch { try { return await safeQuery(`${BASE_SELECT} LIMIT 500`); } catch { return []; } }
}

async function loadHandoffs(): Promise<any[]> {
  try { return await safeQuery('SELECT business_id, status FROM minisite_vendor_handoffs'); }
  catch { return []; }
}

const chip: React.CSSProperties = { padding: '0.45rem 0.8rem', borderRadius: '999px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textDecoration: 'none', whiteSpace: 'nowrap' };
const kpiCard: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem 1rem', minWidth: '140px' };

export default async function AdminDashboardPage() {
  const [businesses, handoffs] = await Promise.all([loadBusinesses(), loadHandoffs()]);

  // Furthest handoff stage per business.
  const bestByBusiness: Record<string, { rank: number; stage: Stage }> = {};
  for (const h of handoffs) {
    const info = HANDOFF_RANK[String(h.status)];
    if (!info) continue;
    const cur = bestByBusiness[h.business_id];
    if (!cur || info.rank > cur.rank) bestByBusiness[h.business_id] = info;
  }

  const buckets: Record<Stage, any[]> = { prospect: [], register: [], data: [], build: [], follow_up: [], decide: [], live: [] };
  for (const biz of businesses) {
    const best = bestByBusiness[biz.id];
    const stage = parseStage(biz, best?.rank ?? 0, best?.stage ?? null);
    buckets[stage].push(biz);
  }

  const kpis = {
    businesses: businesses.length,
    vendors: businesses.filter((b: any) => !!b.vendor_id).length,
    inPipeline: buckets.build.length + buckets.follow_up.length + buckets.decide.length,
    awaitingDecision: buckets.decide.length,
    live: buckets.live.length,
    pendingApprovals: businesses.filter((b: any) => b.vendor_id && !Number(b.approved_by_vendor)).length,
  };

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1500px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: '#0f172a' }}>
          <i className="fas fa-compass" style={{ color: '#D4AF37', marginRight: '0.5rem' }}></i>Vendor Lifecycle — Command Center
        </h1>
        <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
          Every prospect and vendor on one board, from parent/child creation to the final approved minisite. Follow the lanes, click the next action.
        </p>
      </header>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={kpiCard}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{kpis.businesses}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Businesses</div></div>
        <div style={kpiCard}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{kpis.vendors}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Registered vendors</div></div>
        <div style={kpiCard}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>{kpis.inPipeline}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>In pitch / follow-up</div></div>
        <div style={kpiCard}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a855f7' }}>{kpis.awaitingDecision}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Awaiting decision</div></div>
        <div style={kpiCard}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a' }}>{kpis.live}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Live minisites</div></div>
        <div style={{ ...kpiCard, borderLeft: '3px solid #10b981' }}><div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{kpis.pendingApprovals}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Pending approvals</div></div>
      </div>

      {/* Compact tools strip (preserves the old banners as links) */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05rem', marginRight: '0.25rem' }}>Setup & tools</span>
        <Link href="/jana/orchestrator" style={chip}>🧭 Master Orchestrator</Link>
        <Link href="/jana/unified-builder" style={chip}>🛠 Unified Builder</Link>
        <Link href="/jana/form-builder" style={chip}>📝 Form Builder</Link>
        <Link href="/jana/types" style={chip}>🏷️ Typologies (parent/child)</Link>
        <Link href="/jana/blueprints" style={chip}>🧩 Blueprints</Link>
        <Link href="/jana/businesses" style={chip}>🏪 Business Registry</Link>
        <Link href="/jana/minisite-handoffs" style={chip}>📣 Pitch & Pipeline Board</Link>
      </div>

      {/* Pipeline board */}
      <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}>
        {STAGE_ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const items = buckets[stage];
          return (
            <section key={stage} style={{ flex: '1 0 232px', minWidth: '232px', background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: `3px solid ${meta.accent}`, borderRadius: '14px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: meta.accent }}>{meta.label}</h2>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#94a3b8' }}>{items.length}</span>
              </div>
              <p style={{ margin: '0.2rem 0 0.6rem', fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.3 }}>{meta.hint}</p>

              {items.length === 0 && <div style={{ fontSize: '0.72rem', color: '#cbd5e1', padding: '0.75rem 0', textAlign: 'center' }}>Empty</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.slice(0, 30).map((biz: any) => {
                  const slug = biz.slug || biz.id;
                  const next = meta.next(biz.id, slug);
                  return (
                    <article key={biz.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.65rem' }}>
                      <Link href={`/jana/businesses/${biz.id}`} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', display: 'block', lineHeight: 1.25 }}>
                        {biz.name || slug}
                      </Link>
                      <div style={{ fontSize: '0.66rem', color: '#64748b', margin: '0.15rem 0 0.45rem' }}>
                        {biz.type_name || biz.type_id || 'no type'}{biz.subscription_tier ? ` · ${biz.subscription_tier}` : ''}
                      </div>
                      <Link href={next.href} target={next.external ? '_blank' : undefined} rel={next.external ? 'noopener' : undefined}
                        style={{ display: 'inline-block', padding: '0.3rem 0.55rem', borderRadius: '7px', background: meta.accent, color: '#fff', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}>
                        {next.text}
                      </Link>
                    </article>
                  );
                })}
                {items.length > 30 && <Link href="/jana/businesses" style={{ fontSize: '0.7rem', fontWeight: 800, color: meta.accent, textDecoration: 'none' }}>+{items.length - 30} more in registry →</Link>}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
