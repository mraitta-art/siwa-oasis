'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// Mock Data for the Builder
const TIERS = [
  { id: 'free', name: 'Free', price: 0, version: 12 },
  { id: 'basic', name: 'Basic', price: 15, version: 8 },
  { id: 'premium', name: 'Premium', price: 45, version: 5 }
];

const COMPONENT_LIBRARY = [
  { id: 'minisite', name: 'Minisite Pages', type: 'quota', field: 'max_pages', description: 'How many custom pages they can build.' },
  { id: 'carousel', name: 'Media Carousel', type: 'quota', field: 'max_slides', description: 'Number of hero slides permitted.' },
  { id: 'gallery', name: 'Image Gallery', type: 'quota', field: 'max_images', description: 'Total gallery image limit.' },
  { id: 'contact', name: 'Contact Actions', type: 'multi-select', options: ['phone', 'email', 'whatsapp', 'social'], description: 'Allowed contact buttons on the minisite.' },
  { id: 'booking', name: 'Booking Engine', type: 'boolean', description: 'Toggle native booking requests.' }
]

export default function TierPolicyLab() {
  const [activeTier, setActiveTier] = useState('premium');
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-outfit font-bold text-white tracking-tight">Policy Lab</h2>
          <p className="text-slate-400 mt-1">Component-Based Subscription Tier Engine</p>
        </div>
        <div className="flex gap-3">
          <Button variant={showHistory ? "primary" : "secondary"} onClick={() => setShowHistory(!showHistory)}>
            <i className="fas fa-history mr-2"></i> {showHistory ? "Back to Editor" : "View Version History"}
          </Button>
          <Button variant="accent">
            <i className="fas fa-plus mr-2"></i> Create Tier
          </Button>
        </div>
      </div>

      {!showHistory ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Tiers List */}
          <div className="space-y-4">
            {TIERS.map(tier => (
              <div 
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  activeTier === tier.id 
                    ? 'bg-brand-500/10 border-brand-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                    : 'bg-slate-900/40 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className={`font-bold ${activeTier === tier.id ? 'text-brand-300' : 'text-white'}`}>{tier.name} Tier</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">v.{tier.version}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">${tier.price} / month</p>
              </div>
            ))}

            <div className="glass-card p-4 border-dashed border-2 border-slate-700/50 text-center text-slate-500 cursor-help">
              <i className="fas fa-info-circle mb-2 text-xl"></i>
              <p className="text-xs">Any changes saved to a tier automatically generate a new version in the history log.</p>
            </div>
          </div>

          {/* Right Column: Policy Matrix Editor */}
          <div className="lg:col-span-2">
            <Card className="border-brand-500/30">
              <CardHeader className="bg-slate-900/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-brand-300 flex items-center gap-2">
                    <i className="fas fa-sliders-h"></i> {TIERS.find(t => t.id === activeTier)?.name} Policy Matrix
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-400"><i className="fas fa-undo"></i></Button>
                  <Button variant="primary" size="sm">Save Version</Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 divide-y divide-slate-800/50">
                {COMPONENT_LIBRARY.map(comp => (
                  <div key={comp.id} className="p-6 hover:bg-slate-900/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium">{comp.name}</h4>
                        {comp.type === 'quota' && <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Quota</span>}
                        {comp.type === 'boolean' && <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Toggle</span>}
                        {comp.type === 'multi-select' && <span className="text-[10px] uppercase tracking-wider bg-accent-500/20 text-accent-400 px-2 py-0.5 rounded">Permissions</span>}
                      </div>
                      <p className="text-sm text-slate-400">{comp.description}</p>
                    </div>

                    <div className="w-full md:w-64">
                      {/* Dynamic Input Types based on Component Needs */}
                      {comp.type === 'quota' && (
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-500 uppercase font-semibold">{comp.field}:</label>
                          <input type="number" className="input-field py-1 px-3 h-9" defaultValue={activeTier === 'premium' ? 50 : 5} />
                        </div>
                      )}
                      
                      {comp.type === 'boolean' && (
                        <div className="flex items-center justify-end">
                           <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked={activeTier === 'premium'} />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      )}

                      {comp.type === 'multi-select' && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {comp.options?.map(opt => (
                            <label key={opt} className={`cursor-pointer px-3 py-1 rounded text-xs font-medium border transition-colors ${activeTier === 'free' && opt === 'whatsapp' ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-brand-500/20 border-brand-500/50 text-brand-300'}`}>
                              <input type="checkbox" className="hidden" defaultChecked={!(activeTier === 'free' && opt === 'whatsapp')} />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* History View */
        <Card className="border-slate-700">
          <CardHeader>
            <CardTitle>Policy Version History Log</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {[
                  { version: 12, tier: 'Premium', date: 'Oct 14, 2026', author: 'Super Admin', notes: 'Increased gallery quota from 25 to 50.' },
                  { version: 8, tier: 'Basic', date: 'Sep 02, 2026', author: 'Super Admin', notes: 'Enabled Minisite Builder (Max 1 Page).' },
                  { version: 5, tier: 'Premium', date: 'Aug 15, 2026', author: 'Super Admin', notes: 'Initial premium launch constraints.' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:bg-slate-800/80 transition-colors">
                     <div className="w-16 h-16 rounded-lg bg-slate-900 flex flex-col items-center justify-center border border-slate-700 flex-shrink-0">
                       <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">v.</span>
                       <span className="text-xl text-white font-bold">{log.version}</span>
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between">
                         <h4 className="text-white font-medium flex items-center gap-2">
                           {log.tier} Policy Updated
                           {i === 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Active Rollback Point</span>}
                         </h4>
                         <span className="text-sm text-slate-500">{log.date}</span>
                       </div>
                       <p className="text-slate-400 text-sm mt-1">{log.notes}</p>
                       <p className="text-xs text-slate-500 mt-2">Saved by: {log.author}</p>
                     </div>
                     <div className="flex items-center justify-center pl-4 border-l border-slate-700/50">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand-300">
                          <i className="fas fa-search-plus mr-2"></i> Inspect
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
