'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

/**
 * Enhanced Simple Form Builder with Tree-View Preview
 * Features:
 * - Real-time tree visualization of form structure
 * - Section inheritance display (general vs additional)
 * - Live preview panel with instant updates
 * - Collapsible tree nodes
 * - Visual indicators for field types and inheritance
 */

interface Field {
  id: string;
  name: string;
  label: string;
  field_type: string;
  section_id: string;
  business_type_id: string;
  required: boolean;
  vendor_editable: boolean;
  options?: any;
  help_text?: string;
  placeholder?: string;
  sort_order: number;
  acl?: { read: string[]; write: string[] };
  validation?: any;
  is_searchable?: boolean;
  is_filterable?: boolean;
  show_on_card?: boolean;
  is_inherited?: boolean;
  is_universal?: boolean;
  section_origin?: 'inherited' | 'own' | 'template';
}

interface Section {
  id: string;
  name: string;
  icon: string;
  section_type?: 'general' | 'additional' | 'universal';
  description?: string;
  fields: Field[];
}

interface BusinessType {
  id: string;
  name: string;
  icon: string;
  is_parent: boolean;
  parent_id: string | null;
}

const FIELD_ICONS: Record<string, string> = {
  text: '📝',
  textarea: '📄',
  number: '🔢',
  date: '📅',
  select: '📋',
  multiselect: '☑️',
  radio_group: '🔘',
  checkbox: '✅',
  file_upload: '📎',
  gallery: '🖼️',
  link: '🔗',
};

const FIELD_COLORS: Record<string, string> = {
  text: '#3b82f6',
  textarea: '#8b5cf6',
  number: '#10b981',
  date: '#f59e0b',
  select: '#ec4899',
  multiselect: '#06b6d4',
  radio_group: '#f97316',
  checkbox: '#14b8a6',
  file_upload: '#6366f1',
  gallery: '#d946ef',
  link: '#64748b',
};

