'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle } from 'lucide-react';

interface DiscoveryItem {
  id: string;
  business_id: string;
  business_name: string;
  business_slug?: string;
  title: string;
  description?: string | null;
  price?: number | null;
  original_price?: number | null;
  discount?: string | null;
  valid_until?: string | null;
  type?: string;
  source?: string;
  link?: string;
  itemType: 'offer' | 'package' | 'discount';
}

export default function VisitorJourneyRequestPage() {
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    title: '',
    description: '',
    duration_days: 3,
    preferred_start_date: '',
    vibe: 'adventure',
    pace: 'moderate',
    budget_usd_min: 300,
    budget_usd_max: 500,
    group_size: 1,
    preferred_vendor_type: '',
    preferred_vendor_id: '',
    special_requirements: '',
    dietary_restrictions: ''
  });

  const [vendorOptions, setVendorOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [preferredVendorLoading, setPreferredVendorLoading] = useState(false);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<DiscoveryItem | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [manualOfferDetails, setManualOfferDetails] = useState({
    title: '',
    description: '',
    price: '',
    business_name: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('duration') || name.includes('budget') || name.includes('group_size') 
        ? parseInt(value) 
        : value
    }));
  };

  const handleManualOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManualOfferDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/visitor/journey-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          request_type: 'custom_request',
          preferred_vendor_type: formData.preferred_vendor_type || null,
          preferred_vendor_id: formData.preferred_vendor_id || null,
          selected_offer: selectedOffer ? {
            id: selectedOffer.id,
            business_id: selectedOffer.business_id,
            business_name: selectedOffer.business_name,
            title: selectedOffer.title,
            description: selectedOffer.description,
            price: selectedOffer.price,
            currency: 'USD',
            type: selectedOffer.itemType,
            source: selectedOffer.source || selectedOffer.type,
            link: selectedOffer.link || null
          } : null,
          manual_offer_details: !selectedOffer ? {
            title: manualOfferDetails.title,
            description: manualOfferDetails.description,
            price: manualOfferDetails.price ? parseFloat(manualOfferDetails.price) : null,
            business_name: manualOfferDetails.business_name,
            notes: manualOfferDetails.notes
          } : null,
        })
      });

      const responseData = await response.json();
      if (response.ok && responseData?.id) {
        setSavedRequestId(responseData.id);
        router.push(`/visitor/journey-request/${responseData.id}`);
      } else {
        setError(responseData?.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-[#2a2a2a] p-8 rounded-lg border-2 border-green-600 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-[#FFD700] mb-3">Request Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Your journey request has been submitted. We'll review it and notify vendors who match your needs. You'll hear back within 24 hours.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Confirmation email sent to: <strong>{formData.visitor_email}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-[#556B2F] hover:bg-[#6B8234] text-white py-3 rounded-lg font-bold transition"
          >
            Back to Journey Builder
          </button>
        </div>
      </div>
    );
  }

  const VENDOR_CATEGORIES = [
    { id: '', label: 'No preference' },
    { id: 'hotel', label: 'Accommodation' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'safari_4x4', label: 'Adventure Safari' },
    { id: 'camel_trek', label: 'Camel Trek' },
    { id: 'salt_therapy', label: 'Wellness & Spa' },
    { id: 'artisan_shop', label: 'Handicrafts & Shops' }
  ];

  useEffect(() => {
    if (!formData.preferred_vendor_type) {
      setVendorOptions([]);
      setFormData(prev => ({ ...prev, preferred_vendor_id: '' }));
    } else {
      const loadVendorOptions = async () => {
        setPreferredVendorLoading(true);
        try {
          const res = await fetch(`/api/businesses?type_id=${encodeURIComponent(formData.preferred_vendor_type)}`);
          if (res.ok) {
            const data = await res.json();
            setVendorOptions(Array.isArray(data) ? data.map((item: any) => ({ id: item.id, name: item.name })) : []);
          }
        } catch (err) {
          console.error('Failed to load vendor options:', err);
        } finally {
          setPreferredVendorLoading(false);
        }
      };
      loadVendorOptions();
    }
  }, [formData.preferred_vendor_type]);

  useEffect(() => {
    const loadDiscoveryItems = async () => {
      setDiscoveryLoading(true);
      setDiscoveryError('');
      setSelectedOffer(null);

      try {
        const typeQuery = formData.preferred_vendor_type ? `?type=${encodeURIComponent(formData.preferred_vendor_type)}&limit=24` : '?limit=24';
        const [offersRes, discountsRes] = await Promise.all([
          fetch(`/api/discovery/offers${typeQuery}`),
          fetch(`/api/discovery/discounts${typeQuery}`)
        ]);

        const offersJson = await offersRes.json();
        const discountsJson = await discountsRes.json();

        const offerItems = (offersJson?.offers || offersJson?.items || []).map((item: any) => ({
          id: item.business_id ? `${item.business_id}-${item.source || item.type || 'offer'}` : item.id || `${item.business_slug || 'biz'}-${item.title}`,
          business_id: item.business_id || item.id || '',
          business_name: item.business_name || '',
          business_slug: item.business_slug || item.business_id || undefined,
          title: item.title || item.offer_title || '',
          description: item.description || item.offer_description || '',
          price: item.price != null ? parseFloat(item.price) : null,
          original_price: item.original_price != null ? parseFloat(item.original_price) : null,
          discount: item.discount || null,
          valid_until: item.valid_until || null,
          type: item.type || item.offer_type || 'offer',
          source: item.source || item.type || 'offer',
          link: item.link || item.offer_cta_link || `/p/${item.business_slug || item.business_id}`,
          itemType: item.type === 'package' ? 'package' : 'offer',
        }));

        const discountItems = (discountsJson?.items || discountsJson?.discounts || []).map((item: any) => ({
          id: `${item.business_id || item.id}-discount-${item.slot || 1}`,
          business_id: item.business_id || item.id || '',
          business_name: item.business_name || '',
          business_slug: item.business_slug || item.business_id || undefined,
          title: item.discount_name || item.title || 'Discount',
          description: item.description || '',
          price: null,
          original_price: null,
          discount: item.discount_value || null,
          valid_until: item.valid_until || null,
          type: 'discount',
          source: 'discount',
          link: item.link || `/p/${item.business_slug || item.business_id}`,
          itemType: 'discount',
        }));

        setDiscoveryItems([...offerItems, ...discountItems].slice(0, 24));
      } catch (err) {
        console.error('Failed to load discovery items:', err);
        setDiscoveryError('Unable to load offers and packages right now.');
      } finally {
        setDiscoveryLoading(false);
      }
    };

    loadDiscoveryItems();
  }, [formData.preferred_vendor_type]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#FFD700] mb-2">Create Custom Journey Request</h1>
          <p className="text-gray-400">Tell us what you're looking for, and our vendors will create the perfect journey for you</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2a2a2a] rounded-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Personal Info */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">1. Your Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="visitor_name"
                  value={formData.visitor_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Ahmed Hassan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    name="visitor_email"
                    value={formData.visitor_email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    placeholder="ahmed@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="visitor_phone"
                    value={formData.visitor_phone}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Group Size</label>
                <input
                  type="number"
                  name="group_size"
                  value={formData.group_size}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
          </div>

          {/* Journey Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">2. What You're Looking For</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Journey Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Desert Wellness Escape"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Tell us about your ideal journey. What experiences do you want? What's important to you?"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Duration (days)</label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    min="1"
                    max="14"
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Vibe</label>
                  <select
                    name="vibe"
                    value={formData.vibe}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="adventure">Adventure</option>
                    <option value="wellness">Wellness</option>
                    <option value="culinary">Culinary</option>
                    <option value="cultural">Cultural</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Pace</label>
                  <select
                    name="pace"
                    value={formData.pace}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="slow">Slow & Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active & Packed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Preferred Start Date</label>
                <input
                  type="date"
                  name="preferred_start_date"
                  value={formData.preferred_start_date}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">3. Vendor Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Preferred Vendor Category</label>
                <select
                  name="preferred_vendor_type"
                  value={formData.preferred_vendor_type}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                >
                  {VENDOR_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Preferred Vendor (Optional)</label>
                {preferredVendorLoading ? (
                  <div className="text-gray-400 py-3 px-4 bg-[#161616] rounded">Loading available vendors...</div>
                ) : vendorOptions.length > 0 ? (
                  <select
                    name="preferred_vendor_id"
                    value={formData.preferred_vendor_id}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="">Any vendor in this category</option>
                    {vendorOptions.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="preferred_vendor_id"
                    value={formData.preferred_vendor_id}
                    onChange={handleChange}
                    placeholder="Vendor ID or name"
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Leave blank to allow any matching vendor to respond. Use this to specify a vendor if you have one in mind.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#FFD700]">4. Choose an Offer, Package or Discount</h3>
                <p className="text-gray-400 mt-2 max-w-2xl">
                  Browse live offers from businesses that match your preferences. Select one to attach a real package to your request, or describe a custom offer below.
                </p>
              </div>
              {selectedOffer && (
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Clear selected offer
                </button>
              )}
            </div>

            {selectedOffer && (
              <div className="mb-6 bg-[#161616] border border-[#556B2F] rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Selected Live Item</div>
                    <div className="text-lg font-bold text-white">{selectedOffer.title}</div>
                    <div className="text-sm text-gray-400">{selectedOffer.business_name} · {selectedOffer.itemType.toUpperCase()}</div>
                  </div>
                  <div className="text-right">
                    {selectedOffer.price != null ? (
                      <div className="text-2xl font-bold text-[#FFD700]">${selectedOffer.price}</div>
                    ) : (
                      <div className="text-sm text-gray-400">Price not listed</div>
                    )}
                    {selectedOffer.valid_until && (
                      <div className="text-xs text-gray-500 mt-1">Valid until {selectedOffer.valid_until}</div>
                    )}
                  </div>
                </div>
                {selectedOffer.description && (
                  <p className="mt-3 text-gray-300">{selectedOffer.description}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-sm font-semibold text-gray-300">Discover business offers</div>
                <span className="text-xs text-gray-400">{discoveryItems.length} live options</span>
              </div>
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search by title, business, or keyword"
                className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            {discoveryError && (
              <div className="mb-4 text-sm text-red-300">{discoveryError}</div>
            )}

            {discoveryLoading ? (
              <div className="text-center py-10 text-gray-400">Loading offers and packages…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {discoveryItems
                  .filter(item =>
                    !itemSearch ||
                    item.title.toLowerCase().includes(itemSearch.toLowerCase()) ||
                    item.business_name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                    (item.description || '').toLowerCase().includes(itemSearch.toLowerCase())
                  )
                  .slice(0, 8)
                  .map((item) => (
                    <div key={item.id} className="bg-[#161616] border border-[#394141] rounded-lg p-4 flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-[0.2em]">{item.itemType}</div>
                          <div className="text-lg font-bold text-white">{item.title}</div>
                          <div className="text-sm text-gray-400">{item.business_name}</div>
                        </div>
                        <div className="text-right">
                          {item.price != null ? (
                            <div className="text-lg font-bold text-[#FFD700]">${item.price}</div>
                          ) : item.discount ? (
                            <div className="text-lg font-bold text-[#D4AF37]">{item.discount}</div>
                          ) : (
                            <div className="text-sm text-gray-500">No price</div>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-300 mb-4 line-clamp-3">{item.description}</p>
                      )}
                      <div className="mt-auto flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOffer(item)}
                          className="px-3 py-2 bg-[#556B2F] text-[#FFD700] rounded-lg text-sm font-semibold hover:bg-[#6B8234] transition"
                        >
                          Select
                        </button>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 border border-[#556B2F] text-sm rounded-lg text-gray-300 hover:border-[#FFD700] hover:text-white transition"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="bg-[#161616] border border-[#556B2F] rounded-lg p-6">
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-300 mb-2">Custom Offer Details</div>
                <p className="text-xs text-gray-500">Leave these fields blank when you have selected a live offer above. Use them when no exact business offer exists or you want to provide your own price and package description.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Custom offer or package title</label>
                  <input
                    type="text"
                    name="title"
                    value={manualOfferDetails.title}
                    onChange={handleManualOfferChange}
                    placeholder="e.g. Family desert retreat with private tour"
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Preferred business or vendor name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={manualOfferDetails.business_name}
                    onChange={handleManualOfferChange}
                    placeholder="Optional business name"
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Estimated best price (USD)</label>
                    <input
                      type="number"
                      name="price"
                      value={manualOfferDetails.price}
                      onChange={handleManualOfferChange}
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                      placeholder="e.g. 480"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">Any extra notes</label>
                    <input
                      type="text"
                      name="notes"
                      value={manualOfferDetails.notes}
                      onChange={handleManualOfferChange}
                      placeholder="Special pricing, add-ons, or requests"
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Describe the package or offer</label>
                  <textarea
                    name="description"
                    value={manualOfferDetails.description}
                    onChange={handleManualOfferChange}
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    placeholder="What should be included? Number of nights, meals, transfers, activities..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">3. Budget & Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Budget Range (USD)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Minimum</label>
                    <input
                      type="number"
                      name="budget_usd_min"
                      value={formData.budget_usd_min}
                      onChange={handleChange}
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Maximum *</label>
                    <input
                      type="number"
                      name="budget_usd_max"
                      value={formData.budget_usd_max}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Dietary Restrictions</label>
                <textarea
                  name="dietary_restrictions"
                  value={formData.dietary_restrictions}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Any dietary restrictions? Allergies? Preferences?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Special Requirements</label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-[#1a1a1a] border border-[#556B2F] rounded px-4 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="Accessibility needs? Family-friendly? Other important requirements?"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#556B2F] hover:bg-[#6B8234] disabled:opacity-50 text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
          >
            <Send size={20} />
            {loading ? 'Submitting...' : 'Submit Journey Request'}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            By submitting, you agree to let vendors contact you with custom offers. We'll respect your privacy.
          </p>
        </form>

        {/* Info */}
        <div className="mt-8 bg-[#2a2a2a] p-6 rounded-lg border-l-4 border-[#FFD700]">
          <h3 className="text-lg font-bold text-[#FFD700] mb-3">How It Works</h3>
          <ol className="text-gray-300 space-y-2 ml-4 list-decimal">
            <li>You submit your request</li>
            <li>We match it to our vendor network</li>
            <li>Vendors respond with custom offers</li>
            <li>You compare and book your ideal journey</li>
            <li>Experience Siwa like never before!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
