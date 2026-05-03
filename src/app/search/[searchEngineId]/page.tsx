'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function PublicSearchPage({ params }: { params: Promise<{ searchEngineId: string }> }) {
  const { searchEngineId } = React.use(params);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [engine, setEngine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ total: 0, page: 1 });
  const [cardTemplates, setCardTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadEngine();
    loadCardTemplates();
    runSearch();
  }, [searchEngineId]);

  async function loadEngine() {
    const res = await fetch(`/api/admin/search-engines`);
    if (res.ok) {
      const all = await res.json();
      setEngine(all.find((e: any) => e.id === searchEngineId));
    }
  }

  async function loadCardTemplates() {
    const res = await fetch(`/api/admin/cards`);
    if (res.ok) setCardTemplates(await res.json());
  }

  async function runSearch() {
    setLoading(true);
    const res = await fetch(`/api/search?engineId=${searchEngineId}`, {
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
                Engine: <strong>{engine?.name || searchEngineId}</strong>
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
