'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  summary: {
    totalHits: number;
    uniqueVisitors: number;
    avgDuration: number;
    prevHits: number;
    prevVisitors: number;
  };
  trafficChart: { label: string; hits: number; visitors: number }[];
  topPages: { page_path: string; page_type: string; hits: number; visitors: number }[];
  topBusinesses: { business_id: string; name: string; slug: string; hits: number; visitors: number }[];
  devices: { device_type: string; count: number }[];
  referrers: { source: string; count: number }[];
  pageTypes: { page_type: string; count: number }[];
}

const PERIODS = [
  { key: 'today', label: 'Today', icon: 'fa-clock' },
  { key: '7d', label: '7 Days', icon: 'fa-calendar-week' },
  { key: '30d', label: '30 Days', icon: 'fa-calendar' },
  { key: '90d', label: '90 Days', icon: 'fa-calendar-alt' },
];

const PAGE_TYPE_COLORS: Record<string, string> = {
  homepage: '#6366f1',
  business: '#10b981',
  offers: '#f59e0b',
  packages: '#8b5cf6',
  discounts: '#ec4899',
  investments: '#14b8a6',
  auctions: '#f97316',
  blog: '#3b82f6',
  discovery: '#06b6d4',
  admin: '#64748b',
  vendor: '#a855f7',
  auth: '#94a3b8',
  other: '#475569',
};

const DEVICE_ICONS: Record<string, string> = {
  mobile: 'fa-mobile-screen',
  tablet: 'fa-tablet-screen-button',
  desktop: 'fa-desktop',
};

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#6366f1',
  tablet: '#f59e0b',
  desktop: '#10b981',
};

const REFERRER_COLORS: Record<string, string> = {
  Direct: '#6366f1',
  Google: '#ea4335',
  Facebook: '#1877f2',
  Instagram: '#e4405f',
  'Twitter/X': '#1da1f2',
  YouTube: '#ff0000',
  TikTok: '#010101',
  WhatsApp: '#25d366',
  LinkedIn: '#0a66c2',
  Other: '#64748b',
};

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return '< 1s';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return secs + 's';
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return mins + 'm ' + remainSecs + 's';
}

function getTrend(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0) return { value: current > 0 ? '+∞%' : '0%', positive: current > 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    value: (change >= 0 ? '+' : '') + change.toFixed(1) + '%',
    positive: change >= 0,
  };
}

