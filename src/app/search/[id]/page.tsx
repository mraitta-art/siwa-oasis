'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel';
import VibeSearch from '@/components/VibeSearch';
import DynamicComponentRenderer from '@/components/DynamicComponentRenderer';

interface SearchResult {
  id: string;
  name: string;
  type_id: string;
  type_name: string;
  type_icon: string;
  status: string;
  subscription_tier: string;
  views: number;
  [key: string]: any;
}

export default function PublicSearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  
  // States for search engine mode
  const [results, setResults] = useState<SearchResult[]>([]);
  const [engine, setEngine] = useState<any>(null);
  const [cardTemplates, setCardTemplates] = useState<any[]>([]);
  
  // States for search page mode
  const [searchPage, setSearchPage] = useState<any>(null);
  const [isSearchPageMode, setIsSearchPageMode] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ total: 0, page: 1 });

  useEffect(() => {
    loadPage();
  }, [id]);

  async function loadPage() {
    setLoading(true);
    setNotFound(false);
    
    // First, try to load as a search page (by slug)
    try {
      const res = await fetch(`/api/jana/search-pages/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.is_published && data.is_visible) {
          setSearchPage(data);
          setIsSearchPageMode(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Not a search page, trying as search engine...');
    }
    
    // Fall back to loading as search engine
    setIsSearchPageMode(false);
    try {
      const res = await fetch(`/api/jana/search-engines`);
      if (res.ok) {
        const all = await res.json();
        const foundEngine = all.find((e: any) => e.id === id);
        if (foundEngine) {
          setEngine(foundEngine);
          await loadCardTemplates();
          await runSearch();
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error('Failed to load search engine:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadCardTemplates() {
    const res = await fetch(`/api/jana/cards`);
    if (res.ok) setCardTemplates(await res.json());
  }

  async function runSearch() {
    setLoading(true);
    const res = await fetch(`/api/search?engineId=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, page: 1, pageSize: 12 })
    });
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setStats({ total: data.total, page: data.page });
    }
    setLoading(false);
  }

  // Find the correct card template for a business type
  const getCardTemplate = (typeId: string) => {
    return cardTemplates.find(t => t.business_type_id === typeId) || {
      layout: 'standard',
      visible_fields: ['name', 'description', 'stars']
    };
  };

  // SEARCH PAGE MODE - Render configurable search page from database
  if (isSearchPageMode) {
    if (loading) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
          <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
          <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>LOADING SEARCH...</div>
        </div>
      );
    }

    if (notFound) {
      return (
        <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
          <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
          <p style={{ opacity: 0.5 }}>The search page &ldquo;{id}&rdquo; does not exist.</p>
          <p style={{ opacity: 0.3, fontSize: '0.8rem' }}>Create it in the admin → Search Pages Manager</p>
          <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return Home</Link>
        </div>
      );
    }

    if (!searchPage) return null;

    // Render hero carousel if enabled
    const renderHero = () => {
      if (!searchPage.hero_enabled) return null;

      return (
        <AdvancedHeroCarousel
          carouselName={searchPage.hero_carousel_id || 'main_hero'}
          height={`${searchPage.hero_height_vh || 85}vh`}
          autoPlay={searchPage.hero_autoplay !== false}
        />
      );
    };

    // Determine which search component to render
    const renderSearchComponent = () => {
      if (!searchPage.search_engine_id) {
        // Default to vibe search if no engine specified
        return <VibeSearch />;
      }

      // Use VibeSearch with specified engine
      return <VibeSearch engineId={searchPage.search_engine_id} />;
    };

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '10rem' }}>
        {/* Breadcrumb */}
        {searchPage.show_breadcrumb && (
          <nav style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', color: '#64748b' }}>
            <Link href="/" style={{ color: '#D4AF37', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <span>{searchPage.title}</span>
          </nav>
        )}

        {/* Hero Carousel (if enabled) */}
        {renderHero()}

        {/* Search Component Container */}
        <div className="container" style={{ marginTop: searchPage.hero_enabled ? '-6rem' : '2rem', position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(30px)',
            padding: '4rem',
            borderRadius: '40px',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            {renderSearchComponent()}
          </div>
        </div>

        {/* Custom Components (if any) */}
        {searchPage.components && searchPage.components.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            {searchPage.components.map((component: any, idx: number) => (
              <DynamicComponentRenderer
                key={`${component.id || idx}`}
                component={component}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Handle loading state for search engine mode
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <i className="fas fa-sun fa-spin fa-4x" style={{ color: '#D4AF37', marginBottom: '2rem' }}></i>
        <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '4px', fontSize: '0.7rem' }}>LOADING SEARCH...</div>
      </div>
    );
  }

  // Handle not found state
  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
        <h1 style={{ fontWeight: 900, color: '#D4AF37', fontSize: '4rem' }}>404</h1>
        <p style={{ opacity: 0.5 }}>The search page or engine &ldquo;{id}&rdquo; does not exist.</p>
        <Link href="/" style={{ color: '#D4AF37', marginTop: '2rem', display: 'inline-block' }}>Return Home</Link>
      </div>
    );
  }

  // SEARCH ENGINE MODE - Render search engine results
  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <nav style={{ background: '#fff', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#1a1a2e', fontWeight: 800 }}>
          <i className="fas fa-sun" style={{ color: '#D4AF37' }}></i> SIWA TODAY
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" className="btn btn-outline btn-sm">Sign In</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          
          <aside>
            <div className="card" style={{ position: 'sticky', top: '2rem' }}>
              <h4>Refine Exploration</h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0 1.5rem' }}>
                Engine: <strong>{engine?.name || id}</strong>
              </p>
              
              {engine?.allowed_fields?.map((f: string) => (
                <div key={f} className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{f.replace(/_|\./g, ' ').toUpperCase()}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder={`Filter by ${f}...`} 
                    onChange={e => setFilters({...filters, [f]: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && runSearch()}
                  />
                </div>
              ))}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={runSearch}>
                <i className="fas fa-search"></i> Update Results
              </button>
            </div>
          </aside>

          <main>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Showing {results.length} Experiences</h3>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Filtered by {engine?.name} configuration</div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: '#9ca3af' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem' }}></i>
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '1rem' }}>
                 <i className="fas fa-search-minus" style={{ fontSize: '3rem', color: '#eee', marginBottom: '1rem' }}></i>
                 <p>No matches found for your criteria. Try adjusting your vibe filters.</p>
              </div>
            ) : (
              <div className="grid-2">
                {results.map(biz => {
                  const tpl = getCardTemplate(biz.type_id);
                  const isHero = tpl.layout === 'hero';
                  
                  return (
                    <div 
                      key={biz.id} 
                      className="card" 
                      style={{ 
                        padding: 0, 
                        overflow: 'hidden', 
                        gridColumn: isHero ? '1 / -1' : 'auto',
                        borderTop: isHero ? '4px solid #D4AF37' : '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ height: isHero ? 300 : 180, background: '#eee', position: 'relative' }}>
                         <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                           <i className={`fas ${biz.type_icon}`} style={{ marginRight: '0.5rem' }}></i>
                           {biz.type_name.toUpperCase()}
                         </div>
                         <div style={{ position: 'absolute', top: 12, right: 12, background: '#fff', color: '#1a1a2e', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                           ★ 5.0
                         </div>
                         {isHero && (
                           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', alignItems: 'flex-end', padding: '2rem' }}>
                             <div>
                               <h2 style={{ color: '#fff', margin: 0 }}>{biz.name}</h2>
                               <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{biz.subscription_tier === 'premium' ? 'Oasis Collection' : 'Featured Experience'}</p>
                             </div>
                           </div>
                         )}
                      </div>
                      
                      {!isHero && (
                        <div style={{ padding: '1.25rem' }}>
                          <h4 style={{ margin: 0 }}>{biz.name}</h4>
                          <div style={{ margin: '0.75rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {tpl.visible_fields.map((f: string) => (
                              <span key={f} className="badge badge-info" style={{ fontSize: '0.6rem' }}>{f.replace('_', ' ')}</span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <span style={{ fontWeight: 700, color: '#D4AF37', fontSize: '0.8rem' }}>EXPLORER CHOICE</span>
                            <Link href={`/business/${biz.id}`} className="btn btn-primary btn-sm">Explore House</Link>
                          </div>
                        </div>
                      )}
                      
                      {isHero && (
                        <div style={{ padding: '1rem 2rem', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                             {tpl.visible_fields.slice(0, 4).map((f: string) => (
                               <span key={f} style={{ fontSize: '0.75rem', color: '#6b7280' }}><i className="fas fa-check" style={{ color: '#D4AF37', marginRight: '0.4rem' }}></i>{f}</span>
                             ))}
                          </div>
                          <Link href={`/business/${biz.id}`} className="btn btn-primary">Discover Full Oasis</Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
