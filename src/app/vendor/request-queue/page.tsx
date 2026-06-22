'use client';

import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';

interface QueueItem {
  id: string;
  journey_request_id: string;
  vendor_id: string;
  business_id: string;
  match_score: number;
  reason_for_match: string;
  vendor_status: string;
  opened_by_vendor: boolean;
  priority_position: number;
  vendor_proposed_price?: number;
  request: {
    title: string;
    duration_days: number;
    budget_usd_max: number;
    requested_items: string[];
  };
  created_at: Date;
}

export default function VendorRequestQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [selectedRequest, setSelectedRequest] = useState<QueueItem | null>(null);

  // Mock vendor ID - in production, get from auth
  const vendorId = 'vendor_001';

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    try {
      const query = `?vendor_id=${vendorId}` + (filter !== 'all' ? `&status=${filter}` : '');
      const response = await fetch(`/api/vendor/request-queue${query}`);
      const data = await response.json();
      setQueue(data.queue || []);
      if (data.queue?.length > 0) {
        setSelectedRequest(data.queue[0]);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-900 text-blue-200';
      case 'viewed':
        return 'bg-gray-700 text-gray-200';
      case 'interested':
        return 'bg-green-900 text-green-200';
      case 'declined':
        return 'bg-red-900 text-red-200';
      case 'quoted':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const stats = {
    total: queue.length,
    new: queue.filter(q => q.vendor_status === 'new').length,
    interested: queue.filter(q => q.vendor_status === 'interested').length,
    quoted: queue.filter(q => q.vendor_status === 'quoted').length,
    avgScore: queue.length > 0 ? Math.round(queue.reduce((sum, q) => sum + q.match_score, 0) / queue.length) : 0
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Your Request Queue</h1>
          <p className="text-gray-400">See journey requests from visitors that match your business. Respond to opportunities.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Total Requests</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.total}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-blue-700">
            <div className="text-gray-400 text-sm mb-2">New Requests</div>
            <div className="text-3xl font-bold text-blue-400">{stats.new}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-green-700">
            <div className="text-gray-400 text-sm mb-2">Interested</div>
            <div className="text-3xl font-bold text-green-400">{stats.interested}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-yellow-700">
            <div className="text-gray-400 text-sm mb-2">Quotes Sent</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.quoted}</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#FFD700]">
            <div className="text-gray-400 text-sm mb-2">Avg Match Score</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.avgScore}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'new', 'viewed', 'interested', 'quoted'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                filter === status
                  ? 'bg-[#556B2F] text-[#FFD700]'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Content: Queue List + Details */}
        <div className="grid grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="col-span-1">
            <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="bg-[#556B2F] px-6 py-4">
                <h3 className="text-lg font-bold text-white">Requests for You</h3>
              </div>
              {loading ? (
                <div className="p-6 text-center text-gray-400">Loading...</div>
              ) : queue.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No matching requests</div>
              ) : (
                <div className="divide-y divide-[#3a3a3a] max-h-[600px] overflow-y-auto">
                  {queue.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedRequest(item)}
                      className={`w-full text-left p-4 transition ${
                        selectedRequest?.id === item.id
                          ? 'bg-[#556B2F]'
                          : 'hover:bg-[#333333]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-white line-clamp-2">{item.request.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{item.request.duration_days}d • ${item.request.budget_usd_max}</div>
                        </div>
                        <div className="flex items-center gap-1 text-[#FFD700] font-bold text-sm whitespace-nowrap">
                          <Star size={14} fill="currentColor" />
                          {item.match_score}%
                        </div>
                      </div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.vendor_status)}`}>
                        {item.vendor_status.charAt(0).toUpperCase() + item.vendor_status.slice(1)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="col-span-2">
            {selectedRequest ? (
              <div className="bg-[#2a2a2a] rounded-lg p-6">
                {/* Match Score */}
                <div className="mb-6 p-4 bg-[#3a3a3a] rounded-lg border-l-4 border-[#FFD700]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-gray-400">Match Score</div>
                    <div className="text-3xl font-bold text-[#FFD700]">{selectedRequest.match_score}%</div>
                  </div>
                  <p className="text-sm text-gray-300">{selectedRequest.reason_for_match}</p>
                </div>

                {/* Request Details */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">{selectedRequest.request.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Duration</div>
                      <div className="text-2xl font-bold text-[#FFD700]">{selectedRequest.request.duration_days} days</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Budget</div>
                      <div className="text-2xl font-bold text-[#FFD700]">${selectedRequest.request.budget_usd_max}</div>
                    </div>
                  </div>

                  {/* Requested Items */}
                  <div className="mb-4">
                    <div className="text-gray-400 text-sm mb-2">They Want</div>
                    <div className="space-y-2">
                      {selectedRequest.request.requested_items.map((item, idx) => (
                        <div key={idx} className="bg-[#333333] px-3 py-2 rounded text-sm text-gray-300">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="bg-[#333333] rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Your Status</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRequest.vendor_status)}`}>
                        {selectedRequest.vendor_status.toUpperCase()}
                      </span>
                    </div>
                    {selectedRequest.vendor_proposed_price && (
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Your Quote</div>
                        <div className="text-2xl font-bold text-[#FFD700]">${selectedRequest.vendor_proposed_price}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {selectedRequest.vendor_status === 'new' && (
                    <>
                      <button className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Express Interest
                      </button>
                      <button className="w-full bg-[#556B2F] hover:bg-[#6B8234] text-white py-3 rounded-lg font-bold transition">
                        Send Quote
                      </button>
                    </>
                  )}
                  {selectedRequest.vendor_status === 'interested' && (
                    <button className="w-full bg-[#556B2F] hover:bg-[#6B8234] text-white py-3 rounded-lg font-bold transition">
                      Send Quote
                    </button>
                  )}
                  {selectedRequest.vendor_status === 'quoted' && (
                    <div className="p-4 bg-green-900 text-green-200 rounded-lg text-center">
                      ✓ Quote sent - waiting for visitor response
                    </div>
                  )}
                  <button className="w-full text-gray-400 py-2 border border-gray-600 rounded-lg hover:text-white transition">
                    View Full Request Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#2a2a2a] rounded-lg p-12 text-center text-gray-400">
                Select a request to view details
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border-l-4 border-[#FFD700]">
            <h3 className="text-lg font-bold text-[#FFD700] mb-3">Quick Tips</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✓ Higher match scores = better fit for your business</li>
              <li>✓ Respond quickly to new requests (first 2 hours)</li>
              <li>✓ Send competitive quotes to win journeys</li>
              <li>✓ Express interest to increase visibility</li>
            </ul>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-green-400 mb-3">Your Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm mb-1">Response Rate</div>
                <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '85%' }}></div>
                </div>
                <div className="text-sm text-green-400 mt-1">85% - Above average!</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Conversion Rate</div>
                <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: '62%' }}></div>
                </div>
                <div className="text-sm text-yellow-400 mt-1">62% - Keep improving</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
