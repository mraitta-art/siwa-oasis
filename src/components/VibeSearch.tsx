'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MasterCard from './MasterCard';

export default function VibeSearch({ engineId, defaultCategory }: { engineId?: string; defaultCategory?: string }) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';
  const category = defaultCategory || categoryFromUrl || '';
  const isTransportation = category === 'transportation';
  const isRestaurant = category === 'restaurant';
  const isFood = category === 'food';
  const foodChildTypes = [
    { id: '', label: 'All food businesses' },
    { id: 'restaurant', label: 'Restaurants' },
    { id: 'siwan_kitchen', label: 'Traditional Siwan kitchens' },
    { id: 'cafe_juice', label: 'Cafes & juice bars' },
    { id: 'fine_dining', label: 'Fine dining' },
    { id: 'street_food_stall', label: 'Street food' },
    { id: 'bakery', label: 'Bakeries & pastry shops' },
    { id: 'catering_service', label: 'Catering services' },
    { id: 'food_truck', label: 'Food trucks' },
    { id: 'dessert_shop', label: 'Dessert & ice cream shops' },
  ];
  const transportationOptions = [
    'Car / Taxi',
    'Bus / Mini-Bus',
    '4x4 Desert Jeep',
    'Local Tuk-Tuk',
    'Private Transfer',
    'Vehicle Rental',
    'Bicycle/Scooter Rental',
  ];
  const transportFilterGroups = [
    { label: 'Vehicle type', options: transportationOptions },
    { label: 'Service type', options: ['Transfer', 'Tour', 'Delivery', 'Vehicle rental', 'Equipment rental', 'Guided journey', 'Airport pickup'] },
    { label: 'Comfort', options: ['Basic', 'Standard', 'Premium', 'Luxury'] },
    { label: 'Vehicle features', options: ['Air conditioning', 'Luggage space', 'Child seats', 'Wheelchair access', 'GPS', 'WiFi', 'Safety equipment'] },
    { label: 'Route coverage', options: ['Within Siwa Oasis', 'Airport Transfers (Cairo/Alex)', 'Desert Rescue/Retrieval', 'Cross-Country Trips'] },
  ];
  const restaurantFilterGroups = [
    { label: 'Cuisine', options: ['Traditional Siwan', 'Egyptian', 'Mediterranean', 'International', 'Vegetarian', 'Vegan', 'Bakery and desserts', 'Juices and drinks'] },
    { label: 'Dining service', options: ['Dine-in', 'Takeaway', 'Delivery', 'Catering', 'Reservations', 'Private events'] },
    { label: 'Dietary options', options: ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free options', 'Allergen-aware kitchen'] },
    { label: 'Seating & setting', options: ['Indoor', 'Outdoor terrace', 'Garden', 'Floor seating', 'Table seating', 'Counter', 'Communal', 'Private room'] },
    { label: 'Price range', options: ['Budget', 'Moderate', 'Premium', 'Fine dining'] },
  ];
  const [availableVibes, setAvailableVibes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minimumPassengers, setMinimumPassengers] = useState('');
  const [selectedChildType, setSelectedChildType] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<'compact' | 'standard' | 'wide'>('standard');
  const activeFilterCount = selectedTags.length + (selectedChildType ? 1 : 0) + (minimumPassengers ? 1 : 0);
  const summary = activeFilterCount > 0
    ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`
    : 'All businesses';

  // 1. Fetch Dynamic Config
  useEffect(() => {
    const controller = new AbortController();

    async function loadConfig() {
      const url = engineId ? `/api/discovery/vibe-config?engineId=${engineId}` : '/api/discovery/vibe-config';
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Vibe config request failed: ${res.status}`);
        const data = await res.json();
        if (data.options) {
          const categoryOptions = category === 'transportation' ? transportationOptions : category === 'restaurant' || category === 'food' ? [] : data.options;
          setAvailableVibes(categoryOptions);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Unable to load vibe configuration', error);
          setAvailableVibes([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadConfig();

    return () => controller.abort();
  }, [engineId, category]);

  // 2. Trigger Search when tags change
  useEffect(() => {
    const controller = new AbortController();

    async function performSearch() {
      setLoading(true);
      try {
        const res = await fetch('/api/discovery/vibe-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: selectedTags, category, engineId, childType: selectedChildType || null, minimumPassengers: minimumPassengers ? Number(minimumPassengers) : null }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Vibe search request failed: ${res.status}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Unable to load vibe search results', error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    performSearch();

    return () => controller.abort();
  }, [selectedTags, category, engineId, minimumPassengers, selectedChildType]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="vibe-search-container" style={{ margin: '1rem 0' }}>
      <div className="vibe-search-toolbar">
        <div>
          <div className="vibe-search-kicker">Smart discovery</div>
          <div className="vibe-search-summary">{summary}</div>
        </div>
        <div className="vibe-search-actions">
          <div className="vibe-search-size" aria-label="Search panel size">
            {(['compact', 'standard', 'wide'] as const).map(size => (
              <button
                key={size}
                type="button"
                className={panelSize === size ? 'is-active' : ''}
                aria-label={`${size} search panel`}
                aria-pressed={panelSize === size}
                onClick={() => setPanelSize(size)}
              >
                <span aria-hidden="true">{size === 'compact' ? '−' : size === 'standard' ? '＝' : '＋'}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="vibe-search-toggle"
            aria-expanded={panelOpen}
            aria-controls="vibe-filter-panel"
            onClick={() => setPanelOpen(open => !open)}
          >
            <i className={`fas ${panelOpen ? 'fa-chevron-up' : 'fa-sliders-h'}`} aria-hidden="true"></i>
            {panelOpen ? 'Hide filters' : 'Refine'}
          </button>
        </div>
      </div>
      
      {/* Dynamic Vibe Selection UI */}
      {panelOpen && <div id="vibe-filter-panel" className="vibe-filter-panel" data-size={panelSize}>
        <div className="vibe-filter-panel-header">
          <span>Choose what matters</span>
          <span className="vibe-filter-hint">Results update instantly</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
          {defaultCategory ? `Find the best ${defaultCategory.replace(/-/g, ' ')} in Siwa` : 'What is your Siwa Story today?'}
        </h2>
        {isFood && (
          <div className="vibe-filter-options" style={{ maxWidth: '1050px', margin: '0 auto 1rem' }}>
            {foodChildTypes.map(type => (
              <button
                key={type.id || 'all-food'}
                type="button"
                onClick={() => setSelectedChildType(type.id)}
                className={`vibe-filter-chip ${selectedChildType === type.id ? 'is-active' : ''}`}
                style={{ border: selectedChildType === type.id ? '2px solid #D4AF37' : '1px solid #e2e8f0', background: selectedChildType === type.id ? '#fffbeb' : '#fff', color: selectedChildType === type.id ? '#a16207' : '#64748b' }}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
        {isTransportation && (
          <div className="vibe-filter-control" style={{ margin: '0 auto 1rem', maxWidth: '320px', textAlign: 'left' }}>
            <label htmlFor="transport-passengers" style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Minimum passengers
            </label>
            <select
              id="transport-passengers"
              value={minimumPassengers}
              onChange={(event) => setMinimumPassengers(event.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', color: '#475569', fontWeight: 700 }}
            >
              <option value="">Any capacity</option>
              {[1, 2, 4, 6, 8, 12, 20].map((passengers) => (
                <option key={passengers} value={passengers}>{passengers}+ passengers</option>
              ))}
            </select>
          </div>
        )}
        {isTransportation || isRestaurant || isFood ? (isTransportation ? transportFilterGroups : restaurantFilterGroups).map(group => (
          <div key={group.label} className="vibe-filter-group" style={{ margin: '0 auto 1.25rem', maxWidth: '1050px' }}>
            <div style={{ marginBottom: '0.6rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{group.label}</div>
            <div className="vibe-filter-options">
              {group.options.map(option => {
                const isActive = selectedTags.includes(option);
                return (
                  <button
                    key={`${group.label}-${option}`}
                    onClick={() => toggleTag(option)}
                      className={`vibe-filter-chip ${isActive ? 'is-active' : ''}`}
                      style={{
                      borderRadius: '100px',
                      border: isActive ? '2px solid #D4AF37' : '1px solid #e2e8f0',
                      background: isActive ? 'rgba(212, 175, 55, 0.1)' : '#fff',
                      color: isActive ? '#D4AF37' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 10px 20px -5px rgba(212, 175, 55, 0.3)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle-notch'}`} style={{ fontSize: '0.65rem' }}></i>
                    {option.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="vibe-filter-options" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {availableVibes.filter(vibe => typeof vibe === 'string').map(vibe => {
              const isActive = selectedTags.includes(vibe);
              return (
                <button
                  key={vibe}
                  onClick={() => toggleTag(vibe)}
                  className={`vibe-filter-chip ${isActive ? 'is-active' : ''}`}
                  style={{ border: isActive ? '2px solid #D4AF37' : '1px solid #e2e8f0', background: isActive ? 'rgba(212, 175, 55, 0.1)' : '#fff', color: isActive ? '#D4AF37' : '#64748b', boxShadow: isActive ? '0 10px 20px -5px rgba(212, 175, 55, 0.3)' : 'none' }}
                >
                  <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle-notch'}`} style={{ fontSize: '0.7rem' }}></i>
                  {(vibe || '').toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
        {selectedTags.length > 0 && (
          <button 
            onClick={() => setSelectedTags([])}
            style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '1px' }}
          >
            <i className="fas fa-times-circle" style={{ marginRight: '0.5rem' }}></i> RESET SELECTION
          </button>
        )}
        </div>
      </div>}

      {/* Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
          <div style={{ marginTop: '1rem', fontWeight: 800, fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '2px' }}>CURATING EXPERIENCES...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {results.length > 0 ? (
            results.map(biz => {
              const data = typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data;
              // Dynamically hunt for the best image
              const sectionValues = Object.values(data || {}) as any[];
              const image = data?.business_logo || data?.logo || sectionValues.find(s => s?.section_gallery)?.[0]?.url || 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&q=80&w=1200';
              
              // 1. Extract dynamic hint/teaser from custom_data
              let hint = '';
              if (data) {
                const basic = data.basic || {};
                hint = basic.description || basic.summary || basic.about || '';
                
                if (!hint) {
                  for (const section of Object.values(data)) {
                    if (section && typeof section === 'object') {
                      const text = (section as any).mini_blog || (section as any).description || (section as any).about || (section as any).summary;
                      if (text && typeof text === 'string') {
                        hint = text.replace(/<[^>]*>/g, '');
                        break;
                      }
                    }
                  }
                }
              }
              if (!hint) {
                hint = `Explore authentic ${biz.type_name.toLowerCase()} experiences in the historical heart of Siwa Oasis.`;
              }
              if (hint.length > 110) {
                hint = hint.slice(0, 110) + '...';
              }

              // 2. Build premium category and governance badges
              let badge = biz.type_name || '';
              if (biz.is_featured) badge = `⭐ FEATURED • ${badge}`;
              else if (biz.is_recommended) badge = `🏆 RECOMMENDED • ${badge}`;
              else if (biz.is_trusted) badge = `🛡️ VERIFIED • ${badge}`;
              
              return (
                <MasterCard
                  key={biz.id}
                  title={biz.name}
                  description={hint}
                  image={image}
                  tag={badge}
                  onCardClick={() => window.location.href = `/${biz.slug || biz.id}`}
                  links={[
                    { label: 'Explore Journey', icon: 'fa-arrow-right', onClick: () => window.location.href = `/${biz.slug || biz.id}` }
                  ]}
                />
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
              <i className="fas fa-search fa-3x" style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}></i>
              <h3 style={{ color: '#1e293b' }}>No direct matches for this specific combination.</h3>
              <p style={{ color: '#64748b' }}>Try broadening your search or selecting a single vibe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
