'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────── */
interface BusinessData {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_published?: boolean;
  published?: boolean;
}
interface Section {
  id: string;
  name: string;
  icon: string;
  fields: { name: string; label: string; value: any }[];
}
interface StoryData {
  business: BusinessData;
  structure: Section[];
  typology: { child: any; parent: any };
}
interface JourneyRequest {
  id: string;
  status: string;
  created_at: string;
  traveler_name?: string;
  guest_name?: string;
}

/* ─── CSS ─────────────────────────────────────────────────── */
const PAGE_CSS = `
  .vd-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
  }

  /* Hero Banner */
  .vd-hero {
    position: relative;
    border-radius: 24px;
    padding: 2rem 2.25rem;
    margin-bottom: 2rem;
    overflow: hidden;
    background: linear-gradient(135deg, #0d0f14 0%, #1a1d2e 50%, #0f1520 100%);
    box-shadow: 0 20px 60px -12px rgba(13,15,20,0.4);
  }
  .vd-hero-orb1 {
    position: absolute; width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%);
    top: -80px; right: -60px; pointer-events: none;
  }
  .vd-hero-orb2 {
    position: absolute; width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    bottom: -60px; left: 30%; pointer-events: none;
  }
  .vd-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .vd-hero-inner {
    position: relative; z-index: 2;
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 1.5rem;
    flex-wrap: wrap;
  }
  .vd-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px;
    background: rgba(212,175,55,0.12);
    border: 1px solid rgba(212,175,55,0.25);
    color: #D4AF37; font-size: 0.58rem; font-weight: 900;
    text-transform: uppercase; letter-spacing: 1.5px;
    margin-bottom: 0.75rem;
  }
  .vd-hero-title {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 900; color: #f8fafc; line-height: 1.15;
    margin-bottom: 0.5rem; letter-spacing: -0.5px;
  }
  .vd-hero-title span { color: #D4AF37; }
  .vd-hero-sub {
    font-size: 0.82rem; color: rgba(248,250,252,0.55);
    font-weight: 500; max-width: 480px; line-height: 1.6;
    margin-bottom: 1.25rem;
  }
  .vd-hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .vd-hero-btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.35rem; border-radius: 12px;
    background: linear-gradient(135deg, #D4AF37, #f0c842);
    color: #1a1000; font-size: 0.78rem; font-weight: 800;
    text-decoration: none; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(212,175,55,0.3);
  }
  .vd-hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,175,55,0.4); }
  .vd-hero-btn-ghost {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.35rem; border-radius: 12px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(248,250,252,0.8); font-size: 0.78rem; font-weight: 700;
    text-decoration: none; transition: all 0.2s;
    backdrop-filter: blur(4px);
  }
  .vd-hero-btn-ghost:hover { background: rgba(255,255,255,0.12); color: #fff; }

  /* Published badge on hero right */
  .vd-hero-status {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 1.25rem 1.5rem;
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    min-width: 130px; text-align: center; flex-shrink: 0;
  }
  .vd-hero-status-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .vd-hero-status-dot.live { background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.5); }
  .vd-hero-status-dot.draft { background: #facc15; box-shadow: 0 0 8px rgba(250,204,21,0.4); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity: 0.5; } }
  .vd-hero-status-label {
    font-size: 0.58rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 1px; color: rgba(248,250,252,0.4);
  }
  .vd-hero-status-val {
    font-size: 0.78rem; font-weight: 800; color: #f8fafc;
  }

  /* KPI Strip */
  .vd-kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem; margin-bottom: 2rem;
  }
  @media (max-width: 900px) { .vd-kpi-strip { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 500px) { .vd-kpi-strip { grid-template-columns: 1fr; } }

  .vd-kpi {
    background: #fff; border: 1px solid #eef0f5; border-radius: 18px;
    padding: 1.25rem 1.5rem; transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .vd-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .vd-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; }
  .vd-kpi-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
  }
  .vd-kpi-trend {
    font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .vd-kpi-trend.up { background: rgba(34,197,94,0.1); color: #16a34a; }
  .vd-kpi-trend.warn { background: rgba(245,158,11,0.1); color: #d97706; }
  .vd-kpi-trend.info { background: rgba(99,102,241,0.1); color: #4f46e5; }
  .vd-kpi-val { font-size: 2rem; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 4px; }
  .vd-kpi-label { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }

  /* Main grid */
  .vd-grid {
    display: grid; grid-template-columns: 1fr 360px; gap: 1.5rem;
  }
  @media (max-width: 1100px) { .vd-grid { grid-template-columns: 1fr; } }

  .vd-col-left  { display: flex; flex-direction: column; gap: 1.5rem; }
  .vd-col-right { display: flex; flex-direction: column; gap: 1.5rem; }

  /* Card */
  .vd-card {
    background: #fff; border: 1px solid #eef0f5; border-radius: 22px;
    padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s;
  }
  .vd-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }
  .vd-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .vd-card-title {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.95rem; font-weight: 800; color: #0f172a;
  }
  .vd-card-title-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; flex-shrink: 0;
  }
  .vd-card-link {
    font-size: 0.68rem; font-weight: 700; color: #D4AF37;
    text-decoration: none; display: flex; align-items: center; gap: 4px;
    transition: gap 0.15s;
  }
  .vd-card-link:hover { gap: 7px; }

  /* Checklist */
  .vd-checklist { display: flex; flex-direction: column; gap: 0.6rem; }
  .vd-checklist-prog {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1rem;
  }
  .vd-checklist-pct { font-size: 2.25rem; font-weight: 900; color: #D4AF37; line-height: 1; }
  .vd-checklist-sub { font-size: 0.62rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .vd-prog-bar {
    height: 6px; background: #f1f5f9; border-radius: 3px;
    overflow: hidden; margin-bottom: 1.25rem;
  }
  .vd-prog-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #D4AF37, #f0c842);
    transition: width 0.8s ease-out;
    box-shadow: 0 0 8px rgba(212,175,55,0.4);
  }
  .vd-check-item {
    display: flex; align-items: center; gap: 0.85rem;
    padding: 0.85rem 1rem; border-radius: 14px;
    text-decoration: none; border: 1px solid;
    transition: all 0.18s; group: true;
  }
  .vd-check-item.done {
    background: rgba(34,197,94,0.04);
    border-color: rgba(34,197,94,0.15);
  }
  .vd-check-item.todo {
    background: #fafafa;
    border-color: #eef0f5;
  }
  .vd-check-item.todo:hover {
    background: #fdf8ee;
    border-color: rgba(212,175,55,0.3);
    transform: translateX(4px);
  }
  .vd-check-circle {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 900; flex-shrink: 0;
    transition: all 0.2s;
  }
  .vd-check-circle.done { background: #22c55e; color: #fff; box-shadow: 0 2px 8px rgba(34,197,94,0.3); }
  .vd-check-circle.todo { background: #fff; border: 1.5px solid #e2e8f0; color: #94a3b8; }
  .vd-check-text {
    flex: 1; font-size: 0.82rem; font-weight: 600; color: #334155;
  }
  .vd-check-item.done .vd-check-text { color: #94a3b8; text-decoration: line-through; }
  .vd-check-arrow { font-size: 0.65rem; color: #cbd5e1; transition: all 0.18s; }
  .vd-check-item.todo:hover .vd-check-arrow { color: #D4AF37; transform: translateX(3px); }

  /* Quick actions */
  .vd-actions-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem;
  }
  @media (max-width: 700px) { .vd-actions-grid { grid-template-columns: repeat(2,1fr); } }

  .vd-action {
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 1.25rem; border-radius: 18px; text-decoration: none;
    border: 1px solid; min-height: 130px;
    transition: all 0.22s; position: relative; overflow: hidden;
  }
  .vd-action::before {
    content: ''; position: absolute;
    inset: 0; opacity: 0; transition: opacity 0.2s;
    border-radius: 18px;
  }
  .vd-action:hover { transform: translateY(-3px); }
  .vd-action:hover::before { opacity: 1; }

  .vd-action-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; margin-bottom: 0.75rem; flex-shrink: 0;
    transition: transform 0.2s;
  }
  .vd-action:hover .vd-action-icon { transform: scale(1.1) rotate(-3deg); }
  .vd-action-label { font-size: 0.78rem; font-weight: 800; color: #1e293b; margin-bottom: 3px; }
  .vd-action-desc  { font-size: 0.65rem; font-weight: 500; color: #94a3b8; line-height: 1.4; }

  /* Section progress (right col) */
  .vd-section-item { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
  .vd-section-row { display: flex; align-items: center; justify-content: space-between; }
  .vd-section-name { font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem; }
  .vd-section-pct  { font-size: 0.68rem; font-weight: 900; color: #D4AF37; }
  .vd-section-bar { height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
  .vd-section-fill { height: 100%; border-radius: 3px; transition: width 0.7s ease-out; }

  /* Activity feed */
  .vd-feed { display: flex; flex-direction: column; gap: 0.6rem; }
  .vd-feed-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.875rem; border-radius: 14px;
    background: #fafafa; border: 1px solid #f1f5f9;
    transition: all 0.18s;
  }
  .vd-feed-item:hover { background: #fff; border-color: #eef0f5; }
  .vd-feed-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; flex-shrink: 0;
  }
  .vd-feed-body { flex: 1; min-width: 0; }
  .vd-feed-msg { font-size: 0.75rem; font-weight: 700; color: #334155; line-height: 1.4; }
  .vd-feed-time { font-size: 0.6rem; font-weight: 700; color: #94a3b8; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.4px; }

  /* Published banner */
  .vd-pub-card {
    border-radius: 18px; padding: 1.5rem; border: 1px solid;
    transition: box-shadow 0.2s;
  }
  .vd-pub-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }
  .vd-pub-card.live   { background: rgba(22,163,74,0.04); border-color: rgba(22,163,74,0.2); }
  .vd-pub-card.draft  { background: #fdfbf5; border-color: rgba(212,175,55,0.25); }
  .vd-pub-label { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; }
  .vd-pub-label.live  { color: #16a34a; }
  .vd-pub-label.draft { color: #d97706; }
  .vd-pub-desc { font-size: 0.75rem; color: #64748b; font-weight: 500; line-height: 1.55; margin-bottom: 1.1rem; }
  .vd-pub-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    width: 100%; padding: 0.75rem 1rem; border-radius: 12px;
    font-size: 0.78rem; font-weight: 800; text-decoration: none;
    transition: all 0.2s;
  }
  .vd-pub-btn.live  { background: #16a34a; color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,0.25); }
  .vd-pub-btn.live:hover  { background: #15803d; }
  .vd-pub-btn.draft { background: #0f172a; color: #fff; box-shadow: 0 4px 14px rgba(15,23,42,0.2); }
  .vd-pub-btn.draft:hover { background: #1e293b; }

  /* Skeleton */
  .vd-skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Tip box */
  .vd-tip {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 1rem 1.25rem; border-radius: 14px;
    background: rgba(212,175,55,0.05); border: 1px solid rgba(212,175,55,0.2);
    margin-top: 1.25rem;
  }
  .vd-tip-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
  .vd-tip-body {}
  .vd-tip-title { font-size: 0.75rem; font-weight: 800; color: #92400e; margin-bottom: 3px; }
  .vd-tip-text  { font-size: 0.7rem; color: #78350f; font-weight: 500; line-height: 1.5; }
`;

