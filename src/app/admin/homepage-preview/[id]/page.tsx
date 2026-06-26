'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface FieldDef { 
  id: string; 
  name: string; 
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox'; 
  required?: boolean; 
  options?: string[] 
}

interface Section {
  id: string;
  name: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'gallery' | 'team' | 'faq' | 'pricing' | 'packages' | 'offers' | 'discounts' | 'investments' | 'business_form';
  order: number;
  enabled: boolean;
  images?: string[];
  content?: string;
  fields?: FieldDef[];
}

interface PageData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  title: string;
  description: string;
  theme: 'light' | 'dark' | 'golden';
  layout: 'standard' | 'minimal' | 'showcase';
  sections: Section[];
}

export default function HomepagePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadPreview() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/homepages/${id}`);
        const data = await res.json();
        if (data.success && data.page) {
          setPage(data.page);
        }
      } catch (err) {
        console.error('Failed to load preview data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [id]);

  const toggleFaq = (idx: string) => {
    setActiveFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-900 text-slate-100 dark-theme';
      case 'golden':
        return 'bg-[#FAF6EE] text-slate-800 golden-theme';
      case 'light':
      default:
        return 'bg-[#F8FAFC] text-slate-800 light-theme';
    }
  };

  const getCardThemeClass = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-800 border-slate-700 text-white';
      case 'golden':
        return 'bg-white border-[#e6dcbe] text-slate-800';
      case 'light':
      default:
        return 'bg-white border-slate-200 text-slate-800 shadow-sm';
    }
  };

  const getHeadingColorClass = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'text-white';
      case 'golden':
        return 'text-[#556B2F]';
      case 'light':
      default:
        return 'text-slate-900';
    }
  };

  const getButtonClass = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-gradient-to-r from-[#D4AF37] to-[#FFB700] hover:opacity-90 text-slate-950 font-bold';
      case 'golden':
        return 'bg-[#556B2F] hover:bg-[#445625] text-white font-bold';
      case 'light':
      default:
        return 'bg-gradient-to-r from-[#556B2F] to-[#D4AF37] hover:opacity-95 text-white font-bold';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#556B2F]/20 border-t-[#556B2F] rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Generating preview...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-slate-505 text-sm max-w-sm mb-4">The requested homepage configuration could not be loaded.</p>
        <Link href="/admin/homepages-manager" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold">
          Return to Manager
        </Link>
      </div>
    );
  }

  const activeSections = (page.sections || [])
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={`min-h-screen ${getThemeClass(page.theme)}`}>
      
      {/* Dynamic Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-b border-slate-850 z-50 flex items-center justify-between px-6 py-3.5 shadow-md">
        <div className="flex items-center gap-4">
          <Link href={`/admin/homepage-editor/${id}`} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-colors">
            ← Back to Editor
          </Link>
          <div>
            <div className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Preview Mode</span>
              <span className={`w-2 h-2 rounded-full ${page.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div className="text-slate-400 text-xs font-semibold">{page.title || page.name} ({page.theme} theme)</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/homepages-manager"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all duration-200"
          >
            Manage All Pages
          </Link>
        </div>
      </div>

      {/* Dynamic Page content */}
      <div className="pt-16 pb-24">
        {activeSections.length === 0 ? (
          <div className="py-32 text-center max-w-md mx-auto px-6">
            <div className="text-5xl mb-4">🏜️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">An Oasis Awaits</h2>
            <p className="text-slate-500 text-sm mb-6">This page configuration is active but has no visible layout sections. Open the builder editor to insert hero grids, business showcases, or pricing plans.</p>
            <Link href={`/admin/homepage-editor/${id}`} className="px-6 py-2.5 bg-[#556B2F] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
              Add Layout Sections
            </Link>
          </div>
        ) : (
          activeSections.map((section) => {
            const hasImages = Array.isArray(section.images) && section.images.length > 0;
            
            switch (section.type) {
              case 'hero':
                return (
                  <div key={section.id} className="relative overflow-hidden py-24 sm:py-32 border-b border-slate-200/20">
                    {hasImages ? (
                      <div className="absolute inset-0">
                        <img src={section.images?.[0]} alt="hero-bg" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-[#D4AF37] to-[#556B2F] animate-gradient" />
                      </div>
                    )}
                    
                    <div className="relative mx-auto max-w-5xl px-6 text-center z-10">
                      <h1 className={`text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6 ${hasImages ? 'text-white' : getHeadingColorClass(page.theme)}`}>
                        {section.name}
                      </h1>
                      <p className={`text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed ${hasImages ? 'text-slate-200' : 'text-slate-500'}`}>
                        {section.content || page.description || 'Welcome to the beautiful Siwa Oasis. Discover attractions, stays, and dynamic investment listings.'}
                      </p>
                      <button className={`px-8 py-3.5 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 ${getButtonClass(page.theme)}`}>
                        Get Started Today
                      </button>
                    </div>
                  </div>
                );

              case 'features':
                return (
                  <div key={section.id} className="py-16 max-w-7xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm max-w-xl mx-auto">{section.content || 'Highlighting key services, points of interest, and listings in the region.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: '⭐ Premium Comfort', desc: 'Handpicked local eco-lodges, hotels, and luxury suites.' },
                        { title: '🌵 Desert Expeditions', desc: 'Guided travel, safaris, natural spring retreats, and historical tours.' },
                        { title: '🏺 Cultural Heritage', desc: 'Discover ancient fortresses, salt lakes, and traditional craft markets.' }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-6 border rounded-xl hover:-translate-y-0.5 transition-all duration-200 ${getCardThemeClass(page.theme)}`}>
                          <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'gallery':
                return (
                  <div key={section.id} className="py-16 max-w-7xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm max-w-xl mx-auto">{section.content || 'Explore visual grids showcasing standard locations, landmarks, and highlights.'}</p>
                    </div>

                    {hasImages ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(section.images || []).map((img, idx) => (
                          <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:shadow transition-all duration-200 border border-slate-200">
                            <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[1, 2, 3].map((idx) => (
                          <div key={idx} className={`aspect-[4/3] rounded-xl flex items-center justify-center text-4xl border border-dashed border-slate-300 ${getCardThemeClass(page.theme)}`}>
                            🖼️ Placeholder
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );

              case 'testimonials':
                return (
                  <div key={section.id} className="py-16 max-w-7xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm max-w-xl mx-auto">{section.content || 'What guests and travel agencies say about our Siwa Oasis platforms.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { name: 'Dr. Sarah Wilson', role: 'Adventure Enthusiast', text: 'An absolutely magical experience. The platform made it seamless to locate premium eco-resorts and private desert guides in Siwa.', stars: '⭐⭐⭐⭐⭐' },
                        { name: 'Karim Ahmed', role: 'Investment Partner', text: 'Finding dynamic business opportunities and networking with local vendors is extremely straightforward now.', stars: '⭐⭐⭐⭐⭐' }
                      ].map((review, idx) => (
                        <div key={idx} className={`p-6 border rounded-xl shadow-sm ${getCardThemeClass(page.theme)}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[#556B2F]">
                              {review.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800">{review.name}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{review.role}</div>
                            </div>
                            <span className="ml-auto text-xs">{review.stars}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed italic">"{review.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'faq':
                return (
                  <div key={section.id} className="py-16 max-w-4xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm">{section.content || 'Quick answers to common questions about travelling and investing.'}</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { q: 'How do I travel to Siwa Oasis from Cairo?', a: 'You can travel by overnight bus lines leaving Cairo daily, hire a private car service, or take a scenic drive along the El Alamein road.' },
                        { q: 'What is the best time of year to visit Siwa?', a: 'The ideal travel window is from October through April when daytime temperatures are pleasant and nights are cool.' },
                        { q: 'How can I submit my business to the directory?', a: 'You can navigate to our Vendor portal, create an account, and fill out our customized submission forms.' }
                      ].map((item, idx) => {
                        const fid = `${section.id}-${idx}`;
                        const isOpen = !!activeFaq[fid];
                        return (
                          <div key={idx} className={`border rounded-xl overflow-hidden transition-all duration-200 ${getCardThemeClass(page.theme)}`}>
                            <button
                              onClick={() => toggleFaq(fid)}
                              className="w-full p-4 text-left font-bold text-sm flex items-center justify-between focus:outline-none"
                            >
                              <span>{item.q}</span>
                              <span className="text-xs">{isOpen ? '▼' : '▶'}</span>
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 text-xs text-slate-500 border-t border-slate-100 leading-relaxed">
                                {item.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

              case 'pricing':
                return (
                  <div key={section.id} className="py-16 max-w-7xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm max-w-xl mx-auto">{section.content || 'Select a plan that fits your business marketing needs in Siwa Today.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                      {[
                        { title: 'Standard Listing', price: 'Free', features: ['1 Business Profile', 'Include Phone & Location', 'Basic Search visibility'] },
                        { title: 'Premium Promotion', price: '$29/mo', features: ['Featured tag placement', 'Gallery image uploads', 'Collect dynamic booking requests', 'Email & SMS Notifications'] },
                        { title: 'Enterprise Network', price: '$99/mo', features: ['Manage up to 5 properties', 'Custom inquiry forms', 'Detailed analytics dashboard', 'Dedicated account manager'] }
                      ].map((plan, idx) => (
                        <div key={idx} className={`p-6 border rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow ${getCardThemeClass(page.theme)}`}>
                          <div>
                            <h4 className="font-bold text-base text-slate-800 mb-1">{plan.title}</h4>
                            <div className="text-2xl font-black text-[#556B2F] mb-4">{plan.price}</div>
                            <ul className="space-y-2 mb-6">
                              {plan.features.map((f, i) => (
                                <li key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <span className="text-emerald-500">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <button className={`w-full py-2 rounded-lg text-xs font-bold ${getButtonClass(page.theme)}`}>
                            Choose Plan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'packages':
              case 'offers':
              case 'discounts':
              case 'investments':
                return (
                  <div key={section.id} className="py-16 max-w-7xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-12">
                      <h2 className={`text-3xl font-extrabold mb-3 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm max-w-xl mx-auto">{section.content || 'Curated opportunities, discounts, and custom packages catalog.'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx} className={`border rounded-xl overflow-hidden hover:shadow-md transition-all group ${getCardThemeClass(page.theme)}`}>
                          <div className="bg-slate-200 aspect-[16/10] flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                            🏷️
                          </div>
                          <div className="p-5">
                            <span className="text-[9px] uppercase font-black bg-[#556B2F]/10 text-[#556B2F] px-2 py-0.5 rounded border border-[#556B2F]/20">
                              {section.type}
                            </span>
                            <h4 className="font-bold text-sm text-slate-800 mt-2.5 mb-1">Standard Item Offer</h4>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">This is an active campaign listing featured on the homepage layout dynamically.</p>
                            <button className="text-xs font-bold text-[#556B2F] hover:underline flex items-center gap-1">
                              Learn More ➔
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'business_form':
                const fields = section.fields || [];
                return (
                  <div key={section.id} className="py-16 max-w-2xl mx-auto px-6 border-b border-slate-200/20">
                    <div className="text-center mb-8">
                      <h2 className={`text-3xl font-extrabold mb-2 ${getHeadingColorClass(page.theme)}`}>{section.name}</h2>
                      <p className="text-slate-500 text-sm">{section.content || 'Submit your inquiries or register your information dynamically.'}</p>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        alert('Form submission simulated successfully!');
                      }}
                      className={`p-6 md:p-8 border rounded-2xl shadow-sm space-y-4 ${getCardThemeClass(page.theme)}`}
                    >
                      {fields.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No custom fields defined. Open the editor to add field elements.</p>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id}>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              {field.name} {field.required && <span className="text-rose-500">*</span>}
                            </label>
                            
                            {field.type === 'textarea' ? (
                              <textarea
                                required={field.required}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm"
                              />
                            ) : field.type === 'checkbox' ? (
                              <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
                                <input
                                  type="checkbox"
                                  required={field.required}
                                  className="rounded text-[#556B2F] focus:ring-[#556B2F] accent-[#556B2F]"
                                />
                                I agree to the terms
                              </label>
                            ) : (
                              <input
                                type={field.type}
                                required={field.required}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm"
                              />
                            )}
                          </div>
                        ))
                      )}

                      <button
                        type="submit"
                        disabled={fields.length === 0}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 mt-2 ${getButtonClass(page.theme)} disabled:opacity-50`}
                      >
                        Submit Request
                      </button>
                    </form>
                  </div>
                );

              case 'cta':
              default:
                return (
                  <div key={section.id} className="py-16 text-center max-w-4xl mx-auto px-6 border-b border-slate-200/20">
                    <div className={`p-8 md:p-12 rounded-2xl bg-gradient-to-r from-[#556B2F] to-[#D4AF37] text-white shadow-md`}>
                      <h2 className="text-3xl font-black mb-4">{section.name}</h2>
                      <p className="text-slate-100 text-sm max-w-xl mx-auto mb-6">
                        {section.content || 'Ready to plan your trip or list your property? Join our platform now.'}
                      </p>
                      <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl shadow hover:bg-slate-50 hover:shadow-lg transition-all duration-200">
                        Join Network
                      </button>
                    </div>
                  </div>
                );
            }
          })
        )}
      </div>
    </div>
  );
}
