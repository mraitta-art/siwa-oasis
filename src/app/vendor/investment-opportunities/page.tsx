'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface InvestmentOpportunity {
  id: string;
  opportunity_title: string;
  opportunity_type: 'equity' | 'partnership' | 'franchise' | 'joint_venture' | 'sponsorship';
  investment_amount_min: number;
  investment_amount_max: number;
  expected_roi_percent: number;
  status: 'draft' | 'published' | 'funded' | 'closed';
  approval_status: 'pending' | 'approved' | 'rejected';
  visibility_on_main_site: boolean;
  is_featured: boolean;
  investors_current: number;
  target_investors: number;
  inquiries_count: number;
  applications_count: number;
  valid_until: string;
}

const INV_CSS = `
  .vi-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .vi-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.2s; position: relative;
  }
  .vi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
  .vi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }

  .vi-badge {
    font-size: 0.58rem; font-weight: 900; padding: 3px 9px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;
  }
  .vi-badge.published { background: rgba(34,197,94,0.1); color: #16a34a; border: 1px solid rgba(34,197,94,0.2); }
  .vi-badge.draft { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }
  .vi-badge.roi { background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); }

  .vi-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.6);
    backdrop-filter: blur(4px); z-index: 500;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .vi-modal {
    background: #fff; border-radius: 24px; padding: 2rem;
    max-width: 540px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }
`;

export default function VendorInvestmentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([
    {
      id: '1',
      opportunity_title: 'Eco-Lodge Palm Grove Expansion',
      opportunity_type: 'equity',
      investment_amount_min: 50000,
      investment_amount_max: 200000,
      expected_roi_percent: 24,
      status: 'published',
      approval_status: 'approved',
      visibility_on_main_site: true,
      is_featured: true,
      investors_current: 2,
      target_investors: 5,
      inquiries_count: 14,
      applications_count: 5,
      valid_until: '2026-12-31',
    },
    {
      id: '2',
      opportunity_title: 'Organic Date Bottling & Export Joint Venture',
      opportunity_type: 'joint_venture',
      investment_amount_min: 30000,
      investment_amount_max: 100000,
      expected_roi_percent: 18,
      status: 'draft',
      approval_status: 'pending',
      visibility_on_main_site: false,
      is_featured: false,
      investors_current: 0,
      target_investors: 3,
      inquiries_count: 2,
      applications_count: 0,
      valid_until: '2026-09-30',
    },
  ]);

  const [slug, setSlug] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [roi, setRoi] = useState('');

  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(d => { if (d?.business) setSlug(d.business.slug || d.business.id || ''); })
      .catch(() => {});
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !minAmt) return;
    const created: InvestmentOpportunity = {
      id: Date.now().toString(),
      opportunity_title: title,
      opportunity_type: 'equity',
      investment_amount_min: Number(minAmt),
      investment_amount_max: Number(maxAmt) || Number(minAmt) * 2,
      expected_roi_percent: Number(roi) || 15,
      status: 'published',
      approval_status: 'approved',
      visibility_on_main_site: true,
      is_featured: false,
      investors_current: 0,
      target_investors: 5,
      inquiries_count: 0,
      applications_count: 0,
      valid_until: '2026-12-31',
    };
    setOpportunities([created, ...opportunities]);
    setShowModal(false);
    setTitle(''); setMinAmt(''); setMaxAmt(''); setRoi('');
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INV_CSS }} />
      <div className="vi-root">

        {/* Top Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
              💰 Investment Opportunities
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Register capital & joint venture opportunities for local or global investors
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {slug && (
              <Link href={`/${slug}`} target="_blank" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', background: '#fdf8ee', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} /> Preview Minisite
              </Link>
            )}
            <button
              onClick={() => setShowModal(true)}
              style={{ background: 'linear-gradient(135deg, #D4AF37, #f0c842)', color: '#1a1000', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}
            >
              <i className="fas fa-plus" /> List Opportunity
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="vi-grid">
          {opportunities.map(op => (
            <div key={op.id} className="vi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className={`vi-badge ${op.status}`}>{op.status}</span>
                <span className="vi-badge roi">📈 Expected ROI: {op.expected_roi_percent}%</span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                {op.opportunity_title}
              </h3>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37', marginBottom: '1rem' }}>
                ${op.investment_amount_min.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>to ${op.investment_amount_max.toLocaleString()}</span>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem' }}>
                <div>Inquiries: <strong style={{ color: '#0f172a' }}>{op.inquiries_count}</strong></div>
                <div>Investors: <strong style={{ color: '#0f172a' }}>{op.investors_current}/{op.target_investors}</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
                <span>Type: <strong style={{ color: '#334155', textTransform: 'capitalize' }}>{op.opportunity_type}</strong></span>
                <span>Valid until {op.valid_until}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="vi-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="vi-modal" onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>List New Investment Opportunity</h2>
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Opportunity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ecolodge Solar Power & Eco Water Station"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Min Amount ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="25000"
                      value={minAmt}
                      onChange={e => setMinAmt(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Max Amount ($)</label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={maxAmt}
                      onChange={e => setMaxAmt(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Est. ROI (%)</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={roi}
                      onChange={e => setRoi(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 600 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', background: '#D4AF37', color: '#1a1000', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                    List Opportunity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
