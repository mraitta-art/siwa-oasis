'use client';

import React from 'react';
import Link from 'next/link';

/**
 * VENDOR ACQUISITION (BizDev Stage) — hub / organized procedures.
 * Presentation-only landing that serializes the Stage-1 hunt pipeline into ordered
 * steps. Each step links to an existing screen (no logic duplication here).
 */

interface Step {
  no: number;
  name: string;
  href: string;
  icon: string;
  accent: string;
  role: string;
  desc: string;
  secondary?: { name: string; href: string }[];
}

const STEPS: Step[] = [
  {
    no: 1,
    name: 'Pipeline Board (Review · Publish)',
    href: '/jana/minisite-handoffs',
    icon: 'fa-diagram-project',
    accent: '#2563eb',
    role: 'Track every prospect deal in one place',
    desc: 'The serialized pipeline for all hunting deals. Every prospect is a revision-tracked handoff moving through draft → sent → read → follow-up → decision → published.',
  },
  {
    no: 2,
    name: 'Build Studio (Home + Sections)',
    href: '/jana/minisite-builder',
    icon: 'fa-store',
    accent: '#d4af37',
    role: 'Admin builds the full-featured pitch — unlimited',
    desc: 'Assemble the minisite using every feature: a rich home (hero, QR/barcode, navigators, footer ribbon) plus any sectional pages. Governance is deferred to the Decide step.',
    secondary: [
      { name: 'Minisite Carousels', href: '/jana/hero-carousel?targetScope=minisite' },
      { name: 'Typology Templates', href: '/jana/page-builder/templates' },
    ],
  },
  {
    no: 3,
    name: 'Outreach & Pitch (WhatsApp)',
    href: '/jana/outreach',
    icon: 'fa-paper-plane',
    accent: '#16a34a',
    role: 'Send the private wow-preview to the prospect',
    desc: 'Template-driven outreach with a tokenized preview link delivered over WhatsApp so the prospect sees the full minisite — no login, nothing public yet.',
    secondary: [{ name: 'WhatsApp Outreach', href: '/jana/whatsapp-outreach' }],
  },
  {
    no: 4,
    name: 'Approval Packages (L2)',
    href: '/jana/approval-packages',
    icon: 'fa-clipboard-check',
    accent: '#7c3aed',
    role: 'Assign an owner & negotiate terms',
    desc: 'Own each deal with an account manager, log responses, and move the negotiation forward.',
  },
  {
    no: 5,
    name: 'CRM Contacts & Follow-up',
    href: '/jana/crm',
    icon: 'fa-address-book',
    accent: '#0891b2',
    role: 'Nurture undecided prospects with ribbon & news',
    desc: 'Keep pitched-but-undecided prospects warm. Follow-up reminders and the ribbon/news broadcast run from here.',
  },
];

const STATUS_FLOW = ['draft', 'sent', 'delivered', 'read', 'followup_due', 'replied', 'accepted', 'published'];

export default function VendorAcquisitionHubPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#d4af37,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0f1e', fontSize: '1.1rem' }}>
              <i className="fas fa-user-plus" />
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Vendor Acquisition <span style={{ color: '#d4af37' }}>· BizDev Stage</span>
              </h1>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                Hunt → Build → Pitch → Follow-up → Decide — one serialized pipeline.
              </p>
            </div>
          </div>
        </header>

        {/* Steps */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {STEPS.map((s) => (
            <Link
              key={s.no}
              href={s.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${s.accent}`,
                borderRadius: 16,
                padding: '1.05rem 1.15rem',
                boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: `${s.accent}1a`, color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 900 }}>
                <span style={{ position: 'absolute', transform: 'translate(14px,-14px)', fontSize: '0.62rem', background: s.accent, color: '#fff', borderRadius: 999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.no}</span>
                <i className={`fas ${s.icon}`} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: s.accent, margin: '2px 0 4px' }}>{s.role}</div>
                <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>{s.desc}</div>
                {s.secondary && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {s.secondary.map((sub) => (
                      <span key={sub.href} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '3px 8px' }}>
                        <i className={`fas ${sub.href.includes('hero-carousel') ? 'fa-images' : sub.href.includes('whatsapp') ? 'fa-whatsapp' : 'fa-layer-group'}`} style={{ marginInlineEnd: 5, color: s.accent }} />
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, color: '#cbd5e1', alignSelf: 'center' }}>
                <i className="fas fa-angle-right" />
              </div>
            </Link>
          ))}
        </div>

        {/* Status legend */}
        <section style={{ marginTop: '1.5rem', background: '#0f172a', color: '#e2e8f0', borderRadius: 16, padding: '1.1rem 1.2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1.5px', color: '#d4af37', marginBottom: '0.6rem' }}>HOW PROSPECTS ARE FOLLOWED</div>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>
            Every deal carries one status. The board, WhatsApp receipts and reminders move it forward automatically; overdue items surface as
            <strong style={{ color: '#f8fafc' }}> follow-up due</strong> and trigger a reminder.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {STATUS_FLOW.map((st, i) => (
              <React.Fragment key={st}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '3px 9px', color: st === 'published' ? '#4ade80' : st === 'followup_due' ? '#f59e0b' : '#e2e8f0' }}>
                  {st}
                </span>
                {i < STATUS_FLOW.length - 1 && <span style={{ color: '#475569', alignSelf: 'center' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
          <p style={{ margin: '0.9rem 0 0', fontSize: '0.76rem', color: '#64748b' }}>
            Note: this is the organized Stage-1 home. The final <strong>Decide</strong> (Keep / Minimize-to-template / To-free) is the hand-off into Stage 2.
          </p>
        </section>
      </div>
    </div>
  );
}