/* ─── Quick action definitions ──────────────────────────── */
const QUICK_ACTIONS = [
  {
    icon: 'fa-layer-group', label: 'Content & Profile', desc: 'Edit sections and business details',
    href: '/vendor/sections',
    iconBg: 'rgba(212,175,55,0.12)', iconColor: '#D4AF37',
    bg: '#fffdf5', border: 'rgba(212,175,55,0.2)',
    hoverBg: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(240,200,66,0.04))',
  },
  {
    icon: 'fa-images', label: 'Media Gallery', desc: 'Upload photos and cover image',
    href: '/vendor/media',
    iconBg: 'rgba(139,92,246,0.12)', iconColor: '#8b5cf6',
    bg: '#fdf9ff', border: 'rgba(139,92,246,0.15)',
    hoverBg: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(167,139,250,0.03))',
  },
  {
    icon: 'fa-globe', label: 'Theme & Publish', desc: 'Customize colors and go live',
    href: '/vendor/minisite',
    iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22c55e',
    bg: '#f9fffe', border: 'rgba(34,197,94,0.15)',
    hoverBg: 'linear-gradient(135deg, rgba(34,197,94,0.04), rgba(16,185,129,0.02))',
  },
  {
    icon: 'fa-route', label: 'Journey Requests', desc: 'Respond to traveler inquiries',
    href: '/vendor/journey-requests',
    iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1',
    bg: '#faf9ff', border: 'rgba(99,102,241,0.15)',
    hoverBg: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(79,70,229,0.03))',
  },
  {
    icon: 'fa-box-open', label: 'My Packages', desc: 'Create promotional deals',
    href: '/vendor/packages',
    iconBg: 'rgba(249,115,22,0.1)', iconColor: '#f97316',
    bg: '#fffaf5', border: 'rgba(249,115,22,0.15)',
    hoverBg: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(234,88,12,0.03))',
  },
  {
    icon: 'fa-chart-bar', label: 'Investments', desc: 'List local capital opportunities',
    href: '/vendor/investment-opportunities',
    iconBg: 'rgba(236,72,153,0.1)', iconColor: '#ec4899',
    bg: '#fff9fc', border: 'rgba(236,72,153,0.15)',
    hoverBg: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(219,39,119,0.03))',
  },
];

