import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  
  // Navigation groupings
  const navGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Overview', href: '/admin', icon: 'fa-home' },
        { name: 'Audit Log', href: '/admin/audit', icon: 'fa-history' }
      ]
    },
    {
      title: 'TAXONOMY ENGINE',
      items: [
        { name: 'Location Tree', href: '/admin/locations', icon: 'fa-map-marked-alt' },
        { name: 'Business Types', href: '/admin/types', icon: 'fa-sitemap' }
      ]
    },
    {
      title: 'BUILDER STATION',
      items: [
        { name: 'Form Builder', href: '/admin/forms', icon: 'fa-wpforms' },
        { name: 'Search Policies', href: '/admin/policies', icon: 'fa-shield-alt' }
      ]
    },
    {
      title: 'POLICY LAB',
      items: [
        { name: 'Service Components', href: '/admin/components', icon: 'fa-cubes' },
        { name: 'Subscription Tiers', href: '/admin/tiers', icon: 'fa-gem' }
      ]
    },
    {
      title: 'DATA HUB',
      items: [
        { name: 'Businesses', href: '/admin/businesses', icon: 'fa-store' },
        { name: 'Users & Vendors', href: '/admin/users', icon: 'fa-users' },
        { name: 'Import / Export', href: '/admin/data', icon: 'fa-database' }
      ]
    }
  ]

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* 1. Glass Sidebar */}
      <aside className="w-72 flex-shrink-0 glass-panel !rounded-none !border-y-0 !border-l-0 flex flex-col z-20 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <Link href="/admin">
            <h1 className="font-outfit text-xl font-bold tracking-tight text-white inline-flex items-center gap-2">
              <span className="text-brand-400">SIWA</span> ADMIN
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group, idx) => (
            <div key={idx} className="px-4">
              <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <i className={`fas ${item.icon} w-5 text-center text-brand-400`}></i>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              SA
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">Super Admin</p>
              <p className="text-xs text-slate-400 truncate">admin@siwa.com</p>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors" title="Log out">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 flex-shrink-0 glass-panel !rounded-none !border-x-0 !border-t-0 flex justify-between items-center px-8 z-10">
           <div className="text-sm text-slate-400">
              <span className="text-brand-400 font-medium">Dashboard</span> / Overview
           </div>
           <div className="flex items-center gap-4">
             <button className="text-slate-400 hover:text-white relative">
               <i className="fas fa-bell text-lg"></i>
               <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-slate-900 border-none shadow-[0_0_10px_rgba(245,158,11,1)]"></span>
             </button>
             <Link href="/" target="_blank" className="btn-secondary py-1.5 px-4 text-sm flex gap-2 items-center">
               View Live Site <i className="fas fa-external-link-alt text-xs"></i>
             </Link>
           </div>
        </header>

        {/* Scrollable Content Engine */}
        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
