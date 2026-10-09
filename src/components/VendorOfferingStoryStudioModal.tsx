'use client';

import React, { useState, useRef } from 'react';
import { 
  Plus, Upload, Image as ImageIcon, CheckCircle2, 
  Sparkles, X, Star, FileText, ChevronRight, AlertCircle, 
  Globe, Eye, Layers, Compass, Car, Bed, TreePine, Package as PackageIcon, ArrowRight
} from 'lucide-react';
import RichBlogEditor from '@/components/RichBlogEditor';

export type OfferingCategory = 'transportation' | 'accommodation' | 'retreat' | 'product' | 'package';

interface UploadedPhoto {
  id?: string;
  url: string;
  caption: string;
  isCover?: boolean;
}

interface VendorOfferingStoryStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  businessName?: string;
  businessSlug?: string;
  onItemCreated?: (item: any) => void;
}

const CATEGORIES: Array<{
  id: OfferingCategory;
  name: string;
  name_ar: string;
  icon: any;
  color: string;
  sectionId: string;
  description: string;
}> = [
  {
    id: 'transportation',
    name: 'Transportation & Transfers',
    name_ar: 'النقل والمواصلات',
    icon: Car,
    color: '#b45309',
    sectionId: 'sec_5_experiences',
    description: '4x4 desert safari, Cairo/Alexandria direct transfers, tuk-tuks, or local mobility'
  },
  {
    id: 'accommodation',
    name: 'Accommodation & Stays',
    name_ar: 'الإقامة والنزول',
    icon: Bed,
    color: '#059669',
    sectionId: 'sec_3_facilities',
    description: 'Eco-lodge chalets, desert camps, luxury glamping, or mud-brick heritage rooms'
  },
  {
    id: 'retreat',
    name: 'Retreats & Day Programs',
    name_ar: 'الخلوات والأنشطة',
    icon: TreePine,
    color: '#0284c7',
    sectionId: 'sec_5_experiences',
    description: 'Salt lake floating, sunset sandboarding, wellness therapy, or guided cultural walks'
  },
  {
    id: 'product',
    name: 'Artisanal Products & Trade',
    name_ar: 'المنتجات والحرف',
    icon: PackageIcon,
    color: '#ec4899',
    sectionId: 'sec_9_marketplace_catalog',
    description: 'Siwan dates, cold-pressed virgin olive oil, salt crystal lamps, or Berber textiles'
  },
  {
    id: 'package',
    name: 'Curated Combo Package',
    name_ar: 'باقة سياحية متكاملة',
    icon: Layers,
    color: '#7c3aed',
    sectionId: 'sec_5_experiences',
    description: 'Multi-service bundled package (Stay + Transfer + Tours) with packaged savings'
  }
];

