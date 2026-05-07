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
  data: any;
  onChange: (sectionId: string, fieldName: string, value: any) => void;
  readOnly?: boolean;
  userRole?: string;
  sections: Section[];
  tierFeatures?: {
    maxSlides?: number;
    maxImages?: number;
    allowedMediaTypes?: string[]; // ['image', 'youtube', 'video']
    [key: string]: any;
  };
  businessName?: string;
  typology?: string;
}

export default function DynamicForm({ fields, data, onChange, readOnly, userRole, sections, tierFeatures = {}, businessName, typology }: DynamicFormProps) {
  const [currentLang, setCurrentLang] = React.useState('en');
  const languages = [
    { code: 'en', label: 'English', icon: '🇬🇧' },
    { code: 'zh', label: 'Chinese', icon: '🇨🇳' },
    { code: 'ko', label: 'Korean', icon: '🇰🇷' },
    { code: 'fr', label: 'French', icon: '🇫🇷' }
  ];

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

    // TIER RECONCILIATION: Check media type allowance
    const isMediaAllowed = (type: string) => {
      if (isAdmin) return true;
      const allowed = tierFeatures.allowedMediaTypes || ['image'];
      return allowed.includes(type);
    };

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

        {field.field_type === 'rich_text' || field.field_type === 'richtext' || field.field_type === 'narrative' ? (
          <div className="rich-text-container" style={{ position: 'relative', background: '#fff', borderRadius: '24px', border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <div className="editor-toolbar" style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <button onClick={() => document.execCommand('bold')} className="editor-tool-btn" title="Bold"><i className="fas fa-bold"></i></button>
                <button onClick={() => document.execCommand('italic')} className="editor-tool-btn" title="Italic"><i className="fas fa-italic"></i></button>
                <button onClick={() => document.execCommand('formatBlock', false, 'h3')} className="editor-tool-btn" title="Heading"><i className="fas fa-heading"></i></button>
                <button onClick={() => document.execCommand('insertUnorderedList')} className="editor-tool-btn" title="List"><i className="fas fa-list-ul"></i></button>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {!isFieldLocked && (
                  <label className="editor-tool-btn" style={{ cursor: 'pointer', color: '#D4AF37' }} title="Insert Image">
                    <i className="fas fa-image"></i>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', 'siwa_standard'); // Assuming preset exists
                        try {
                          const res = await fetch(`https://api.cloudinary.com/v1_1/siwatoday/image/upload`, { method: 'POST', body: formData });
                          const data = await res.json();
                          document.execCommand('insertImage', false, data.secure_url);
                        } catch (err) { console.error("Upload failed", err); }
                      }}
                    />
                  </label>
                )}
              </div>

              <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>CINEMATIC NARRATIVE STUDIO</div>

              {isAdmin && !isFieldLocked && (
                <button
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const editor = btn.parentElement?.nextElementSibling as HTMLElement;
                    btn.innerHTML = '<i class="fas fa-magic fa-spin"></i> GENERATING...';
                    btn.style.opacity = '0.5';
                    try {
                      const res = await fetch('/api/jana/ai-generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessName, sectionName: field.label, typology })
                      });
                      const json = await res.json();
                      if (json.story) {
                        editor.innerHTML = json.story;
                        handleChange(json.story);
                      }
                    } catch (err) { console.error(err); }
                    btn.innerHTML = '<i class="fas fa-magic"></i> AI MAGIC';
                    btn.style.opacity = '1';
                  }}
                  style={{ marginLeft: '1rem', background: '#1e293b', border: 'none', color: '#D4AF37', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                >
                  <i className="fas fa-magic"></i> AI MAGIC
                </button>
              )}

              {!isFieldLocked && (
                <button
                  onClick={(e) => {
                    const editor = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                    if (document.fullscreenElement) document.exitFullscreen();
                    else editor.requestFullscreen();
                  }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  <i className="fas fa-expand-arrows-alt" style={{ marginRight: '0.5rem' }}></i> ZEN MODE
                </button>
              )}
            </div>

            <div
              contentEditable={!isFieldLocked}
              onBlur={e => handleChange(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: value || '' }}
              style={{
                minHeight: '400px', padding: '3rem', fontSize: '1.2rem', lineHeight: '1.8',
                color: '#334155', fontFamily: 'Inter, serif', outline: 'none', background: '#fff',
                overflowY: 'auto'
              }}
              className="narrative-canvas"
            />
          </div>
        ) : field.field_type === 'map' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              height: '180px', background: '#f1f5f9', borderRadius: '16px', overflow: 'hidden',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #e2e8f0'
            }}>
              {value && value.includes(',') ? (
                <iframe
                  width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_API_KEY&q=${value}`}
                  allowFullScreen
                ></iframe>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                  <i className="fas fa-map-marked-alt fa-3x" style={{ color: '#D4AF37', marginBottom: '1rem' }}></i>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>ENTER COORDINATES TO PREVIEW</div>
                </div>
              )}
              {value && (
                <a
                  href={`https://www.google.com/maps?q=${value}`} target="_blank" rel="noopener noreferrer"
                  style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, color: '#1e293b', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textDecoration: 'none' }}
                >
                  <i className="fas fa-external-link-alt" style={{ marginRight: '5px' }}></i> OPEN IN GOOGLE MAPS
                </a>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-crosshairs" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="text" className="form-control" placeholder="Latitude, Longitude (e.g. 29.2023, 25.5244)"
                value={value || ''} onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        ) : field.field_type === 'youtube' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative', height: '200px', background: '#000', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {value ? (
                <img src={`https://img.youtube.com/vi/${value.split('v=')[1]?.split('&')[0] || value.split('/').pop()}/maxresdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt="Preview" />
              ) : (
                <i className="fab fa-youtube fa-4x" style={{ color: '#ff0000' }}></i>
              )}
              <div style={{ position: 'absolute', zIndex: 1, textAlign: 'center', color: '#fff' }}>
                <div style={{ fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>CINEMATIC PREVIEW</div>
                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{value ? 'READY TO STREAM' : 'NO VIDEO LINK'}</div>
                {!isMediaAllowed('youtube') && (
                  <div style={{ background: '#D4AF37', color: '#000', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900, marginTop: '1rem' }}>
                    <i className="fas fa-lock"></i> UPGRADE FOR YOUTUBE
                  </div>
                )}
              </div>
            </div>
            <input
              type="text" className="form-control" placeholder={isMediaAllowed('youtube') ? "Paste YouTube URL or ID..." : "YouTube locked for this tier"}
              value={value || ''} onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked || !isMediaAllowed('youtube')}
            />
          </div>
        ) : field.field_type === 'star_rating' ? (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => !isFieldLocked && handleChange(star)}
                style={{ background: 'none', border: 'none', cursor: isFieldLocked ? 'default' : 'pointer', fontSize: '1.5rem', color: star <= (parseInt(value) || 0) ? '#D4AF37' : '#e2e8f0', transition: 'all 0.2s' }}
              >
                <i className={`fa${star <= (parseInt(value) || 0) ? 's' : 'r'} fa-star`}></i>
              </button>
            ))}
            <span style={{ marginLeft: '1rem', fontWeight: 800, color: '#64748b', alignSelf: 'center' }}>{value || 0} / 5</span>
          </div>
        ) : field.field_type === 'boolean' ? (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
            background: value ? 'rgba(34,197,94,0.05)' : '#f8fafc',
            borderRadius: '16px', border: value ? '1px solid #22c55e40' : '1px solid #e2e8f0',
            cursor: isFieldLocked ? 'default' : 'pointer', transition: 'all 0.3s'
          }}>
            <input
              type="checkbox" checked={!!value}
              onChange={e => handleChange(e.target.checked)}
              disabled={isFieldLocked}
              style={{ width: '20px', height: '20px', accentColor: '#22c55e' }}
            />
            <span style={{ fontWeight: 800, color: value ? '#166534' : '#64748b', fontSize: '0.85rem' }}>
              {value ? 'ENABLED / ACTIVE' : 'DISABLED / INACTIVE'}
            </span>
          </label>
        ) : isSelect ? (
          <select
            className="form-control" value={value || ''}
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
          <div className="premium-gallery-manager" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {(Array.isArray(value) ? value : []).map((item: any, i: number) => (
                <div key={i} className="gallery-item-card animate-in" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ height: '140px', position: 'relative' }}>
                    <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!isFieldLocked && (
                      <button onClick={() => {
                        const next = [...value]; next.splice(i, 1); handleChange(next);
                      }} style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}>
                        <i className="fas fa-trash-alt" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                    )}

                    {/* HERO PROMOTION TOGGLE */}
                    <button
                      onClick={() => {
                        if (isFieldLocked) return;
                        const featuredCount = value.filter((p: any) => p.is_hero).length;
                        if (!item.is_hero && featuredCount >= (tierFeatures.maxSlides || 3) && !isAdmin) {
                          alert(`Hero Slide Limit Reached (${tierFeatures.maxSlides || 3} max). Please upgrade or unselect another photo.`);
                          return;
                        }
                        const next = [...value];
                        next[i] = { ...item, is_hero: !item.is_hero };
                        handleChange(next);
                      }}
                      style={{
                        position: 'absolute', top: 10, left: 10,
                        background: item.is_hero ? '#D4AF37' : 'rgba(255,255,255,0.8)',
                        color: item.is_hero ? '#fff' : '#64748b',
                        border: 'none', borderRadius: '8px', padding: '4px 8px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.6rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      <i className={`fa${item.is_hero ? 's' : 'r'} fa-star`}></i>
                      {item.is_hero ? 'FEATURED IN HERO' : 'PROMOTE TO HERO'}
                    </button>

                    <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>
                      SLOT {i + 1}
                    </div>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>SLIDE CAPTION</label>
                    <textarea
                      placeholder="Story for this slide..." value={item.caption || ''}
                      onChange={e => {
                        const next = [...value]; next[i] = { ...item, caption: e.target.value };
                        handleChange(next);
                      }}
                      readOnly={isFieldLocked}
                      style={{ width: '100%', fontSize: '0.8rem', border: 'none', outline: 'none', background: '#fcfcfc', borderRadius: '8px', padding: '0.5rem', resize: 'none', minHeight: '60px', color: '#475569', fontWeight: 600 }}
                    />
                  </div>
                </div>
              ))}
              {!isFieldLocked && (
                <label className="upload-dropzone hover-lift" style={{
                  height: '240px', border: '2px dashed #D4AF3740', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', borderRadius: '20px', gap: '1rem',
                  background: 'rgba(212,175,55,0.03)', transition: 'all 0.3s'
                }}>
                  <div style={{ width: 60, height: 60, background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                    <i className="fas fa-cloud-upload-alt fa-2x"></i>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>UPLOAD MEDIA</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>JPEG, PNG, WEBP (MAX 10MB)</div>
                  </div>
                  <input type="file" multiple style={{ display: 'none' }} onChange={async (e) => {
                    const files = Array.from(e.target.files || []); if (files.length === 0) return;

                    const dropzone = e.target.parentElement;
                    if (dropzone) {
                      dropzone.style.opacity = '0.5';
                      dropzone.innerHTML = `<i class="fas fa-circle-notch fa-spin fa-2x" style="color: #D4AF37"></i><div style="font-weight: 900; font-size: 0.7rem; color: #1e293b">UPLOADING ${files.length}...</div>`;
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
                      if (dropzone) {
                        dropzone.style.opacity = '1';
                        dropzone.innerHTML = `<div style="width: 60px; height: 60px; background: rgba(212,175,55,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #D4AF37"><i class="fas fa-cloud-upload-alt fa-2x"></i></div><div style="text-align: center"><div style="font-size: 0.8rem; font-weight: 900; color: #1e293b">UPLOAD MEDIA</div><div style="font-size: 0.65rem; color: #94a3b8; margin-top: 0.25rem">JPEG, PNG, WEBP (MAX 10MB)</div></div><input type="file" multiple style={{ display: 'none' }} />`;
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
                type="text" placeholder="Paste URL here..." value={value || ''}
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
            {(field.label || '').toUpperCase()}
          </button>
        ) : (
          <input
            type="text" className="form-control" value={value || ''}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
          />
        )}
      </div>
    );
  };

  if (!fields || fields.length === 0) return <p>No fields.</p>;

  return (
    <div className="dynamic-form">
      {/* GLOBAL LANGUAGE SWITCHER */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setCurrentLang(lang.code)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: currentLang === lang.code ? '#1e293b' : 'transparent',
              color: currentLang === lang.code ? '#fff' : '#64748b',
              fontSize: '0.65rem', fontWeight: 900, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <span>{lang.icon}</span>
            <span>{lang.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {sectionOrder.map(sid => (
        <section key={sid} style={{ marginBottom: '4rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: '#1e293b' }}>
            <i className={`fas ${sections?.find(s => s.id === sid)?.icon || 'fa-tag'}`} style={{ color: '#D4AF37' }}></i>
            {sections?.find(s => s.id === sid)?.name || (sid || '').toUpperCase()}
          </h3>
          <div className="grid-2">
            {groupedFields[sid].map(f => renderField(f, sid))}
          </div>
        </section>
      ))}
    </div>
  );
}

