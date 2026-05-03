'use client';

import React from 'react';
import { FIELD_TYPES } from '@/lib/governance/constants';

interface Field {
  id: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string[];
  help_text?: string;
  vendor_editable?: boolean;
  is_admin_only?: boolean;
  requires_verification?: boolean;
  show_on_card?: boolean;
  is_public?: boolean;
  required_feature?: string;
  acl?: {
    read?: string[];
    write?: string[];
  };
}

interface Section {
  id: string;
  name: string;
  icon: string;
}

interface DynamicFormProps {
  fields: Field[];
  data: Record<string, Record<string, any>>; // Changed: Now expects { section_id: { field_name: value } }
  onChange: (sectionId: string, name: string, value: any) => void; // Changed: Pass sectionId
  readOnly?: boolean;
  userRole?: string;
  sections?: Section[];
  tierFeatures?: Record<string, boolean>;
}

export default function DynamicForm({ fields, data, onChange, readOnly, userRole, sections, tierFeatures = {} }: DynamicFormProps) {
  // 1. Group fields by section
  const groupedFields: Record<string, Field[]> = {};
  const sectionOrder: string[] = [];

  if (Array.isArray(fields)) {
    fields.forEach(field => {
      // ACL check
      if (field.acl?.read && !field.acl.read.includes(userRole || 'public')) return;

      const sid = (field as any).section_id || 'basic';
      if (!groupedFields[sid]) {
        groupedFields[sid] = [];
        sectionOrder.push(sid);
      }
      groupedFields[sid].push(field);
    });
  }

  // 2. Render Helper
  const renderField = (field: Field, sectionId: string) => {
    const sectionData = data[sectionId] || {};
    const value = sectionData[field.name] || '';

    const isSelect = ['select', 'radio_group'].includes(field.field_type);
    const isMulti = ['checkbox_group', 'multiselect'].includes(field.field_type);

    const isAdmin = ['super_admin', 'admin', 'content_admin'].includes(userRole || 'public');
    const featureMissing = !!(field.required_feature && !tierFeatures[field.required_feature] && !isAdmin);

    const defaultWriteRoles = ['super_admin', 'admin', 'content_admin', 'vendor'];
    const writeRoles = field.acl?.write || defaultWriteRoles;
    const hasWriteAccess = writeRoles.includes(userRole || 'public');
    const vendorCanEdit = field.vendor_editable !== false;

    const isFieldLocked = readOnly || !hasWriteAccess || (userRole === 'vendor' && !vendorCanEdit) || featureMissing;

    const handleChange = (val: any) => onChange(sectionId, field.name, val);

    return (
      <div
        key={`${sectionId}-${field.name}`}
        className={`form-group ${featureMissing ? 'feature-locked' : ''}`}
        style={{
          gridColumn: ['textarea', 'gallery', 'map', 'richtext', 'video', 'narrative'].includes(field.field_type) ? '1 / -1' : 'auto',
          position: 'relative'
        }}
      >
        <label className={`form-label ${field.required ? 'required' : ''}`}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {field.label}
            {featureMissing && <span className="badge badge-warning"><i className="fas fa-crown"></i> PREMIUM</span>}
          </span>
          {field.help_text && <span className="help-text">{field.help_text}</span>}
        </label>

        {featureMissing && (
          <div className="lock-overlay">
            <button className="btn btn-sm btn-dark">UPGRADE TO UNLOCK</button>
          </div>
        )}

        {field.field_type === 'textarea' || field.field_type === 'richtext' ? (
          <div style={{ position: 'relative' }}>
            <textarea
              className="form-control" 
              rows={['mini_blog', 'description', 'narrative'].includes(field.name) ? 12 : 6} 
              value={value}
              onChange={e => handleChange(e.target.value)} 
              readOnly={isFieldLocked}
              placeholder={`Enter the ${field.label.toLowerCase()} content here...`}
              style={{ fontSize: '1rem', lineHeight: '1.6', padding: '1.5rem', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />
            {!isFieldLocked && (
              <button 
                onClick={(e) => {
                  const ta = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                  if (document.fullscreenElement) document.exitFullscreen();
                  else ta.requestFullscreen();
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.8)', border: '1px solid #eee', borderRadius: '8px', padding: '5px 10px', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                <i className="fas fa-expand"></i> ZEN MODE
              </button>
            )}
          </div>
        ) : isSelect ? (
          <select
            className="form-control" value={value}
            onChange={e => handleChange(e.target.value)} disabled={isFieldLocked}
          >
            {(() => {
              try {
                const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                return Array.isArray(opts) ? opts.map(opt => <option key={opt} value={opt}>{opt}</option>) : null;
              } catch (e) { return null; }
            })()}
          </select>
        ) : isMulti ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {(() => {
              const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
              if (!Array.isArray(opts)) return null;
              const items = Array.isArray(value) ? value : [];
              return opts.map(opt => {
                const isChecked = items.includes(opt);
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isFieldLocked ? 'default' : 'pointer' }}>
                    <input
                      type="checkbox" checked={isChecked} disabled={isFieldLocked}
                      onChange={() => {
                        const next = isChecked ? items.filter((i: any) => i !== opt) : [...items, opt];
                        handleChange(next);
                      }}
                    />
                    <span style={{ fontSize: '0.8rem' }}>{opt}</span>
                  </label>
                );
              });
            })()}
          </div>
        ) : field.field_type === 'gallery' ? (
          <div className="gallery-manager">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              {(Array.isArray(value) ? value : []).map((item: any, i: number) => (
                <div key={i} className="gallery-item-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
                  <div style={{ height: '100px', position: 'relative' }}>
                    <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!isFieldLocked && (
                      <button onClick={() => {
                        const next = [...value]; next.splice(i, 1); handleChange(next);
                      }} style={{ position: 'absolute', top: 5, right: 5, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20 }}>×</button>
                    )}
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    <input
                      type="text" placeholder="Caption..." value={item.caption || ''}
                      onChange={e => {
                        const next = [...value]; next[i] = { ...item, caption: e.target.value };
                        handleChange(next);
                      }}
                      readOnly={isFieldLocked}
                      style={{ width: '100%', fontSize: '0.7rem', border: 'none', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
              {!isFieldLocked && (
                <label className="upload-btn" style={{ 
                  height: '135px', border: '2px dashed #ccc', display: 'flex', 
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', borderRadius: '8px', gap: '0.5rem',
                  background: '#f8fafc', transition: 'all 0.2s'
                }}>
                   <i className="fas fa-images fa-2x" style={{ opacity: 0.3 }}></i>
                   <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>BATCH UPLOAD</span>
                   <input type="file" multiple style={{ display: 'none' }} onChange={async (e) => {
                     const files = Array.from(e.target.files || []); if (files.length === 0) return;
                     
                     const btn = e.target.parentElement;
                     if (btn) {
                       btn.style.opacity = '0.5';
                       btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span style="font-size: 0.6rem">UPLOADING ${files.length}...</span>`;
                     }

                     try {
                       const newItems = [...(Array.isArray(value) ? value : [])];
                       for (const file of files) {
                         const fd = new FormData(); fd.append('file', file);
                         const res = await fetch('/api/upload', { method: 'POST', body: fd });
                         const json = await res.json();
                         if (json.url) newItems.push({ url: json.url, caption: '' });
                       }
                       handleChange(newItems);
                     } catch (err) {
                       console.error("Batch upload failed", err);
                     } finally {
                       if (btn) {
                         btn.style.opacity = '1';
                         btn.innerHTML = '<i class="fas fa-images fa-2x" style="opacity: 0.3"></i><span style="font-size: 0.7rem; font-weight: 700; color: #64748b">BATCH UPLOAD</span>';
                       }
                     }
                   }} />
                </label>
              )}
            </div>
          </div>
        ) : field.field_type === 'link_label' ? (
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <i className="fas fa-external-link-alt" style={{ color: '#3b82f6' }}></i>
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>
              {value || 'No Link Provided'}
            </a>
            {!isFieldLocked && (
              <input 
                type="text" placeholder="Paste URL here..." value={value} 
                onChange={e => handleChange(e.target.value)}
                style={{ marginLeft: 'auto', padding: '0.4rem', borderRadius: '6px', border: '1px solid #eee', fontSize: '0.7rem' }}
              />
            )}
          </div>
        ) : field.field_type === 'action_button' ? (
          <button 
            disabled={isFieldLocked}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
          >
            <i className="fas fa-bolt" style={{ color: '#D4AF37' }}></i>
            {field.label.toUpperCase()}
          </button>
        ) : (
          <input
            type="text" className="form-control" value={value}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
          />
        )}
      </div>
    );
  };

  if (!fields || fields.length === 0) return <p>No fields.</p>;

  return (
    <div>
      {sectionOrder.map(sid => (
        <section key={sid} style={{ marginBottom: '4rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: '#1e293b' }}>
            <i className={`fas ${sections?.find(s => s.id === sid)?.icon || 'fa-tag'}`} style={{ color: '#D4AF37' }}></i>
            {sections?.find(s => s.id === sid)?.name || sid.toUpperCase()}
          </h3>
          <div className="grid-2">
            {groupedFields[sid].map(f => renderField(f, sid))}
          </div>
        </section>
      ))}
    </div>
  );
}