export default function VendorOfferingStoryStudioModal({
  isOpen,
  onClose,
  businessId,
  businessName = 'My Business',
  businessSlug = '',
  onItemCreated
}: VendorOfferingStoryStudioModalProps) {
  // Stepper: 1: Selection & Specs, 2: Image Gallery, 3: Success & Blog Narrative
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState<OfferingCategory>('transportation');

  // Specs & Data Form
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('EGP');
  const [priceUnit, setPriceUnit] = useState('per_person');
  const [durationValue, setDurationValue] = useState<number | ''>(1);
  const [durationType, setDurationType] = useState<'hours' | 'days'>('days');
  const [capacity, setCapacity] = useState('1-4 Guests');
  const [routeOrLocation, setRouteOrLocation] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [highlights, setHighlights] = useState('');

  // Uploaded Photos
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved Service State
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [saveItemError, setSaveItemError] = useState('');
  const [savedItemId, setSavedItemId] = useState<string | null>(null);

  // Blog Narrative State (Step 3)
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogLanguage, setBlogLanguage] = useState<'en' | 'ar'>('en');
  const [showOnMinisite, setShowOnMinisite] = useState(true);
  const [showOnMainPortal, setShowOnMainPortal] = useState(true);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [blogSavedSuccess, setBlogSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentCatConfig = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  // Handle Photo Upload
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploadingPhotos(true);
    setUploadError('');

    const newUploaded: UploadedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sectionId', currentCatConfig.sectionId);
      formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('show_on_minisite', 'true');
      formData.append('show_on_main', 'true');

      try {
        const res = await fetch('/api/vendor/gallery/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data?.url) {
          newUploaded.push({
            id: data.id,
            url: data.url,
            caption: data.caption || file.name,
            isCover: photos.length === 0 && newUploaded.length === 0
          });
        } else {
          setUploadError(data?.error || 'One or more images failed to upload.');
        }
      } catch (err: any) {
        setUploadError(err.message || 'Image upload network error.');
      }
    }

    if (newUploaded.length > 0) {
      setPhotos(prev => [...prev, ...newUploaded]);
    }
    setIsUploadingPhotos(false);
  }

  function handleSetCover(index: number) {
    setPhotos(prev => prev.map((p, idx) => ({ ...p, isCover: idx === index })));
  }

  function handleRemovePhoto(index: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  }

  // Save Item To Database
  async function handleSaveItem() {
    if (!title.trim()) {
      setSaveItemError('Please enter an offering title.');
      return;
    }
    setIsSavingItem(true);
    setSaveItemError('');

    const coverPhoto = photos.find(p => p.isCover) || photos[0];
    const attributes: Record<string, any> = {
      route_location: routeOrLocation,
      start_time: startTime,
      end_time: endTime,
      highlights: highlights.split('\n').filter(Boolean),
      photos: photos.map(p => ({ url: p.url, caption: p.caption, is_cover: p.isCover })),
      cover_image: coverPhoto?.url || null
    };

    const payload = {
      category: selectedCategory === 'retreat' ? 'activity' : selectedCategory,
      service_type: selectedCategory,
      title: title.trim(),
      description: description.trim(),
      attributes,
      price: price ? Number(price) : null,
      currency,
      price_unit: priceUnit,
      capacity,
      availability: 'Available Daily',
      package_eligible: selectedCategory === 'package',
      audience_scopes: ['public', 'visitors', 'minisite'],
      placements: ['minisite', 'main_portal', 'marketplace']
    };

    try {
      const res = await fetch('/api/vendor/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save offering.');
      }

      const createdId = data.id || `item_${Date.now()}`;
      setSavedItemId(createdId);

      // Pre-fill Blog story template
      setBlogTitle(`Discover ${title}: An Authentic Siwan Experience`);
      setBlogExcerpt(description ? description.slice(0, 160) : `Experience authentic ${title} with ${businessName} in Siwa Oasis.`);
      setBlogContent(`
        <p><strong>Welcome to ${title}</strong> hosted by <strong>${businessName}</strong>.</p>
        <p>${description}</p>
        <h3>What Makes This Experience Special</h3>
        <ul>
          ${highlights.split('\n').filter(Boolean).map(h => `<li>${h}</li>`).join('') || '<li>Handcrafted local authenticity</li><li>Personalized service</li>'}
        </ul>
        <p>Whether you are planning a solo retreat, family journey, or desert adventure, our team ensures seamless hospitality with deep reverence for Siwa's cultural heritage.</p>
      `.trim());

      if (onItemCreated) {
        onItemCreated({ id: createdId, title, category: selectedCategory, price, photos });
      }

      // Transition to Step 3: Story & Blog Narrative!
      setStep(3);
    } catch (err: any) {
      setSaveItemError(err.message || 'Error saving offering.');
    } finally {
      setIsSavingItem(false);
    }
  }

  // Save Blog Post / Free Text Narrative
  async function handleSaveBlog() {
    if (!blogTitle.trim()) return;
    setIsSavingBlog(true);

    const targetSection = currentCatConfig.sectionId;
    const coverPhoto = photos.find(p => p.isCover) || photos[0];

    try {
      const res = await fetch(`/api/vendor/sections/${targetSection}/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blogTitle.trim(),
          excerpt: blogExcerpt.trim(),
          content: blogContent,
          show_on_minisite: showOnMinisite,
          show_on_main: showOnMainPortal,
          cover_image_url: coverPhoto?.url || null
        })
      });

      if (res.ok) {
        setBlogSavedSuccess(true);
      } else {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to publish story');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving story');
    } finally {
      setIsSavingBlog(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b18] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b45309] flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Vendor Offering &amp; Visual Story Studio
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-2 py-0.5 rounded-full">
                  Minisite &amp; Main Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {businessName} • Multi-Section Selection &amp; Narrative Gathering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={() => step > 1 && setStep(1)} 
              className={`flex items-center gap-2 pb-1 transition-all ${step === 1 ? 'text-[#b45309] border-b-2 border-[#b45309]' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#b45309] text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span>Selections &amp; Rates</span>
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <button 
              onClick={() => step > 2 && setStep(2)} 
              className={`flex items-center gap-2 pb-1 transition-all ${step === 2 ? 'text-[#b45309] border-b-2 border-[#b45309]' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#b45309] text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span>Item Images ({photos.length})</span>
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <button 
              disabled={!savedItemId}
              className={`flex items-center gap-2 pb-1 transition-all ${step === 3 ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
              <span>Story &amp; Blog Narrative</span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
            Auto-syndicates to Journey Builder &amp; Minisite
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ───────────────── STEP 1: SELECTIONS & DATA ───────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Category Picker Badges */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                  1. Select Offering Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {CATEGORIES.map(cat => {
                    const IconComp = cat.icon;
                    const isSel = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSel 
                            ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                            style={{ background: cat.color }}
                          >
                            <IconComp size={16} />
                          </span>
                          {isSel && <CheckCircle2 size={16} className="text-amber-600" />}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 leading-tight">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {cat.name_ar}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {currentCatConfig.description}
                </p>
              </div>

              {/* Title & Arabic Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Offering Title (English) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Cairo to Siwa VIP Direct 4x4 Transfer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العنوان باللغة العربية (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={titleAr}
                    onChange={e => setTitleAr(e.target.value)}
                    placeholder="مثال: رحلة خاصة بسيارة 4x4 من القاهرة إلى سيوة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Offering Price *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 1500"
                      className="w-full pl-3 pr-12 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 1800"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pricing Unit
                  </label>
                  <select
                    value={priceUnit}
                    onChange={e => setPriceUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none bg-white font-medium"
                  >
                    <option value="per_person">Per Person</option>
                    <option value="per_group">Per Group</option>
                    <option value="per_room">Per Room / Night</option>
                    <option value="per_vehicle">Per Vehicle / Transfer</option>
                    <option value="fixed">Fixed Price</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacity / Unit Limit
                  </label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    placeholder="e.g. Up to 4 Passengers"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Specs based on Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {selectedCategory === 'transportation' ? 'Route / Coverage' : selectedCategory === 'accommodation' ? 'Property / Room Unit' : 'Location / Destination'}
                  </label>
                  <input
                    type="text"
                    value={routeOrLocation}
                    onChange={e => setRouteOrLocation(e.target.value)}
                    placeholder={selectedCategory === 'transportation' ? 'Cairo ⇄ Siwa / Great Sand Sea' : 'Mudbrick Chalet or Dune Camp'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standard Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={durationValue}
                      onChange={e => setDurationValue(e.target.value ? Number(e.target.value) : '')}
                      className="w-20 px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                    />
                    <select
                      value={durationType}
                      onChange={e => setDurationType(e.target.value as any)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none bg-white font-medium"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description & Key Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe this service or product briefly for visitor search cards..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Key Highlights (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={highlights}
                    onChange={e => setHighlights(e.target.value)}
                    placeholder="Private air-conditioned 4x4&#10;Experienced Siwan Bedouin driver&#10;Free cold water &amp; dates"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action to Step 2 */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      alert('Please provide an offering title.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  <span>Continue to Image Upload ({photos.length} uploaded)</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          )}

          {/* ───────────────── STEP 2: MULTI-IMAGE UPLOADING ───────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    2. Upload Photos for: <span className="text-amber-700 font-bold">{title || 'Selected Item'}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload high-resolution photography. These images are attached to this offering and syndicated to your minisite.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#b45309] text-slate-950 font-black rounded-xl text-xs hover:brightness-105 transition-all shadow-sm flex items-center gap-2"
                >
                  <Upload size={14} />
                  <span>Select Images</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={e => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {/* Dropzone Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-amber-50/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ImageIcon size={22} />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {isUploadingPhotos ? 'Uploading Images...' : 'Click to Browse or Drag Multiple Images Here'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WEBP (Max 10MB each)
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Photo Previews Grid */}
              {photos.length > 0 && (
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                    <span>Uploaded Gallery ({photos.length} Images)</span>
                    <span className="text-[11px] font-normal text-slate-500">Click star to set Cover Image</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-2xl border overflow-hidden group bg-white shadow-xs ${
                          photo.isCover ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {photo.isCover && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm">
                              Cover Photo
                            </span>
                          )}
                        </div>

                        <div className="p-2 space-y-1.5 bg-white">
                          <input
                            type="text"
                            value={photo.caption}
                            onChange={e => {
                              const newCaption = e.target.value;
                              setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption: newCaption } : p));
                            }}
                            placeholder="Caption..."
                            className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 outline-none text-slate-700"
                          />
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => handleSetCover(idx)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                photo.isCover 
                                  ? 'text-amber-700 bg-amber-50' 
                                  : 'text-slate-500 hover:text-amber-600'
                              }`}
                            >
                              <Star size={11} className={photo.isCover ? 'fill-amber-500 text-amber-500' : ''} />
                              <span>{photo.isCover ? 'Cover' : 'Set Cover'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveItemError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {saveItemError}
                </div>
              )}

              {/* Navigation Bar */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Back to Specs
                </button>

                <button
                  type="button"
                  disabled={isSavingItem}
                  onClick={handleSaveItem}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b45309] text-slate-950 font-black text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-2"
                >
                  {isSavingItem ? (
                    <span>Saving to Database...</span>
                  ) : (
                    <>
                      <span>Save Offering &amp; Unlock Story Editor</span>
                      <Sparkles size={14} />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ───────────────── STEP 3: BLOGS & FREE TEXT NARRATIVE ───────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      Saved Successfully to Database!
                    </div>
                    <div className="text-xs text-emerald-700 font-medium">
                      "{title}" is now recorded. Now enrich it with a story or blog post to inspire visitors and search engines.
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  ID: {savedItemId?.slice(0, 8)}...
                </span>
              </div>

              {/* Story Editor Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-[#b45309]" />
                      <span>Story &amp; Blog Narrative</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Provide free-text storytelling to accompany this offering on your minisite and Siwa discovery portals.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBlogLanguage('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        blogLanguage === 'en' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      English Story
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogLanguage('ar')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        blogLanguage === 'ar' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      القصة بالعربية
                    </button>
                  </div>
                </div>

                {/* Story Title & Hook */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Story / Article Headline *
                    </label>
                    <input
                      type="text"
                      value={blogTitle}
                      onChange={e => setBlogTitle(e.target.value)}
                      placeholder="e.g. Desert Magic: The Story Behind Our 4x4 Dune Expedition"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Short Excerpt (Search Snippet)
                    </label>
                    <input
                      type="text"
                      value={blogExcerpt}
                      onChange={e => setBlogExcerpt(e.target.value)}
                      placeholder="1-2 sentences summarizing the experience..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Free Text / Rich Content Editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Narrative Story &amp; Insider Notes
                  </label>
                  <RichBlogEditor
                    value={blogContent}
                    onChange={setBlogContent}
                    minHeight="220px"
                    placeholder="Write detailed insider stories, cultural significance, packing advice, and memories..."
                    businessName={businessName}
                    dir={blogLanguage === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Distribution Controls */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={showOnMinisite}
                        onChange={e => setShowOnMinisite(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>🌐 Publish to My Business Minisite</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={showOnMainPortal}
                        onChange={e => setShowOnMainPortal(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>🏛️ Feature on Main Portal &amp; Discovery Hub</span>
                    </label>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    {photos.length} Photos Attached
                  </div>
                </div>

                {/* Success Notice if saved */}
                {blogSavedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Story successfully syndicated to database, visitor feed, and your minisite!</span>
                  </div>
                )}

                {/* Completion Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Done &amp; Close Studio
                  </button>

                  <div className="flex items-center gap-2">
                    {businessSlug && (
                      <a
                        href={`/${businessSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Eye size={13} />
                        <span>View on Minisite</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={isSavingBlog}
                      onClick={handleSaveBlog}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs hover:brightness-105 transition-all shadow-md flex items-center gap-2"
                    >
                      {isSavingBlog ? (
                        <span>Publishing Story...</span>
                      ) : (
                        <>
                          <span>Publish Story &amp; Syndicate</span>
                          <Sparkles size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