export default function EnhancedFormBuilder() {
  const { notify } = useAdmin();
  
  // Data State
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showPreview, setShowPreview] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all']));
  const [previewMode, setPreviewMode] = useState<'tree' | 'form'>('tree');
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load fields when selection changes
  useEffect(() => {
    if (selectedType) {
      loadFieldsForType();
    }
  }, [selectedType]);

  async function loadData() {
    setLoading(true);
    try {
      const [typesRes, sectionsRes] = await Promise.all([
        fetch('/api/jana/types'),
        fetch('/api/jana/sections')
      ]);
      
      if (typesRes.ok) {
        const types = await typesRes.json();
        setBusinessTypes(types);
        if (types.length > 0) setSelectedType(types[0].id);
      }
      
      if (sectionsRes.ok) {
        const sects = await sectionsRes.json();
        setSections(sects.map((s: any) => ({ ...s, fields: [] })));
      }
    } catch (e) {
      notify('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadFieldsForType() {
    try {
      const res = await fetch(`/api/jana/forms?type=${selectedType}&include_inherited=true`);
      if (res.ok) {
        const fields = await res.json();
        
        // Group fields by section
        const fieldsBySection: Record<string, Field[]> = {};
        fields.forEach((field: Field) => {
          if (!fieldsBySection[field.section_id]) {
            fieldsBySection[field.section_id] = [];
          }
          fieldsBySection[field.section_id].push(field);
        });
        
        // Update sections with their fields
        setSections(prev => prev.map(section => ({
          ...section,
          fields: fieldsBySection[section.id] || []
        })));
      }
    } catch (e) {
      console.error('Failed to load fields:', e);
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>(['all']);
    sections.forEach(s => {
      allIds.add(s.id);
      s.fields.forEach(f => allIds.add(f.id));
    });
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Form Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🌳 Enhanced Form Builder</h1>
            <p className="text-sm text-gray-600 mt-1">Build forms with real-time tree preview</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={() => window.location.href = '/jana/governance'}
              className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Advanced Wizard →
            </button>
          </div>
        </div>
      </div>

      <div className="flex max-w-[1920px] mx-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {/* LEFT: Business Types & Sections */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Business Type</h3>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              {businessTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.is_parent ? '(Parent)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Sections</h3>
            <div className="space-y-2">
              {sections.filter(s => s.fields.length > 0 || activeSection === s.id).map(section => {
                const isActive = activeSection === section.id;
                const isExpanded = expandedNodes.has(section.id);
                
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        toggleNode(section.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        isActive
                          ? 'bg-yellow-50 border-2 border-yellow-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <div>
                            <div className="font-medium text-sm">{section.name}</div>
                            <div className="text-xs text-gray-500">
                              {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Fields under section */}
                    {isExpanded && section.fields.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.fields.map(field => (
                          <div
                            key={field.id}
                            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded flex items-center gap-2"
                          >
                            <span>{FIELD_ICONS[field.field_type] || '📝'}</span>
                            <span className="truncate">{field.label}</span>
                            {field.is_inherited && (
                              <span className="text-[10px] px-1 bg-blue-100 text-blue-700 rounded">
                                inherited
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: Tree View Preview */}
        {showPreview && (
          <div className="flex-1 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🌲 Form Structure Tree</h2>
                <p className="text-xs text-gray-600 mt-1">
                  {sections.reduce((sum, s) => sum + s.fields.length, 0)} total fields
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="p-6">
              {sections.filter(s => s.fields.length > 0).map((section, sectionIdx) => {
                const isExpanded = expandedNodes.has(section.id) || expandedNodes.has('all');
                const sectionColor = section.section_type === 'general' ? '#D4AF37' :
                                    section.section_type === 'universal' ? '#8b5cf6' : '#10b981';
                
                return (
                  <div key={section.id} className="mb-4">
                    {/* Section Node */}
                    <div
                      onClick={() => toggleNode(section.id)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition border-l-4"
                      style={{ borderLeftColor: sectionColor }}
                    >
                      <span className="text-xl">
                        {isExpanded ? '📂' : '📁'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{section.name}</h3>
                          {section.section_type && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                              style={{ backgroundColor: sectionColor }}
                            >
                              {section.section_type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {section.fields.length} fields
                        </p>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>

                    {/* Field Nodes */}
                    {isExpanded && (
                      <div className="ml-8 mt-2 space-y-2">
                        {section.fields.map((field, fieldIdx) => {
                          const fieldColor = FIELD_COLORS[field.field_type] || '#3b82f6';
                          
                          return (
                            <div
                              key={field.id}
                              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                              style={{ borderLeft: `3px solid ${fieldColor}` }}
                            >
                              <span className="text-2xl" title={field.field_type}>
                                {FIELD_ICONS[field.field_type] || '📝'}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-gray-900">
                                    {field.label}
                                  </h4>
                                  {field.required && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                                      REQ
                                    </span>
                                  )}
                                  {field.is_inherited && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                                      INHERITED
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500 font-mono">
                                    {field.field_type}
                                  </span>
                                  {field.is_searchable && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                      🔍 Searchable
                                    </span>
                                  )}
                                  {field.acl?.read?.includes('public') && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                      🌐 Public
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {sections.filter(s => s.fields.length > 0).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🌳</div>
                  <p className="text-gray-600 font-medium">No fields yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Select a business type to see its form structure
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT: Live Form Preview */}
        <div className="w-96 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900">👁️ Live Preview</h2>
            <p className="text-xs text-gray-600 mt-1">
              See how the form will look
            </p>
          </div>

          <div className="p-6">
            {sections.filter(s => s.fields.length > 0).map(section => {
              const sectionColor = section.section_type === 'general' ? '#D4AF37' :
                                  section.section_type === 'universal' ? '#8b5cf6' : '#10b981';
              
              return (
                <div key={section.id} className="mb-6">
                  <div
                    className="pb-2 mb-3 border-b-2 flex items-center gap-2"
                    style={{ borderColor: sectionColor }}
                  >
                    <h3 className="font-bold text-sm text-gray-900">{section.name}</h3>
                    {section.section_type && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold"
                        style={{ backgroundColor: sectionColor }}
                      >
                        {section.section_type}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.id} className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {/* Render field preview based on type */}
                        {field.field_type === 'text' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || 'Enter text...'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                            disabled
                          />
                        )}
                        {field.field_type === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder || 'Enter long text...'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                            rows={2}
                            disabled
                          />
                        )}
                        {field.field_type === 'number' && (
                          <input
                            type="number"
                            placeholder={field.placeholder || '0'}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                            disabled
                          />
                        )}
                        {field.field_type === 'select' && (
                          <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50" disabled>
                            <option>Select...</option>
                            {Array.isArray(field.options) && field.options.map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {field.field_type === 'checkbox' && (
                          <div className="flex items-center gap-2">
                            <input type="checkbox" disabled className="w-4 h-4" />
                            <span className="text-xs text-gray-600">Yes</span>
                          </div>
                        )}
                        
                        {field.help_text && (
                          <p className="text-[10px] text-gray-500 mt-1">{field.help_text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {sections.filter(s => s.fields.length > 0).length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👁️</div>
                <p className="text-gray-600 font-medium">No preview available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