/* ─── Helpers ───────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── Component ─────────────────────────────────────────── */
export default function VendorDashboardPage() {
  const [story,       setStory]       = useState<StoryData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [requests,    setRequests]    = useState<JourneyRequest[]>([]);
  const [profilePct,  setProfilePct]  = useState(0);

  /* ── Fetch data ── */
  useEffect(() => {
    /* Story / profile */
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then((data: StoryData) => {
        if (data?.business) {
          setStory(data);
          const total  = data.structure.reduce((a, s) => a + s.fields.length, 0);
          const filled = data.structure.reduce((a, s) =>
            a + s.fields.filter(f => f.value != null && f.value !== '').length, 0);
          setProfilePct(total > 0 ? Math.round((filled / total) * 100) : 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    /* Journey requests */
    fetch('/api/vendor/journey-requests')
      .then(r => r.json())
      .then((d: any) => {
        const arr = Array.isArray(d) ? d : Array.isArray(d?.requests) ? d.requests : [];
        setRequests(arr.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  /* ── Derived ── */
  const isPublished = !!(story?.business?.is_published || story?.business?.published);

  const checklistItems = [
    {
      label: 'Add business name & description',
      href: '/vendor/sections',
      done: !!(story?.business?.description?.trim()),
    },
    {
      label: 'Fill at least one content section',
      href: '/vendor/sections',
      done: profilePct > 10,
    },
    {
      label: 'Upload a cover photo',
      href: '/vendor/media',
      done: false,   // Would need media API — default false until we have it
    },
    {
      label: 'Add gallery images (min 3)',
      href: '/vendor/media',
      done: false,
    },
    {
      label: 'Publish minisite to the public',
      href: '/vendor/minisite',
      done: isPublished,
    },
  ];
  const doneCount = checklistItems.filter(i => i.done).length;
  const checkPct  = Math.round((doneCount / checklistItems.length) * 100);

  /* Activity feed: derive from real journey requests + static fallback */
  const activityItems = requests.length > 0
    ? requests.map(r => ({
        icon: 'fa-route', iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1',
        msg: `Journey request from ${r.traveler_name || r.guest_name || 'a traveler'}`,
        time: timeAgo(r.created_at),
        status: r.status,
      }))
    : [
        { icon: 'fa-check-circle', iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22c55e', msg: 'Profile saved — keep filling sections to rank higher', time: 'Active', status: 'info' },
        { icon: 'fa-lightbulb',    iconBg: 'rgba(212,175,55,0.1)', iconColor: '#D4AF37', msg: 'Tip: Upload a panoramic photo to attract more visitors',   time: 'Suggestion', status: 'tip' },
        { icon: 'fa-star',         iconBg: 'rgba(139,92,246,0.1)', iconColor: '#8b5cf6', msg: 'Complete your profile to unlock discovery ranking boost',  time: 'Goal', status: 'info' },
      ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="vd-root">

        {/* ─── Hero ─── */}
        <div className="vd-hero">
          <div className="vd-hero-orb1" />
          <div className="vd-hero-orb2" />
          <div className="vd-hero-grid" />
          <div className="vd-hero-inner">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vd-hero-badge">
                <i className="fas fa-star" style={{ fontSize: '0.6rem' }} />
                Vendor Overview
              </div>
              <h1 className="vd-hero-title">
                {loading ? (
                  <div className="vd-skeleton" style={{ height: 40, width: '60%' }} />
                ) : (
                  <>
                    Welcome back,{' '}
                    <span>{story?.business?.name?.split(' ')[0] || 'Vendor'}</span>
                  </>
                )}
              </h1>
              <p className="vd-hero-sub">
                {story?.typology?.parent?.name && story?.typology?.child?.name
                  ? `${story.typology.parent.name} · ${story.typology.child.name}`
                  : 'Manage your business presence and connect with travelers.'}
              </p>
              <div className="vd-hero-actions">
                <Link href="/vendor/sections" className="vd-hero-btn-primary">
                  <i className="fas fa-pen" />
                  Edit Profile
                </Link>
                {story?.business?.slug && (
                  <Link href={`/${story.business.slug}`} target="_blank" className="vd-hero-btn-ghost">
                    <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }} />
                    View Minisite
                  </Link>
                )}
              </div>
            </div>

            {/* Status widget */}
            <div className="vd-hero-status">
              <div className={`vd-hero-status-dot ${isPublished ? 'live' : 'draft'}`} />
              <div className="vd-hero-status-label">Minisite</div>
              <div className="vd-hero-status-val">{isPublished ? 'Published' : 'Draft'}</div>
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.5rem 0' }} />
              <div className="vd-hero-status-label">Profile</div>
              <div className="vd-hero-status-val" style={{ color: '#D4AF37' }}>{profilePct}%</div>
            </div>
          </div>
        </div>

        {/* ─── KPI Strip ─── */}
        <div className="vd-kpi-strip">
          {[
            {
              icon: 'fa-percent', iconBg: 'rgba(212,175,55,0.12)', iconColor: '#D4AF37',
              val: `${profilePct}%`, label: 'Profile Complete',
              trend: profilePct >= 80 ? '✓ Strong' : profilePct >= 40 ? 'In progress' : 'Needs work',
              trendClass: profilePct >= 80 ? 'up' : 'warn',
            },
            {
              icon: 'fa-route', iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1',
              val: requests.length, label: 'Journey Requests',
              trend: requests.filter(r => r.status === 'pending').length > 0
                     ? `${requests.filter(r => r.status === 'pending').length} pending` : 'All clear',
              trendClass: requests.filter(r => r.status === 'pending').length > 0 ? 'info' : 'up',
            },
            {
              icon: 'fa-tasks', iconBg: 'rgba(34,197,94,0.1)', iconColor: '#22c55e',
              val: `${doneCount}/${checklistItems.length}`, label: 'Tasks Complete',
              trend: doneCount === checklistItems.length ? 'All done!' : `${checklistItems.length - doneCount} remaining`,
              trendClass: doneCount === checklistItems.length ? 'up' : 'warn',
            },
            {
              icon: 'fa-globe', iconBg: 'rgba(14,165,233,0.1)', iconColor: '#0ea5e9',
              val: isPublished ? 'Live' : 'Draft', label: 'Minisite Status',
              trend: isPublished ? 'Publicly visible' : 'Not published',
              trendClass: isPublished ? 'up' : 'warn',
            },
          ].map((k, i) => (
            <div key={i} className="vd-kpi">
              <div className="vd-kpi-top">
                <div className="vd-kpi-icon" style={{ background: k.iconBg }}>
                  <i className={`fas ${k.icon}`} style={{ color: k.iconColor }} />
                </div>
                <span className={`vd-kpi-trend ${k.trendClass}`}>{k.trend}</span>
              </div>
              <div className="vd-kpi-val">{loading ? <span className="vd-skeleton" style={{ display:'inline-block', width: 60, height: 32 }} /> : k.val}</div>
              <div className="vd-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ─── Main 2-col grid ─── */}
        <div className="vd-grid">

          {/* LEFT */}
          <div className="vd-col-left">

            {/* Launch Checklist */}
            <div className="vd-card">
              <div className="vd-card-header">
                <div className="vd-card-title">
                  <div className="vd-card-title-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <i className="fas fa-rocket" style={{ color: '#D4AF37' }} />
                  </div>
                  Launch Checklist
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="vd-checklist-pct">{checkPct}%</div>
                  <div className="vd-checklist-sub">{doneCount} of {checklistItems.length} done</div>
                </div>
              </div>

              <div className="vd-prog-bar">
                <div className="vd-prog-fill" style={{ width: `${checkPct}%` }} />
              </div>

              <div className="vd-checklist">
                {checklistItems.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className={`vd-check-item ${item.done ? 'done' : 'todo'}`}
                  >
                    <div className={`vd-check-circle ${item.done ? 'done' : 'todo'}`}>
                      {item.done ? <i className="fas fa-check" /> : <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{i + 1}</span>}
                    </div>
                    <span className="vd-check-text">{item.label}</span>
                    {!item.done && <i className="fas fa-chevron-right vd-check-arrow" />}
                  </Link>
                ))}
              </div>

              {profilePct < 50 && (
                <div className="vd-tip">
                  <span className="vd-tip-icon">💡</span>
                  <div className="vd-tip-body">
                    <div className="vd-tip-title">Improve your ranking</div>
                    <div className="vd-tip-text">
                      Businesses with 80%+ profile completion appear 3× more in search results. Fill your sections to attract more travelers.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="vd-card">
              <div className="vd-card-header">
                <div className="vd-card-title">
                  <div className="vd-card-title-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <i className="fas fa-bolt" style={{ color: '#6366f1' }} />
                  </div>
                  Quick Actions
                </div>
              </div>
              <div className="vd-actions-grid">
                {QUICK_ACTIONS.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className="vd-action"
                    style={{ background: a.bg, borderColor: a.border }}
                  >
                    <div>
                      <div className="vd-action-icon" style={{ background: a.iconBg }}>
                        <i className={`fas ${a.icon}`} style={{ color: a.iconColor }} />
                      </div>
                      <div className="vd-action-label">{a.label}</div>
                    </div>
                    <div className="vd-action-desc">{a.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="vd-col-right">

            {/* Publish Status */}
            <div className={`vd-pub-card ${isPublished ? 'live' : 'draft'}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div className={`vd-pub-label ${isPublished ? 'live' : 'draft'}`}>
                  <i className="fas fa-circle" style={{ fontSize: '0.45rem', marginRight: 5 }} />
                  {isPublished ? 'Minisite is Live' : 'Minisite in Draft'}
                </div>
                {story?.business?.slug && (
                  <Link
                    href={`/${story.business.slug}`}
                    target="_blank"
                    style={{ fontSize: '0.62rem', color: isPublished ? '#16a34a' : '#d97706', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Visit →
                  </Link>
                )}
              </div>
              <p className="vd-pub-desc">
                {isPublished
                  ? 'Your minisite is publicly visible and indexed. Travelers can discover and contact you.'
                  : 'Your content is saved but not public. Publish to go live and start receiving inquiries.'}
              </p>
              <Link
                href="/vendor/minisite"
                className={`vd-pub-btn ${isPublished ? 'live' : 'draft'}`}
              >
                <i className={`fas ${isPublished ? 'fa-cog' : 'fa-rocket'}`} />
                {isPublished ? 'Minisite Settings' : 'Publish Now'}
              </Link>
            </div>

            {/* Section Completion */}
            <div className="vd-card">
              <div className="vd-card-header">
                <div className="vd-card-title">
                  <div className="vd-card-title-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <i className="fas fa-chart-pie" style={{ color: '#D4AF37' }} />
                  </div>
                  Profile Health
                </div>
                <Link href="/vendor/sections" className="vd-card-link">
                  Edit <i className="fas fa-arrow-right" />
                </Link>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1,2,3].map(k => <div key={k} className="vd-skeleton" style={{ height: 40 }} />)}
                </div>
              ) : story?.structure?.length ? (
                story.structure.slice(0, 5).map(s => {
                  const filled = s.fields.filter(f => f.value != null && f.value !== '').length;
                  const pct = s.fields.length > 0 ? Math.round((filled / s.fields.length) * 100) : 0;
                  return (
                    <div key={s.id} className="vd-section-item">
                      <div className="vd-section-row">
                        <span className="vd-section-name">
                          <span>{s.icon || '📋'}</span>
                          {s.name}
                        </span>
                        <span className="vd-section-pct">{pct}%</span>
                      </div>
                      <div className="vd-section-bar">
                        <div
                          className="vd-section-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#D4AF37,#f0c842)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                  No sections found. <Link href="/vendor/sections" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 700 }}>Add content →</Link>
                </p>
              )}
            </div>

            {/* Activity Feed */}
            <div className="vd-card">
              <div className="vd-card-header">
                <div className="vd-card-title">
                  <div className="vd-card-title-icon" style={{ background: 'rgba(14,165,233,0.1)' }}>
                    <i className="fas fa-bell" style={{ color: '#0ea5e9' }} />
                  </div>
                  Recent Activity
                </div>
                <Link href="/vendor/journey-requests" className="vd-card-link">
                  All <i className="fas fa-arrow-right" />
                </Link>
              </div>
              <div className="vd-feed">
                {activityItems.map((item, i) => (
                  <div key={i} className="vd-feed-item">
                    <div className="vd-feed-icon" style={{ background: item.iconBg }}>
                      <i className={`fas ${item.icon}`} style={{ color: item.iconColor }} />
                    </div>
                    <div className="vd-feed-body">
                      <div className="vd-feed-msg">{item.msg}</div>
                      <div className="vd-feed-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
