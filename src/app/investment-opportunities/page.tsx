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

export default function MainSiteInvestmentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);

  useEffect(() => {
    fetch('/api/approved/investments')
      .then(r => r.json())
      .then(j => {
        if (j?.success && Array.isArray(j.items)) {
          const mapped = j.items.map((item: any) => ({
            id: item.id,
            opportunity_title: item.title || '',
            opportunity_type: 'equity' as const,
            business_name: item.business_name || 'Business',
            investment_amount_min: 50000,
            investment_amount_max: 250000,
            expected_roi_percent: 20,
            business_stage: 'growth',
            annual_revenue: 500000,
            years_in_business: 5,
            is_featured: item.is_featured || false,
            investors_current: 0,
            target_investors: 5,
            visibility_on_main_site: true,
          }));
          setOpportunities(mapped);
        }
      })
      .catch(e => console.error('Failed to fetch investments', e));
  }, []);

  // Fallback mock data if no approved items
  const mockOpportunities: InvestmentOpportunity[] = [
    {
      id: '1',
      opportunity_title: 'Desert Tours Expansion',
      opportunity_type: 'equity',
      business_name: 'Desert Tours Co',
      investment_amount_min: 50000,
      investment_amount_max: 250000,
      expected_roi_percent: 25,
      business_stage: 'growth',
      annual_revenue: 500000,
      years_in_business: 5,
      is_featured: true,
      investors_current: 3,
      target_investors: 5,
      visibility_on_main_site: true,
    },
    {
      id: '2',
      opportunity_title: 'Siwa Palace Renovation',
      opportunity_type: 'partnership',
      business_name: 'Siwa Palace Hotel',
      investment_amount_min: 100000,
      investment_amount_max: 500000,
      expected_roi_percent: 20,
      business_stage: 'expansion',
      annual_revenue: 1200000,
      years_in_business: 8,
      is_featured: true,
      investors_current: 2,
      target_investors: 4,
      visibility_on_main_site: true,
    },
    {
      id: '3',
      opportunity_title: 'Restaurant Chain Franchise',
      opportunity_type: 'franchise',
      business_name: 'Restaurant Siwa',
      investment_amount_min: 30000,
      investment_amount_max: 80000,
      expected_roi_percent: 30,
      business_stage: 'expansion',
      annual_revenue: 350000,
      years_in_business: 3,
      is_featured: false,
      investors_current: 0,
      target_investors: 10,
      visibility_on_main_site: true,
    },
    {
      id: '4',
      opportunity_title: 'Photography Studio Network',
      opportunity_type: 'joint_venture',
      business_name: 'Siwa Photo Studio',
      investment_amount_min: 20000,
      investment_amount_max: 100000,
      expected_roi_percent: 22,
      business_stage: 'startup',
      annual_revenue: 80000,
      years_in_business: 1,
      is_featured: false,
      investors_current: 1,
      target_investors: 3,
      visibility_on_main_site: false,
    },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterROI, setFilterROI] = useState('all');
  const [sortBy, setSortBy] = useState('roi');

  // Use API opportunities if available, fallback to mock
  const displayOpportunities = opportunities.length > 0 ? opportunities : mockOpportunities;

  const visibleOpportunities = displayOpportunities
    .filter((opp) => opp.visibility_on_main_site)
    .filter((opp) => {
      if (filterType !== 'all' && opp.opportunity_type !== filterType) return false;
      if (filterStage !== 'all' && opp.business_stage !== filterStage) return false;
      if (filterROI === 'high' && opp.expected_roi_percent < 25) return false;
      if (filterROI === 'medium' && (opp.expected_roi_percent < 15 || opp.expected_roi_percent >= 25)) return false;
      if (filterROI === 'low' && opp.expected_roi_percent >= 15) return false;
      if (searchTerm && !opp.opportunity_title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'roi') return b.expected_roi_percent - a.expected_roi_percent;
      if (sortBy === 'investment') return a.investment_amount_min - b.investment_amount_min;
      if (sortBy === 'progress') return b.investors_current / b.target_investors - a.investors_current / a.target_investors;
      return 0;
    });

  const featuredOpportunities = visibleOpportunities.filter((o) => o.is_featured).slice(0, 2);

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
      case 'startup':
        return 'bg-yellow-900 text-yellow-200';
      case 'growth':
        return 'bg-green-900 text-green-200';
      case 'established':
        return 'bg-blue-900 text-blue-200';
      case 'expansion':
        return 'bg-purple-900 text-purple-200';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Investment Opportunities
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Invest in promising businesses and tourism ventures in Siwa Oasis
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Opportunities */}
        {featuredOpportunities.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-[#D4AF37]">⭐</span> Featured Investment Opportunities
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-gradient-to-br from-[#556B2F] to-[#D4AF37] rounded-lg p-1 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all"
                >
                  <div className="bg-gray-900 rounded-lg p-8 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl">{getTypeIcon(opp.opportunity_type)}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${getStageColor(
                              opp.business_stage
                            )}`}
                          >
                            {opp.business_stage}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{opp.opportunity_title}</h3>
                        <p className="text-sm text-gray-400">{opp.business_name}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#D4AF37]">{opp.expected_roi_percent}%</div>
                        <div className="text-xs text-gray-500">Expected ROI</div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded p-4 mb-4 flex-1">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500">Investment Range</div>
                          <div className="text-sm font-semibold text-white">
                            ${(opp.investment_amount_min / 1000).toFixed(0)}K -
                            ${(opp.investment_amount_max / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Business Stats</div>
                          <div className="text-sm font-semibold text-white">
                            {opp.years_in_business}yr • ${(opp.annual_revenue / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">Investors</span>
                          <span className="text-sm font-bold text-[#D4AF37]">
                            {opp.investors_current}/{opp.target_investors}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#556B2F] to-[#D4AF37]"
                            style={{ width: `${(opp.investors_current / opp.target_investors) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full px-4 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
                      View Opportunity →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2 lg:col-span-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
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
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
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
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All ROI</option>
              <option value="high">High (25%+)</option>
              <option value="medium">Medium (15-25%)</option>
              <option value="low">Low (&lt;15%)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="roi">Sort by ROI</option>
              <option value="investment">Sort by Min Investment</option>
              <option value="progress">Sort by Progress</option>
            </select>
          </div>

          <div className="text-gray-400 text-sm">
            Showing {visibleOpportunities.length} opportunity{visibleOpportunities.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* All Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#D4AF37] transition-colors group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getTypeIcon(opp.opportunity_type)}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${getStageColor(
                          opp.business_stage
                        )}`}
                      >
                        {opp.business_stage}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{opp.opportunity_title}</h3>
                    <p className="text-sm text-gray-400">{opp.business_name}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-gray-800 rounded p-3 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 text-xs">ROI</div>
                      <div className="text-lg font-bold text-[#D4AF37]">{opp.expected_roi_percent}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Min Investment</div>
                      <div className="text-lg font-bold text-green-400">
                        ${(opp.investment_amount_min / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-2 text-xs">
                      <span className="text-gray-500">Investors</span>
                      <span className="font-bold text-white">
                        {opp.investors_current}/{opp.target_investors}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#556B2F] to-[#D4AF37]"
                        style={{ width: `${(opp.investors_current / opp.target_investors) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  {opp.years_in_business} year{opp.years_in_business !== 1 ? 's' : ''} • ${(
                    opp.annual_revenue / 1000
                  ).toFixed(0)}K revenue
                </div>

                <button className="w-full px-4 py-2 bg-[#556B2F] rounded text-white font-semibold hover:opacity-90 transition-opacity group-hover:bg-[#D4AF37] group-hover:text-black">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {visibleOpportunities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">No opportunities found matching your filters</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Invest?</h2>
          <p className="text-gray-100 mb-6">
            Create your investor profile and start receiving personalized investment opportunities
          </p>
          <Link
            href="/investor-signup"
            className="inline-block px-8 py-3 bg-white rounded-lg text-[#556B2F] font-semibold hover:bg-gray-100 transition-colors"
          >
            Become an Investor →
          </Link>
        </div>
      </div>
    </div>
  );
}
