'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SectionConfig {
  name: string;
  icon: string;
  description: string;
  has_miniblog: boolean;
  has_gallery: boolean;
  curation_policy: 'auto_approve' | 'manual_review' | 'admin_only';
  vendor_permissions: {
    can_upload_images: boolean;
    can_write_blogs: boolean;
    can_edit_own: boolean;
    can_delete_own: boolean;
  };
  content_instructions: string;
  max_gallery_items: number;
  auto_publish_blogs: boolean;
  auto_publish_images: boolean;
}

export default function CreateSectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<SectionConfig>({
    name: '',
    icon: 'fa-layer-group',
    description: '',
    has_miniblog: true,
    has_gallery: true,
    curation_policy: 'manual_review',
    vendor_permissions: {
      can_upload_images: true,
      can_write_blogs: true,
      can_edit_own: true,
      can_delete_own: false,
    },
    content_instructions: '',
    max_gallery_items: 50,
    auto_publish_blogs: false,
    auto_publish_images: false,
  });

  const updateConfig = (key: keyof SectionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const togglePermission = (perm: keyof typeof config.vendor_permissions) => {
    setConfig(prev => ({
      ...prev,
      vendor_permissions: {
        ...prev.vendor_permissions,
        [perm]: !prev.vendor_permissions[perm]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.name.trim()) {
      setError('Section name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/sections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/sections/${data.id}/add-components`);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create section');
      }
    } catch (err) {
      setError('Error creating section');
    } finally {
      setLoading(false);
    }
  };

  const S = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem',
      background: '#1a1a1a',
      borderRadius: '8px',
      color: '#fff'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      color: '#D4AF37'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem'
    },
    section: {
      background: '#2a2a2a',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #556B2F'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#D4AF37'
    },
    fieldGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#ddd'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '1rem'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '1rem',
      minHeight: '120px',
      fontFamily: 'inherit'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      background: '#1a1a1a',
      border: '1px solid #556B2F',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '1rem'
    },
    toggleGroup: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap' as const
    },
    toggleItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: '#1a1a1a',
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      border: '1px solid #556B2F',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    toggleItemActive: {
      background: '#556B2F',
      borderColor: '#D4AF37'
    },
    featureRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem'
    },
    permissionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 0'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    error: {
      background: '#ef4444',
      color: '#fff',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      fontSize: '1rem',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    submitButton: {
      background: '#D4AF37',
      color: '#1a1a1a',
      flex: 1
    },
    cancelButton: {
      background: '#556B2F',
      color: '#fff'
    }
  };

  return (
    <div style={S.container}>
      <h1 style={S.title}>⚙️ Create New Section</h1>

      {error && <div style={S.error}>{error}</div>}

      <form style={S.form} onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📋 Basic Information</div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Section Name *</label>
            <input
              style={S.input}
              type="text"
              value={config.name}
              onChange={(e) => updateConfig('name', e.target.value)}
              placeholder="e.g., Gallery, Location, Services"
              required
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Icon (FontAwesome)</label>
            <input
              style={S.input}
              type="text"
              value={config.icon}
              onChange={(e) => updateConfig('icon', e.target.value)}
              placeholder="fa-layer-group"
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Description</label>
            <textarea
              style={S.textarea}
              value={config.description}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="What is this section for?"
            />
          </div>
        </div>

        {/* Features */}
        <div style={S.section}>
          <div style={S.sectionTitle}>✨ Enable Features</div>

          <div style={S.featureRow}>
            <div style={S.fieldGroup}>
              <label style={S.label}>
                <input
                  type="checkbox"
                  checked={config.has_miniblog}
                  onChange={(e) => updateConfig('has_miniblog', e.target.checked)}
                  style={S.checkbox}
                />
                {' '} Mini Blog System
              </label>
              <small style={{ color: '#aaa', marginLeft: '1.5rem', display: 'block' }}>
                Vendors can write blog posts for this section
              </small>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>
                <input
                  type="checkbox"
                  checked={config.has_gallery}
                  onChange={(e) => updateConfig('has_gallery', e.target.checked)}
                  style={S.checkbox}
                />
                {' '} Image Gallery
              </label>
              <small style={{ color: '#aaa', marginLeft: '1.5rem', display: 'block' }}>
                Vendors can upload images to this section
              </small>
            </div>
          </div>

          {config.has_miniblog && (
            <div style={S.fieldGroup}>
              <label style={S.label}>
                <input
                  type="checkbox"
                  checked={config.auto_publish_blogs}
                  onChange={(e) => updateConfig('auto_publish_blogs', e.target.checked)}
                  style={S.checkbox}
                />
                {' '} Auto-Publish Blogs (no admin review)
              </label>
            </div>
          )}

          {config.has_gallery && (
            <>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  <input
                    type="checkbox"
                    checked={config.auto_publish_images}
                    onChange={(e) => updateConfig('auto_publish_images', e.target.checked)}
                    style={S.checkbox}
                  />
                  {' '} Auto-Approve Images (no admin review)
                </label>
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Max Gallery Items</label>
                <input
                  style={S.input}
                  type="number"
                  min="5"
                  max="200"
                  value={config.max_gallery_items}
                  onChange={(e) => updateConfig('max_gallery_items', parseInt(e.target.value))}
                />
              </div>
            </>
          )}
        </div>

        {/* Curation Policy */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🛡️ Approval Policy</div>

          <div style={S.fieldGroup}>
            <label style={S.label}>How should vendor content be approved?</label>
            <select
              style={S.select}
              value={config.curation_policy}
              onChange={(e) => updateConfig('curation_policy', e.target.value as any)}
            >
              <option value="auto_approve">✅ Auto-Approve (immediate visibility)</option>
              <option value="manual_review">⏳ Manual Review (admin reviews each item)</option>
              <option value="admin_only">🔒 Admin Only (only admins can upload content)</option>
            </select>
            <small style={{ color: '#aaa', marginTop: '0.5rem', display: 'block' }}>
              {config.curation_policy === 'auto_approve' && 'Vendor content appears immediately on the minisite'}
              {config.curation_policy === 'manual_review' && 'Admin must approve each blog/image before it appears'}
              {config.curation_policy === 'admin_only' && 'Only admins can add content to this section'}
            </small>
          </div>
        </div>

        {/* Vendor Permissions */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👥 Vendor Permissions</div>

          <div style={S.permissionItem}>
            <input
              type="checkbox"
              checked={config.vendor_permissions.can_upload_images}
              onChange={() => togglePermission('can_upload_images')}
              style={S.checkbox}
              disabled={config.curation_policy === 'admin_only'}
            />
            <label>Can upload images</label>
          </div>

          <div style={S.permissionItem}>
            <input
              type="checkbox"
              checked={config.vendor_permissions.can_write_blogs}
              onChange={() => togglePermission('can_write_blogs')}
              style={S.checkbox}
              disabled={config.curation_policy === 'admin_only' || !config.has_miniblog}
            />
            <label>Can write blog posts</label>
          </div>

          <div style={S.permissionItem}>
            <input
              type="checkbox"
              checked={config.vendor_permissions.can_edit_own}
              onChange={() => togglePermission('can_edit_own')}
              style={S.checkbox}
              disabled={config.curation_policy === 'admin_only'}
            />
            <label>Can edit their own content</label>
          </div>

          <div style={S.permissionItem}>
            <input
              type="checkbox"
              checked={config.vendor_permissions.can_delete_own}
              onChange={() => togglePermission('can_delete_own')}
              style={S.checkbox}
              disabled={config.curation_policy === 'admin_only'}
            />
            <label>Can delete their own content</label>
          </div>
        </div>

        {/* Content Instructions */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📝 Vendor Instructions</div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Content Guidelines for Vendors</label>
            <textarea
              style={S.textarea}
              value={config.content_instructions}
              onChange={(e) => updateConfig('content_instructions', e.target.value)}
              placeholder={`E.g., "This section is for high-quality product photos and detailed descriptions. Please use good lighting and clear images. Recommended image size: 1200x800px."`}
            />
            <small style={{ color: '#aaa', marginTop: '0.5rem', display: 'block' }}>
              These instructions will be shown to vendors when they add content to this section
            </small>
          </div>
        </div>

        {/* Summary */}
        <div style={{ ...S.section, background: '#556B2F', borderColor: '#D4AF37' }}>
          <div style={S.sectionTitle}>✅ Configuration Summary</div>
          <ul style={{ lineHeight: '1.8', marginLeft: '1rem', color: '#ddd' }}>
            <li>🏷️ Section: <strong>{config.name || '(name required)'}</strong></li>
            <li>📖 Mini Blog: <strong>{config.has_miniblog ? '✅ Enabled' : '❌ Disabled'}</strong></li>
            <li>🖼️ Gallery: <strong>{config.has_gallery ? '✅ Enabled' : '❌ Disabled'}</strong> {config.has_gallery && `(${config.max_gallery_items} max items)`}</li>
            <li>🛡️ Approval: <strong>
              {config.curation_policy === 'auto_approve' && 'Auto-Approve'}
              {config.curation_policy === 'manual_review' && 'Manual Review'}
              {config.curation_policy === 'admin_only' && 'Admin Only'}
            </strong></li>
            <li>🔓 Vendor Access: <strong>
              {config.vendor_permissions.can_upload_images && 'Upload '}
              {config.vendor_permissions.can_write_blogs && 'Blog '}
              {config.vendor_permissions.can_edit_own && 'Edit '}
              {config.vendor_permissions.can_delete_own && 'Delete'}
            </strong></li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={S.buttonGroup}>
          <button
            style={{ ...S.button, ...S.cancelButton }}
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            style={{ ...S.button, ...S.submitButton }}
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳ Creating...' : '✅ Create Section with Features'}
          </button>
        </div>
      </form>
    </div>
  );
}
