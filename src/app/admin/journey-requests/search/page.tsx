'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle } from 'lucide-react';

interface Request {
  id: string;
  visitor_name: string;
  title: string;
  status: string;
  vibe: string;
  duration_days: number;
  budget_usd_max: number;
  interested_vendors: number;
  created_at: string;
}

export default function AdminRequestSearchPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filtered, setFiltered] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVibe, setFilterVibe] = useState('all');
  const [filterBudget, setFilterBudget] = useState('all');
  const [filterDuration, setFilterDuration] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterVibe, filterBudget, filterDuration, requests]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/journey-requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...requests];

    // Search
    if (searchTerm) {
      result = result.filter(r =>
        r.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }

    // Vibe
    if (filterVibe !== 'all') {
      result = result.filter(r => r.vibe === filterVibe);
    }

    // Budget
    if (filterBudget !== 'all') {
      if (filterBudget === 'under_500') result = result.filter(r => r.budget_usd_max <= 500);
      if (filterBudget === '500_1000') result = result.filter(r => r.budget_usd_max > 500 && r.budget_usd_max <= 1000);
      if (filterBudget === 'over_1000') result = result.filter(r => r.budget_usd_max > 1000);
    }

    // Duration
    if (filterDuration !== 'all') {
      if (filterDuration === 'short') result = result.filter(r => r.duration_days <= 3);
      if (filterDuration === 'medium') result = result.filter(r => r.duration_days > 3 && r.duration_days <= 7);
      if (filterDuration === 'long') result = result.filter(r => r.duration_days > 7);
    }

    setFiltered(result);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(filtered.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkApprove = async () => {
    // Bulk approve selected requests
    for (const id of selectedRequests) {
      await fetch(`/api/admin/journey-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approval_decision: 'admin_approved' })
      });
    }
    setSelectedRequests(new Set());
    fetchRequests();
  };

  const handleExport = () => {
    // Export filtered results as CSV
    const headers = ['ID', 'Visitor', 'Title', 'Status', 'Vibe', 'Duration', 'Budget', 'Vendors', 'Date'];
    const rows = filtered.map(r => [
      r.id, r.visitor_name, r.title, r.status, r.vibe, `${r.duration_days}d`, `$${r.budget_usd_max}`, r.interested_vendors, r.created_at
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Request Search & Management</h1>
          <p className="text-gray-400">Advanced filters, bulk operations, and export capabilities</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#556B2F] rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-[#556B2F] text-[#FFD700] rounded-lg hover:bg-[#6B8234] transition">
            <Download size={20} />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#556B2F] rounded px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="vendor_quoted">Quoted</option>
              <option value="booked">Booked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Vibe</label>
            <select
              value={filterVibe}
              onChange={(e) => setFilterVibe(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#556B2F] rounded px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="all">All Vibes</option>
              <option value="adventure">Adventure</option>
              <option value="wellness">Wellness</option>
              <option value="culinary">Culinary</option>
              <option value="cultural">Cultural</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Budget</label>
            <select
              value={filterBudget}
              onChange={(e) => setFilterBudget(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#556B2F] rounded px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="all">All Budgets</option>
              <option value="under_500">Under $500</option>
              <option value="500_1000">$500 - $1000</option>
              <option value="over_1000">Over $1000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Duration</label>
            <select
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
              className="w-full bg-[#2a2a2a] border border-[#556B2F] rounded px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="all">All Durations</option>
              <option value="short">1-3 Days</option>
              <option value="medium">4-7 Days</option>
              <option value="long">8+ Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Results</label>
            <div className="bg-[#2a2a2a] border border-[#556B2F] rounded px-3 py-2 text-[#FFD700] font-bold">
              {filtered.length}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.size > 0 && (
          <div className="mb-8 bg-[#556B2F] text-white p-4 rounded-lg flex justify-between items-center">
            <span>{selectedRequests.size} request(s) selected</span>
            <div className="space-x-2">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded transition"
              >
                Approve All
              </button>
              <button
                onClick={() => setSelectedRequests(new Set())}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#556B2F]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === filtered.length && filtered.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">Request</th>
                  <th className="px-6 py-3 text-left">Visitor</th>
                  <th className="px-6 py-3 text-center">Details</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Interest</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-[#333333] transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={() => toggleSelect(request.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-white">{request.title}</div>
                      <div className="text-sm text-gray-400">{request.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-3">{request.visitor_name}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="space-y-1">
                        <div className="text-sm">{request.duration_days}d</div>
                        <div className="text-xs text-gray-400">
                          <span className={`inline-block px-2 py-1 rounded ${
                            request.vibe === 'adventure' ? 'bg-orange-900 text-orange-200' :
                            request.vibe === 'wellness' ? 'bg-green-900 text-green-200' :
                            'bg-purple-900 text-purple-200'
                          }`}>
                            {request.vibe}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        request.status === 'approved' ? 'bg-green-900 text-green-200' :
                        request.status === 'under_review' ? 'bg-yellow-900 text-yellow-200' :
                        request.status === 'vendor_quoted' ? 'bg-blue-900 text-blue-200' :
                        'bg-gray-700 text-gray-200'
                      }`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-[#FFD700] font-bold">{request.interested_vendors}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-gray-400 hover:text-[#FFD700] transition">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 bg-[#2a2a2a] rounded-lg text-gray-400">
            No requests found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}
