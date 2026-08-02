'use client';

import { useState, useEffect } from 'react';

interface BlogSubmission {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  section_name: string;
  vendor_name?: string;
  business_name?: string;
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  created_at: string;
  featured_image_url?: string;
}

export default function AdminBlogApprovalPage() {
  const [blogs, setBlogs] = useState<BlogSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'published' | 'rejected'>('pending_approval');
  const [selectedBlog, setSelectedBlog] = useState<BlogSubmission | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadBlogs();
  }, [filterStatus]);

  async function loadBlogs() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog-approval?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Load blogs error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function approveBlog(blogId: string) {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/admin/blog-approval/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', approval_notes: approvalNotes })
      });
      if (res.ok) {
        alert('✅ Blog published!');
        loadBlogs();
        setSelectedBlog(null);
        setApprovalNotes('');
      }
    } catch (err) {
      alert('Error approving blog');
    } finally {
      setActionInProgress(false);
    }
  }

  async function rejectBlog(blogId: string) {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/admin/blog-approval/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', approval_notes: approvalNotes || 'No specific reason provided' })
      });
      if (res.ok) {
        alert('Blog rejected');
        loadBlogs();
        setSelectedBlog(null);
        setApprovalNotes('');
      }
    } catch (err) {
      alert('Error rejecting blog');
    } finally {
      setActionInProgress(false);
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'pending_approval') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (status === 'published')        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (status === 'rejected')         return 'bg-rose-50 text-rose-600 border border-rose-200';
    return 'bg-slate-50 text-slate-500 border border-slate-200';
  };

  const statusLabel = (status: string) => {
    if (status === 'pending_approval') return '⏳ Pending';
    if (status === 'published')        return '✅ Published';
    if (status === 'rejected')         return '❌ Rejected';
    return status;
  };

  const filters: { key: typeof filterStatus; label: string }[] = [
    { key: 'pending_approval', label: '⏳ Pending' },
    { key: 'published',        label: '✅ Published' },
    { key: 'rejected',         label: '❌ Rejected' },
    { key: 'all',              label: '📋 All' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">

        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <a href="/admin" className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition mb-3 block">
            ← Control Center
          </a>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">📝 Blog Approval Queue</h1>
          <p className="text-slate-400 text-sm font-semibold">Review, approve or reject vendor blog submissions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Left — list */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                    filterStatus === f.key
                      ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-semibold">Loading blogs...</div>
            ) : blogs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 font-semibold">
                  {filterStatus === 'pending_approval' ? 'No blogs pending approval' : 'No blogs found'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {blogs.map(blog => (
                  <button
                    key={blog.id}
                    onClick={() => setSelectedBlog(blog)}
                    className={`text-left p-4 rounded-2xl border transition ${
                      selectedBlog?.id === blog.id
                        ? 'border-[#D4AF37] bg-amber-50/40'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-extrabold text-slate-800 text-sm mb-1.5">{blog.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-semibold mb-2">
                      <span>{blog.section_name}</span>
                      {blog.business_name && <><span>•</span><span>{blog.business_name}</span></>}
                      <span>•</span>
                      <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusBadge(blog.status)}`}>
                        {statusLabel(blog.status)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">{blog.excerpt}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — preview / action panel */}
          {selectedBlog ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-6 h-fit">
              <div className="font-extrabold text-slate-900 text-base mb-1">{selectedBlog.title}</div>
              <div className="text-xs text-slate-400 font-semibold mb-4">
                {selectedBlog.business_name} • {selectedBlog.section_name} • {new Date(selectedBlog.created_at).toLocaleDateString()}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-64 overflow-y-auto mb-4 text-sm text-slate-600 leading-relaxed">
                {selectedBlog.content}
              </div>

              {selectedBlog.status === 'pending_approval' && (
                <>
                  <textarea
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 resize-none min-h-[80px] mb-4 font-inherit"
                    placeholder="Add approval notes (optional)"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveBlog(selectedBlog.id)}
                      disabled={actionInProgress}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition disabled:opacity-50 text-sm"
                    >
                      ✅ Publish
                    </button>
                    <button
                      onClick={() => rejectBlog(selectedBlog.id)}
                      disabled={actionInProgress}
                      className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition disabled:opacity-50 text-sm"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </>
              )}

              {selectedBlog.status === 'published' && (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                  ✅ This blog is published and live
                </div>
              )}

              {selectedBlog.status === 'rejected' && (
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                  ❌ This blog was rejected
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-fit min-h-[200px]">
              <div className="text-3xl mb-2">👈</div>
              <p className="text-slate-400 font-semibold text-sm">Select a blog to preview &amp; take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
