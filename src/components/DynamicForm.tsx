'use client';

import React from 'react';
import { FIELD_TYPES } from '@/lib/governance/constants';
import { useAdmin, AdminContext } from '@/context/AdminContext';

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
  business?: any;
}

export default function DynamicForm({ fields, data, onChange, readOnly, userRole, sections, tierFeatures = {}, businessName, typology, business }: DynamicFormProps) {
  const adminCtx = React.useContext(AdminContext);
  const notify = adminCtx?.notify || (() => {});
  
  const [currentLang, setCurrentLang] = React.useState('en');
  const [uploadingFields, setUploadingFields] = React.useState<Record<string, boolean>>({});
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

    // 🏛️ GLOBAL SOCIAL INJECTION: Ensure Identity Chapter always has social slots
    if (groupedFields['sec_1_identity']) {
      const socialFields = [
        { name: 'instagram_handle', label: 'Instagram Handle', field_type: 'text', help_text: 'e.g. @siwatoday' },
        { name: 'facebook_link', label: 'Facebook Page Link', field_type: 'text' },
        { name: 'tiktok_handle', label: 'TikTok Handle', field_type: 'text' },
        { name: 'wechat_id', label: 'WeChat ID', field_type: 'text', help_text: 'For direct discovery in the Chinese market' },
      ];
      
      socialFields.forEach(sf => {
        const exists = groupedFields['sec_1_identity'].some(f => f.name === sf.name);
        if (!exists) {
          groupedFields['sec_1_identity'].push({ ...sf, section_id: 'sec_1_identity' } as any);
        }
      });
    }
  }

  // 2. Render Helper
  const renderField = (field: Field, sectionId: string) => {
    const sectionData = data[sectionId] || {};
    const value = sectionData[field.name] || '';

    const isSelect = ['select', 'radio_group'].includes(field.field_type);
    const isMulti = ['checkbox_group', 'multiselect'].includes(field.field_type);

    const isTrial = business?.subscription_tier === 'trial' || (business?.trial_expires_at && new Date(business.trial_expires_at) > new Date());
    const isAdmin = ['super_admin', 'admin', 'content_admin'].includes(userRole || 'public');
    
    // TRIAL LOGIC: Unlock features but limit resources
    const featureMissing = !!(field.required_feature && !tierFeatures[field.required_feature] && !isAdmin && !isTrial);
    const uploadSizeLimit = isTrial ? 2 * 1024 * 1024 : (tierFeatures.maxUploadSize || 10 * 1024 * 1024); // 2MB for trial, 10MB standard
    
    const isFieldLocked = featureMissing || (field.vendor_editable === false && !isAdmin);

    const isUniversal = field.business_type_id === 'SECTION_TEMPLATE';
    const isInherited = field.is_inherited || field.section_origin === 'inherited';
    
    let originColor = '#10b981';
    let originLabel = 'UNIQUE';
    if (isUniversal) { originColor = '#D4AF37'; originLabel = 'UNIVERSAL'; }
    else if (isInherited) { originColor = '#3b82f6'; originLabel = 'INHERITED'; }

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
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {field.label}
            <span style={{ 
              fontSize: '0.45rem', background: `${originColor}15`, color: originColor, 
              padding: '2px 6px', borderRadius: '4px', border: `1px solid ${originColor}30`,
              fontWeight: 900, letterSpacing: '1px'
            }}>
              {originLabel}
            </span>
            <span style={{ 
              fontSize: '0.45rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', 
              padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 900, letterSpacing: '1px'
            }}>
              {(field.field_type || 'TEXT').toUpperCase()}
            </span>
            {featureMissing && <span className="badge badge-warning"><i className="fas fa-crown"></i> PREMIUM</span>}
          </span>
          {field.help_text && <span className="help-text">{field.help_text}</span>}
        </label>

        {isTrial && business?.trial_expires_at && (new Date(business.trial_expires_at).getTime() - new Date().getTime()) < 3 * 24 * 60 * 60 * 1000 && (
          <div style={{ 
            gridColumn: '1 / -1', background: 'linear-gradient(90deg, #D4AF37, #B45309)', 
            padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 10px 20px rgba(212,175,55,0.2)', animation: 'pulse 2s infinite'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <i className="fas fa-hourglass-half" style={{ color: '#0f172a', fontSize: '1.2rem' }}></i>
              <div>
                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.85rem' }}>TRIAL ENDING SOON</div>
                <div style={{ fontSize: '0.65rem', color: '#0f172a', fontWeight: 700, opacity: 0.8 }}>
                  Your premium access expires in {Math.round((new Date(business.trial_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60))} hours.
                </div>
              </div>
            </div>
            <button style={{ background: '#0f172a', color: '#D4AF37', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer' }}>
              UPGRADE NOW
            </button>
          </div>
        )}

        {featureMissing && (
          <div className="lock-overlay">
            <button className="btn btn-sm btn-dark">UPGRADE TO UNLOCK</button>
          </div>
        )}

        {field.field_type === 'rich_text' || field.field_type === 'richtext' || field.field_type === 'narrative' ? (
          <div className="rich-text-container" style={{ position: 'relative', background: '#fff', borderRadius: '24px', border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <details style={{ width: '100%' }}>
              <summary style={{ 
                listStyle: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#1e293b10', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-book-open"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>
                      MASTER STORYTELLER <span style={{ opacity: 0.3, marginLeft: '5px' }}>•</span> {value ? (value as string).replace(/<[^>]*>/g, '').split(/\s+/).length : 0} WORDS
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 800 }}>CLICK TO EXPAND NARRATIVE CANVAS</div>
                  </div>
                </div>
                <div style={{ background: '#D4AF37', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900 }}>
                  OPEN EDITOR
                </div>
              </summary>

              <div className="editor-toolbar" style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.25rem', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <button onClick={() => document.execCommand('bold')} className="editor-tool-btn" title="Bold"><i className="fas fa-bold"></i></button>
                  <button onClick={() => document.execCommand('italic')} className="editor-tool-btn" title="Italic"><i className="fas fa-italic"></i></button>
                  <button onClick={() => document.execCommand('formatBlock', false, 'h3')} className="editor-tool-btn" title="Heading"><i className="fas fa-heading"></i></button>
                  <button onClick={() => document.execCommand('insertUnorderedList')} className="editor-tool-btn" title="List"><i className="fas fa-list-ul"></i></button>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {!isFieldLocked && (
                    <label className="editor-tool-btn" style={{ cursor: 'pointer', color: uploadingFields[`${field.id}-img`] ? '#94a3b8' : '#D4AF37' }} title="Insert Image">
                      {uploadingFields[`${field.id}-img`] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        disabled={uploadingFields[`${field.id}-img`]}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // SIZE VALIDATION
                          if (file.size > uploadSizeLimit) {
                            alert(`File too large for your current tier (${Math.round(file.size/1024/1024)}MB). Your limit is ${Math.round(uploadSizeLimit/1024/1024)}MB.`);
                            return;
                          }

                          setUploadingFields(prev => ({ ...prev, [`${field.id}-img`]: true }));
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('businessName', businessName || 'General');
                          const sName = sections?.find(s => s.id === sectionId)?.name || sectionId;
                          formData.append('sectionName', sName);

                          try {
                            const res = await fetch(`/api/upload`, { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.url) {
                              document.execCommand('insertImage', false, data.url);
                            }
                          } catch (err) { console.error("Upload failed", err); }
                          finally { setUploadingFields(prev => ({ ...prev, [`${field.id}-img`]: false })); }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px' }}>CINEMATIC NARRATIVE STUDIO</div>

                {isAdmin && !isFieldLocked && (
                  <button
                    disabled={uploadingFields[`${field.id}-ai`]}
                    onClick={async () => {
                      setUploadingFields(prev => ({ ...prev, [`${field.id}-ai`]: true }));
                      try {
                        const res = await fetch('/api/jana/ai-generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ businessName, sectionName: field.label, typology })
                        });
                        const json = await res.json();
                        if (json.story) {
                          handleChange(json.story);
                        }
                      } catch (e) { console.error("AI Generation failed", e); }
                      finally { setUploadingFields(prev => ({ ...prev, [`${field.id}-ai`]: false })); }
                    }}
                    style={{ marginLeft: '1rem', background: '#1e293b', border: 'none', color: '#D4AF37', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  >
                    {uploadingFields[`${field.id}-ai`] ? <i className="fas fa-magic fa-spin"></i> : <i className="fas fa-magic"></i>}
                    {uploadingFields[`${field.id}-ai`] ? 'GENERATING...' : 'AI MAGIC'}
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
            </details>
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
          <div style={{ position: 'relative' }}>
            <select
              className="form-control"
              value={value || ''}
              onChange={e => handleChange(e.target.value)}
              disabled={isFieldLocked}
              style={{
                appearance: 'none',
                paddingRight: '2.5rem',
                background: isFieldLocked ? '#f8fafc' : '#fff',
                fontWeight: 700,
                color: value ? '#1e293b' : '#94a3b8',
              }}
            >
              <option value="">— Select an option —</option>
              {(() => {
                try {
                  const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                  return Array.isArray(opts) ? opts.map(opt => <option key={opt} value={opt}>{opt}</option>) : null;
                } catch (e) { return null; }
              })()}
            </select>
            {/* Custom chevron */}
            <i className="fas fa-chevron-down" style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: '#94a3b8', fontSize: '0.7rem', pointerEvents: 'none'
            }}></i>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              <i className="fas fa-shield-alt" style={{ fontSize: '0.55rem', color: '#D4AF37' }}></i>
              <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700 }}>Options defined by admin • Admin-locked choices</span>
            </div>
          </div>
        ) : isMulti ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', minHeight: '60px' }}>
              {(() => {
                try {
                  const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                  if (!Array.isArray(opts) || opts.length === 0) return (
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, alignSelf: 'center' }}>No options defined by admin yet.</div>
                  );
                  const selected: string[] = Array.isArray(value) ? value : [];
                  return opts.map((opt: string) => {
                    const isChecked = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isFieldLocked}
                        onClick={() => {
                          if (isFieldLocked) return;
                          const next = isChecked
                            ? selected.filter(i => i !== opt)
                            : [...selected, opt];
                          handleChange(next);
                        }}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          border: isChecked ? '2px solid #1e293b' : '1.5px solid #e2e8f0',
                          background: isChecked ? '#1e293b' : '#fff',
                          color: isChecked ? '#fff' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: isFieldLocked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: isChecked ? '0 4px 10px rgba(30,41,59,0.2)' : 'none',
                        }}
                      >
                        {isChecked && <i className="fas fa-check" style={{ fontSize: '0.6rem', color: '#D4AF37' }}></i>}
                        {opt}
                      </button>
                    );
                  });
                } catch (e) { return null; }
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              <i className="fas fa-shield-alt" style={{ fontSize: '0.55rem', color: '#D4AF37' }}></i>
              <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700 }}>Options defined by admin • Click to toggle selections</span>
              ) : field.field_type === 'gallery' ? (
          <div className="premium-gallery-manager" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <details style={{ width: '100%' }}>
              <summary style={{ 
                listStyle: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#D4AF3710', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-images"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>
                      GALLERY ASSETS <span style={{ opacity: 0.3, marginLeft: '5px' }}>•</span> {(Array.isArray(value) ? value.length : 0)} IMAGES
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 800 }}>CLICK TO EXPAND CINEMATIC MANAGER</div>
                  </div>
                </div>
                <div style={{ background: '#1e293b', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900 }}>
                  MANAGE MEDIA
                </div>
              </summary>

              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {(Array.isArray(value) ? value : []).map((item: any, i: number) => (
                    <div key={i} className="gallery-item-card animate-in" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ height: '140px', position: 'relative', background: '#000' }}>
                        {(() => {
                          const url = typeof item === 'object' ? item.url : item;
                          const isUploading = typeof item === 'object' && item.is_uploading;
                          const isVideo = url && (url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.includes('/video/upload/'));
                          
                          return (
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              {isVideo ? (
                                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isUploading ? 'blur(5px)' : 'none' }} autoPlay muted loop />
                              ) : (
                                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isUploading ? 'blur(5px)' : 'none' }} />
                              )}
                              
                              {isUploading && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                                  <i className="fas fa-circle-notch fa-spin fa-2x" style={{ marginBottom: '0.5rem' }}></i>
                                  <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '1px' }}>PROCESSING...</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                            const isObj = typeof item === 'object';
                            const itemIsHero = isObj ? !!item.is_hero : false;
                            
                            const featuredCount = value.filter((p: any) => typeof p === 'object' ? p.is_hero : false).length;
                            if (!itemIsHero && featuredCount >= (tierFeatures.maxSlides || 3) && !isAdmin) {
                              alert(`Hero Slide Limit Reached (${tierFeatures.maxSlides || 3} max). Please upgrade or unselect another photo.`);
                              return;
                            }
                            const next = [...value];
                            const newItem = isObj ? { ...item, is_hero: !itemIsHero } : { url: item, is_hero: true };
                            next[i] = newItem;
                            handleChange(next);
                          }}
                          style={{
                            position: 'absolute', top: 10, left: 10,
                            background: (typeof item === 'object' && item.is_hero) ? '#D4AF37' : 'rgba(255,255,255,0.8)',
                            color: (typeof item === 'object' && item.is_hero) ? '#fff' : '#64748b',
                            border: 'none', borderRadius: '8px', padding: '4px 8px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.6rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                          }}
                        >
                          <i className={`fa${(typeof item === 'object' && item.is_hero) ? 's' : 'r'} fa-star`}></i>
                          {(typeof item === 'object' && item.is_hero) ? 'FEATURED IN HERO' : 'PROMOTE TO HERO'}
                        </button>

                        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>
                          SLOT {i + 1}
                        </div>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>SLIDE SETTINGS</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              title="Display Mode"
                              onClick={() => {
                                const next = [...value];
                                next[i] = { ...item, display_mode: item.display_mode === 'text_only' ? 'image' : 'text_only' };
                                handleChange(next);
                              }}
                              style={{ background: item.display_mode === 'text_only' ? '#1e293b' : 'transparent', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer' }}
                            >
                              <i className={item.display_mode === 'text_only' ? 'fas fa-font' : 'fas fa-image'}></i>
                            </button>
                            <button 
                              title="Show Caption"
                              onClick={() => {
                                const next = [...value];
                                next[i] = { ...item, show_caption: item.show_caption === false ? true : false };
                                handleChange(next);
                              }}
                              style={{ background: item.show_caption !== false ? '#1e293b' : 'transparent', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer', color: item.show_caption !== false ? '#fff' : '#64748b' }}
                            >
                              <i className="fas fa-closed-captioning"></i>
                            </button>
                            {item.display_mode === 'text_only' && (
                              <input 
                                type="color" 
                                value={item.bg_color || '#1e293b'}
                                onChange={(e) => {
                                  const next = [...value];
                                  next[i] = { ...item, bg_color: e.target.value };
                                  handleChange(next);
                                }}
                                style={{ width: '20px', height: '20px', border: 'none', borderRadius: '4px', padding: 0, cursor: 'pointer' }}
                              />
                            )}
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', fontSize: '0.55rem', fontWeight: 900, color: '#cbd5e1', marginBottom: '0.2rem' }}>IMAGE URL (EXTERNAL)</label>
                          <input 
                            type="text"
                            placeholder="Paste image link here..."
                            value={(typeof item === 'object' ? item.url : item) || ''}
                            onChange={e => {
                              const next = [...value];
                              const newVal = e.target.value;
                              next[i] = typeof item === 'object' ? { ...item, url: newVal } : newVal;
                              handleChange(next);
                            }}
                            style={{ width: '100%', fontSize: '0.65rem', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px', padding: '4px 8px', color: '#64748b' }}
                          />
                        </div>

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
                      cursor: uploadingFields[field.id] ? 'wait' : 'pointer', borderRadius: '20px', gap: '1rem',
                      background: 'rgba(212,175,55,0.03)', transition: 'all 0.3s',
                      opacity: uploadingFields[field.id] ? 0.6 : 1
                    }}>
                      {uploadingFields[field.id] ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37' }}></i>
                          <div style={{ fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>UPLOADING DNA...</div>
                        </>
                      ) : (
                        <>
                          <div style={{ width: 60, height: 60, background: 'rgba(212,175,55,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                            <i className="fas fa-cloud-upload-alt fa-2x"></i>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>UPLOAD MEDIA</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>JPEG, PNG, WEBP (MAX 10MB)</div>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        style={{ display: 'none' }} 
                        disabled={uploadingFields[field.id]}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []); 
                          if (files.length === 0) return;

                          // SIZE VALIDATION
                          const oversized = files.filter(f => f.size > uploadSizeLimit);
                          if (oversized.length > 0) {
                            alert(`${oversized.length} files exceed your ${Math.round(uploadSizeLimit/1024/1024)}MB limit. Please reduce size or upgrade.`);
                            return;
                          }

                          setUploadingFields(prev => ({ ...prev, [field.id]: true }));

                          const currentItems = Array.isArray(value) ? [...value] : [];
                          const optimisticItems = [...currentItems];
                          
                          // 1. Add Optimistic Previews
                          const localPreviews = files.map(file => ({
                            url: URL.createObjectURL(file),
                            caption: 'Uploading...',
                            is_uploading: true,
                            file: file
                          }));
                          
                          handleChange([...currentItems, ...localPreviews]);

                          try {
                            const finalItems = [...currentItems];
                            
                            for (const localItem of localPreviews) {
                              const fd = new FormData(); 
                              fd.append('file', localItem.file);
                              fd.append('businessName', businessName || 'General');
                              const sName = sections?.find(s => s.id === sectionId)?.name || sectionId;
                              fd.append('sectionName', sName);
                              
                              const res = await fetch('/api/upload', { method: 'POST', body: fd });
                              const json = await res.json();
                              
                              if (json.url) {
                                finalItems.push({ url: json.url, caption: '', is_hero: false });
                                // Update UI incrementally if possible, or just build the final list
                                handleChange([...finalItems, ...localPreviews.slice(finalItems.length - currentItems.length)]);
                              }
                              
                              // Revoke the object URL to free memory
                              URL.revokeObjectURL(localItem.url);
                            }
                            
                            handleChange(finalItems);
                            notify(`Media Synchronized: ${files.length} assets added`, 'success');
                          } catch (err: any) {
                            console.error("Batch upload failed", err);
                            notify(err.message || "Media Upload Failed", "error");
                            // Fallback to original items if everything fails
                            handleChange(currentItems);
                          } finally {
                            setUploadingFields(prev => ({ ...prev, [field.id]: false }));
                            e.target.value = '';
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>
              </div>
            </details>
          </div>
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
        ) : field.field_type === 'component' ? (
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #6366f140', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <i className="fas fa-cube"></i>
            </div>
            <div style={{ flex: 1 }}>
               <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                 {(field as any).options?.component_id ? `Linked Component ID: ${(field as any).options.component_id}` : 'No Component Linked'}
               </div>
               <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>
                 This component will be rendered on the public site.
               </div>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary" 
              style={{ fontSize: '0.6rem', fontWeight: 900 }}
              onClick={() => window.open(`/jana/component-library`, '_blank')}
            >
              OPEN LIBRARY
            </button>
          </div>
        ) : field.field_type === 'boolean' || field.field_type === 'checkbox' ? (
          <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: isFieldLocked ? 'not-allowed' : 'pointer', opacity: isFieldLocked ? 0.6 : 1 }}>
            <div style={{ position: 'relative', width: '50px', height: '28px' }}>
              <input 
                type="checkbox" 
                checked={!!value} 
                onChange={e => handleChange(e.target.checked)}
                disabled={isFieldLocked}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
              />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '28px',
                background: value ? '#D4AF37' : '#e2e8f0', transition: '0.4s',
              }}>
                <span style={{
                  position: 'absolute', height: '22px', width: '22px', left: value ? '24px' : '3px', bottom: '3px',
                  background: '#fff', borderRadius: '50%', transition: '0.4s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></span>
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: value ? '#1e293b' : '#94a3b8' }}>
              {value ? 'ENABLED' : 'DISABLED'}
            </span>
          </label>
        ) : field.field_type === 'textarea' ? (
          <textarea
            className="form-control" value={value || ''}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
            style={{ minHeight: '100px', resize: 'vertical' }}
          />
        ) : field.field_type === 'tel' || field.field_type === 'phone' ? (
          <input
            type="tel" className="form-control" value={value || ''}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
            placeholder="+20 (12) 000-0000"
          />
        ) : field.field_type === 'email' ? (
          <input
            type="email" className="form-control" value={value || ''}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
            placeholder="example@siwa.today"
          />
        ) : field.field_type === 'number' ? (
          <input
            type="number" className="form-control" value={value || ''}
            onChange={e => handleChange(e.target.value)} readOnly={isFieldLocked}
          />
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
      {/* DNA LEGEND FOR ADMINS/VENDORS */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', marginBottom: '1rem', textTransform: 'uppercase' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i> Data Architecture Guide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '3px', background: '#D4AF37', marginTop: '3px' }}></div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37' }}>UNIVERSAL (BLUEPRINT)</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', lineHeight: 1.4 }}>Fields defined at the core platform level. Required for all businesses in this section.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '3px', background: '#3b82f6', marginTop: '3px' }}></div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6' }}>INHERITED (COMMON)</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', lineHeight: 1.4 }}>Fields shared across multiple similar business types (e.g. all Accommodation types).</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '3px', background: '#10b981', marginTop: '3px' }}></div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}>UNIQUE (TYPOLOGY)</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', lineHeight: 1.4 }}>Fields built exclusively for this specific business type in the Form Architect.</div>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL LANGUAGE SWITCHER */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setCurrentLang(lang.code)}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: currentLang === lang.code ? '#D4AF37' : 'transparent',
              color: currentLang === lang.code ? '#1e293b' : 'rgba(255,255,255,0.4)',
              fontSize: '0.6rem', fontWeight: 900, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <span>{lang.icon}</span>
            <span>{lang.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {sectionOrder.map(sid => {
        const sectionFields = groupedFields[sid];
        const birthrightFields = sectionFields.filter(f => ['section_gallery', 'section_blog', 'section_news', 'feature_on_main'].includes(f.name));
        const strategicFields = sectionFields.filter(f => !['section_gallery', 'section_blog', 'section_news', 'feature_on_main', 'initialized'].includes(f.name));

        return (
          <section key={sid} style={{ marginBottom: '3rem' }}>
            {/* FOUNDATION BLOCK */}
            {birthrightFields.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', opacity: 0.6 }}>
                  <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }}></div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '3px' }}>SECTIONAL FOUNDATION</span>
                  <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }}></div>
                </div>
                <div className="grid-fit">
                  {birthrightFields.map(f => renderField(f, sid))}
                </div>
              </div>
            )}

            {/* STRATEGIC FIELDS BLOCK */}
            {strategicFields.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', opacity: 0.6 }}>
                  <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #6366f1, transparent)' }}></div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#6366f1', letterSpacing: '3px' }}>STRATEGIC DNA FIELDS</span>
                  <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #6366f1, transparent)' }}></div>
                </div>
                <div className="grid-fit">
                  {strategicFields.map(f => renderField(f, sid))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      <style jsx>{`
        .dynamic-form { width: 100%; }
        
        .grid-fit {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        @media (min-width: 1400px) {
          .grid-fit {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        .form-group { margin-bottom: 0.5rem; }
        
        .form-label {
          display: block;
          font-size: 0.65rem;
          font-weight: 900;
          color: #D4AF37;
          letter-spacing: 1px;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .help-text {
          display: block;
          font-size: 0.6rem;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
          margin-top: 0.25rem;
          letter-spacing: 0.5px;
          line-height: 1.4;
        }

        .form-control {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1.2px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.85rem 1.25rem;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          outline: none;
          transition: all 0.3s;
        }

        .form-control:focus {
          border-color: #D4AF37;
          background: rgba(212,175,55,0.04);
          box-shadow: 0 0 15px rgba(212,175,55,0.1);
        }

        .narrative-canvas {
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 transparent;
        }

        .editor-tool-btn {
          background: none;
          border: none;
          color: #64748b;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .editor-tool-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15,23,42,0.8);
          backdrop-filter: blur(4px);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .animate-in {
          animation: slideUp 0.4s ease-out forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

