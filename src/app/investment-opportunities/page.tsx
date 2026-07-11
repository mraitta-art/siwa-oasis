'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface InvestmentOpportunity {
  id: string;
  opportunity_title: string;
  opportunity_type: 'equity' | 'partnership' | 'franchise' | 'joint_venture' | 'sponsorship';
  business_name: string;
  investment_amount_min: number;
  investment_amount_max: number;
  expected_roi_percent: number;
  business_stage: string;
  annual_revenue: number;
  years_in_business: number;
  is_featured: boolean;
  investors_current: number;
  target_investors: number;
  visibility_on_main_site: boolean;
}

interface SponsorshipPackage {
  id: string;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  sponsorship_title: string;
  sponsorship_type: string;
  sponsorship_tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'custom';
  sponsorship_value: string;
  sponsorship_benefits: string;
  sponsorship_duration: string;
  sponsorship_description: string;
  is_featured: boolean;
}

export default function MainSiteInvestmentOpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<'investments' | 'sponsorships'>('investments');
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterROI, setFilterROI] = useState('all');
  const [sortBy, setSortBy] = useState('roi');

  // Load both investments and sponsorships
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/discovery/investments').then((r) => r.json()),
      fetch('/api/discovery/sponsorships').then((r) => r.json())
    ])
      .then(([invData, spData]) => {
        if (invData?.success && Array.isArray(invData.items)) {
          const mapped = invData.items.map((item: any) => ({
            id: item.business_id || item.id,
            opportunity_title: item.opportunity_title || '',
            opportunity_type: (item.opportunity_type || 'equity') as any,
            business_name: item.business_name || 'Business',
            investment_amount_min: parseFloat(item.investment_amount_min) || 0,
            investment_amount_max: parseFloat(item.investment_amount_max) || 0,
            expected_roi_percent: parseFloat(item.expected_roi_percent) || 0,
            business_stage: item.business_stage || 'growth',
            annual_revenue: parseFloat(item.annual_revenue) || 0,
            years_in_business: 0,
            is_featured: !!item.is_featured,
            investors_current: 0,
            target_investors: parseInt(item.target_investors) || 5,
            visibility_on_main_site: true,
          }));
          setOpportunities(mapped);
        }
        if (spData?.success && Array.isArray(spData.items)) {
          setSponsorships(spData.items.map((item: any) => ({
            id: item.business_id,
            business_name: item.business_name,
            business_slug: item.business_slug,
            business_logo: item.business_logo,
            sponsorship_title: item.sponsorship_title,
            sponsorship_type: item.sponsorship_type,
            sponsorship_tier: item.sponsorship_tier || 'custom',
            sponsorship_value: item.sponsorship_value || 'Contact Us',
            sponsorship_benefits: item.sponsorship_benefits || '',
            sponsorship_duration: item.sponsorship_duration || 'Annual',
            sponsorship_description: item.sponsorship_description || '',
            is_featured: !!item.is_featured,
          })));
        }
      })
      .catch((e) => console.error('Failed to fetch investments/sponsorships', e))
      .finally(() => setLoading(false));
  }, []);

  // Filter Opportunities
  const visibleOpportunities = opportunities
    .filter((opp) => {
      const matchesSearch = opp.opportunity_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            opp.business_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || opp.opportunity_type === filterType;
      const matchesStage = filterStage === 'all' || opp.business_stage === filterStage;
      
      let matchesROI = true;
      if (filterROI === 'high') matchesROI = opp.expected_roi_percent >= 25;
      else if (filterROI === 'medium') matchesROI = opp.expected_roi_percent >= 15 && opp.expected_roi_percent < 25;
      else if (filterROI === 'low') matchesROI = opp.expected_roi_percent < 15;

      return matchesSearch && matchesType && matchesStage && matchesROI;
    })
    .sort((a, b) => {
      if (sortBy === 'roi') return b.expected_roi_percent - a.expected_roi_percent;
      if (sortBy === 'investment') return a.investment_amount_min - b.investment_amount_min;
      return 0;
    });

  // Filter Sponsorships
  const visibleSponsorships = sponsorships.filter((sp) => {
    const matchesSearch = sp.sponsorship_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sp.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterType === 'all' || sp.sponsorship_tier === filterType;
    return matchesSearch && matchesTier;
  });

  const featuredOpportunities = opportunities.filter((o) => o.is_featured).slice(0, 2);
  const featuredSponsorships = sponsorships.filter((s) => s.is_featured).slice(0, 2);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      equity: '📊',
      partnership: '🤝',
      franchise: '🏢',
      joint_venture: '🔗',
      sponsorship: '🎯',
    };
    return icons[type] || '💰';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'startup': return 'bg-yellow-900 text-yellow-200';
      case 'growth': return 'bg-green-900 text-green-200';
      case 'established': return 'bg-blue-900 text-blue-200';
      case 'expansion': return 'bg-purple-900 text-purple-200';
      default: return 'bg-gray-800 text-gray-300';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-slate-300 text-slate-900';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'silver': return 'bg-gray-400 text-black';
      case 'bronze': return 'bg-amber-700 text-amber-100';
      default: return 'bg-emerald-950 text-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24 border-b border-gray-850">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Investment & Sponsorship Hub
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Find high-yield equity stakes, local partnerships, or promote your brand through premium sponsorships.
          </p>

          {/* Hub Tabs */}
          <div className="mt-8 inline-flex p-1.5 bg-gray-900 border border-gray-800 rounded-2xl gap-2">
            <button
              onClick={() => { setActiveTab('investments'); setSearchTerm(''); setFilterType('all'); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'investments' ? 'bg-gradient-to-r from-[#556B2F] to-[#D4AF37] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              💰 Investment Opportunities
            </button>
            <button
              onClick={() => { setActiveTab('sponsorships'); setSearchTerm(''); setFilterType('all'); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'sponsorships' ? 'bg-gradient-to-r from-[#556B2F] to-[#D4AF37] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              🤝 Sponsorship Packages
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin fa-3x text-[#D4AF37] mb-4"></i>
            <p className="text-gray-400">Loading listings...</p>
          </div>
        )}

        {!loading && activeTab === 'investments' && (
          <>
            {/* Featured Section */}
            {featuredOpportunities.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-[#D4AF37]">⭐</span> Featured Investments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredOpportunities.map((opp) => (
                    <div key={opp.id} className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-2xl p-[1px] hover:shadow-lg transition-all">
                      <div className="bg-gray-900 rounded-2xl p-8 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStageColor(opp.business_stage)}`}>
                              {opp.business_stage.toUpperCase()}
                            </span>
                            <span className="text-2xl font-bold text-[#D4AF37]">{opp.expected_roi_percent}% ROI</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-1">{opp.opportunity_title}</h3>
                          <p className="text-sm text-gray-500 mb-6">{opp.business_name}</p>
                        </div>
                        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 mb-6 flex justify-between">
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">MIN INVESTMENT</span>
                            <span className="font-bold text-lg">${opp.investment_amount_min.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 block mb-1">STAGE</span>
                            <span className="font-semibold text-gray-300 capitalize">{opp.business_stage}</span>
                          </div>
                        </div>
                        <Link href={`/p/${opp.id}`} className="w-full text-center py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-xl text-white font-bold hover:opacity-90 transition-opacity">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-850">
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="equity">Equity</option>
                <option value="partnership">Partnership</option>
                <option value="franchise">Franchise</option>
                <option value="joint_venture">Joint Venture</option>
              </select>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="all">All Stages</option>
                <option value="startup">Startup</option>
                <option value="growth">Growth</option>
                <option value="established">Established</option>
                <option value="expansion">Expansion</option>
              </select>
              <select
                value={filterROI}
                onChange={(e) => setFilterROI(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="all">All ROI</option>
                <option value="high">High (25%+)</option>
                <option value="medium">Medium (15-25%)</option>
                <option value="low">Low (&lt;15%)</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="roi">Sort by ROI</option>
                <option value="investment">Sort by Min Investment</option>
              </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleOpportunities.map((opp) => (
                <div key={opp.id} className="bg-gray-900 border border-gray-850 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-colors flex flex-col justify-between p-6">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-2xl">{getTypeIcon(opp.opportunity_type)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStageColor(opp.business_stage)}`}>
                        {opp.business_stage}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{opp.opportunity_title}</h4>
                    <p className="text-xs text-gray-500 mb-6">{opp.business_name}</p>
                  </div>
                  <div className="space-y-3 bg-gray-950 p-4 rounded-xl border border-gray-850 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Min Commit</span>
                      <span className="font-semibold text-white">${opp.investment_amount_min.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-800/40">
                      <span className="text-gray-500">Target ROI</span>
                      <span className="font-bold text-[#D4AF37]">{opp.expected_roi_percent}%</span>
                    </div>
                  </div>
                  <Link href={`/p/${opp.id}`} className="w-full text-center py-2.5 bg-gray-800 hover:bg-gray-750 text-white text-xs font-bold rounded-xl transition-all">
                    View Project
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && activeTab === 'sponsorships' && (
          <>
            {/* Featured Section */}
            {featuredSponsorships.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-[#D4AF37]">⭐</span> Featured Sponsorships
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredSponsorships.map((sp) => (
                    <div key={sp.id} className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-2xl p-[1px] hover:shadow-lg transition-all">
                      <div className="bg-gray-900 rounded-2xl p-8 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getTierColor(sp.sponsorship_tier)}`}>
                              {sp.sponsorship_tier.toUpperCase()} TIER
                            </span>
                            <span className="text-lg font-bold text-green-400">{sp.sponsorship_value}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-1">{sp.sponsorship_title}</h3>
                          <p className="text-sm text-gray-500 mb-6">{sp.business_name}</p>
                        </div>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-2">{sp.sponsorship_description}</p>
                        <Link href={`/p/${sp.business_slug}`} className="w-full text-center py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-xl text-white font-bold hover:opacity-90 transition-opacity">
                          Secure Sponsorship
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="mb-8 flex gap-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-850">
              <input
                type="text"
                placeholder="Search sponsorships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleSponsorships.map((sp) => (
                <div key={sp.id} className="bg-gray-900 border border-gray-850 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-colors flex flex-col justify-between p-6">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTierColor(sp.sponsorship_tier)}`}>
                        {sp.sponsorship_tier}
                      </span>
                      <span className="text-sm font-semibold text-green-400">{sp.sponsorship_value}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{sp.sponsorship_title}</h4>
                    <p className="text-xs text-gray-500 mb-6">{sp.business_name}</p>
                    <p className="text-xs text-gray-400 mb-6 line-clamp-3">{sp.sponsorship_description}</p>
                  </div>
                  <Link href={`/p/${sp.business_slug}`} className="w-full text-center py-2.5 bg-gray-800 hover:bg-gray-750 text-white text-xs font-bold rounded-xl transition-all">
                    Inquire details
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
