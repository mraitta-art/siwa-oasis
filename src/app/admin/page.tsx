import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-outfit font-bold text-white tracking-tight">System Overview</h2>
          <p className="text-slate-400 mt-1">SIWA OASIS Platform Command Center</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Generate Report</Button>
          <Button variant="primary">Add Business</Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Businesses</p>
                <h3 className="text-3xl font-bold text-white mt-1">124</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                <i className="fas fa-store text-brand-400"></i>
              </div>
            </div>
            <p className="text-sm text-emerald-400 mt-4 flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 12% this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Vendors</p>
                <h3 className="text-3xl font-bold text-white mt-1">86</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <i className="fas fa-users text-emerald-400"></i>
              </div>
            </div>
            <p className="text-sm text-emerald-400 mt-4 flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 4 new accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Upgrade Requests</p>
                <h3 className="text-3xl font-bold text-white mt-1">5</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
                <i className="fas fa-tasks text-accent-400"></i>
              </div>
            </div>
            <p className="text-sm text-accent-400 mt-4 flex items-center gap-1">
              <i className="fas fa-exclamation-circle"></i> Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Views</p>
                <h3 className="text-3xl font-bold text-white mt-1">45.2K</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-eye text-blue-400"></i>
              </div>
            </div>
            <p className="text-sm text-emerald-400 mt-4 flex items-center gap-1">
              <i className="fas fa-arrow-up"></i> 18% traffic surge
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database & Data Integrity Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { time: '10 mins ago', msg: 'Super Admin updated Silver Tier Policy components.', icon: 'fa-shield-alt', color: 'text-brand-400' },
                  { time: '1 hour ago', msg: 'New Vendor registered: "Desert Stars Camp".', icon: 'fa-user-plus', color: 'text-emerald-400' },
                  { time: '3 hours ago', msg: 'Salesman A triggered bulk CSV import (12 businesses).', icon: 'fa-upload', color: 'text-blue-400' }
                ].map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 flex-shrink-0 flex justify-center pt-1">
                      <i className={`fas ${log.icon} ${log.color}`}></i>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{log.msg}</p>
                      <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="bg-gradient-to-br from-slate-900 to-brand-900/20 border-brand-500/30">
            <CardHeader className="border-none pb-2">
              <CardTitle className="text-brand-300">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 border-brand-500/30 hover:border-brand-500/60 hover:bg-brand-500/10">
                <i className="fas fa-sitemap w-5"></i> Manage Typology
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 border-brand-500/30 hover:border-brand-500/60 hover:bg-brand-500/10">
                <i className="fas fa-wpforms w-5"></i> Edit Forms
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 border-accent-500/30 hover:border-accent-500/60 hover:bg-accent-500/10">
                <i className="fas fa-gem w-5 text-accent-400"></i> Review Tiers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
