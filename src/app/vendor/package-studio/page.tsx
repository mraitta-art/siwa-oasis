'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, CheckCircle,
  PauseCircle, Upload, Youtube, Image as ImageIcon, Video, X, ChevronDown,
  ChevronUp, GripVertical, Save, ArrowLeft, Globe, Globe2, Tag, Clock,
  Users, DollarSign, AlignLeft, List, Sparkles, ShieldCheck, AlertCircle, Send
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'youtube';
  url: string;
  caption?: string;
  caption_ar?: string;
  cover?: boolean;
}

interface ItineraryDay {
  day: number;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  activities: string[];
}

interface StudioItem {
  id: string;
  item_type: string;
  title: string;
  title_ar?: string;
  tagline?: string;
  tagline_ar?: string;
  description_html?: string;
  description_html_ar?: string;
  duration_type: string;
  duration_value: number;
  price_amount: number;
  original_price?: number;
  discount_percentage?: number;
  currency: string;
  pricing_unit: string;
  target_audience?: string;
  itinerary: ItineraryDay[];
  included_features: string[];
  excluded_features: string[];
  media: MediaItem[];
  cover_image_url?: string;
  status: string;
  publish_on_minisite: boolean;
  publish_on_main_portal: boolean;
  is_featured: boolean;
  business_name?: string;
  creator_name?: string;
  created_at?: string;
  booking_cta_type?: string;
  booking_whatsapp?: string;
}

