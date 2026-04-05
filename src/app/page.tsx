import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function PublicHomepage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. Global Navigation (Transparent overlay) */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <span className="font-outfit text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
            <span className="text-brand-400">SIWA</span> OASIS
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-white font-medium">
          <Link href="/search" className="hover:text-brand-300 transition-colors drop-shadow-md">Explore</Link>
          <Link href="/tours" className="hover:text-brand-300 transition-colors drop-shadow-md">Experiences</Link>
          <Link href="/stays" className="hover:text-brand-300 transition-colors drop-shadow-md">Stays</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-white hover:text-brand-300 font-medium transition-colors">Sign In</Link>
          <Link href="/signup">
            <Button variant="accent" className="shadow-[0_0_20px_rgba(245,158,11,0.4)]">Add Your Business</Button>
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section (Immersive & Swift Navigation) */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image / Video Mock */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/20 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1543884175-01e4ec305a46?q=80&w=2670&auto=format&fit=crop" 
            alt="Siwa Oasis Desert" 
            className="w-full h-full object-cover animate-in fade-in zoom-in duration-[3000ms]"
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl pt-20">
          <h1 className="font-outfit text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
            Discover the Magic of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Western Desert</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-200 mb-10 font-light drop-shadow-lg animate-in slide-in-from-bottom-8 duration-700 delay-150">
            Book luxury eco-lodges, authentic traditional camps, and unforgettable desert safaris directly from verified local hosts.
          </p>
          
          {/* Smart Search Engine Engine (Controlled by Taxonomy) */}
          <div className="glass-card p-3 max-w-3xl mx-auto flex flex-col md:flex-row gap-3 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex-1 relative">
              <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-brand-400"></i>
              <select className="w-full h-12 bg-slate-900/80 border border-slate-700 rounded-lg pl-12 pr-4 text-white focus:ring-2 focus:ring-brand-500 appearance-none">
                <option value="">Any Location in Siwa</option>
                <option value="aghurmi">Aghurmi (Old Fortress)</option>
                <option value="cleopatra">Cleopatra Spring</option>
                <option value="sand-sea">Great Sand Sea</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-accent-400"></i>
              <select className="w-full h-12 bg-slate-900/80 border border-slate-700 rounded-lg pl-12 pr-4 text-white focus:ring-2 focus:ring-brand-500 appearance-none">
                <option value="">All Experiences</option>
                <option value="hotel">Luxury Hotels & Resorts</option>
                <option value="camp">Desert Camps & Lodges</option>
                <option value="safari">4x4 Safari Expeditions</option>
              </select>
            </div>
            <Button variant="primary" className="h-12 px-8 shadow-brand-500/50">
              <i className="fas fa-search mr-2"></i> Search
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Categories (Driven by Business Types DB) */}
      <section className="py-24 bg-bg-base relative z-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-outfit font-bold text-white mb-2">Curated Categories</h2>
              <p className="text-slate-400">Fly swiftly between our top-rated services.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Eco Lodges', count: 24, icon: 'fa-leaf', img: 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?w=800&q=80' },
              { title: 'Hot Springs', count: 12, icon: 'fa-water', img: 'https://images.unsplash.com/photo-1520637102912-2df6bb2aec6d?w=800&q=80' },
              { title: '4x4 Desert Safari', count: 45, icon: 'fa-truck-monster', img: 'https://images.unsplash.com/photo-1621245648585-e6f4773de578?w=800&q=80' },
              { title: 'Historic Sites', count: 18, icon: 'fa-monument', img: 'https://images.unsplash.com/photo-1572914857229-37bf6ee8101c?w=800&q=80' }
            ].map((cat, i) => (
              <Link href="/search" key={i} className="group relative h-64 rounded-2xl overflow-hidden glass-card border border-slate-700/50 cursor-pointer block">
                <img src={cat.img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 backdrop-blur-md flex items-center justify-center border border-brand-500/50 mb-4 group-hover:bg-brand-500/40 transition-colors">
                    <i className={`fas ${cat.icon} text-brand-300`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{cat.title}</h3>
                  <p className="text-sm text-brand-300">{cat.count} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The Vendor B2B Sales Pitch (To attract clients to sign up) */}
      <section className="py-24 relative overflow-hidden bg-slate-900 border-t border-b border-brand-500/20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-medium mb-6">
                  <i className="fas fa-rocket"></i> For Business Owners
                </div>
                <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white mb-6 leading-tight">
                  Grow your business with the <span className="text-brand-400">official</span> Siwa Directory.
                </h2>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  Join hundreds of verified local vendors reaching thousands of daily travelers. Create your interactive Minisite in minutes, manage bookings, and showcase your Premium Media Gallery without paying massive commission fees to foreign agencies.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-brand-500/30 shadow-lg">Create Minisite (Free)</Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">View Partner Tiers</Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mt-12 border-t border-slate-700/50 pt-8">
                   <div>
                     <h4 className="text-3xl font-bold text-white">45k+</h4>
                     <p className="text-sm text-slate-400 mt-1">Monthly Visitors</p>
                   </div>
                   <div>
                     <h4 className="text-3xl font-bold text-brand-400">0%</h4>
                     <p className="text-sm text-slate-400 mt-1">Booking Fees</p>
                   </div>
                   <div>
                     <h4 className="text-3xl font-bold text-accent-400">120+</h4>
                     <p className="text-sm text-slate-400 mt-1">Local Vendors</p>
                   </div>
                </div>
             </div>

             {/* UI Preview Mockup (Showing off the tools to vendors) */}
             <div className="lg:w-1/2 w-full">
                <div className="glass-panel p-2 rounded-2xl rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl shadow-brand-500/20 border-brand-500/30">
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <div className="h-8 bg-slate-950 flex items-center px-4 gap-2 border-b border-slate-800">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center p-0.5">
                          <img src="https://images.unsplash.com/photo-1542640244-7e672d6cb466?w=100&q=80" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">Siwa Premium Camp</h4>
                          <div className="flex text-accent-400 text-xs">
                            <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 w-3/4 bg-slate-800 rounded-full"></div>
                        <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                        <div className="h-2 w-5/6 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <div className="flex-1 h-24 rounded-lg bg-brand-900/30 border border-brand-500/20 flex items-center justify-center">
                          <i className="fas fa-images text-brand-400 text-2xl opacity-50"></i>
                        </div>
                        <div className="flex-1 h-24 rounded-lg bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center">
                          <i className="fab fa-whatsapp text-emerald-400 text-2xl opacity-50"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

    </div>
  )
}
