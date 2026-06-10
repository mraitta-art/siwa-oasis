'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SectionContent {
  section_id: string;
  section_name: string;
  has_miniblog: boolean;
  has_gallery: boolean;
  gallery_enabled: boolean;
  miniblog_enabled: boolean;
  curation_policy: string;
  content_instructions: string;
  published_blogs: number;
  draft_blogs: number;
  approved_images: number;
  pending_approval_images: number;
  vendor_permissions: {
    can_upload_images: boolean;
    can_write_blogs: boolean;
    can_edit_own: boolean;
  };
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  created_at: string;
  published_at?: string;
}

export default function VendorContentManagerPage() {
  const [sections, setSections] = useState<SectionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'write-blog' | 'gallery'>('overview');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [savingBlog, setSavingBlog] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    try {
      const res = await fetch('/api/vendor/sections/content-manager');
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setSelectedSection(data[0].section_id);
          loadBlogs(data[0].section_id);
        }
      }
    } catch (err) {
      console.error('Load sections error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBlogs(sectionId: string) {
    try {
      const res = await fetch(`/api/vendor/sections/${sectionId}/blogs`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Load blogs error:', err);
    }
  }

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(sectionId);
    setActiveTab('overview');
    loadBlogs(sectionId);
  };

  const handleSaveBlog = async () => {
    if (!selectedSection || !blogTitle.trim() || !blogContent.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setSavingBlog(true);
    try {
      const res = await fetch(`/api/vendor/sections/${selectedSection}/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent,
          excerpt: blogExcerpt || blogContent.substring(0, 160)
        })
      });

      if (res.ok) {
        alert('✅ Blog saved! ' + (selectedSection && 'Auto-published' || 'Awaiting admin approval'));
        setBlogTitle('');
        setBlogContent('');
        setBlogExcerpt('');
        loadBlogs(selectedSection);
      } else {
        alert('Failed to save blog');
      }
    } catch (err) {
      alert('Error saving blog');
    } finally {
      setSavingBlog(false);
    }
  };

  const currentSection = sections.find(s => s.section_id === selectedSection);

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
      gridTemplateColumns: '250px 1fr',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    sidebar: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '1rem',
      height: 'fit-content'
    },
    sidebarTitle: {
      fontSize: '1rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#D4AF37',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #556B2F'
    },
    sectionItem: {
      padding: '0.75rem 1rem',
      marginBottom: '0.5rem',
      borderRadius: '4px',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '0.9rem'
    },
    sectionItemActive: {
      background: '#556B2F',
      borderColor: '#D4AF37',
      color: '#D4AF37'
    },
    content: {
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #556B2F',
      padding: '2rem'
    },
    tabs: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      borderBottom: '1px solid #556B2F',
      paddingBottom: '1rem'
    },
    tab: {
      padding: '0.75rem 1.5rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#aaa',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '0.9rem'
    },
    tabActive: {
      background: '#556B2F',
      borderColor: '#D4AF37',
      color: '#D4AF37'
    },
    overviewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F',
      textAlign: 'center' as const
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#D4AF37',
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#aaa'
    },
    instructions: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F',
      marginBottom: '1rem',
      lineHeight: '1.6',
      color: '#ddd',
      whiteSpace: 'pre-wrap' as const
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontWeight: '500',
      color: '#D4AF37'
    },
    input: {
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '1rem'
    },
    textarea: {
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '1rem',
      minHeight: '300px',
      fontFamily: 'inherit'
    },
    button: {
      padding: '0.75rem 1.5rem',
      background: '#D4AF37',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    blogsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    blogItem: {
      background: '#1a1a1a',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F'
    },
    blogTitle: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#D4AF37'
    },
    blogStatus: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    statusDraft: {
      background: '#fbbf24',
      color: '#1a1a1a'
    },
    statusPending: {
      background: '#3b82f6',
      color: '#fff'
    },
    statusPublished: {
      background: '#10b981',
      color: '#fff'
    },
    statusRejected: {
      background: '#ef4444',
      color: '#fff'
    }
  };

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.header}>⏳ Loading section content manager...</div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div style={S.container}>
        <div style={S.header}>📋 Section Content Manager</div>
        <div style={{ fontSize: '1.1rem', color: '#aaa', marginTop: '2rem' }}>
          No sections available. Admin needs to create sections with vendor permissions enabled.
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.header}>📋 Section Content Manager</div>

      <div style={S.mainContent}>
        {/* Sidebar - Section List */}
        <div style={S.sidebar}>
          <div style={S.sidebarTitle}>YOUR SECTIONS</div>
          {sections.map(section => (
            <div
              key={section.section_id}
              style={{
                ...S.sectionItem,
                ...(selectedSection === section.section_id ? S.sectionItemActive : {})
              }}
              onClick={() => handleSelectSection(section.section_id)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {section.section_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                📝 {section.published_blogs} | 🖼️ {section.approved_images}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={S.content}>
          {currentSection && (
            <>
              {/* Tabs */}
              <div style={S.tabs}>
                <button
                  style={{
                    ...S.tab,
                    ...(activeTab === 'overview' ? S.tabActive : {})
                  }}
                  onClick={() => setActiveTab('overview')}
                >
                  📊 Overview
                </button>
                {currentSection.has_miniblog && currentSection.vendor_permissions.can_write_blogs && (
                  <button
                    style={{
                      ...S.tab,
                      ...(activeTab === 'write-blog' ? S.tabActive : {})
                    }}
                    onClick={() => setActiveTab('write-blog')}
                  >
                    ✍️ Write Blog
                  </button>
                )}
                {currentSection.has_gallery && currentSection.vendor_permissions.can_upload_images && (
                  <button
                    style={{
                      ...S.tab,
                      ...(activeTab === 'gallery' ? S.tabActive : {})
                    }}
                    onClick={() => setActiveTab('gallery')}
                  >
                    🖼️ Gallery
                  </button>
                )}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div style={S.overviewGrid}>
                    <div style={S.statCard}>
                      <div style={S.statNumber}>{currentSection.published_blogs}</div>
                      <div style={S.statLabel}>Published Blogs</div>
                    </div>
                    <div style={S.statCard}>
                      <div style={S.statNumber}>{currentSection.draft_blogs}</div>
                      <div style={S.statLabel}>Draft Blogs</div>
                    </div>
                    <div style={S.statCard}>
                      <div style={S.statNumber}>{currentSection.approved_images}</div>
                      <div style={S.statLabel}>Approved Images</div>
                    </div>
                    <div style={S.statCard}>
                      <div style={S.statNumber}>{currentSection.pending_approval_images}</div>
                      <div style={S.statLabel}>Pending Approval</div>
                    </div>
                  </div>

                  {currentSection.content_instructions && (
                    <div>
                      <h3 style={{ color: '#D4AF37', marginBottom: '0.5rem' }}>📝 Content Guidelines</h3>
                      <div style={S.instructions}>
                        {currentSection.content_instructions}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>📰 Your Blog Posts</h3>
                    {blogs.length === 0 ? (
                      <div style={{ color: '#aaa' }}>No blog posts yet. Start writing!</div>
                    ) : (
                      <div style={S.blogsList}>
                        {blogs.map(blog => (
                          <div key={blog.id} style={S.blogItem}>
                            <div style={S.blogTitle}>{blog.title}</div>
                            <span
                              style={{
                                ...S.blogStatus,
                                ...(blog.status === 'draft' && S.statusDraft),
                                ...(blog.status === 'pending_approval' && S.statusPending),
                                ...(blog.status === 'published' && S.statusPublished),
                                ...(blog.status === 'rejected' && S.statusRejected)
                              }}
                            >
                              {blog.status === 'draft' && '✏️ Draft'}
                              {blog.status === 'pending_approval' && '⏳ Pending'}
                              {blog.status === 'published' && '✅ Published'}
                              {blog.status === 'rejected' && '❌ Rejected'}
                            </span>
                            <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              {blog.excerpt}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                              {new Date(blog.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Write Blog Tab */}
              {activeTab === 'write-blog' && (
                <form style={S.form} onSubmit={(e) => { e.preventDefault(); handleSaveBlog(); }}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Blog Title</label>
                    <input
                      style={S.input}
                      type="text"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="Enter blog title"
                      required
                    />
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Excerpt (summary shown in listings)</label>
                    <input
                      style={S.input}
                      type="text"
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      placeholder="Brief summary of your blog post"
                    />
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Content</label>
                    <textarea
                      style={S.textarea}
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Write your blog post content here..."
                      required
                    />
                  </div>

                  <button
                    style={S.button}
                    type="submit"
                    disabled={savingBlog}
                  >
                    {savingBlog ? '⏳ Saving...' : '✅ Publish Blog'}
                  </button>

                  <small style={{ color: '#aaa' }}>
                    {currentSection.curation_policy === 'auto_approve' && '✅ Will be published immediately'}
                    {currentSection.curation_policy === 'manual_review' && '⏳ Awaits admin approval'}
                    {currentSection.curation_policy === 'admin_only' && '🔒 Only admins can publish in this section'}
                  </small>
                </form>
              )}

              {/* Gallery Tab */}
              {activeTab === 'gallery' && (
                <div>
                  <p style={{ color: '#aaa', marginBottom: '1rem' }}>
                    📸 Upload images to your {currentSection.section_name} gallery. Admins will curate which images appear as hero carousel slides.
                  </p>
                  <a
                    href="/vendor/media"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: '#D4AF37',
                      color: '#1a1a1a',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    📸 Go to Media Manager
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
