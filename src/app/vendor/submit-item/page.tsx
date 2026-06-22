'use client';

import React from 'react';

export default function VendorSubmitItemPage() {
  const [type, setType] = React.useState('offer');
  const [title, setTitle] = React.useState('');
  const [brief, setBrief] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [heroImages, setHeroImages] = React.useState<string[]>([]);
  const [businessName, setBusinessName] = React.useState('');

  async function uploadFile(file: File) {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((res, rej) => {
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    const filename = `${Date.now()}_${file.name}`;
    const resp = await fetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, data: dataUrl }) });
    const j = await resp.json();
    if (j?.success && j.url) return j.url;
    throw new Error('Upload failed');
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>, target: 'images'|'hero') {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const url = await uploadFile(file);
      if (target === 'images') setImages(prev => [...prev, url]); else setHeroImages(prev => [...prev, url]);
    } catch (err) { console.error(err); alert('Upload failed'); }
  }

  async function submit() {
    try {
      const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, title, brief, description, images, hero_images: heroImages, business_name: businessName }) });
      const j = await res.json();
      if (j?.success) { alert('Submitted'); setTitle(''); setBrief(''); setDescription(''); setImages([]); setHeroImages([]); }
      else alert('Submit failed');
    } catch (err) { console.error(err); alert('Submit failed'); }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Submit Offer / Package / Investment</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300">Business Name</label>
          <input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300">Type</label>
          <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded text-white">
            <option value="offer">Offer</option>
            <option value="package">Package</option>
            <option value="investment">Investment</option>
            <option value="discount">Discount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300">Brief (for minisite/blog)</label>
          <input value={brief} onChange={(e)=>setBrief(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-300">Description</label>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded text-white" rows={6} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">Images (gallery)</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFiles(e,'images')} />
          <div className="flex gap-2 mt-2">
            {images.map((u,i)=> (<img key={i} src={u} className="w-20 h-12 object-cover rounded"/>))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">Hero Images (carousel)</label>
          <input type="file" accept="image/*" onChange={(e)=>handleFiles(e,'hero')} />
          <div className="flex gap-2 mt-2">
            {heroImages.map((u,i)=> (<img key={i} src={u} className="w-20 h-12 object-cover rounded"/>))}
          </div>
        </div>

        <div className="md:col-span-2">
          <button onClick={submit} className="px-4 py-2 bg-[#556B2F] rounded text-white">Submit</button>
        </div>
      </div>
    </div>
  );
}