// ─── Mini SVG Chart ─────────────────────────────────────────────────────────────
function MiniAreaChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const width = 200;
  const points = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: height - (v / max) * (height - 8),
  }));
  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = linePath + ` L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: height + 'px' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Traffic Area Chart ─────────────────────────────────────────────────────────
function TrafficChart({ data }: { data: { label: string; hits: number; visitors: number }[] }) {
  if (!data.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#475569', fontSize: '0.9rem' }}>
        <i className="fas fa-chart-area" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }} /><br />
        No traffic data yet for this period
      </div>
    );
  }
  const maxHits = Math.max(...data.map(d => d.hits), 1);
  const barWidth = Math.max(100 / data.length - 1, 2);

  return (
    <div style={{ position: 'relative', height: '280px', padding: '0 0.5rem' }}>
      {/* Y-axis labels */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 30, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.65rem', color: '#475569' }}>
        <span>{formatNumber(maxHits)}</span>
        <span>{formatNumber(Math.round(maxHits / 2))}</span>
        <span>0</span>
      </div>
      {/* Grid lines */}
      <div style={{ position: 'absolute', left: 45, right: 0, top: 0, bottom: 30 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <div key={pct} style={{ position: 'absolute', top: `${pct * 100}%`, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {/* Bars */}
      <div style={{ position: 'absolute', left: 50, right: 10, top: 0, bottom: 30, display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
        {data.map((d, i) => {
          const heightPct = (d.hits / maxHits) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div
                title={`${d.label}: ${d.hits} hits, ${d.visitors} visitors`}
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${Math.max(heightPct, 1)}%`,
                  background: `linear-gradient(180deg, #6366f1, #4f46e5)`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Visitor overlay bar */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '15%',
                  right: '15%',
                  height: `${d.visitors ? (d.visitors / d.hits) * 100 : 0}%`,
                  background: 'rgba(99,102,241,0.4)',
                  borderRadius: '3px 3px 0 0',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div style={{ position: 'absolute', left: 50, right: 10, bottom: 0, height: '25px', display: 'flex', overflow: 'hidden' }}>
        {data.map((d, i) => {
          // Show only every Nth label to avoid crowding
          const step = Math.max(Math.floor(data.length / 8), 1);
          if (i % step !== 0 && i !== data.length - 1) return <div key={i} style={{ flex: 1 }} />;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {d.label.replace(/^\d{4}-/, '')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data, colorMap }: { data: { label: string; value: number }[]; colorMap: Record<string, string> }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLen = pct * circumference;
          const dashOffset = -offset * circumference;
          offset += pct;
          return (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={colorMap[d.label] || '#475569'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${circumference}`}
              strokeDashoffset={dashOffset}
              style={{ transition: 'all 0.5s ease' }}
            />
          );
        })}
        <text x="80" y="76" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{formatNumber(total)}</text>
        <text x="80" y="96" textAnchor="middle" fill="#64748b" fontSize="11">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap[d.label] || '#475569', flexShrink: 0 }} />
            <span style={{ color: '#cbd5e1', minWidth: '60px' }}>{d.label}</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>{formatNumber(d.value)}</span>
            <span style={{ color: '#475569', fontSize: '0.7rem' }}>({((d.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart ───────────────────────────────────────────────────────
function HorizontalBar({ items, colorMap }: { items: { label: string; value: number }[]; colorMap: Record<string, string> }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.78rem' }}>
            <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[item.label] || '#6366f1' }} />
              {item.label}
            </span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>{formatNumber(item.value)}</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(item.value / max) * 100}%`,
              borderRadius: '3px',
              background: `linear-gradient(90deg, ${colorMap[item.label] || '#6366f1'}, ${colorMap[item.label] || '#6366f1'}88)`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`);
      const json = await res.json();
      if (json.success !== false) setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const hitsTrend = data ? getTrend(data.summary.totalHits, data.summary.prevHits) : { value: '0%', positive: true };
  const visitorTrend = data ? getTrend(data.summary.uniqueVisitors, data.summary.prevVisitors) : { value: '0%', positive: true };

  // ── Card style ──
  const cardStyle: React.CSSProperties = {
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '1.75rem',
    transition: 'all 0.3s ease',
  };

  return (
    <div className="animate-in" style={{ background: '#08090a', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Link href="/jana" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>
                <i className="fas fa-arrow-left" /> Jana
              </Link>
              <span style={{ color: '#334155' }}>/</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Analytics</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <i className="fas fa-chart-line" style={{ WebkitTextFillColor: '#6366f1', marginRight: '0.5rem' }} />
              Visitor Analytics
            </h1>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Track visitor hits, destinations, devices, and traffic sources
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: autoRefresh ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                color: autoRefresh ? '#818cf8' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <i className={`fas ${autoRefresh ? 'fa-sync fa-spin' : 'fa-sync'}`} style={{ fontSize: '0.7rem' }} />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>

            {/* Manual refresh */}
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <i className="fas fa-redo" />
            </button>
          </div>
        </div>

        {/* ── Period Selector ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '14px',
                border: period === p.key ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                background: period === p.key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                color: period === p.key ? '#818cf8' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              <i className={`fas ${p.icon}`} style={{ fontSize: '0.75rem' }} />
              {p.label}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <div style={{ textAlign: 'center', padding: '6rem', color: '#475569' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} /><br />
            Loading analytics...
          </div>
        ) : (
          <>
            {/* ── Stat Cards Row ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Total Hits */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Total Hits</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{formatNumber(data?.summary.totalHits || 0)}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-eye" style={{ color: '#6366f1', fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                  <span style={{ color: hitsTrend.positive ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    <i className={`fas ${hitsTrend.positive ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: '0.65rem' }} /> {hitsTrend.value}
                  </span>
                  <span style={{ color: '#475569' }}>vs previous period</span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <MiniAreaChart data={data?.trafficChart.map(d => d.hits) || []} color="#6366f1" height={40} />
                </div>
              </div>

              {/* Unique Visitors */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Unique Visitors</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{formatNumber(data?.summary.uniqueVisitors || 0)}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-users" style={{ color: '#10b981', fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                  <span style={{ color: visitorTrend.positive ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    <i className={`fas ${visitorTrend.positive ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: '0.65rem' }} /> {visitorTrend.value}
                  </span>
                  <span style={{ color: '#475569' }}>vs previous period</span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <MiniAreaChart data={data?.trafficChart.map(d => d.visitors) || []} color="#10b981" height={40} />
                </div>
              </div>

              {/* Avg Duration */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Avg. Time on Page</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{formatDuration(data?.summary.avgDuration || 0)}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-stopwatch" style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Across all page views
                </div>
              </div>

              {/* Page Types */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Top Category</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1, textTransform: 'capitalize' }}>
                      {data?.pageTypes?.[0]?.page_type || '—'}
                    </div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-layer-group" style={{ color: '#ec4899', fontSize: '1.1rem' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  {data?.pageTypes?.[0] ? `${formatNumber(data.pageTypes[0].count)} hits` : 'No data yet'}
                </div>
              </div>
            </div>

            {/* ── Traffic Chart ──────────────────────────────────────────── */}
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>
                    <i className="fas fa-chart-bar" style={{ color: '#6366f1', marginRight: '0.5rem' }} />
                    Traffic Overview
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                    Page views and unique visitors over time
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '3px', background: '#6366f1' }} /> Hits
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '3px', background: 'rgba(99,102,241,0.4)' }} /> Visitors
                  </span>
                </div>
              </div>
              <TrafficChart data={data?.trafficChart || []} />
            </div>

            {/* ── Two Column Grid ──────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

              {/* Top Pages */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#e2e8f0' }}>
                  <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
                  Top Destinations
                </h2>
                {(!data?.topPages?.length) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>
                    No page view data yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.topPages.slice(0, 10).map((page, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#818cf8', flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {page.page_path === '/' ? 'Homepage' : page.page_path}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                            {page.visitors} unique visitor{page.visitors !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', background: (PAGE_TYPE_COLORS[page.page_type] || '#475569') + '18', color: PAGE_TYPE_COLORS[page.page_type] || '#94a3b8' }}>
                          {page.page_type}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', minWidth: '40px', textAlign: 'right' }}>
                          {formatNumber(page.hits)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Businesses */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#e2e8f0' }}>
                  <i className="fas fa-store" style={{ color: '#10b981', marginRight: '0.5rem' }} />
                  Top Businesses
                </h2>
                {(!data?.topBusinesses?.length) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>
                    No business visits yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.topBusinesses.map((biz, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#34d399', flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {biz.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                            /{biz.slug} · {biz.visitors} unique visitor{biz.visitors !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', minWidth: '40px', textAlign: 'right' }}>
                          {formatNumber(biz.hits)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Three Column Grid ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

              {/* Device Breakdown */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#e2e8f0' }}>
                  <i className="fas fa-laptop" style={{ color: '#6366f1', marginRight: '0.5rem' }} />
                  Devices
                </h2>
                {data?.devices?.length ? (
                  <DonutChart
                    data={data.devices.map(d => ({ label: d.device_type, value: d.count }))}
                    colorMap={DEVICE_COLORS}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>No data</div>
                )}
              </div>

              {/* Referrer Sources */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#e2e8f0' }}>
                  <i className="fas fa-share-nodes" style={{ color: '#a855f7', marginRight: '0.5rem' }} />
                  Traffic Sources
                </h2>
                {data?.referrers?.length ? (
                  <HorizontalBar
                    items={data.referrers.map(r => ({ label: r.source, value: r.count }))}
                    colorMap={REFERRER_COLORS}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>No data</div>
                )}
              </div>

              {/* Page Types */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#e2e8f0' }}>
                  <i className="fas fa-th-large" style={{ color: '#ec4899', marginRight: '0.5rem' }} />
                  Content Categories
                </h2>
                {data?.pageTypes?.length ? (
                  <HorizontalBar
                    items={data.pageTypes.map(p => ({ label: p.page_type, value: p.count }))}
                    colorMap={PAGE_TYPE_COLORS}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>No data</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
