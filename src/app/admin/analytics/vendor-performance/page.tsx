'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, DollarSign } from 'lucide-react';

interface VendorPerformance {
  vendor_id: string;
  vendor_name: string;
  business_type: string;
  requests_received: number;
  requests_responded: number;
  quotes_sent: number;
  bookings_completed: number;
  avg_response_time_hours: number;
  quote_win_rate: number;
  avg_quote_value: number;
  total_revenue_generated: number;
  rating: number;
  rank: number;
}

export default function VendorPerformanceAnalyticsPage() {
  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'rating' | 'bookings' | 'response_time'>('revenue');

  useEffect(() => {
    fetchVendorPerformance();
  }, [sortBy]);

  const fetchVendorPerformance = async () => {
    try {
      // Mock data - in production, aggregate from vendor_request_queue + journey_requests tables
      const mockData: VendorPerformance[] = [
        {
          vendor_id: 'vendor_001',
          vendor_name: 'Siwa Paradise Hotel',
          business_type: 'Accommodation',
          requests_received: 24,
          requests_responded: 22,
          quotes_sent: 18,
          bookings_completed: 12,
          avg_response_time_hours: 2.1,
          quote_win_rate: 67,
          avg_quote_value: 450,
          total_revenue_generated: 5400,
          rating: 4.8,
          rank: 1
        },
        {
          vendor_id: 'vendor_002',
          vendor_name: 'Dunes Photography Tours',
          business_type: 'Adventure',
          requests_received: 18,
          requests_responded: 16,
          quotes_sent: 14,
          bookings_completed: 9,
          avg_response_time_hours: 3.2,
          quote_win_rate: 64,
          avg_quote_value: 350,
          total_revenue_generated: 3150,
          rating: 4.6,
          rank: 2
        },
        {
          vendor_id: 'vendor_003',
          vendor_name: 'Cleopatra Restaurant',
          business_type: 'Dining',
          requests_received: 15,
          requests_responded: 12,
          quotes_sent: 10,
          bookings_completed: 7,
          avg_response_time_hours: 4.5,
          quote_win_rate: 70,
          avg_quote_value: 280,
          total_revenue_generated: 1960,
          rating: 4.4,
          rank: 3
        }
      ];

      let sorted = [...mockData];
      if (sortBy === 'revenue') {
        sorted.sort((a, b) => b.total_revenue_generated - a.total_revenue_generated);
      } else if (sortBy === 'rating') {
        sorted.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'bookings') {
        sorted.sort((a, b) => b.bookings_completed - a.bookings_completed);
      } else if (sortBy === 'response_time') {
        sorted.sort((a, b) => a.avg_response_time_hours - b.avg_response_time_hours);
      }

      setVendors(sorted);
    } catch (error) {
      console.error('Failed to fetch vendor performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRankBadge = (rank: number) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[rank - 1] || `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Vendor Performance Rankings</h1>
          <p className="text-gray-400">Track vendor engagement, response times, and revenue generation</p>
        </div>

        {/* Sort Options */}
        <div className="mb-8 flex gap-2">
          {[
            { key: 'revenue' as const, label: 'Revenue Generated' },
            { key: 'rating' as const, label: 'Rating' },
            { key: 'bookings' as const, label: 'Bookings' },
            { key: 'response_time' as const, label: 'Response Speed' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`px-4 py-2 rounded-lg transition ${
                sortBy === option.key
                  ? 'bg-[#556B2F] text-[#FFD700]'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Vendors Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading vendor data...</div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor, index) => (
              <div key={vendor.vendor_id} className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] hover:border-[#556B2F] transition">
                {/* Top Row: Rank, Name, Rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getRankBadge(vendor.rank)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{vendor.vendor_name}</h3>
                      <p className="text-sm text-gray-400">{vendor.business_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      <span className="text-2xl font-bold text-[#FFD700]">{vendor.rating.toFixed(1)}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-6 gap-4">
                  {/* Requests Received */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Requests</div>
                    <div className="text-2xl font-bold text-[#FFD700]">{vendor.requests_received}</div>
                    <div className="text-xs text-gray-500 mt-1">Received</div>
                  </div>

                  {/* Response Rate */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Responded</div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round((vendor.requests_responded / vendor.requests_received) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{vendor.requests_responded}/{vendor.requests_received}</div>
                  </div>

                  {/* Avg Response Time */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                      <Clock size={14} />
                      Response
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{vendor.avg_response_time_hours.toFixed(1)}h</div>
                    <div className="text-xs text-gray-500 mt-1">Average</div>
                  </div>

                  {/* Quote Win Rate */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Win Rate</div>
                    <div className={`text-2xl font-bold ${getStatusColor(vendor.quote_win_rate)}`}>
                      {vendor.quote_win_rate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Quote → Booking</div>
                  </div>

                  {/* Bookings Completed */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                      <Award size={14} />
                      Bookings
                    </div>
                    <div className="text-2xl font-bold text-green-400">{vendor.bookings_completed}</div>
                    <div className="text-xs text-gray-500 mt-1">Completed</div>
                  </div>

                  {/* Revenue Generated */}
                  <div className="bg-[#333333] p-4 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                      <DollarSign size={14} />
                      Revenue
                    </div>
                    <div className="text-2xl font-bold text-[#FFD700]">${vendor.total_revenue_generated}</div>
                    <div className="text-xs text-gray-500 mt-1">Generated</div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Response Rate</span>
                      <span className="text-gray-500">
                        {Math.round((vendor.requests_responded / vendor.requests_received) * 100)}%
                      </span>
                    </div>
                    <div className="bg-[#1a1a1a] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(vendor.requests_responded / vendor.requests_received) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Quote Win Rate</span>
                      <span className="text-gray-500">{vendor.quote_win_rate}%</span>
                    </div>
                    <div className="bg-[#1a1a1a] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${vendor.quote_win_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Tips */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-green-600">
            <h4 className="font-bold text-green-400 mb-2">🏆 Top Performer</h4>
            <p className="text-sm text-gray-300">{vendors[0]?.vendor_name} leads with highest revenue</p>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-blue-600">
            <h4 className="font-bold text-blue-400 mb-2">⚡ Fastest Responders</h4>
            <p className="text-sm text-gray-300">Vendors responding in under 2 hours get priority</p>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-[#FFD700]">
            <h4 className="font-bold text-[#FFD700] mb-2">💡 Win More</h4>
            <p className="text-sm text-gray-300">Higher win rates get featured in premium slots</p>
          </div>
        </div>
      </div>
    </div>
  );
}
