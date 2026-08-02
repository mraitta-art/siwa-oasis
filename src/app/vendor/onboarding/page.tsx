'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ── */
interface Section {
  id: string;
  name: string;
  icon: string;
  fields: { id: string; name: string; label: string; field_type: string; required: boolean; value: any; options?: any }[];
}
interface BusinessData { id: string; name: string; slug: string; description: string; }

/* ─── Steps config ── */
const STEPS = [
  { n: 1, icon: '🏪', label: 'Identity',  sub: 'Name, tagline, description' },
  { n: 2, icon: '📍', label: 'Contact',   sub: 'Phone, location, hours' },
  { n: 3, icon: '📸', label: 'Gallery',   sub: 'Upload your best photos' },
  { n: 4, icon: '🚀', label: 'Publish',   sub: 'Review & go live' },
];

export default function VendorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [gallery, setGallery] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── Load vendor story ── */
  useEffect(() => {
    fetch('/api/vendor/story')
      .then(r => r.json())
      .then(data => {
        if (data?.business) {
          setBusiness(data.business);
          setPublished(!!data.business.is_published);
        }
        if (data?.structure) {
          setSections(data.structure);
          const init: Record<string, any> = {};
          data.structure.forEach((s: Section) => {
            s.fields.forEach(f => { init[f.name] = f.value ?? ''; });
          });
          setFormData(init);
        }
      })
      .catch(() => {});
    fetch('/api/vendor/gallery')
      .then(r => r.json())
      .then(d => setGallery(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  /* ── Save section data ── */
  async function saveSection(sectionId: string) {
    setSaving(true);
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;
      const payload: Record<string, any> = {};
      section.fields.forEach(f => { payload[f.name] = formData[f.name] ?? ''; });
      await fetch(`/api/vendor/sections/${sectionId}/component-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  /* ── Upload photos ── */
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const firstSection = sections[0];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sectionId', firstSection?.id || 'basic');
      fd.append('caption', file.name.replace(/\.[^/.]+$/, ''));
      try {
        await fetch('/api/vendor/gallery/upload', { method: 'POST', body: fd });
      } catch (e) { console.error(e); }
    }
    const updated = await fetch('/api/vendor/gallery').then(r => r.json()).catch(() => []);
    setGallery(Array.isArray(updated) ? updated : []);
    setUploading(false);
  }

  async function setHero(id: string) {
    await fetch(`/api/vendor/gallery/${id}/hero`, { method: 'PATCH' });
    const updated = await fetch('/api/vendor/gallery').then(r => r.json()).catch(() => []);
    setGallery(Array.isArray(updated) ? updated : []);
  }

  /* ── Publish ── */
  async function handlePublish() {
    setPublishing(true);
    try {
      await fetch('/api/vendor/minisite/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      });
      setPublished(true);
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  }

  /* ─── Helpers ─── */
  const totalPct = () => {
    let total = 0, filled = 0;
    sections.forEach(s => { s.fields.forEach(f => { total++; if (formData[f.name]) filled++; }); });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  const fieldsByStep: Record<number, string[]> = {
    1: ['name', 'tagline', 'description', 'established_year'],
    2: ['phone', 'whatsapp', 'email', 'website', 'address', 'working_hours'],
  };

  const renderField = (field: { id: string; name: string; label: string; field_type: string; required: boolean; options?: any }) => {
    const val = formData[field.name] ?? '';
    const onChange = (v: any) => setFormData(p => ({ ...p, [field.name]: v }));
    const base = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition';

    if (field.field_type === 'textarea') return (
      <textarea key={field.id} value={val} onChange={e => onChange(e.target.value)} placeholder={field.label} rows={4} className={base + ' resize-none'} />
    );
    if (field.field_type === 'select' && field.options) return (
      <select key={field.id} value={val} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">Select {field.label}...</option>
        {Array.isArray(field.options) ? field.options.map((o: any) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        )) : null}
      </select>
    );
    return (
      <input key={field.id} type={field.field_type === 'number' ? 'number' : 'text'} value={val} onChange={e => onChange(e.target.value)} placeholder={field.label} className={base} />
    );
  };

  const stepFields = (stepN: number) => {
    const names = fieldsByStep[stepN] || [];
    const matched: any[] = [];
    sections.forEach(s => s.fields.forEach(f => { if (names.includes(f.name)) matched.push(f); }));
    // fallback: show all fields from first section if no matches
    if (matched.length === 0 && stepN <= 2) {
      const s = sections[stepN - 1] || sections[0];
      return s?.fields.slice(0, 6) || [];
    }
    return matched;
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] font-sans">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            🪄 Setup Wizard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Build Your Minisite</h1>
          <p className="text-slate-400 font-semibold text-sm">Complete these steps to launch your business profile on Siwa Oasis</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => step > s.n && setStep(s.n)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition ${step === s.n ? 'bg-[#D4AF37]/10 border border-amber-200' : step > s.n ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold border-2 transition ${
                  step > s.n ? 'bg-emerald-500 border-emerald-500 text-white' :
                  step === s.n ? 'bg-[#D4AF37] border-[#D4AF37] text-white shadow-lg shadow-amber-200' :
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                  {step > s.n ? '✓' : s.icon}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${step === s.n ? 'text-[#D4AF37]' : step > s.n ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 max-w-8 rounded-full transition ${step > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">

          {/* Step header */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-slate-100 px-7 py-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{STEPS[step - 1]?.icon}</span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Step {step}: {STEPS[step - 1]?.label}</h2>
                <p className="text-sm text-slate-500 font-semibold">{STEPS[step - 1]?.sub}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-2xl font-extrabold text-[#D4AF37]">{totalPct()}%</span>
                <div className="text-xs text-slate-400 font-semibold">complete</div>
              </div>
            </div>
          </div>

          <div className="p-7">

            {/* ── STEP 1: Identity ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-sm text-amber-700 font-semibold mb-2">
                  💡 Your business name and description appear prominently on your minisite and in search results.
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Business Name *</label>
                  <input type="text" value={formData.name || business?.name || ''} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g. Siwa Desert Camp" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Tagline</label>
                  <input type="text" value={formData.tagline || ''} onChange={e => setFormData(p => ({...p, tagline: e.target.value}))} placeholder="e.g. Authentic desert experience since 2010" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Description *</label>
                  <textarea value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} placeholder="Tell visitors about your business, what makes it unique, what to expect..." rows={5} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition resize-none" />
                </div>
                {/* Extra fields from first section */}
                {stepFields(1).filter(f => !['name','description','tagline'].includes(f.name)).slice(0,3).map((f: any) => (
                  <div key={f.id}>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                    {renderField(f)}
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 2: Contact ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-700 font-semibold mb-2">
                  💡 Contact details appear on your minisite so visitors can reach you directly.
                </div>
                {[
                  { key: 'phone', label: 'Phone Number', placeholder: '+20 123 456 7890', icon: '📞' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+20 123 456 7890', icon: '💬' },
                  { key: 'email', label: 'Email Address', placeholder: 'info@yourbusiness.com', icon: '✉️' },
                  { key: 'website', label: 'Website', placeholder: 'https://yourbusiness.com', icon: '🌐' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">{f.icon} {f.label}</label>
                    <input type="text" value={formData[f.key] || ''} onChange={e => setFormData(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">📍 Address</label>
                  <textarea value={formData.address || ''} onChange={e => setFormData(p => ({...p, address: e.target.value}))} placeholder="Full address in Siwa Oasis" rows={2} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">⏰ Working Hours</label>
                  <input type="text" value={formData.working_hours || ''} onChange={e => setFormData(p => ({...p, working_hours: e.target.value}))} placeholder="e.g. Daily 8AM – 10PM" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-amber-50 transition" />
                </div>
              </div>
            )}

            {/* ── STEP 3: Gallery ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm text-purple-700 font-semibold">
                  💡 Upload at least 3 photos. The hero image will be your minisite's main cover photo.
                </div>

                {/* Upload Zone */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${dragOver ? 'border-[#D4AF37] bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/40'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-4xl mb-3">{uploading ? '⏳' : '📸'}</div>
                  <h3 className="font-extrabold text-slate-700 mb-1">{uploading ? 'Uploading...' : 'Drag & Drop Photos Here'}</h3>
                  <p className="text-sm text-slate-400 font-semibold">or click to browse</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                </div>

                {/* Upload buttons */}
                <div className="flex gap-3">
                  <label className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition text-center cursor-pointer">
                    📁 Choose Files
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                  </label>
                  <label className="flex-1 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl transition text-center cursor-pointer">
                    📱 Camera
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                  </label>
                </div>

                {/* Gallery grid */}
                {gallery.length > 0 && (
                  <>
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{gallery.length} Photo{gallery.length !== 1 ? 's' : ''} Uploaded</p>
                    <div className="grid grid-cols-3 gap-3">
                      {gallery.map((img: any) => (
                        <div key={img.id} className={`relative rounded-2xl overflow-hidden border-2 transition ${img.is_hero ? 'border-[#D4AF37] shadow-lg shadow-amber-100' : 'border-slate-100 hover:border-slate-200'}`}>
                          <img src={img.url} alt={img.caption || 'photo'} className="w-full h-24 sm:h-32 object-cover" />
                          {img.is_hero && (
                            <div className="absolute top-1 left-1 bg-[#D4AF37] text-white text-xs font-extrabold px-1.5 py-0.5 rounded-lg">⭐ Hero</div>
                          )}
                          {!img.is_hero && (
                            <button onClick={() => setHero(img.id)} className="absolute bottom-1 right-1 bg-white/90 hover:bg-[#D4AF37] hover:text-white text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg transition border border-slate-200">
                              Set Hero
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {gallery.length < 3 && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                    ⚠️ Upload at least {3 - gallery.length} more photo{3 - gallery.length !== 1 ? 's' : ''} to complete this step
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Publish ── */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <h3 className="font-extrabold text-slate-800 mb-3">📋 Your Profile Summary</h3>
                  {[
                    { label: 'Business Name', value: formData.name || business?.name || '—' },
                    { label: 'Description', value: formData.description ? `${String(formData.description).slice(0, 60)}...` : '—' },
                    { label: 'Phone', value: formData.phone || '—' },
                    { label: 'WhatsApp', value: formData.whatsapp || '—' },
                    { label: 'Email', value: formData.email || '—' },
                    { label: 'Photos', value: `${gallery.length} uploaded` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{row.label}</span>
                      <span className="text-sm font-bold text-slate-700 text-right max-w-[60%]">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Profile Completion */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-extrabold text-amber-700">Profile Completion</span>
                    <span className="text-lg font-extrabold text-[#D4AF37]">{totalPct()}%</span>
                  </div>
                  <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${totalPct()}%`, background: 'linear-gradient(90deg,#D4AF37,#f0c842)' }} />
                  </div>
                  {totalPct() < 60 && (
                    <p className="text-xs text-amber-600 font-semibold mt-2">💡 Complete more sections for a better minisite. You can still publish now and update later.</p>
                  )}
                </div>

                {/* Publish CTA */}
                {!published ? (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-500 hover:to-[#D4AF37] text-white font-extrabold text-lg rounded-2xl transition shadow-lg shadow-amber-200 disabled:opacity-50"
                  >
                    {publishing ? '⏳ Publishing...' : '🚀 Launch My Minisite!'}
                  </button>
                ) : (
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-extrabold text-emerald-800 text-lg mb-1">You're Live!</h3>
                    <p className="text-emerald-600 text-sm font-semibold mb-4">Your minisite is published on Siwa Oasis</p>
                    {business?.slug && (
                      <Link href={`/${business.slug}`} target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl transition">
                        <i className="fas fa-external-link-alt text-xs"></i>
                        View My Minisite
                      </Link>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/vendor/sections" className="py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl transition text-center">
                    ✏️ Edit More Sections
                  </Link>
                  <Link href="/vendor/minisite" className="py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl transition text-center">
                    ⚙️ Section Visibility
                  </Link>
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition flex items-center gap-2">
                  <i className="fas fa-arrow-left text-xs"></i> Back
                </button>
              )}
              <div className="flex-1" />
              {step < 3 && (
                <button
                  onClick={async () => {
                    // auto-save step 1 & 2
                    if (step <= 2) {
                      const firstSec = sections[step - 1] || sections[0];
                      if (firstSec) await saveSection(firstSec.id);
                    }
                    setStep(s => s + 1);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-extrabold text-sm rounded-2xl transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : `Save & Continue`}
                  <i className="fas fa-arrow-right text-xs"></i>
                </button>
              )}
              {step === 3 && (
                <button onClick={() => setStep(4)} className="px-6 py-3 bg-[#D4AF37] hover:bg-amber-600 text-white font-extrabold text-sm rounded-2xl transition shadow-sm flex items-center gap-2">
                  Next: Review <i className="fas fa-arrow-right text-xs"></i>
                </button>
              )}
              {step === 4 && !published && (
                <Link href="/vendor" className="px-5 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-200 transition">
                  Skip for now
                </Link>
              )}
              {step === 4 && published && (
                <Link href="/vendor" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl transition flex items-center gap-2">
                  Go to Dashboard <i className="fas fa-arrow-right text-xs"></i>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Skip link */}
        {!published && (
          <div className="text-center mt-5">
            <Link href="/vendor" className="text-slate-400 text-sm font-semibold hover:text-slate-600 transition">
              Skip setup → Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
