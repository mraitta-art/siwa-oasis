'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Field {
  id: string;
  name: string;
  label: string;
  field_type: string;
  value: any;
  options?: any;
  help_text?: string;
}

interface Section {
  id: string;
  name: string;
  icon: string;
  fields: Field[];
}

import DynamicForm from '@/components/DynamicForm';

export default function VendorStudio() {
  const notify = (msg: string, type: string = 'info') => console.log(type, msg);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadStory();
  }, []);

  async function loadStory() {
    try {
      const res = await fetch('/api/vendor/story');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBusiness(data.business);
      setSections(data.structure);
      if (data.structure.length > 0) setActiveSection(data.structure[0].id);

      // Initialize form data
      const initialData: Record<string, any> = {};
      data.structure.forEach((s: Section) => {
        initialData[s.id] = {};
        s.fields.forEach((f: any) => {
          initialData[s.id][f.name] = f.value;
        });
      });
      setFormData(initialData);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData })
      });
      if (res.ok) {
        notify('Your story has been updated and is now live!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="studio-loader">Preparing your Storyteller Studio...</div>;

  const currentSection = sections.find(s => s.id === activeSection);
  
  // Flatten fields for DynamicForm
  const allFields = sections.flatMap(s => s.fields.map(f => ({ ...f, section_id: s.id })));

  return (
    <div className="studio-container">
      {/* ── SIDEBAR: CHAPTERS ────────────────────────────────────────── */}
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <i className="fas fa-sun"></i>
          <span>SIWA STUDIO</span>
        </div>
        
        <nav className="studio-nav">
          <div className="nav-label">STORY CHAPTERS</div>
          {sections.map(s => (
            <button 
              key={s.id} 
              className={`nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <i className={`fas ${s.icon}`}></i>
              {s.name}
              {['basic', 'location', 'contact'].includes(s.id) && <span className="dna-indicator" title="Core DNA Section"></span>}
            </button>
          ))}
        </nav>

        <div className="studio-footer">
          <Link href={`/business/${business?.id}`} target="_blank" className="btn-preview">
            <i className="fas fa-external-link-alt"></i> VIEW MINISITE
          </Link>
          <button className="btn-save" onClick={saveChanges} disabled={saving}>
            {saving ? 'SAVING...' : 'PUBLISH STORY'}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA: EDITOR ─────────────────────────────────────────── */}
      <main className="studio-main">
        <header className="studio-header">
          <div className="header-info">
            <h1>{currentSection?.name}</h1>
            <p>Tell the story of your business in this chapter.</p>
          </div>
          <div className="biz-status">
            <span className={`status-pill ${business?.status}`}>{business?.status.toUpperCase()}</span>
            {business?.published && <span className="live-pill">LIVE</span>}
          </div>
        </header>

        <section className="editor-canvas">
          <div className="form-stack">
            <DynamicForm 
              fields={allFields.filter(f => f.section_id === activeSection)}
              data={formData}
              onChange={handleInputChange}
              userRole="vendor"
              sections={sections}
            />
          </div>
        </section>
      </main>

      <style jsx>{`
        .studio-container { display: flex; height: 100vh; background: #fcfcfc; color: #1a1a1a; }
        .studio-sidebar { width: 320px; background: #fff; border-right: 1px solid #eee; display: flex; flexDirection: column; }
        .studio-brand { padding: 2rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #f9f9f9; }
        .studio-brand i { color: #D4AF37; font-size: 1.5rem; }
        .studio-brand span { font-weight: 900; letter-spacing: 2px; font-size: 0.9rem; }
        
        .studio-nav { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-label { font-size: 0.65rem; font-weight: 900; color: #999; letter-spacing: 1.5px; margin-bottom: 1rem; }
        .nav-item { border: none; background: none; padding: 1rem; border-radius: 12px; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 1rem; font-weight: 700; color: #666; transition: all 0.2s; }
        .nav-item i { width: 20px; color: #ccc; }
        .nav-item:hover { background: #f9f9f9; color: #333; }
        .nav-item.active { background: #1a1a1a; color: #fff; }
        .nav-item.active i { color: #D4AF37; }
        
        .dna-indicator { width: 6px; height: 6px; border-radius: 50%; background: #D4AF37; margin-left: auto; }
        
        .studio-footer { padding: 1.5rem; border-top: 1px solid #f9f9f9; display: flex; flex-direction: column; gap: 0.75rem; }
        .btn-preview { text-align: center; padding: 0.85rem; border-radius: 10px; border: 1.5px solid #eee; text-decoration: none; color: #666; font-weight: 800; font-size: 0.75rem; }
        .btn-save { padding: 1rem; border-radius: 10px; border: none; background: #D4AF37; color: #1a1a1a; font-weight: 900; cursor: pointer; }
        
        .studio-main { flex: 1; overflow-y: auto; padding: 4rem; }
        .studio-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4rem; }
        .studio-header h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; }
        .studio-header p { color: #999; margin-top: 0.5rem; }
        
        .live-pill { background: #000; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.6rem; font-weight: 900; margin-left: 0.5rem; }
        .status-pill { border: 1px solid #eee; padding: 4px 10px; border-radius: 4px; font-size: 0.6rem; font-weight: 900; }
        
        .form-stack { max-width: 700px; display: flex; flex-direction: column; gap: 3rem; }
        .field-group { display: flex; flex-direction: column; gap: 1rem; }
        .field-label-row { display: flex; align-items: center; gap: 0.5rem; }
        .field-label-row label { font-weight: 900; font-size: 0.8rem; text-transform: uppercase; color: #333; }
        
        .studio-input { width: 100%; padding: 1.25rem; border-radius: 14px; border: 1.5px solid #eee; background: #f9f9f9; outline: none; font-size: 1rem; transition: all 0.2s; }
        .studio-input:focus { border-color: #D4AF37; background: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.02); }
        
        .dna-badge { font-size: 0.6rem; font-weight: 900; color: #D4AF37; letter-spacing: 1px; display: flex; align-items: center; gap: 0.5rem; }
        
        .studio-loader { height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #D4AF37; font-weight: 900; letter-spacing: 3px; }
      `}</style>
    </div>
  );
}
