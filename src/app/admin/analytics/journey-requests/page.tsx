'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Download, Calendar } from 'lucide-react';

interface DailyMetric {
  date: string;
  total_requests: number;
  auto_approved: number;
  admin_approved: number;
  rejected: number;
  bookings_completed: number;
  total_revenue: number;
}

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      // Mock data - in production, query from journey_request_analytics table
      const mockData: DailyMetric[] = [
        { date: '2026-01-10', total_requests: 5, auto_approved: 4, admin_approved: 0, rejected: 1, bookings_completed: 2, total_revenue: 600 },
        { date: '2026-01-11', total_requests: 8, auto_approved: 6, admin_approved: 1, rejected: 1, bookings_completed: 3, total_revenue: 950 },
        { date: '2026-01-12', total_requests: 12, auto_approved: 9, admin_approved: 2, rejected: 1, bookings_completed: 5, total_revenue: 1400 },
        { date: '2026-01-13', total_requests: 6, auto_approved: 5, admin_approved: 1, rejected: 0, bookings_completed: 2, total_revenue: 700 },
        { date: '2026-01-14', total_requests: 10, auto_approved: 7, admin_approved: 2, rejected: 1, bookings_completed: 4, total_revenue: 1200 },
        { date: '2026-01-15', total_requests: 15, auto_approved: 11, admin_approved: 3, rejected: 1, bookings_completed: 6, total_revenue: 1800 },
        { date: '2026-01-16', total_requests: 18, auto_approved: 13, admin_approved: 4, rejected: 1, bookings_completed: 8, total_revenue: 2100 }
      ];

      setMetrics(mockData);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const stats = {
    totalRequests: metrics.reduce((sum, m) => sum + m.total_requests, 0),
    totalApproved: metrics.reduce((sum, m) => sum + m.auto_approved + m.admin_approved, 0),
    totalRejected: metrics.reduce((sum, m) => sum + m.rejected, 0),
    totalBookings: metrics.reduce((sum, m) => sum + m.bookings_completed, 0),
    totalRevenue: metrics.reduce((sum, m) => sum + m.total_revenue, 0),
    conversionRate: metrics.length > 0 
      ? Math.round((metrics.reduce((sum, m) => sum + m.bookings_completed, 0) / metrics.reduce((sum, m) => sum + m.total_requests, 0)) * 100)
      : 0,
    avgRequestValue: metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.total_revenue, 0) / metrics.reduce((sum, m) => sum + m.total_requests, 0))
      : 0
  };

  const approvalBreakdown = [
    { name: 'Auto-Approved', value: metrics.reduce((sum, m) => sum + m.auto_approved, 0), color: '#22C55E' },
    { name: 'Admin-Approved', value: metrics.reduce((sum, m) => sum + m.admin_approved, 0), color: '#3B82F6' },
    { name: 'Rejected', value: metrics.reduce((sum, m) => sum + m.rejected, 0), color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Request Analytics</h1>
            <p className="text-gray-400">Real-time metrics on journey requests, approvals, and revenue</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#556B2F] text-[#FFD700] rounded-lg hover:bg-[#6B8234] transition">
            <Download size={20} />
            Export Report
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-8 flex gap-2">
          {['7days', '30days', '90days', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg transition ${
                dateRange === range
                  ? 'bg-[#556B2F] text-[#FFD700]'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : range === '90days' ? 'Last 90 Days' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#556B2F]">
            <div className="text-gray-400 text-sm mb-2">Total Requests</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.totalRequests}</div>
            <div className="text-xs text-gray-500 mt-2">+12% from last period</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-green-700">
            <div className="text-gray-400 text-sm mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-400">{stats.totalApproved}</div>
            <div className="text-xs text-gray-500 mt-2">{Math.round((stats.totalApproved / stats.totalRequests) * 100)}% approval rate</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#FFD700]">
            <div className="text-gray-400 text-sm mb-2">Bookings</div>
            <div className="text-3xl font-bold text-[#FFD700]">{stats.totalBookings}</div>
            <div className="text-xs text-gray-500 mt-2">{stats.conversionRate}% conversion</div>
          </div>
          <div className="bg-[#2a2a2a] p-6 rounded-lg border border-yellow-700">
            <div className="text-gray-400 text-sm mb-2">Revenue</div>
            <div className="text-3xl font-bold text-yellow-400">${stats.totalRevenue}</div>
            <div className="text-xs text-gray-500 mt-2">Avg ${stats.avgRequestValue}/request</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Daily Requests Trend */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Daily Requests Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #556B2F', borderRadius: '8px' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total_requests" stroke="#FFD700" strokeWidth={2} name="Total Requests" />
                <Line type="monotone" dataKey="auto_approved" stroke="#22C55E" strokeWidth={2} name="Auto-Approved" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Approval Breakdown */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Approval Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={approvalBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {approvalBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #556B2F' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Conversion */}
        <div className="grid grid-cols-2 gap-6">
          {/* Daily Revenue */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #556B2F' }} />
                <Bar dataKey="total_revenue" fill="#FFD700" name="Revenue ($)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings Performance */}
          <div className="bg-[#2a2a2a] p-6 rounded-lg">
            <h3 className="text-lg font-bold text-[#FFD700] mb-4">Bookings Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #556B2F' }} />
                <Bar dataKey="total_requests" fill="#556B2F" name="Requests" radius={[8, 8, 0, 0]} />
                <Bar dataKey="bookings_completed" fill="#22C55E" name="Bookings" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-[#FFD700]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-[#FFD700]" size={20} />
              <h4 className="font-bold text-[#FFD700]">Peak Day</h4>
            </div>
            <p className="text-2xl font-bold text-white">Jan 16</p>
            <p className="text-sm text-gray-400">18 requests, $2,100 revenue</p>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-green-600">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-400" size={20} />
              <h4 className="font-bold text-green-400">Best Rate</h4>
            </div>
            <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
            <p className="text-sm text-gray-400">Request to booking conversion</p>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-lg border-l-4 border-yellow-600">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-yellow-400" size={20} />
              <h4 className="font-bold text-yellow-400">Avg Value</h4>
            </div>
            <p className="text-2xl font-bold text-white">${stats.avgRequestValue}</p>
            <p className="text-sm text-gray-400">Per approved request</p>
          </div>
        </div>
      </div>
    </div>
  );
}
