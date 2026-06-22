'use client';

import { useState, useEffect } from 'react';
import { Edit, Save, X, AlertCircle } from 'lucide-react';

interface JourneyRequest {
  id: string;
  visitor_name: string;
  visitor_email: string;
  title: string;
  description: string;
  duration_days: number;
  budget_usd_max: number;
  vibe: string;
  pace: string;
  status: string;
  interested_vendors: number;
  created_at: string;
}

export default function VisitorTrackRequestPage() {
  const [request, setRequest] = useState<JourneyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [error, setError] = useState('');

  const requestId = 'req_001'; // In production, get from URL params

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/visitor/journey-requests/${requestId}`);
      const data = await response.json();
      setRequest(data.request);
      setEditData(data.request);
    } catch (err) {
      setError('Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/visitor/journey-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        setRequest(editData);
        setEditing(false);
      }
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const canEdit = request && ['submitted', 'under_review'].includes(request.status);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white py-8">
      <div className="max-w-3xl mx-auto px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg flex gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : request ? (
          <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-bold text-[#FFD700] mb-2">{request.title}</h1>
                <p className="text-gray-400">Request ID: {request.id}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#556B2F] text-[#FFD700] rounded-lg hover:bg-[#6B8234] transition"
                >
                  <Edit size={20} />
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {/* Status Card */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg mb-8">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Status</div>
                  <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                    request.status === 'approved' ? 'bg-green-900 text-green-200' :
                    request.status === 'under_review' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-gray-700 text-gray-200'
                  }`}>
                    {request.status.replace(/_/g, ' ').toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Vendor Interest</div>
                  <div className="text-2xl font-bold text-[#FFD700]">{request.interested_vendors}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Submitted</div>
                  <div className="text-sm text-gray-300">{new Date(request.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-[#FFD700] mb-6">Journey Details</h3>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={4}
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Duration (days)</label>
                      <input
                        type="number"
                        value={editData.duration_days}
                        onChange={(e) => setEditData({ ...editData, duration_days: parseInt(e.target.value) })}
                        className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Budget (USD)</label>
                      <input
                        type="number"
                        value={editData.budget_usd_max}
                        onChange={(e) => setEditData({ ...editData, budget_usd_max: parseInt(e.target.value) })}
                        className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Vibe</label>
                      <select
                        value={editData.vibe}
                        onChange={(e) => setEditData({ ...editData, vibe: e.target.value })}
                        className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                      >
                        <option value="adventure">Adventure</option>
                        <option value="wellness">Wellness</option>
                        <option value="culinary">Culinary</option>
                        <option value="cultural">Cultural</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold transition"
                    >
                      <Save size={20} />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-bold transition"
                    >
                      <X size={20} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Description</div>
                    <p className="text-white">{request.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#333333] p-4 rounded-lg">
                      <div className="text-gray-400 text-xs mb-1">Duration</div>
                      <div className="text-2xl font-bold text-[#FFD700]">{request.duration_days} days</div>
                    </div>
                    <div className="bg-[#333333] p-4 rounded-lg">
                      <div className="text-gray-400 text-xs mb-1">Budget</div>
                      <div className="text-2xl font-bold text-[#FFD700]">${request.budget_usd_max}</div>
                    </div>
                    <div className="bg-[#333333] p-4 rounded-lg">
                      <div className="text-gray-400 text-xs mb-1">Vibe</div>
                      <div className="text-2xl font-bold text-[#FFD700]">{request.vibe}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vendor Quotes */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#FFD700] mb-4">Vendor Responses</h3>

              {request.interested_vendors > 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#333333] p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">Vendor {i}</div>
                          <div className="text-sm text-gray-400">Business Name</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#FFD700]">$XXX</div>
                          <div className="text-xs text-gray-500">Quote</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">Custom proposal from vendor...</p>
                      <button className="px-4 py-2 bg-[#556B2F] text-[#FFD700] rounded hover:bg-[#6B8234] transition text-sm font-bold">
                        View Full Quote
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No vendor responses yet. We're matching your request to vendors...
                </div>
              )}
            </div>

            {/* Edit Notice */}
            {!canEdit && (
              <div className="mt-8 p-4 bg-[#333333] text-gray-400 rounded-lg text-center">
                This request has been {request.status.replace(/_/g, ' ')} and can no longer be edited.
                <br />
                <span className="text-[#FFD700]">Create a new request if you need different options.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">Request not found</div>
        )}
      </div>
    </div>
  );
}
