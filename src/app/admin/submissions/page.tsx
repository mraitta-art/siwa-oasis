'use client';

import React from 'react';

export default function AdminSubmissionsPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [approved, setApproved] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'pending' | 'approved'>('pending');

  React.useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      const j = await res.json();
      if (j?.success) setItems(j.submissions || []);
      
      // Fetch approved items from all types
      const types = ['offers', 'packages', 'investments', 'discounts'];
      let allApproved: any[] = [];
      for (const type of types) {
        try {
          const res = await fetch(`/api/approved/${type}`);
          const j = await res.json();
          if (j?.success && Array.isArray(j.items)) {
            allApproved = [...allApproved, ...j.items.map((it: any) => ({ ...it, type }))];
          }
        } catch (e) { console.error(e); }
      }
      setApproved(allApproved);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function act(id: string, action: 'approve' | 'reject') {
    const admin = window.prompt('Admin name for audit', 'admin');
    if (!admin) return;
    const body: any = { action, admin };
    if (action === 'reject') {
      const reason = window.prompt('Reason for rejection');
      body.reason = reason || '';
    }
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j?.success) {
        alert('Done');
        fetchList();
      } else alert('Action failed');
    } catch (e) { console.error(e); alert('Action failed'); }
  }

  async function toggleFeatured(id: string, type: string, isFeatured: boolean) {
    try {
      const res = await fetch(`/api/approved/${type}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_featured: !isFeatured }) });
      const j = await res.json();
      if (j?.success) {
        alert('Updated');
        fetchList();
      } else alert('Failed to update');
    } catch (e) { console.error(e); alert('Failed'); }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Submissions & Approvals</h1>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded ${activeTab === 'pending' ? 'bg-blue-700' : 'bg-gray-700'}`}>Pending ({items.length})</button>
        <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 rounded ${activeTab === 'approved' ? 'bg-blue-700' : 'bg-gray-700'}`}>Approved ({approved.length})</button>
      </div>

      {loading && <div>Loading...</div>}

      {activeTab === 'pending' && (
        <div className="space-y-3">
          {items.filter(it => it.status !== 'approved').map(it => (
            <div key={it.id} className="p-4 border rounded bg-white/5 flex gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg">{it.title} <span className="text-sm text-gray-400">({it.type})</span></div>
                    <div className="text-sm text-gray-300">{it.brief}</div>
                    <div className="text-xs text-gray-500 mt-1">Business: {it.business_name || 'Anonymous'}</div>
                  </div>
                  <div className="text-xs text-gray-400">{it.status}</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(it.images||[]).map((u:string,i:number)=> (
                    <img key={i} src={u} className="w-full h-20 object-cover rounded" />
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-200">{it.description}</div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => act(it.id, 'approve')} className="px-3 py-1 bg-green-700 rounded text-white">Approve</button>
                <button onClick={() => act(it.id, 'reject')} className="px-3 py-1 bg-red-700 rounded text-white">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="space-y-3">
          {approved.map(it => (
            <div key={it.id} className="p-4 border rounded bg-white/5 flex gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg">{it.title} <span className="text-sm text-gray-400">({it.type})</span></div>
                    <div className="text-sm text-gray-300">{it.brief}</div>
                    <div className="text-xs text-gray-500 mt-1">Business: {it.business_name || 'Anonymous'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-400">Approved</div>
                    <label className="text-xs flex items-center gap-1">
                      <input type="checkbox" checked={it.is_featured || false} onChange={() => toggleFeatured(it.id, it.type, it.is_featured)} />
                      Featured
                    </label>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(it.images||[]).map((u:string,i:number)=> (
                    <img key={i} src={u} className="w-full h-20 object-cover rounded" />
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-200">{it.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