interface SessionInfo {
  role: string;
  businessId: string | null;
  displayName: string | null;
  isAdmin: boolean;
  canCreatePackages?: boolean;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const ITEM_TYPES = [
  { value: 'tour', label_en: 'Tour', label_ar: 'جولة' },
  { value: 'package', label_en: 'Package', label_ar: 'باقة' },
  { value: 'program', label_en: 'Program', label_ar: 'برنامج' },
  { value: 'activity', label_en: 'Activity', label_ar: 'نشاط' },
  { value: 'offer', label_en: 'Offer', label_ar: 'عرض' },
  { value: 'discount', label_en: 'Discount', label_ar: 'خصم' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:            { label: 'Draft',             color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  pending_approval: { label: 'Pending Approval',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  approved:         { label: 'Approved / Live',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  suspended:        { label: 'Suspended',          color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  archived:         { label: 'Archived',           color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

// ─── MINI RICH TEXT TOOLBAR ───────────────────────────────────────────────────

function MiniRichEditor({ 
  value, 
  onChange, 
  placeholder = 'Write detailed description here...', 
  dir = 'ltr',
  minHeight = '200px',
  businessId,
  sectionName = 'package-studio'
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  minHeight?: string;
  businessId?: string;
  sectionName?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInternalRef.current) { isInternalRef.current = false; return; }
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      lastRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (!lastRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(lastRangeRef.current); }
  }, []);

  const exec = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalRef.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (businessId) fd.append('businessId', businessId);
      fd.append('section', sectionName);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (res.ok && data.url) {
        restoreSelection();
        document.execCommand('insertHTML', false, `<img src="${data.url}" alt="media" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
        if (editorRef.current) {
          isInternalRef.current = true;
          onChange(editorRef.current.innerHTML);
        }
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch {
      setUploadError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const insertYouTube = () => {
    const url = prompt('Paste YouTube video URL or embed URL:');
    if (!url) return;
    let embedId = '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    if (match) embedId = match[1];
    if (!embedId) { alert('Invalid YouTube URL'); return; }
    const html = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:12px 0;"><iframe src="https://www.youtube.com/embed/${embedId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      isInternalRef.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rounded-xl border border-white/20 overflow-hidden bg-black/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-white/5 border-b border-white/10">
        {[
          { cmd: 'bold', icon: 'B', title: 'Bold' },
          { cmd: 'italic', icon: 'I', title: 'Italic' },
          { cmd: 'underline', icon: 'U', title: 'Underline' },
        ].map(b => (
          <button key={b.cmd} onMouseDown={e => { e.preventDefault(); exec(b.cmd); }}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-white/20 rounded"
            title={b.title}
          >{b.icon}</button>
        ))}
        <div className="w-px bg-white/20 mx-1" />
        <button onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }} title="Left" className="w-7 h-7 text-xs text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">≡</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }} title="Right" className="w-7 h-7 text-xs text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">≡</button>
        <button onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }} title="Center" className="w-7 h-7 text-xs text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">≡</button>
        <div className="w-px bg-white/20 mx-1" />
        <button onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} title="Bullet list" className="w-7 h-7 text-xs text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">•</button>
        <button onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} title="Numbered list" className="w-7 h-7 text-xs text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">1.</button>
        <div className="w-px bg-white/20 mx-1" />
        <button onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }} title="Heading" className="w-7 h-7 text-xs font-bold text-slate-300 hover:bg-white/20 rounded flex items-center justify-center">H</button>
        <div className="w-px bg-white/20 mx-1" />
        {/* Image Upload */}
        <button
          type="button"
          onClick={() => { saveSelection(); fileInputRef.current?.click(); }}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:bg-white/20 rounded"
          title="Upload Image"
        >
          <ImageIcon size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleUploadImage(f);
            e.target.value = '';
          }}
        />
        {/* YouTube */}
        <button
          type="button"
          onClick={() => { saveSelection(); insertYouTube(); }}
          className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-500/20 rounded"
          title="Embed YouTube"
        >
          <Youtube size={14} />
        </button>

        {uploading && <span className="text-xs text-[#D4AF37] animate-pulse px-2">Uploading...</span>}
        {uploadError && <span className="text-xs text-red-400 px-2">{uploadError}</span>}
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir={dir}
        onInput={() => {
          if (editorRef.current) {
            isInternalRef.current = true;
            onChange(editorRef.current.innerHTML);
          }
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        className="outline-none text-slate-200 text-sm leading-relaxed p-4"
        style={{ minHeight, fontFamily: dir === 'rtl' ? "'Cairo','Tajawal',sans-serif" : 'inherit' }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

// ─── MEDIA GALLERY MANAGER ────────────────────────────────────────────────────

function MediaGalleryManager({ 
  media, 
  onChange, 
  businessId,
  lang 
}: { 
  media: MediaItem[]; 
  onChange: (m: MediaItem[]) => void; 
  businessId?: string;
  lang: 'ar' | 'en';
}) {
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [addingYt, setAddingYt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isRTL = lang === 'ar';

  const addMedia = (item: MediaItem) => onChange([...media, item]);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        if (businessId) fd.append('businessId', businessId);
        fd.append('section', 'package-studio');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          const isVideo = file.type.startsWith('video/');
          addMedia({
            id: crypto.randomUUID(),
            type: isVideo ? 'video' : 'image',
            url: data.url,
            caption: '',
            caption_ar: '',
            cover: media.length === 0
          });
        }
      } catch {}
    }
    setUploading(false);
  };

  const addYouTube = () => {
    const match = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    if (!match) { alert('Invalid YouTube URL'); return; }
    addMedia({
      id: crypto.randomUUID(),
      type: 'youtube',
      url: `https://www.youtube.com/embed/${match[1]}`,
      caption: '',
      caption_ar: '',
      cover: false
    });
    setYtUrl('');
    setAddingYt(false);
  };

  const updateMedia = (id: string, updates: Partial<MediaItem>) => {
    onChange(media.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMedia = (id: string) => onChange(media.filter(m => m.id !== id));

  const setCover = (id: string) => onChange(media.map(m => ({ ...m, cover: m.id === id })));

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white font-semibold border border-white/20 transition"
        >
          <Upload size={16} />
          <span>{uploading ? (isRTL ? 'جاري الرفع...' : 'Uploading...') : (isRTL ? 'رفع صور/فيديو' : 'Upload Image/Video')}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) handleFileUpload(e.target.files); e.target.value = ''; }}
        />
        <button
          type="button"
          onClick={() => setAddingYt(!addingYt)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-sm text-red-300 font-semibold border border-red-500/30 transition"
        >
          <Youtube size={16} />
          <span>{isRTL ? 'إضافة يوتيوب' : 'Add YouTube'}</span>
        </button>
      </div>

      {/* YouTube Input */}
      {addingYt && (
        <div className="flex gap-2">
          <input
            type="text"
            value={ytUrl}
            onChange={e => setYtUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white"
          />
          <button type="button" onClick={addYouTube} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">
            {isRTL ? 'إضافة' : 'Add'}
          </button>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map(item => (
            <div key={item.id} className={`relative rounded-xl overflow-hidden border group ${item.cover ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40' : 'border-white/20'}`}>
              {/* Preview */}
              <div className="aspect-video bg-black/50 relative">
                {item.type === 'youtube' ? (
                  <iframe src={item.url} className="w-full h-full" allowFullScreen />
                ) : item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}

                {/* Type badge */}
                <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-white uppercase">
                  {item.type}
                </div>

                {/* Cover badge */}
                {item.cover && (
                  <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37] text-black">
                    {isRTL ? 'غلاف' : 'Cover'}
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  {!item.cover && (
                    <button type="button" onClick={() => setCover(item.id)} className="px-2 py-1 rounded bg-[#D4AF37] text-black text-[10px] font-bold">
                      {isRTL ? 'غلاف' : 'Set Cover'}
                    </button>
                  )}
                  <button type="button" onClick={() => removeMedia(item.id)} className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Caption */}
              <div className="p-2 bg-black/30 space-y-1">
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={e => updateMedia(item.id, { caption: e.target.value })}
                  placeholder="Caption EN"
                  className="w-full text-xs bg-transparent border-b border-white/20 text-slate-300 focus:outline-none pb-0.5"
                />
                <input
                  type="text"
                  value={item.caption_ar || ''}
                  onChange={e => updateMedia(item.id, { caption_ar: e.target.value })}
                  placeholder="التعليق بالعربية"
                  dir="rtl"
                  className="w-full text-xs bg-transparent border-b border-white/20 text-slate-300 focus:outline-none pb-0.5"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="border border-dashed border-white/20 rounded-xl p-8 text-center text-slate-400 text-sm">
          {isRTL ? 'لا توجد وسائط بعد. ارفع صوراً أو فيديوهات أو أضف رابط يوتيوب.' : 'No media yet. Upload images/videos or add a YouTube link above.'}
        </div>
      )}
    </div>
  );
}

// ─── ITINERARY BUILDER ────────────────────────────────────────────────────────

function ItineraryBuilder({ 
  itinerary, 
  onChange, 
  durationDays,
  lang 
}: { 
  itinerary: ItineraryDay[]; 
  onChange: (it: ItineraryDay[]) => void; 
  durationDays: number;
  lang: 'ar' | 'en';
}) {
  const isRTL = lang === 'ar';

  const ensureDays = () => {
    const existing = [...itinerary];
    for (let d = 1; d <= durationDays; d++) {
      if (!existing.find(x => x.day === d)) {
        existing.push({ day: d, title: `Day ${d}`, title_ar: `اليوم ${d}`, description: '', description_ar: '', activities: [] });
      }
    }
    return existing.filter(x => x.day <= durationDays).sort((a, b) => a.day - b.day);
  };

  const days = ensureDays();

  const updateDay = (day: number, updates: Partial<ItineraryDay>) => {
    onChange(days.map(d => d.day === day ? { ...d, ...updates } : d));
  };

  const addActivity = (day: number) => {
    const d = days.find(x => x.day === day)!;
    updateDay(day, { activities: [...(d.activities || []), ''] });
  };

  const updateActivity = (day: number, idx: number, value: string) => {
    const d = days.find(x => x.day === day)!;
    const acts = [...(d.activities || [])];
    acts[idx] = value;
    updateDay(day, { activities: acts });
  };

  const removeActivity = (day: number, idx: number) => {
    const d = days.find(x => x.day === day)!;
    const acts = (d.activities || []).filter((_, i) => i !== idx);
    updateDay(day, { activities: acts });
  };

  return (
    <div className="space-y-4">
      {days.map(day => (
        <div key={day.day} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-3 bg-white/5 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-extrabold text-sm flex items-center justify-center flex-shrink-0">
              {day.day}
            </div>
            <input
              type="text"
              value={isRTL ? (day.title_ar || day.title) : day.title}
              onChange={e => updateDay(day.day, isRTL ? { title_ar: e.target.value } : { title: e.target.value })}
              placeholder={isRTL ? `عنوان اليوم ${day.day}` : `Day ${day.day} Title`}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none border-b border-white/20 pb-0.5"
            />
          </div>
          <div className="p-3 space-y-3">
            <textarea
              rows={2}
              value={isRTL ? (day.description_ar || '') : (day.description || '')}
              onChange={e => updateDay(day.day, isRTL ? { description_ar: e.target.value } : { description: e.target.value })}
              placeholder={isRTL ? 'وصف مختصر لليوم...' : 'Brief description for this day...'}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-white/30"
            />

            {/* Activities List */}
            <div className="space-y-1.5">
              {(day.activities || []).map((act, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[#D4AF37] text-xs font-bold">•</span>
                  <input
                    type="text"
                    value={act}
                    onChange={e => updateActivity(day.day, idx, e.target.value)}
                    placeholder={isRTL ? 'أضف نشاطاً...' : 'Add an activity...'}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
                  />
                  <button type="button" onClick={() => removeActivity(day.day, idx)} className="text-red-400 hover:text-red-300">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addActivity(day.day)}
                className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-white transition mt-1"
              >
                <Plus size={12} />
                <span>{isRTL ? 'إضافة نشاط' : 'Add Activity'}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FEATURES LIST ────────────────────────────────────────────────────────────

function FeaturesList({ 
  features, 
  onChange, 
  placeholder,
  color = '#22c55e' 
}: { 
  features: string[]; 
  onChange: (f: string[]) => void; 
  placeholder: string;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color }} className="text-xs font-bold flex-shrink-0">
            {color === '#22c55e' ? '✓' : '✗'}
          </span>
          <input
            type="text"
            value={f}
            onChange={e => onChange(features.map((x, j) => j === i ? e.target.value : x))}
            placeholder={placeholder}
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-white/30"
          />
          <button type="button" onClick={() => onChange(features.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 flex-shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...features, ''])}
        className="flex items-center gap-1 text-xs hover:text-white transition mt-1"
        style={{ color }}
      >
        <Plus size={12} />
        <span>Add item</span>
      </button>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────

export default function PackageStudioPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [items, setItems] = useState<StudioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form / editor state
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'media' | 'itinerary' | 'features' | 'publish'>('basic');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>('');

  // Form fields
  const [form, setForm] = useState<Partial<StudioItem>>({
    item_type: 'tour',
    title: '',
    title_ar: '',
    tagline: '',
    tagline_ar: '',
    description_html: '',
    description_html_ar: '',
    duration_type: 'days',
    duration_value: 1,
    price_amount: 0,
    original_price: undefined,
    discount_percentage: 0,
    currency: 'EGP',
    pricing_unit: 'per_person',
    target_audience: 'All travelers',
    itinerary: [],
    included_features: [],
    excluded_features: [],
    media: [],
    cover_image_url: '',
    booking_cta_type: 'whatsapp',
    booking_whatsapp: '',
    status: 'draft',
    publish_on_minisite: false,
    publish_on_main_portal: false,
    is_featured: false,
  });

  const isRTL = lang === 'ar';

  // ── Load session ──
  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(d => {
        const biz = d?.business;
        const profile = d?.profile;
        const adminRoles = ['super_admin', 'content_admin', 'sales_manager'];
        const role = profile?.role || d?.role || 'vendor';
        setSession({
          role,
          businessId: biz?.id || profile?.business_id || null,
          displayName: profile?.display_name || biz?.name || null,
          isAdmin: adminRoles.includes(role),
          canCreatePackages: adminRoles.includes(role) || biz?.can_create_packages === 1 || biz?.can_create_packages === true,
        });
      })
      .catch(() => setSession(null))
      .finally(() => setSessionLoading(false));
  }, []);

  // ── Load items ──
  const loadItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const url = session.isAdmin
        ? '/api/package-studio?status=all'
        : `/api/package-studio?businessId=${session.businessId || ''}&status=all`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadItems();
  }, [session, loadItems]);

  // ── Open editor ──
  const openCreate = () => {
    setEditingId(null);
    setForm({
      item_type: 'tour',
      title: '',
      title_ar: '',
      tagline: '',
      tagline_ar: '',
      description_html: '',
      description_html_ar: '',
      duration_type: 'days',
      duration_value: 1,
      price_amount: 0,
      original_price: undefined,
      discount_percentage: 0,
      currency: 'EGP',
      pricing_unit: 'per_person',
      target_audience: 'All travelers',
      itinerary: [],
      included_features: [],
      excluded_features: [],
      media: [],
      cover_image_url: '',
      booking_cta_type: 'whatsapp',
      booking_whatsapp: '',
      status: 'draft',
      publish_on_minisite: false,
      publish_on_main_portal: false,
      is_featured: false,
    });
    setActiveTab('basic');
    setMode('create');
  };

  const openEdit = (item: StudioItem) => {
    setEditingId(item.id);
    setForm({ ...item });
    setActiveTab('basic');
    setMode('edit');
  };

  const setField = (key: keyof StudioItem, val: any) => setForm(f => ({ ...f, [key]: val }));

  // ── Save ──
  const handleSave = async () => {
    if (!form.title?.trim()) {
      alert(isRTL ? 'يرجى إدخال عنوان الباقة' : 'Please enter a title');
      return;
    }

    setSaving(true);
    setSaveMsg('');
    try {
      const payload = {
        ...form,
        business_id: session?.isAdmin ? (form as any).business_id || session.businessId : session?.businessId,
      };

      const method = mode === 'edit' && editingId ? 'PUT' : 'POST';
      if (mode === 'edit' && editingId) (payload as any).id = editingId;

      const res = await fetch('/api/package-studio', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveMsg(data.message || 'Saved!');
        await loadItems();
        setTimeout(() => { setMode('list'); setSaveMsg(''); }, 1200);
      } else {
        alert(data.error || 'Save failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Admin moderation actions ──
  const moderateItem = async (id: string, updates: Record<string, any>) => {
    await fetch('/api/package-studio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await loadItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Delete this item?')) return;
    await fetch(`/api/package-studio?id=${id}`, { method: 'DELETE' });
    await loadItems();
  };

  // ─── Loading / Auth Guard ─────────────────────────────────────────────────────

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.canCreatePackages) {
    return (
      <div className="min-h-screen bg-[#070B12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6 bg-[#0D1524] border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="text-amber-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isRTL ? 'ليس لديك صلاحية إنشاء الباقات' : 'Package Studio Not Enabled'}
          </h2>
          <p className="text-sm text-slate-400">
            {isRTL 
              ? 'هذه الميزة تتطلب موافقة المدير العام. تواصل مع فريق الإدارة لتفعيل إنشاء الباقات لحسابك.' 
              : 'This feature requires admin approval. Contact the admin team to enable package creation for your business account.'}
          </p>
          <Link href="/vendor" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#e5c158] transition">
            {isRTL ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  // ─── EDITOR VIEW ──────────────────────────────────────────────────────────────

  if (mode === 'create' || mode === 'edit') {
    const TABS = [
      { id: 'basic',     icon: <Tag size={14} />,       label_en: 'Basic Info',      label_ar: 'المعلومات الأساسية' },
      { id: 'content',   icon: <AlignLeft size={14} />, label_en: 'Rich Content',    label_ar: 'المحتوى والوصف' },
      { id: 'media',     icon: <ImageIcon size={14} />, label_en: 'Media Gallery',   label_ar: 'معرض الوسائط' },
      { id: 'itinerary', icon: <List size={14} />,      label_en: 'Day-by-Day Plan', label_ar: 'البرنامج اليومي' },
      { id: 'features',  icon: <CheckCircle size={14} />, label_en: 'What\'s Included', label_ar: 'المشمول والمستثنى' },
      { id: 'publish',   icon: <Globe size={14} />,     label_en: 'Publish Settings', label_ar: 'إعدادات النشر' },
    ];

    return (
      <div className={`min-h-screen bg-[#070B12] text-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Sticky Top Editor Bar */}
        <div className="sticky top-0 z-40 bg-[#0C121E]/95 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('list')}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
              >
                {isRTL ? <ArrowLeft size={16} /> : <ArrowLeft size={16} />}
                <span>{isRTL ? 'رجوع للقائمة' : 'Back to List'}</span>
              </button>
              <div className="w-px h-5 bg-white/20" />
              <h1 className="text-sm font-bold text-white">
                {mode === 'create' 
                  ? (isRTL ? 'إنشاء باقة / جولة / برنامج جديد' : 'Create New Package / Tour / Program') 
                  : (isRTL ? `تعديل: ${form.title}` : `Editing: ${form.title}`)}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="px-3 py-1 text-xs rounded-full border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>

              {saveMsg && (
                <span className="text-xs text-emerald-400 font-bold">{saveMsg}</span>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#e5c158] transition disabled:opacity-50 shadow-lg"
              >
                <Save size={16} />
                <span>{saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}</span>
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="max-w-6xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#D4AF37]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{isRTL ? tab.label_ar : tab.label_en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Panels */}
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

          {/* ── BASIC INFO TAB ── */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                  {isRTL ? 'النوع والعنوان والوصف المختصر' : 'Type, Title & Tagline'}
                </h3>

                {/* Item Type */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ITEM_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setField('item_type', t.value)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        form.item_type === t.value
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {isRTL ? t.label_ar : t.label_en}
                    </button>
                  ))}
                </div>

                {/* Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {isRTL ? 'العنوان (إنجليزي) *' : 'Title (English) *'}
                    </label>
                    <input
                      type="text"
                      value={form.title || ''}
                      onChange={e => setField('title', e.target.value)}
                      placeholder="e.g. 3-Day Siwa Salt Lakes & Desert Safari"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {isRTL ? 'العنوان (عربي) *' : 'Title (Arabic) *'}
                    </label>
                    <input
                      type="text"
                      value={form.title_ar || ''}
                      onChange={e => setField('title_ar', e.target.value)}
                      placeholder="مثال: برنامج ٣ أيام في بحيرات الملح وسفاري الصحراء"
                      dir="rtl"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'شعار تعريفي (إنجليزي)' : 'Tagline (English)'}</label>
                    <input
                      type="text"
                      value={form.tagline || ''}
                      onChange={e => setField('tagline', e.target.value)}
                      placeholder="One compelling sentence..."
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'شعار تعريفي (عربي)' : 'Tagline (Arabic)'}</label>
                    <input
                      type="text"
                      value={form.tagline_ar || ''}
                      onChange={e => setField('tagline_ar', e.target.value)}
                      placeholder="جملة واحدة جاذبة بالعربية..."
                      dir="rtl"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                  {isRTL ? 'التسعير والمدة' : 'Pricing & Duration'}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'السعر (EGP)' : 'Price (EGP)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price_amount || 0}
                      onChange={e => setField('price_amount', Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'السعر الأصلي (قبل الخصم)' : 'Original Price (before discount)'}</label>
                    <input
                      type="number"
                      min={0}
                      value={form.original_price || ''}
                      onChange={e => setField('original_price', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'نسبة الخصم (%)' : 'Discount (%)'}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.discount_percentage || 0}
                      onChange={e => setField('discount_percentage', Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'وحدة التسعير' : 'Pricing Unit'}</label>
                    <select
                      value={form.pricing_unit || 'per_person'}
                      onChange={e => setField('pricing_unit', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="per_person">Per Person</option>
                      <option value="per_group">Per Group</option>
                      <option value="per_night">Per Night</option>
                      <option value="flat">Flat Rate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'المدة (قيمة)' : 'Duration (value)'}</label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration_value || 1}
                      onChange={e => setField('duration_value', Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'وحدة المدة' : 'Duration Unit'}</label>
                    <select
                      value={form.duration_type || 'days'}
                      onChange={e => setField('duration_type', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="nights">Nights</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'الفئة المستهدفة' : 'Target Audience'}</label>
                    <input
                      type="text"
                      value={form.target_audience || ''}
                      onChange={e => setField('target_audience', e.target.value)}
                      placeholder="e.g. Families, Solo travelers, Adventure seekers"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Booking CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{isRTL ? 'نوع زر الحجز' : 'Booking CTA Type'}</label>
                    <select
                      value={form.booking_cta_type || 'whatsapp'}
                      onChange={e => setField('booking_cta_type', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="link">External Link</option>
                      <option value="email">Email</option>
                      <option value="form">Inquiry Form</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {form.booking_cta_type === 'whatsapp' 
                        ? (isRTL ? 'رقم واتساب (مع رمز الدولة)' : 'WhatsApp Number (with country code)') 
                        : (isRTL ? 'رابط الحجز' : 'Booking URL')}
                    </label>
                    <input
                      type="text"
                      value={form.booking_cta_type === 'whatsapp' ? (form.booking_whatsapp || '') : (form as any).booking_cta_url || ''}
                      onChange={e => setField(
                        form.booking_cta_type === 'whatsapp' ? 'booking_whatsapp' : 'booking_cta_url' as any,
                        e.target.value
                      )}
                      placeholder={form.booking_cta_type === 'whatsapp' ? '+201001234567' : 'https://...'}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RICH CONTENT TAB ── */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                  🇬🇧 {isRTL ? 'الوصف التفصيلي بالإنجليزية' : 'Detailed Description (English)'}
                </h3>
                <MiniRichEditor
                  value={form.description_html || ''}
                  onChange={v => setField('description_html', v)}
                  placeholder="Write a detailed, engaging description of your tour/package in English. Add images and YouTube videos to make it rich!"
                  dir="ltr"
                  minHeight="280px"
                  businessId={session?.businessId || undefined}
                  sectionName="package-studio"
                />
              </div>

              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                  🇪🇬 {isRTL ? 'الوصف التفصيلي بالعربية' : 'Detailed Description (Arabic)'}
                </h3>
                <MiniRichEditor
                  value={form.description_html_ar || ''}
                  onChange={v => setField('description_html_ar', v)}
                  placeholder="اكتب وصفاً تفصيلياً جذاباً للجولة أو الباقة باللغة العربية. أضف صوراً ومقاطع يوتيوب لإثراء المحتوى!"
                  dir="rtl"
                  minHeight="280px"
                  businessId={session?.businessId || undefined}
                  sectionName="package-studio-ar"
                />
              </div>
            </div>
          )}

          {/* ── MEDIA GALLERY TAB ── */}
          {activeTab === 'media' && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                {isRTL ? 'معرض الوسائط (صور، فيديو، يوتيوب)' : 'Media Gallery (Images, Videos, YouTube)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isRTL 
                  ? 'ارفع صور وفيديوهات أو أضف روابط يوتيوب. الوسيط المحدد كـ"غلاف" سيظهر كصورة البطاقة الرئيسية.'
                  : 'Upload images/videos or add YouTube links. The item marked as "Cover" will be used as the main listing card image.'}
              </p>

              <MediaGalleryManager
                media={(form.media || []) as MediaItem[]}
                onChange={m => setField('media', m)}
                businessId={session?.businessId || undefined}
                lang={lang}
              />
            </div>
          )}

          {/* ── ITINERARY TAB ── */}
          {activeTab === 'itinerary' && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white">
                  {isRTL ? 'البرنامج التفصيلي يوماً بيوم' : 'Day-by-Day Itinerary'}
                </h3>
                <div className="text-xs text-slate-400">
                  {form.duration_value || 1} {isRTL ? 'أيام' : 'days'}
                </div>
              </div>
              <ItineraryBuilder
                itinerary={(form.itinerary || []) as ItineraryDay[]}
                onChange={it => setField('itinerary', it)}
                durationDays={Number(form.duration_value) || 1}
                lang={lang}
              />
            </div>
          )}

          {/* ── FEATURES TAB ── */}
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                  <CheckCircle className="text-emerald-400" size={18} />
                  <span>{isRTL ? 'ماذا يشمل؟' : "What's Included"}</span>
                </h3>
                <FeaturesList
                  features={(form.included_features || []) as string[]}
                  onChange={f => setField('included_features', f)}
                  placeholder={isRTL ? 'أضف ميزة مشمولة...' : 'Add included item...'}
                  color="#22c55e"
                />
              </div>

              <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                  <X className="text-red-400" size={18} />
                  <span>{isRTL ? 'ماذا لا يشمل؟' : "What's Excluded"}</span>
                </h3>
                <FeaturesList
                  features={(form.excluded_features || []) as string[]}
                  onChange={f => setField('excluded_features', f)}
                  placeholder={isRTL ? 'أضف عنصراً غير مشمول...' : 'Add excluded item...'}
                  color="#ef4444"
                />
              </div>
            </div>
          )}

          {/* ── PUBLISH SETTINGS TAB ── */}
          {activeTab === 'publish' && (
            <div className="bg-[#0D1524] border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                {isRTL ? 'إعدادات النشر والحالة' : 'Status & Publish Settings'}
              </h3>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'حالة العنصر' : 'Item Status'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setField('status', key)}
                      disabled={!session?.isAdmin && key === 'approved'}
                      className={`p-3 rounded-xl border text-xs font-bold text-start transition ${
                        form.status === key ? 'border-current text-current' : 'border-white/10 text-slate-400 hover:border-white/30'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                      style={{
                        background: form.status === key ? cfg.bg : undefined,
                        color: form.status === key ? cfg.color : undefined,
                        borderColor: form.status === key ? cfg.color : undefined,
                      }}
                    >
                      {cfg.label}
                      {!session?.isAdmin && key === 'approved' && <span className="text-[10px] block opacity-60">(Admin only)</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isRTL ? 'مكان العرض' : 'Visibility'}
                </label>

                {[
                  { key: 'publish_on_minisite', label_en: 'Publish on my Minisite / Business Page', label_ar: 'نشر على صفحة بيزنسي المصغرة' },
                  { key: 'publish_on_main_portal', label_en: 'Publish on SiWiFy Main Portal', label_ar: 'نشر على البوابة الرئيسية SiWiFy' },
                  ...(session?.isAdmin ? [{ key: 'is_featured', label_en: '⭐ Feature this item (homepage highlight)', label_ar: '⭐ تمييز هذا العنصر (على الصفحة الرئيسية)' }] : []),
                ].map(t => (
                  <div
                    key={t.key}
                    onClick={() => {
                      if (!session?.isAdmin && t.key !== 'publish_on_minisite') return;
                      setField(t.key as any, !(form as any)[t.key]);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                      (form as any)[t.key] 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    } ${!session?.isAdmin && t.key !== 'publish_on_minisite' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-sm font-semibold">{isRTL ? t.label_ar : t.label_en}</span>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${(form as any)[t.key] ? 'bg-emerald-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(form as any)[t.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                ))}

                {!session?.isAdmin && (
                  <p className="text-xs text-slate-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    💡 {isRTL 
                      ? 'سيتم إرسال الباقة للمراجعة. بعد موافقة المدير يمكن نشرها على البوابة الرئيسية.' 
                      : 'Your item will be submitted for review. After admin approval it can appear on the main portal.'}
                  </p>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#D4AF37] text-black font-extrabold text-base hover:bg-[#e5c158] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                <Send size={18} />
                <span>
                  {saving 
                    ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                    : session?.isAdmin
                      ? (isRTL ? 'حفظ ونشر' : 'Save & Publish')
                      : (isRTL ? 'إرسال للمراجعة' : 'Submit for Review')}
                </span>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────

  const typeFilter = (t: string) => t === 'all' ? items : items.filter(i => i.item_type === t);
  const [filterType, setFilterType] = useState('all');
  const filtered = typeFilter(filterType);

  return (
    <div className={`min-h-screen bg-[#070B12] text-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-[#0C121E] border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Package className="text-[#D4AF37]" size={24} />
              <span>{isRTL ? 'استوديو الباقات والجولات والبرامج' : 'Package & Tour Studio'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {session?.isAdmin 
                ? (isRTL ? 'لوحة تحكم المدير — عرض وإدارة جميع الباقات' : 'Admin Panel — All packages across vendors')
                : (isRTL ? `${session?.displayName || 'مرحباً'} — إنشاء وإدارة باقاتك وعروضك وجولاتك` : `${session?.displayName || 'Welcome'} — Create and manage your packages`)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1 text-xs rounded-full border border-[#D4AF37]/40 text-[#D4AF37]"
            >
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#e5c158] transition shadow-lg"
            >
              <Plus size={16} />
              <span>{isRTL ? 'إنشاء جديد' : 'Create New'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[{ value: 'all', label_en: 'All', label_ar: 'الكل' }, ...ITEM_TYPES].map(t => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                filterType === t.value 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {isRTL ? t.label_ar : t.label_en}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">{isRTL ? 'جاري تحميل الباقات...' : 'Loading items...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-white/20 rounded-2xl p-12 text-center space-y-4">
            <Package className="text-slate-600 mx-auto" size={40} />
            <h3 className="text-lg font-bold text-slate-400">
              {isRTL ? 'لا توجد باقات بعد' : 'No packages yet'}
            </h3>
            <p className="text-sm text-slate-500">
              {isRTL ? 'أنشئ أول باقة أو جولة أو عرض لبيزنسك' : 'Create your first tour, package, or promotional offer'}
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#e5c158] transition"
            >
              <Plus size={16} />
              <span>{isRTL ? 'إنشاء أول باقة' : 'Create First Item'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(item => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
              const coverMedia = item.media?.find(m => m.cover) || item.media?.[0];
              return (
                <div key={item.id} className="bg-[#0D1524] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group">
                  {/* Cover Image / YouTube */}
                  <div className="relative h-44 bg-black/40">
                    {coverMedia?.type === 'youtube' ? (
                      <iframe src={coverMedia.url} className="w-full h-full" allowFullScreen />
                    ) : coverMedia?.type === 'video' ? (
                      <video src={coverMedia.url} className="w-full h-full object-cover" />
                    ) : coverMedia?.url || item.cover_image_url ? (
                      <img src={coverMedia?.url || item.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">
                        {item.item_type === 'tour' ? '🗺️' : item.item_type === 'activity' ? '🎯' : item.item_type === 'discount' ? '🏷️' : '📦'}
                      </div>
                    )}

                    {/* Status badge */}
                    <div
                      className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                    >
                      {cfg.label}
                    </div>

                    {/* Type badge */}
                    <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-black/70 text-white uppercase">
                      {isRTL ? ITEM_TYPES.find(t => t.value === item.item_type)?.label_ar : item.item_type}
                    </div>

                    {item.is_featured && (
                      <div className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-[#D4AF37] text-black">
                        ⭐ {isRTL ? 'مميز' : 'Featured'}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">
                        {isRTL && item.title_ar ? item.title_ar : item.title}
                      </h3>
                      {item.tagline && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {isRTL && item.tagline_ar ? item.tagline_ar : item.tagline}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-[#D4AF37] font-mono text-sm">
                        {item.price_amount?.toLocaleString()} {item.currency}
                      </span>
                      {item.original_price && item.original_price > item.price_amount && (
                        <span className="text-slate-500 line-through text-xs font-mono">{item.original_price}</span>
                      )}
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{item.duration_value} {item.duration_type}</span>
                    </div>

                    {session?.isAdmin && item.business_name && (
                      <div className="text-[10px] text-slate-500 bg-white/5 rounded-lg px-2 py-1">
                        🏢 {item.business_name} {item.creator_name && `• By ${item.creator_name}`}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="border-t border-white/10 pt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEdit(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                      >
                        <Edit2 size={12} />
                        <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {session?.isAdmin && (
                        <>
                          {item.status !== 'approved' && (
                            <button
                              onClick={() => moderateItem(item.id, { status: 'approved', publish_on_main_portal: true, publish_on_minisite: true })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold transition"
                            >
                              <CheckCircle size={12} />
                              <span>{isRTL ? 'قبول' : 'Approve'}</span>
                            </button>
                          )}
                          {item.status === 'approved' && (
                            <button
                              onClick={() => moderateItem(item.id, { status: 'suspended' })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold transition"
                            >
                              <PauseCircle size={12} />
                              <span>{isRTL ? 'إيقاف' : 'Suspend'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => moderateItem(item.id, { is_featured: !item.is_featured })}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                              item.is_featured ? 'bg-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                            }`}
                          >
                            <Star size={12} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
