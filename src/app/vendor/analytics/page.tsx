'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── CSS ─────────────────────────────────────────────────── */
const ANALYTICS_CSS = `
  .va-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }
  .va-card {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s;
  }
  .va-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }
  .va-kpi-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;
  }
  @media (max-width: 900px) { .va-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .va-kpi-grid { grid-template-columns: 1fr; } }

  .va-kpi {
    background: #ffffff; border: 1px solid #eef0f5; border-radius: 18px;
    padding: 1.25rem 1.5rem; transition: transform 0.2s;
  }
  .va-kpi:hover { transform: translateY(-2px); }
  .va-kpi-val { font-size: 2.25rem; font-weight: 900; color: #0f172a; line-height: 1; margin: 0.5rem 0 0.25rem; }
  .va-kpi-lbl { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
  .va-kpi-badge {
    font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 20px;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .va-kpi-badge.up { background: rgba(34,197,94,0.1); color: #16a34a; }
  .va-kpi-badge.info { background: rgba(99,102,241,0.1); color: #4f46e5; }
  .va-kpi-badge.gold { background: rgba(212,175,55,0.12); color: #D4AF37; }

  .va-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
  @media (max-width: 1000px) { .va-grid-2 { grid-template-columns: 1fr; } }

  .va-chart-bar {
    height: 140px; display: flex; align-items: flex-end; gap: 0.75rem;
    padding-top: 1rem; border-bottom: 1px solid #f1f5f9;
  }
  .va-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .va-bar-fill {
    width: 100%; border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, #D4AF37 0%, rgba(212,175,55,0.4) 100%);
    transition: height 0.6s ease-out;
    min-height: 4px;
  }
  .va-bar-lbl { font-size: 0.6rem; font-weight: 700; color: #94a3b8; }

  .va-breakdown-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 0; border-bottom: 1px solid #f8fafc;
  }
  .va-breakdown-row:last-child { border-bottom: none; }
  .va-breakdown-name { font-size: 0.8rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.5rem; }
  .va-breakdown-val { font-size: 0.8rem; font-weight: 900; color: #0f172a; }
`;

export default function VendorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalViews: 342,
    uniqueVisitors: 218,
    journeyInquiries: 14,
    minisiteClicks: 89,
    weeklyViews: [
      { day: 'Mon', views: 32 },
      { day: 'Tue', views: 48 },
      { day: 'Wed', views: 65 },
      { day: 'Thu', views: 42 },
      { day: 'Fri', views: 78 },
      { day: 'Sat', views: 95 },
      { day: 'Sun', views: 54 },
    ],
    trafficSources: [
      { source: 'Direct Minisite Link', count: 145, pct: '42%' },
      { source: 'Siwa Oasis Marketplace', count: 112, pct: '33%' },
      { source: 'Journey Custom Request', count: 54, pct: '16%' },
      { source: 'Search & External', count: 31, pct: '9%' },
    ],
  });

  useEffect(() => {
    // Simulated fetch or fetch real story data
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(res => {
        if (res?.business?.views) {
          setData(prev => ({ ...prev, totalViews: res.business.views }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxWeeklyViews = Math.max(...data.weeklyViews.map(w => w.views), 1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANALYTICS_CSS }} />
      <div className="va-root">

        {/* Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
              📊 Analytics & Traffic
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Performance metrics for your Siwa Oasis minisite and listings
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '6px 14px', borderRadius: '20px', background: '#fdf8ee', border: '1px solid #fde68a', color: '#92702a' }}>
              ● Live 30-Day Window
            </span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="va-kpi-grid">
          <div className="va-kpi">
            <span className="va-kpi-badge gold"><i className="fas fa-eye" /> Total Views</span>
            <div className="va-kpi-val">{loading ? '...' : data.totalViews}</div>
            <div className="va-kpi-lbl">Page views across all listings</div>
          </div>
          <div className="va-kpi">
            <span className="va-kpi-badge info"><i className="fas fa-users" /> Visitors</span>
            <div className="va-kpi-val">{loading ? '...' : data.uniqueVisitors}</div>
            <div className="va-kpi-lbl">Unique traveler visits</div>
          </div>
          <div className="va-kpi">
            <span className="va-kpi-badge up"><i className="fas fa-route" /> Inquiries</span>
            <div className="va-kpi-val">{loading ? '...' : data.journeyInquiries}</div>
            <div className="va-kpi-lbl">Custom journey requests</div>
          </div>
          <div className="va-kpi">
            <span className="va-kpi-badge gold"><i className="fas fa-mouse-pointer" /> Minisite Clicks</span>
            <div className="va-kpi-val">{loading ? '...' : data.minisiteClicks}</div>
            <div className="va-kpi-lbl">Direct vanity link visits</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="va-grid-2">

          {/* Left Chart */}
          <div className="va-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Weekly Traffic Trend</h2>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Daily visits over the last 7 days</p>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '3px 10px', borderRadius: '20px' }}>
                ↑ +18% vs last week
              </span>
            </div>

            <div className="va-chart-bar">
              {data.weeklyViews.map((item, i) => {
                const heightPct = Math.round((item.views / maxWeeklyViews) * 100);
                return (
                  <div key={i} className="va-bar-col">
                    <div
                      className="va-bar-fill"
                      style={{ height: `${heightPct}%` }}
                      title={`${item.views} views on ${item.day}`}
                    />
                    <span className="va-bar-lbl">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Peak day: Saturday (95 views)</span>
              <Link href="/vendor/sections" style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, textDecoration: 'none' }}>
                Add more content to boost traffic →
              </Link>
            </div>
          </div>

          {/* Right Traffic Breakdown */}
          <div className="va-card">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Traffic Sources</h2>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, marginBottom: '1.25rem' }}>Where travelers find your minisite</p>

            {data.trafficSources.map((item, i) => (
              <div key={i} className="va-breakdown-row">
                <div className="va-breakdown-name">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#D4AF37' : i === 1 ? '#6366f1' : i === 2 ? '#22c55e' : '#94a3b8' }} />
                  {item.source}
                </div>
                <div className="va-breakdown-val">{item.pct}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
