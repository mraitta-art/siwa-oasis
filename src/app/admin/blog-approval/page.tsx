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
        body: JSON.stringify({
          status: 'published',
          approval_notes: approvalNotes
        })
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
        body: JSON.stringify({
          status: 'rejected',
          approval_notes: approvalNotes || 'No specific reason provided'
        })
      });

      if (res.ok) {
        alert('❌ Blog rejected');
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

  const S = {
    container: {
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      padding: '2rem'
    },
    header: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
      color: '#D4AF37'
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 350px',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    listContent: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '2rem'
    },
    filterButtons: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      flexWrap: 'wrap' as const
    },
    filterButton: {
      padding: '0.5rem 1rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#aaa',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '0.9rem'
    },
    filterButtonActive: {
      background: '#556B2F',
      borderColor: '#D4AF37',
      color: '#D4AF37'
    },
    blogsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    blogCard: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    blogCardHover: {
      borderColor: '#D4AF37',
      background: '#2a2a2a'
    },
    blogTitle: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#D4AF37'
    },
    blogMeta: {
      display: 'flex',
      gap: '1rem',
      fontSize: '0.85rem',
      color: '#aaa',
      marginBottom: '0.5rem'
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    },
    statusPending: {
      background: '#fbbf24',
      color: '#1a1a1a'
    },
    statusPublished: {
      background: '#10b981',
      color: '#fff'
    },
    statusRejected: {
      background: '#ef4444',
      color: '#fff'
    },
    preview: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '2rem',
      position: 'sticky' as const,
      top: '2rem',
      height: 'fit-content'
    },
    previewTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#D4AF37'
    },
    previewContent: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
      marginBottom: '1rem',
      lineHeight: '1.6',
      fontSize: '0.9rem',
      color: '#ddd'
    },
    notesField: {
      width: '100%',
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '0.85rem',
      minHeight: '80px',
      marginBottom: '1rem',
      fontFamily: 'inherit'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    actionButton: {
      flex: 1,
      padding: '0.5rem',
      borderRadius: '4px',
      border: 'none',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    approveButton: {
      background: '#10b981',
      color: '#fff'
    },
    rejectButton: {
      background: '#ef4444',
      color: '#fff'
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>📝 Blog Approval Queue</div>

      <div style={S.mainContent}>
        <div style={S.listContent}>
          <div style={S.filterButtons}>
            {(['pending_approval', 'published', 'rejected', 'all'] as const).map(status => (
              <button
                key={status}
                style={{
                  ...S.filterButton,
                  ...(filterStatus === status ? S.filterButtonActive : {})
                }}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'pending_approval' && '⏳ Pending'}
                {status === 'published' && '✅ Published'}
                {status === 'rejected' && '❌ Rejected'}
                {status === 'all' && '📋 All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: '#aaa' }}>Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div style={{ color: '#aaa' }}>
              {filterStatus === 'pending_approval' ? 'No blogs pending approval' : 'No blogs found'}
            </div>
          ) : (
            <div style={S.blogsList}>
              {blogs.map(blog => (
                <div
                  key={blog.id}
                  style={{
                    ...S.blogCard,
                    ...(selectedBlog?.id === blog.id ? S.blogCardHover : {})
                  }}
                  onClick={() => setSelectedBlog(blog)}
                >
                  <div style={S.blogTitle}>{blog.title}</div>
                  <div style={S.blogMeta}>
                    <span>{blog.section_name}</span>
                    <span>{blog.business_name}</span>
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    <span
                      style={{
                        ...S.badge,
                        ...(blog.status === 'pending_approval' && S.statusPending),
                        ...(blog.status === 'published' && S.statusPublished),
                        ...(blog.status === 'rejected' && S.statusRejected)
                      }}
                    >
                      {blog.status === 'pending_approval' && '⏳ Pending'}
                      {blog.status === 'published' && '✅ Published'}
                      {blog.status === 'rejected' && '❌ Rejected'}
                    </span>
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{blog.excerpt}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedBlog && (
          <div style={S.preview}>
            <div style={S.previewTitle}>{selectedBlog.title}</div>
            <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div>{selectedBlog.business_name} • {selectedBlog.section_name}</div>
              <div>{new Date(selectedBlog.created_at).toLocaleDateString()}</div>
            </div>
            <div style={S.previewContent}>{selectedBlog.content}</div>

            {selectedBlog.status === 'pending_approval' && (
              <>
                <textarea
                  style={S.notesField}
                  placeholder="Add approval notes (optional)"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
                <div style={S.actionButtons}>
                  <button
                    style={{ ...S.actionButton, ...S.approveButton }}
                    onClick={() => approveBlog(selectedBlog.id)}
                    disabled={actionInProgress}
                  >
                    ✅ Publish
                  </button>
                  <button
                    style={{ ...S.actionButton, ...S.rejectButton }}
                    onClick={() => rejectBlog(selectedBlog.id)}
                    disabled={actionInProgress}
                  >
                    ❌ Reject
                  </button>
                </div>
              </>
            )}

            {selectedBlog.status === 'published' && (
              <div style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Published</div>
            )}

            {selectedBlog.status === 'rejected' && (
              <div style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Rejected</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
