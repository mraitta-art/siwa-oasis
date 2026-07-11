'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuctionItem {
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  type_name: string;
  type_icon: string;
  auction_title: string;
  auction_type: string;
  starting_price: string;
  reserve_price: string | null;
  buy_now_price: string | null;
  auction_start: string;
  auction_end: string;
  auction_status: 'upcoming' | 'live' | 'ended' | 'sold' | 'cancelled';
  auction_description: string;
  auction_terms: string;
  auction_contact: string | null;
  is_featured: boolean;
}

export default function AuctionsPublicPage() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetch('/api/discovery/auctions')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setAuctions(data.items);
        }
      })
      .catch((err) => console.error('Failed to load auctions', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter auctions
  const filteredAuctions = auctions.filter((item) => {
    const matchesSearch = item.auction_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.auction_type === filterType;
    const matchesStatus = filterStatus === 'all' || item.auction_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white animate-pulse';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'ended':
        return 'bg-gray-700 text-gray-300';
      case 'sold':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getAuctionTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return '📦';
      case 'service': return '🛠️';
      case 'experience': return '⛺';
      case 'property': return '🏡';
      case 'license': return '📜';
      default: return '🔨';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24 border-b border-gray-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Live & Upcoming Auctions
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Bid on unique local assets, premium hotel nights, desert tours, and business licenses in Siwa Oasis.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filter Controls */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div className="flex flex-1 min-w-[280px] gap-3">
            <input
              type="text"
              placeholder="Search auctions or businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl focus:outline-none focus:border-[#D4AF37] text-sm text-white"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-gray-850 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Types</option>
              <option value="asset">Assets / Equipment</option>
              <option value="service">Services</option>
              <option value="experience">Experiences & Stays</option>
              <option value="property">Properties</option>
              <option value="license">Licenses & Permits</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-850 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Statuses</option>
              <option value="live">⚡ Live Now</option>
              <option value="upcoming">⏳ Upcoming</option>
              <option value="ended">⌛ Ended</option>
              <option value="sold">✓ Sold</option>
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin fa-3x text-[#D4AF37] mb-4"></i>
            <p className="text-gray-400">Loading auction listings...</p>
          </div>
        )}

        {/* Auctions Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAuctions.map((auc, index) => (
              <div 
                key={index} 
                className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all flex flex-col group"
              >
                {/* Header info */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm text-gray-500 font-medium">
                      {getAuctionTypeIcon(auc.auction_type)} {auc.auction_type.toUpperCase()}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${getStatusBadgeColor(auc.auction_status)}`}>
                      {auc.auction_status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-2">
                    {auc.auction_title}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    {auc.business_logo && (
                      <img src={auc.business_logo} alt={auc.business_name} className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span className="text-sm text-gray-400">{auc.business_name}</span>
                  </div>

                  <p className="text-sm text-gray-400 mb-6 line-clamp-3">
                    {auc.auction_description}
                  </p>

                  <div className="mt-auto space-y-3 bg-gray-950/80 p-4 rounded-xl border border-gray-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Starting Price</span>
                      <span className="font-semibold text-white">${parseFloat(auc.starting_price).toLocaleString()}</span>
                    </div>

                    {auc.buy_now_price && (
                      <div className="flex justify-between text-sm border-t border-gray-800/50 pt-2">
                        <span className="text-[#D4AF37]">Buy Now Price</span>
                        <span className="font-bold text-[#D4AF37]">${parseFloat(auc.buy_now_price).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                      <span>Ends: {auc.auction_end || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-900 border-t border-gray-800 flex gap-3">
                  <Link 
                    href={`/p/${auc.business_slug}`} 
                    className="flex-1 text-center py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    View Minisite
                  </Link>

                  {auc.auction_status === 'live' && (
                    <a 
                      href={auc.auction_contact ? `tel:${auc.auction_contact}` : `mailto:info@siwa.today?subject=Bid Interest: ${auc.auction_title}`}
                      className="flex-1 text-center py-2 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                      Place Bid / Contact
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredAuctions.length === 0 && (
          <div className="text-center py-16 bg-gray-900/20 border border-gray-850 rounded-2xl">
            <p className="text-gray-400">No active auctions found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
