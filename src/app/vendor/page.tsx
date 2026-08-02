'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_published: boolean;
  custom_data: any;
}

interface Section {
  id: string;
  name: string;
  icon: string;
  fields: { name: string; value: any }[];
}

interface StoryData {
  business: BusinessData;
  structure: Section[];
  typology: { child: any; parent: any };
}

export default function VendorDashboardPage() {
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePct, setProfilePct] = useState(0);

  const recentActivity = [
    { id: 1, icon: '✨', message: 'Profile info saved successfully', time: '2 hours ago', color: 'bg-emerald-50/40 text-emerald-700 border-emerald-100/60' },
    { id: 2, icon: '💬', message: 'New custom journey request received', time: '4 hours ago', color: 'bg-indigo-50/40 text-indigo-700 border-indigo-100/60' },
    { id: 3, icon: '📸', message: 'New cover photo uploaded', time: '1 day ago', color: 'bg-amber-50/40 text-amber-700 border-amber-100/60' },
    { id: 4, icon: '🏆', message: 'Minisite gallery section featured', time: '2 days ago', color: 'bg-purple-50/40 text-purple-700 border-purple-100/60' },
  ];

  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then((data: StoryData) => {
        if (data?.business) {
          setStory(data);
          // Calculate completion percentage
          const total = data.structure.reduce((a, s) => a + s.fields.length, 0);
          const filled = data.structure.reduce((a, s) => a + s.fields.filter(f => f.value !== null && f.value !== '' && f.value !== undefined).length, 0);
          setProfilePct(total > 0 ? Math.round((filled / total) * 100) : 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const checklistItems = [
    { label: 'Specify Business Name & Description', href: '/vendor/sections', done: !!(story?.business?.description) },
    { label: 'Upload Panoramic Cover Photo', href: '/vendor/media', done: false },
    { label: 'Add Contact Details & Social Links', href: '/vendor/sections', done: false },
    { label: 'Upload at least 3 Gallery Images', href: '/vendor/media', done: false },
    { label: 'Publish Minisite Live to Public', href: '/vendor/minisite', done: !!(story?.business?.is_published) },
  ];
  const completedChecklist = checklistItems.filter(i => i.done).length;

  const quickActions = [
    { icon: '🏗️', label: 'Identity & Profile', desc: 'Manage core fields and custom details', href: '/vendor/sections', bg: 'from-amber-50/50 to-amber-100/30', border: 'hover:border-amber-300' },
    { icon: '📸', label: 'Media Assets', desc: 'Drag-and-drop gallery manager', href: '/vendor/media', bg: 'from-purple-50/50 to-purple-100/30', border: 'hover:border-purple-300' },
    { icon: '🌐', label: 'Minisite Studio', desc: 'Theme colors, vanity URL, visibility', href: '/vendor/minisite', bg: 'from-emerald-50/50 to-emerald-100/30', border: 'hover:border-emerald-300' },
    { icon: '🗺️', label: 'Journey Inquiries', desc: 'View custom traveler itineraries', href: '/vendor/journey-requests', bg: 'from-blue-50/50 to-blue-100/30', border: 'hover:border-blue-300' },
    { icon: '📦', label: 'Deals & Packages', desc: 'Create promotional experiences', href: '/vendor/packages', bg: 'from-orange-50/50 to-orange-100/30', border: 'hover:border-orange-300' },
    { icon: '💰', label: 'Investment Listings', desc: 'Register local capital opportunities', href: '/vendor/investment-opportunities', bg: 'from-pink-50/50 to-pink-100/30', border: 'hover:border-pink-300' },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Welcome Banner */}
      <div 
        className="relative rounded-[32px] p-8 md:p-10 mb-8 overflow-hidden shadow-md border border-amber-200/40 bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 transition-all duration-300 hover:shadow-lg"
        style={{
          boxShadow: '0 10px 30px -10px rgba(212, 175, 55, 0.3)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 text-[180px] leading-none opacity-[0.08] select-none pointer-events-none translate-y-10 translate-x-5">🏪</div>
        <div className="absolute left-[40%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm mb-3">
            ✨ Vendor Overview Panel
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            {loading ? 'Initializing workspace...' : (story?.business?.name || 'Your Siwan Venture')}
          </h1>
          <p className="text-amber-50/90 text-sm md:text-base font-medium mb-6 leading-relaxed max-w-2xl">
            {story?.typology?.parent?.name && story?.typology?.child?.name
              ? `Authorized vendor of ${story.typology.parent.name} • ${story.typology.child.name}`
              : 'Complete your registration checklist to unlock the full potential of your vanity minisite.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/vendor/onboarding" 
              className="px-5 py-2.5 bg-white text-amber-800 font-extrabold text-xs md:text-sm rounded-2xl hover:bg-amber-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              🪄 Onboarding Wizard
            </Link>
            {story?.business?.slug && (
              <Link 
                href={`/${story.business.slug}`} 
                target="_blank" 
                className="px-5 py-2.5 bg-amber-700/30 text-white font-extrabold text-xs md:text-sm rounded-2xl hover:bg-amber-700/50 transition-all duration-200 border border-white/20 backdrop-blur-sm flex items-center gap-2"
              >
                <i className="fas fa-external-link-alt text-[10px]"></i> View My Minisite
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Checklist + Actions) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Launch Checklist */}
          <div className="bg-white border border-amber-100/50 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="text-[#D4AF37]">🚀</span> Launch Checklist
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Complete these steps to build trust and rank higher in discovery searches.
                </p>
              </div>
              <div className="text-right sm:text-right flex items-center gap-3 sm:flex-col sm:gap-0">
                <span className="text-3xl font-black text-[#D4AF37]">
                  {Math.round((completedChecklist / checklistItems.length) * 100)}%
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {completedChecklist} of {checklistItems.length} Done
                </span>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full mb-6 overflow-hidden p-0.5 border border-slate-200/30">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${Math.round((completedChecklist / checklistItems.length) * 100)}%`, 
                  background: 'linear-gradient(90deg, #D4AF37 0%, #f59e0b 100%)',
                  boxShadow: '0 2px 6px rgba(212,175,55,0.4)'
                }}
              />
            </div>

            {/* Checklist Items */}
            <div className="grid gap-3">
              {checklistItems.map((item, i) => (
                <Link 
                  key={i} 
                  href={item.href} 
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 group ${
                    item.done 
                      ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50' 
                      : 'bg-slate-50/60 border-slate-100 hover:border-amber-200 hover:bg-amber-50/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all duration-300 ${
                    item.done 
                      ? 'bg-emerald-500 text-white scale-105 shadow-sm shadow-emerald-200' 
                      : 'bg-white border border-slate-200 text-slate-400 group-hover:border-amber-300 group-hover:text-amber-500'
                  }`}>
                    {item.done ? '✓' : (i + 1)}
                  </div>
                  <span className={`flex-1 text-sm font-bold transition-all ${
                    item.done ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <i className="fas fa-chevron-right text-slate-300 group-hover:text-[#D4AF37] text-xs transition-transform duration-200 group-hover:translate-x-1"></i>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-amber-100/50 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-5 flex items-center gap-2">
              <span className="text-[#D4AF37]">⚡</span> Dashboard Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((action, i) => (
                <Link 
                  key={i} 
                  href={action.href}
                  className={`group p-5 rounded-3xl border border-slate-100 bg-gradient-to-br ${action.bg} ${action.border} transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between`}
                  style={{ minHeight: '140px' }}
                >
                  <div>
                    <div className="text-3xl mb-3 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110 origin-left inline-block">
                      {action.icon}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800 mb-1 leading-snug">
                      {action.label}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-normal">
                    {action.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Analytics / Health / Activity) */}
        <div className="space-y-8">
          
          {/* Profile Health */}
          <div className="bg-white border border-amber-100/50 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">📊 Profile Completeness</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 mb-6">Percentage of profile attributes completed.</p>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="2.5"/>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="url(#goldGradient)" strokeWidth="3"
                    strokeDasharray={`${profilePct} 100`} strokeLinecap="round" className="transition-all duration-1000"/>
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[#D4AF37]">{profilePct}%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Health</span>
                </div>
              </div>
            </div>

            {/* Individual Sections */}
            <div className="space-y-3.5 mb-6">
              {loading ? (
                <>
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                </>
              ) : (
                story?.structure?.slice(0, 4).map(s => {
                  const filled = s.fields.filter(f => f.value !== null && f.value !== '' && f.value !== undefined).length;
                  const pct = s.fields.length > 0 ? Math.round((filled / s.fields.length) * 100) : 0;
                  return (
                    <div key={s.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600 flex items-center gap-1.5">
                          <span>{s.icon || '📋'}</span>
                          {s.name}
                        </span>
                        <span className="font-black text-[#D4AF37]">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${pct}%`, 
                            background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #D4AF37, #f59e0b)' 
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link 
              href="/vendor/sections" 
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all duration-200 shadow-sm shadow-amber-100"
            >
              ✏️ Customize Content Sections
            </Link>
          </div>

          {/* Minisite Status */}
          <div className={`border rounded-[32px] p-6 shadow-sm transition-all duration-300 hover:shadow-md ${
            story?.business?.is_published 
              ? 'bg-emerald-50/30 border-emerald-100/60' 
              : 'bg-white border-amber-100/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">🌐 Minisite Status</h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                story?.business?.is_published 
                  ? 'bg-emerald-500 text-white border-transparent' 
                  : 'bg-amber-500 text-white border-transparent animate-pulse'
              }`}>
                {story?.business?.is_published ? '● Published' : '○ Draft Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-5 leading-relaxed">
              {story?.business?.is_published
                ? 'Your Siwa Oasis vanity website is fully indexed and visible to global travelers.'
                : 'Your changes are stored safely. Publish to overwrite the active live version.'}
            </p>
            <Link 
              href="/vendor/minisite" 
              className={`flex items-center justify-center gap-2 w-full py-3 font-extrabold text-sm rounded-2xl transition-all duration-200 ${
                story?.business?.is_published 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              }`}
            >
              {story?.business?.is_published ? '⚙️ Open Minisite Settings' : '🚀 Publish To Live Site'}
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-amber-100/50 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4">📈 Status Log</h2>
            <div className="grid gap-3">
              {recentActivity.map(item => (
                <div key={item.id} className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all hover:bg-white/80 ${item.color}`}>
                  <span className="text-xl flex-shrink-0 filter drop-shadow-sm">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold leading-snug">{item.message}</p>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
