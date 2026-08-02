'use client';

import { useState, useEffect, useRef } from 'react';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  isHero?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

interface Section {
  id: string;
  name: string;
}

export default function VendorMediaPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'manage'>('upload');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSections(); loadGallery(); }, []);

  async function loadSections() {
    try {
      const res = await fetch('/api/vendor/sections');
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
      if (data.length > 0) setSelectedSection(data[0].id);
    } catch (err) { console.error(err); }
  }

  async function loadGallery() {
    try {
      const res = await fetch('/api/vendor/gallery');
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!selectedSection) { showMessage('error', 'Please select a section first'); return; }
    setLoading(true);
    setUploadProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sectionId', selectedSection);
        formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round(((i + e.loaded / e.total) / files.length) * 100));
        });
        await new Promise((resolve, reject) => {
          xhr.onload = () => (xhr.status === 200 || xhr.status === 201) ? resolve(xhr.responseText) : reject();
          xhr.onerror = () => reject();
          xhr.open('POST', '/api/vendor/gallery/upload');
          xhr.send(formData);
        });
      }
      showMessage('success', `✓ ${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully`);
      setUploadProgress(0);
      await loadGallery();
      setActiveTab('gallery');
    } catch {
      showMessage('error', 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function setAsHero(id: string) {
    try {
      const res = await fetch(`/api/vendor/gallery/${id}/hero`, { method: 'PATCH' });
      if (res.ok) { showMessage('success', '⭐ Set as hero image'); await loadGallery(); }
    } catch { showMessage('error', 'Failed to update'); }
  }

  async function deleteImage(id: string) {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/vendor/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) { showMessage('success', '✓ Image deleted'); await loadGallery(); }
    } catch { showMessage('error', 'Failed to delete'); }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  const approvalBadge = (status?: string) => {
    if (status === 'approved') return 'bg-emerald-500 text-white';
    if (status === 'rejected') return 'bg-rose-500 text-white';
    return 'bg-amber-400 text-white';
  };

  const tabs = [
    { key: 'upload',  label: '📤 Upload',  count: null },
    { key: 'gallery', label: '🖼️ Gallery',  count: gallery.length },
    { key: 'manage',  label: '⚙️ Manage',   count: null },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">📸 Media Gallery</h1>
        <p className="text-slate-400 font-semibold text-sm">Upload and manage photos for your minisite sections</p>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-5 flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key ? 'bg-white text-[#D4AF37] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-lg ${activeTab === tab.key ? 'bg-amber-50 text-[#D4AF37]' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── UPLOAD TAB ── */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          {/* Section selector */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              📂 Upload to Section
            </label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition"
            >
              <option value="">Choose a section...</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            className={`bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden`}
          >
            <div
              className={`border-2 border-dashed m-5 rounded-2xl p-10 text-center cursor-pointer transition ${
                dragOver ? 'border-[#D4AF37] bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-5xl mb-3">{loading ? '⏳' : '📸'}</div>
              <h3 className="font-extrabold text-slate-700 text-lg mb-1">
                {loading ? `Uploading... ${uploadProgress}%` : 'Drag & Drop Photos Here'}
              </h3>
              <p className="text-slate-400 text-sm font-semibold mb-4">or use the buttons below</p>

              {/* Progress bar */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mx-auto max-w-xs mb-4">
                  <div className="h-full bg-[#D4AF37] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <label className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition cursor-pointer shadow-sm">
                  📁 Browse Files
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
                </label>
                <label className="px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl transition cursor-pointer">
                  📱 Camera
                  <input type="file" accept="image/*,video/*" capture="environment" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
                </label>
              </div>
            </div>

            {/* Tips */}
            <div className="mx-5 mb-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 font-semibold">
              <p className="font-extrabold mb-1">✓ Tips for great photos</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use natural light for food, accommodation and nature shots</li>
                <li>Upload JPG, PNG, WebP or MP4 (max 10MB per file)</li>
                <li>Mark your best photo as "Hero" — it becomes your cover photo</li>
                <li>All photos are reviewed by our team before going live</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY TAB ── */}
      {activeTab === 'gallery' && (
        <div>
          {gallery.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-3">🖼️</div>
              <h3 className="font-extrabold text-slate-700 mb-2">No Photos Yet</h3>
              <p className="text-slate-400 text-sm font-semibold mb-4">Upload your first photo to get started</p>
              <button onClick={() => setActiveTab('upload')} className="px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition">
                Upload Photos
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-extrabold text-slate-500">{gallery.length} photo{gallery.length !== 1 ? 's' : ''} uploaded</p>
                <button onClick={() => setActiveTab('upload')} className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition">
                  + Upload More
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map(item => (
                  <div key={item.id} className={`relative rounded-2xl overflow-hidden border-2 transition group ${item.isHero ? 'border-[#D4AF37] shadow-lg shadow-amber-100' : 'border-slate-100 hover:border-slate-200'}`}>
                    <img src={item.url} alt={item.caption} className="w-full h-36 object-cover" />

                    {/* Hero badge */}
                    {item.isHero && (
                      <div className="absolute top-2 left-2 bg-[#D4AF37] text-white text-xs font-extrabold px-2 py-0.5 rounded-lg shadow">
                        ⭐ Hero
                      </div>
                    )}

                    {/* Approval badge */}
                    {item.approval_status && (
                      <div className={`absolute top-2 right-2 text-xs font-extrabold px-2 py-0.5 rounded-lg shadow ${approvalBadge(item.approval_status)}`}>
                        {item.approval_status === 'approved' ? '✓' : item.approval_status === 'rejected' ? '✗' : '⏳'}
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2 gap-1.5">
                      {!item.isHero && item.approval_status !== 'rejected' && (
                        <button onClick={() => setAsHero(item.id)} className="flex-1 py-1.5 bg-[#D4AF37] text-white text-xs font-extrabold rounded-xl transition">
                          ⭐ Hero
                        </button>
                      )}
                      <button onClick={() => deleteImage(item.id)} className="flex-1 py-1.5 bg-rose-500 text-white text-xs font-extrabold rounded-xl transition">
                        🗑️
                      </button>
                    </div>

                    {/* Caption */}
                    <div className="p-2.5 bg-white">
                      <p className="text-xs font-bold text-slate-600 truncate">{item.caption || 'Untitled'}</p>
                      <p className="text-xs text-slate-400">{new Date(item.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE TAB ── */}
      {activeTab === 'manage' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-extrabold text-slate-800">⚙️ Gallery Settings</h2>

          <div className="space-y-4">
            {[
              { icon: '🎯', title: 'Auto-Feature Best Photo', desc: 'Automatically set highest-quality image as hero', checked: true },
              { icon: '📧', title: 'Email on Upload', desc: 'Get notified when images are processed', checked: false },
              { icon: '🌐', title: 'Show on Main Site', desc: 'Allow approved photos to appear in site galleries', checked: true },
            ].map(setting => (
              <div key={setting.title} className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                <div>
                  <div className="text-sm font-extrabold text-slate-800">{setting.icon} {setting.title}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">{setting.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={setting.checked} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>
            ))}
          </div>

          {gallery.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-extrabold text-slate-700 mb-3">🗑️ Bulk Actions</h3>
              <div className="flex gap-3">
                <button onClick={() => confirm('Delete ALL photos? This cannot be undone.') && null} className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm rounded-2xl hover:bg-rose-100 transition">
                  Delete All Photos
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
