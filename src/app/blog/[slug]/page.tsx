'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Tag { id: number; name: string; slug: string; }

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  author_name: string | null;
  author_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  views: number;
  reading_time: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: Tag[];
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  reading_time: number;
  published_at: string | null;
  category_name: string | null;
}

/* ── Date formatter ─────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ── Simple Markdown → HTML renderer ───────────────────── */
function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Unordered list items
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:1.5rem 0;" />')
    // Line breaks → paragraphs
    .split(/\n\n+/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<hr') || trimmed.startsWith('<li') ||
          trimmed.startsWith('<img')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  return html;
}

/* ── Reading progress bar ──────────────────────────────── */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '3px', background: 'rgba(0,0,0,0.08)',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #D4AF37, #FFB700)',
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

/* ── Copy-link button ──────────────────────────────────── */
function ShareButton() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 1.2rem',
        background: copied ? '#22c55e' : 'rgba(255,255,255,0.1)',
        color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700,
        cursor: 'pointer', transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
      }}
    >
      {copied ? '✅ Copied!' : '🔗 Share'}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${slug}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!res.ok) throw new Error('Failed to load post');
        const data = await res.json();
        setPost(data.post);
        setRelated(data.related || []);
        // Update page title
        if (data.post?.meta_title || data.post?.title) {
          document.title = `${data.post.meta_title || data.post.title} | Siwa Today`;
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0f1d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{
          width: '56px', height: '56px',
          border: '3px solid rgba(212,175,55,0.2)',
          borderTop: '3px solid #D4AF37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', letterSpacing: '2px' }}>
          LOADING ARTICLE
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── 404 ── */
  if (notFound || !post) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0f1d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '2rem', textAlign: 'center', padding: '2rem',
      }}>
        <div style={{ fontSize: '6rem' }}>📭</div>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
          Article Not Found
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '480px', lineHeight: 1.8 }}>
          This article may have been moved, deleted, or is not yet published.
        </p>
        <Link href="/blog" style={{
          padding: '1rem 2.5rem',
          background: 'linear-gradient(135deg, #D4AF37, #FFB700)',
          color: '#0a0f1d', borderRadius: '50px',
          textDecoration: 'none', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '1px',
        }}>
          ← BACK TO BLOG
        </Link>
      </div>
    );
  }

  const categoryColor = post.category_color || '#D4AF37';

  return (
    <>
      <ReadingProgress />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700;900&display=swap');

        .blog-body { font-family: 'Inter', sans-serif; }
        .blog-body h1, .blog-body h2, .blog-body h3 {
          font-family: 'Playfair Display', serif;
          color: #0f172a; margin: 2.5rem 0 1rem;
          line-height: 1.3; font-weight: 700;
        }
        .blog-body h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); }
        .blog-body h2 { font-size: clamp(1.4rem, 3vw, 2rem); }
        .blog-body h3 { font-size: clamp(1.1rem, 2.5vw, 1.4rem); }
        .blog-body p {
          color: #374151; font-size: clamp(1rem, 2vw, 1.125rem);
          line-height: 1.9; margin: 0 0 1.5rem;
        }
        .blog-body ul { margin: 0 0 1.5rem; padding-left: 1.75rem; }
        .blog-body li {
          color: #374151; font-size: 1.05rem;
          line-height: 1.8; margin-bottom: 0.5rem;
        }
        .blog-body blockquote {
          border-left: 4px solid #D4AF37;
          margin: 2rem 0; padding: 1.25rem 2rem;
          background: #fffbeb; border-radius: 0 12px 12px 0;
          font-style: italic; color: #92400e;
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem; line-height: 1.8;
        }
        .blog-body code {
          background: #f1f5f9; border: 1px solid #e2e8f0;
          padding: 0.2rem 0.5rem; border-radius: 4px;
          font-family: 'Courier New', monospace; font-size: 0.9em;
          color: #1e40af;
        }
        .blog-body a { color: #D4AF37; font-weight: 600; text-decoration: underline; }
        .blog-body a:hover { color: #b8962e; }
        .blog-body hr {
          border: none; border-top: 2px solid #e2e8f0;
          margin: 3rem 0;
        }
        .blog-body strong { color: #0f172a; font-weight: 700; }
        .blog-body em { font-style: italic; }

        .related-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
        }
        .tag-pill:hover { background: #D4AF37 !important; color: #0a0f1d !important; }
        .back-btn:hover { background: rgba(255,255,255,0.15) !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#faf9f7' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          {/* Background image with overlay */}
          {post.featured_image ? (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${post.featured_image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(10,15,29,0.55) 0%, rgba(10,15,29,0.85) 60%, rgba(10,15,29,0.97) 100%)',
              }} />
            </div>
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #0a0f1d 0%, #1e293b 50%, #0f172a 100%)',
            }}>
              <div style={{
                position: 'absolute', top: '10%', left: '5%',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
              }} />
            </div>
          )}

          {/* Nav bar */}
          <nav style={{
            position: 'relative', zIndex: 10,
            padding: 'clamp(1.5rem, 4vw, 2rem) clamp(1.5rem, 5vw, 4rem)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Link href="/" style={{
              color: '#fff', textDecoration: 'none',
              fontWeight: 900, letterSpacing: '4px', fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
            }}>
              SIWA.<span style={{ color: '#D4AF37' }}>TODAY</span>
            </Link>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link
                href="/blog"
                className="back-btn"
                style={{
                  color: '#fff', textDecoration: 'none',
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700,
                  letterSpacing: '1px', transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                }}
              >
                ← ALL ARTICLES
              </Link>
              <ShareButton />
            </div>
          </nav>

          {/* Hero content */}
          <div style={{
            position: 'relative', zIndex: 10, flex: 1,
            display: 'flex', alignItems: 'flex-end',
            padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)',
            maxWidth: '900px',
          }}>
            <div className="fade-up">
              {/* Category badge */}
              {post.category_name && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0.4rem 1.1rem',
                  background: categoryColor,
                  color: '#fff', borderRadius: '50px',
                  fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px',
                  marginBottom: '1.5rem',
                  boxShadow: `0 4px 16px ${categoryColor}55`,
                }}>
                  {post.category_name.toUpperCase()}
                </div>
              )}

              {/* Title */}
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 900, color: '#fff', lineHeight: 1.2,
                margin: '0 0 1.5rem',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}>
                {post.title}
              </h1>

              {/* Meta row */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
                alignItems: 'center', color: 'rgba(255,255,255,0.65)',
                fontSize: '0.85rem', fontWeight: 500,
              }}>
                {post.author_name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D4AF37, #FFB700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 900, color: '#0a0f1d',
                    }}>
                      {post.author_name.charAt(0).toUpperCase()}
                    </span>
                    {post.author_name}
                  </span>
                )}
                <span>📅 {formatDate(post.published_at || post.created_at)}</span>
                <span>⏱️ {post.reading_time || 1} min read</span>
                <span>👁️ {(post.views || 0).toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ARTICLE BODY ── */}
        <div style={{ background: '#faf9f7', paddingBottom: '6rem' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 2rem)' }}>

            {/* Excerpt / lead */}
            {post.excerpt && (
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                color: '#374151', lineHeight: 1.8,
                fontStyle: 'italic',
                padding: '2rem 2.5rem',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderLeft: `5px solid ${categoryColor || '#D4AF37'}`,
                borderRadius: '0 16px 16px 0',
                marginBottom: '3rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                {post.excerpt}
              </p>
            )}

            {/* Main content rendered as Markdown */}
            <div
              className="blog-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px', color: '#94a3b8', marginBottom: '1rem' }}>
                  TAGS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {post.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="tag-pill"
                      style={{
                        padding: '0.5rem 1.1rem',
                        background: '#f1f5f9',
                        color: '#475569',
                        borderRadius: '50px',
                        fontSize: '0.8rem', fontWeight: 700,
                        cursor: 'default',
                        transition: 'all 0.2s ease',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author card */}
            {post.author_name && (
              <div style={{
                marginTop: '4rem',
                padding: '2rem 2.5rem',
                background: '#fff',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                display: 'flex', gap: '1.5rem', alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: '64px', height: '64px', flexShrink: 0,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37, #FFB700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 900, color: '#0a0f1d',
                  boxShadow: '0 8px 20px rgba(212,175,55,0.3)',
                }}>
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#D4AF37', marginBottom: '0.25rem' }}>
                    WRITTEN BY
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    {post.author_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Siwa Today Contributor
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RELATED POSTS ── */}
        {related.length > 0 && (
          <div style={{ background: '#0a0f1d', padding: 'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '3px', color: '#D4AF37', marginBottom: '0.75rem' }}>
                  CONTINUE READING
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                  fontWeight: 900, color: '#fff', margin: 0,
                }}>
                  Related Articles
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {related.map(rp => (
                  <Link
                    key={rp.id}
                    href={`/blog/${rp.slug}`}
                    className="related-card"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      display: 'block',
                    }}
                  >
                    {rp.featured_image ? (
                      <img
                        src={rp.featured_image}
                        alt={rp.title}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '180px',
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem',
                      }}>📝</div>
                    )}
                    <div style={{ padding: '1.5rem' }}>
                      {rp.category_name && (
                        <div style={{
                          fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px',
                          color: '#D4AF37', marginBottom: '0.75rem',
                        }}>
                          {rp.category_name.toUpperCase()}
                        </div>
                      )}
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                        margin: '0 0 0.75rem', lineHeight: 1.4,
                      }}>
                        {rp.title}
                      </h3>
                      {rp.excerpt && (
                        <p style={{
                          color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem',
                          lineHeight: 1.7, margin: '0 0 1rem',
                        }}>
                          {rp.excerpt.substring(0, 100)}…
                        </p>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        ⏱️ {rp.reading_time || 1} min read
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER CTA ── */}
        <div style={{
          background: '#0a0f1d',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '4rem clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '2rem', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} SIWA.TODAY
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/blog" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
              ← All Articles
            </Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              Home
            </Link>
            <Link href="/search/vibe" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              Explore Siwa
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
