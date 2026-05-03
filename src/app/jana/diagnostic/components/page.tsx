'use client';

import { useState, useEffect } from 'react';

export default function ComponentLibraryDiagnosticPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      setLoading(true);
      console.log('Fetching component library...');
      const res = await fetch('/api/jana/component-library');
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Components loaded:', data.length);
        console.log('Components data:', data);
        setComponents(data);
      } else {
        const errorText = await res.text();
        setError(`API Error: ${res.status} - ${errorText}`);
      }
    } catch (e: any) {
      console.error('Failed to fetch components:', e);
      setError(`Fetch error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>📦 Component Library Diagnostic</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>📦 Component Library Diagnostic</h1>
        <div style={{ background: '#fee', border: '1px solid #fcc', padding: '1rem', borderRadius: '8px' }}>
          <h3>❌ Error</h3>
          <pre style={{ background: '#fff', padding: '1rem', overflow: 'auto' }}>{error}</pre>
        </div>
        <button onClick={fetchComponents} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📦 Component Library Diagnostic</h1>
      <p style={{ color: '#666' }}>This page shows all components in the library and verifies they load correctly.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px' }}>
        <h3>✅ API Status: SUCCESS</h3>
        <p><strong>Total Components:</strong> {components.length}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Components in Library:</h2>
        {components.length === 0 ? (
          <div style={{ padding: '2rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
            <p>⚠️ No components found in the library.</p>
            <p>The database tables exist but no components have been saved yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {components.map((comp) => (
              <div key={comp.id} style={{ 
                border: '1px solid #e5e7eb', 
                padding: '1.5rem', 
                borderRadius: '8px',
                background: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>
                      {comp.type === 'carousel' ? '🎬' : comp.type === 'blog_sidebar' ? '📰' : '📦'} {comp.name}
                    </h3>
                    <p style={{ color: '#666', margin: '0 0 0.5rem 0' }}>{comp.description || 'No description'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem', 
                      background: comp.is_active ? '#dcfce7' : '#fee2e2',
                      color: comp.is_active ? '#166534' : '#991b1b',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {comp.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Type:</strong> {comp.type}
                  </div>
                  <div>
                    <strong>Category:</strong> {comp.category}
                  </div>
                  <div>
                    <strong>Usage Count:</strong> {comp.usage_count || 0}
                  </div>
                  <div>
                    <strong>Is Global:</strong> {comp.is_global ? 'Yes' : 'No'}
                  </div>
                </div>

                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 600 }}>
                    View Configuration (JSON)
                  </summary>
                  <pre style={{ 
                    marginTop: '0.5rem',
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(comp.config, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px' }}>
        <h3>📋 Next Steps:</h3>
        <ol style={{ marginLeft: '1.5rem' }}>
          <li>If you see components above, the API is working correctly</li>
          <li>Visit <a href="/jana/website" style={{ color: '#3b82f6' }}>/jana/website</a></li>
          <li>In the builder, select the "Body" tab in the left sidebar</li>
          <li>Scroll down past the standard components</li>
          <li>You should see "📦 SAVED COMPONENTS" section</li>
          <li>If you don't see it, press Ctrl+F5 to hard refresh the page</li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <a href="/jana/website" style={{ 
          padding: '0.75rem 1.5rem', 
          background: '#3b82f6', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 600
        }}>
          Go to Website Builder →
        </a>
        <a href="/jana/component-library" style={{ 
          padding: '0.75rem 1.5rem', 
          background: '#8b5cf6', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 600
        }}>
          Manage Components →
        </a>
      </div>
    </div>
  );
}
