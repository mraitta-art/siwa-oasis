'use client';

/**
 * Page Templates Manager
 * Admins can create page templates for vendors to use in their mini-sites
 * Vendors can only use these pre-built templates, not create custom pages
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTemplate } from '@/lib/jana/page-builder-types';

export default function PageTemplatesPage() {
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');

  // Load sections alongside templates
  useEffect(() => {
    // Load templates
    loadTemplates();
    // Load sections for building templates
    fetch('/api/jana/sections')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSections(data);
          // default to first section if available
          if (data.length > 0) setSelectedSection(data[0].id);
        }
      })
      .catch(err => console.error('Error loading sections:', err));
  }, []);


  async function loadTemplates() {
    try {
      const response = await fetch('/api/jana/page-builder/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (
      confirm(
        'Are you sure? This will not affect pages already using this template.'
      )
    ) {
      try {
        const response = await fetch(
          `/api/jana/page-builder/templates/${templateId}`,
          {
            method: 'DELETE',
          }
        );
        if (response.ok) {
          setTemplates(templates.filter((t) => t.id !== templateId));
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-outfit font-bold text-white tracking-tight">
            📋 Page Templates
          </h2>
          <p className="text-slate-400 mt-1">
            Create templates for vendors to use in their mini-sites
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex gap-2 items-center"
        >
          <i className="fas fa-plus"></i>
          Create Template
        </Button>
      </div>

      {/* Info Banner */}
      <div className="glass-panel p-4 border-l-4 border-[#556B2F] bg-[#556B2F]/10">
        <div className="flex gap-3 items-start">
          <i className="fas fa-info-circle text-[#556B2F] mt-1"></i>
          <div>
            <p className="text-white font-medium">For Mini-Sites Only</p>
            <p className="text-slate-400 text-sm mt-1">
              Templates define the structure that vendors can use in their mini-sites.
              Vendors cannot create arbitrary pages—they can only customize these
              pre-built templates.
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <i className="fas fa-file-lines text-4xl text-slate-600 mb-3"></i>
              <p className="text-slate-400">No templates created yet.</p>
              <p className="text-slate-500 text-sm mt-1">
                Create your first template to allow vendors to use mini-sites!
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card
              key={template.id}
              className="hover:border-brand-500/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    {template.isActive ? '✓ Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-slate-500">
                      <p className="text-slate-400 text-xs mb-0.5">Components</p>
                      <p className="text-white font-semibold">{template.components.length}</p>
                    </div>
                    <div className="text-slate-500">
                      <p className="text-slate-400 text-xs mb-0.5">Reorder</p>
                      <p className="text-white font-semibold">
                        {template.allowComponentReorder ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="text-slate-500">
                      <p className="text-slate-400 text-xs mb-0.5">Styles</p>
                      <p className="text-white font-semibold">
                        {template.allowStyleCustomization ? '✓' : '✗'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        /* Edit template */
                      }}
                      className="flex-1 btn-secondary py-1.5 text-sm flex gap-1.5 items-center justify-center"
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="btn-danger py-1.5 px-3 text-sm"
                      title="Delete template"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
