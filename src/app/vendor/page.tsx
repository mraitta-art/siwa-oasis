import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function VendorDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 relative overflow-hidden bg-gradient-to-r from-slate-900 to-brand-900/20 border-brand-500/30">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-outfit font-bold text-white">Welcome back, Ahmed!</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Your minisite is currently live. You've had <strong className="text-brand-400">124</strong> profile views this week. Keep your profile updated to attract more travelers.
            </p>
          </div>
          <Button variant="primary" className="whitespace-nowrap shadow-brand-500/20">
            Edit Profile Data <i className="fas fa-magic ml-2"></i>
          </Button>
        </div>
      </div>

      {/* Profile Health & Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tier Info Card */}
        <Card className="border-brand-500/30 bg-gradient-to-br from-slate-900 to-brand-950/40">
          <CardHeader className="border-b border-brand-500/20">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-brand-300 text-sm tracking-wider uppercase">Active Tier</CardTitle>
              <i className="fas fa-crown text-accent-400 text-xl drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"></i>
            </div>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <h3 className="text-3xl font-outfit font-bold text-white">PREMIUM</h3>
            <p className="text-slate-400 mt-2 text-sm">Full access to Minisite Builder and Advanced Galleries.</p>
            <Button variant="outline" className="w-full mt-6 border-brand-500/30 text-brand-300 hover:bg-brand-500/10">
              View My Policy Limits
            </Button>
          </CardContent>
        </Card>

        {/* Media Quota Tracker */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Storage & Media Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-300">Direct Image Uploads</span>
                <span className="text-sm font-bold text-white">32 <span className="text-slate-500 font-normal">/ 50 Images</span></span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 w-[64%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-300">YouTube / External Videos</span>
                <span className="text-sm font-bold text-emerald-400">Unlimited <i className="fas fa-infinity ml-1 text-xs"></i></span>
              </div>
              <p className="text-xs text-slate-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg leading-relaxed">
                <i className="fas fa-info-circle text-emerald-400 mr-1"></i> You are using external URLs for videos. This does not consume your tier storage limits. Highly recommended!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
