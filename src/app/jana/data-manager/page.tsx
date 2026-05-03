'use client';

import React, { useState } from 'react';

export default function DataManagerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const exportData = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch all tables
      const res = await fetch('/api/jana/data-manager/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `siwa_oasis_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        setResult('Database exported successfully.');
      }
    } catch (e) {
      setResult('Export failed.');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/jana/data-manager/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        if (res.ok) {
          setResult('Data imported successfully!');
        } else {
          setResult('Import failed. Check format.');
        }
      } catch {
        setResult('Invalid JSON file.');
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="card-header">
        <h3><i className="fas fa-server"></i> Master Data & System State</h3>
      </div>

      <div className="notification-banner">
        <i className="fas fa-database"></i> Perform bulk operations, system backups, and data seeding. Use this to move data between development and production environments.
      </div>

      <div className="grid-2">
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h4><i className="fas fa-download"></i> System Backup (JSON)</h4>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '1rem 0' }}>
            Download a full snapshot of the marketplace state including business types, sections, form fields, and website templates.
          </p>
          <button className="btn btn-success" onClick={exportData} disabled={loading}>
            {loading ? 'Processing...' : 'Export All Data'}
          </button>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h4><i className="fas fa-upload"></i> Restore / Seed State</h4>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '1rem 0' }}>
            Upload a previously exported JSON file or a seed file to populate the database. <strong>Warning: This may overwrite existing definitions.</strong>
          </p>
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload} 
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
              disabled={loading}
            />
            <button className="btn btn-info" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Importing...' : 'Select JSON to Import'}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', borderTop: '4px solid #D4AF37' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h4 style={{ margin: 0 }}><i className="fas fa-file-excel"></i> Excel (CSV) Spreadsheet Bridge</h4>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Manage your marketplace architecture using Excel. Export tables, edit in bulk, and re-import.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <select id="csvTable" className="form-control" style={{ width: '200px', height: '38px' }}>
                <option value="businesses">🏢 Businesses (Marketplace)</option>
                <option value="business_types">📁 Business Types</option>
                <option value="sections">📋 Sections</option>
                <option value="form_fields">📝 Form Fields</option>
                <option value="locations">🗺️ Locations</option>
                <option value="profiles">👤 User Profiles</option>
                <option value="subscription_tiers">💎 Sub Tiers</option>
             </select>
             <button className="btn btn-primary" onClick={async () => {
                const table = (document.getElementById('csvTable') as HTMLSelectElement).value;
                window.location.href = `/api/jana/data-manager/csv?table=${table}`;
             }}>
                <i className="fas fa-download"></i> Download for Excel
             </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
           <input 
             type="file" 
             id="csvUpload" 
             accept=".csv" 
             style={{ display: 'none' }} 
             onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const table = (document.getElementById('csvTable') as HTMLSelectElement).value;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('table', table);
                
                setLoading(true);
                const res = await fetch('/api/jana/data-manager/csv', {
                  method: 'POST',
                  body: formData
                });
                setLoading(false);
                if (res.ok) setResult(`Excel import for ${table} successful!`);
                else setResult(`Import failed for ${table}. Check file format.`);
             }}
           />
           <label htmlFor="csvUpload" style={{ cursor: 'pointer' }}>
              <i className="fas fa-file-import fa-2x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
              <div style={{ fontWeight: 700 }}>Upload Edited Spreadsheet</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Click to select your edited CSV file</div>
           </label>
        </div>
      </div>

      {result && (
        <div className="card animate-in" style={{ borderLeft: '4px solid #D4AF37', background: '#fff9e6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="fas fa-info-circle"></i> {result}</span>
            <button className="btn btn-xs" onClick={() => setResult(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h4><i className="fas fa-terminal"></i> Database Utilities</h4>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn btn-outline btn-sm">Reset Cache</button>
          <button className="btn btn-outline btn-sm">Clean Orphand Fields</button>
          <button className="btn btn-outline btn-sm">Optimize Tables</button>
        </div>
      </div>
    </>
  );
}
