'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  type_id: string;
  description?: string;
}

interface BusinessType {
  id: string;
  name: string;
  icon: string;
  parent_id?: string;
}

interface SelectedItem {
  parent_type_id: string;
  parent_type_name: string;
  child_type_id: string;
  child_type_name: string;
  business_id: string;
  business_name: string;
  business_description?: string;
  sequence_order: number;
  day_number?: number;
}

interface JourneyPackage {
  name: string;
  description: string;
  duration_days: number;
  vibe: string;
  pace: string;
  price_usd?: number;
  items: SelectedItem[];
}

export default function JourneyPackageBuilder() {
  const [step, setStep] = useState(1); // 1: Parents, 2: Children, 3: Businesses, 4: Review
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [parentTypes, setParentTypes] = useState<BusinessType[]>([]);
  const [childTypes, setChildTypes] = useState<BusinessType[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [packageItems, setPackageItems] = useState<SelectedItem[]>([]);
  const [packageInfo, setPackageInfo] = useState<JourneyPackage>({
    name: '',
    description: '',
    duration_days: 3,
    vibe: 'adventure',
    pace: 'moderate',
    items: [],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load parent business types
  useEffect(() => {
    const loadParents = async () => {
      try {
        const res = await fetch('/api/business-types?is_parent=true');
        if (res.ok) {
          const data = await res.json();
          setParentTypes(data);
        }
      } catch (error) {
        console.error('Failed to load parent types:', error);
      }
    };
    loadParents();
  }, []);

  // Load child types when parents selected
  useEffect(() => {
    const loadChildren = async () => {
      if (selectedParents.length === 0) {
        setChildTypes([]);
        return;
      }

      try {
        const parents = selectedParents.join(',');
        const res = await fetch(`/api/business-types?parent_ids=${parents}`);
        if (res.ok) {
          const data = await res.json();
          setChildTypes(data);
        }
      } catch (error) {
        console.error('Failed to load child types:', error);
      }
    };

    loadChildren();
  }, [selectedParents]);

  // Load businesses for selected child types
  const handleChildTypeSelect = async (childTypeId: string) => {
    try {
      const res = await fetch(`/api/businesses?type_id=${childTypeId}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  // Add business to package
  const handleAddBusiness = (
    business: Business,
    parentType: BusinessType,
    childType: BusinessType
  ) => {
    const newItem: SelectedItem = {
      parent_type_id: parentType.id,
      parent_type_name: parentType.name,
      child_type_id: childType.id,
      child_type_name: childType.name,
      business_id: business.id,
      business_name: business.name,
      business_description: business.description,
      sequence_order: packageItems.length,
      day_number: Math.ceil((packageItems.length + 1) / 2), // Distribute across days
    };

    setPackageItems([...packageItems, newItem]);
  };

  // Remove item from package
  const handleRemoveItem = (index: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== index));
  };

  // Save package
  const handleSavePackage = async () => {
    if (!packageInfo.name.trim()) {
      alert('Please enter a package name');
      return;
    }

    if (packageItems.length === 0) {
      alert('Please add at least one business to the package');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/custom-journey-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...packageInfo,
          items: packageItems,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Reset form or redirect
          setStep(1);
          setPackageItems([]);
          setSelectedParents([]);
          setPackageInfo({
            name: '',
            description: '',
            duration_days: 3,
            vibe: 'adventure',
            pace: 'moderate',
            items: [],
          });
          setSuccess(false);
        }, 2000);
      } else {
        alert('Failed to save package');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error saving package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-[#556B2F] to-[#6B8E23] rounded-lg shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FFB700] mb-2">
          🗺️ Journey Package Builder
        </h1>
        <p className="text-gray-100">
          Create custom tour packages by selecting from our partner accommodations, restaurants, tours, and experiences
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500 text-white rounded-lg">
          ✓ Package created successfully!
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? 'bg-[#FFB700] text-[#556B2F]'
                  : 'bg-gray-400 text-gray-600'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-[#FFB700]' : 'bg-gray-400'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-6 text-white">
        {/* Step 1: Select Parents */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-[#FFB700] mb-4">
              Step 1: Select Service Categories
            </h2>
            <p className="text-gray-300 mb-6">
              Choose which types of services you want to include in your package
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {parentTypes.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => {
                    setSelectedParents((prev) =>
                      prev.includes(parent.id)
                        ? prev.filter((p) => p !== parent.id)
                        : [...prev, parent.id]
                    );
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedParents.includes(parent.id)
                      ? 'border-[#FFB700] bg-[#FFB700]/20'
                      : 'border-gray-600 hover:border-[#FFB700]'
                  }`}
                >
                  <div className="text-2xl mb-2">{parent.icon}</div>
                  <div className="font-semibold">{parent.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedParents.length > 0 && setStep(2)}
              disabled={selectedParents.length === 0}
              className="mt-8 px-6 py-2 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] disabled:opacity-50"
            >
              Next: Select Specific Services <ChevronRight className="inline ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Select Child Types */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-[#FFB700] mb-4">
              Step 2: Select Specific Service Types
            </h2>
            <p className="text-gray-300 mb-6">
              Choose the specific types of services within each category
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childTypes.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    handleChildTypeSelect(child.id);
                    setStep(3);
                  }}
                  className="p-4 rounded-lg border-2 border-gray-600 hover:border-[#FFB700] hover:bg-[#FFB700]/10 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{child.name}</div>
                      <div className="text-sm text-gray-400">{child.icon}</div>
                    </div>
                    <ChevronRight className="text-[#FFB700]" />
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-8 px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3: Select Businesses */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-[#FFB700] mb-4">
              Step 3: Select Specific Businesses
            </h2>
            <p className="text-gray-300 mb-6">
              Choose the specific partners you want to include
            </p>
            <div className="grid grid-cols-1 gap-3 mb-6 max-h-96 overflow-y-auto">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-[#FFB700] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{business.name}</h3>
                      {business.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {business.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const parentType = parentTypes.find((p) =>
                          selectedParents.includes(p.id)
                        );
                        const childType = childTypes.find(
                          (c) => c.id === business.type_id
                        );
                        if (parentType && childType) {
                          handleAddBusiness(business, parentType, childType);
                        }
                      }}
                      className="ml-4 p-2 bg-[#FFB700] text-[#556B2F] rounded hover:bg-[#FFD700] transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(4)}
              disabled={packageItems.length === 0}
              className="mt-8 px-6 py-2 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] disabled:opacity-50"
            >
              Next: Review Package <ChevronRight className="inline ml-2" />
            </button>
          </div>
        )}

        {/* Step 4: Review & Name Package */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-[#FFB700] mb-4">
              Step 4: Review & Name Your Package
            </h2>

            {/* Package Details Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Package Name *
                </label>
                <input
                  type="text"
                  value={packageInfo.name}
                  onChange={(e) =>
                    setPackageInfo({ ...packageInfo, name: e.target.value })
                  }
                  placeholder="e.g., Desert Wellness Retreat 2026"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={packageInfo.description}
                  onChange={(e) =>
                    setPackageInfo({ ...packageInfo, description: e.target.value })
                  }
                  placeholder="Describe your package..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={packageInfo.duration_days}
                    onChange={(e) =>
                      setPackageInfo({
                        ...packageInfo,
                        duration_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-[#FFB700]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={packageInfo.price_usd || ''}
                    onChange={(e) =>
                      setPackageInfo({
                        ...packageInfo,
                        price_usd: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Vibe
                  </label>
                  <select
                    value={packageInfo.vibe}
                    onChange={(e) =>
                      setPackageInfo({ ...packageInfo, vibe: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-[#FFB700]"
                  >
                    <option value="adventure">Adventure</option>
                    <option value="wellness">Wellness</option>
                    <option value="culinary">Culinary</option>
                    <option value="cultural">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Pace
                  </label>
                  <select
                    value={packageInfo.pace}
                    onChange={(e) =>
                      setPackageInfo({ ...packageInfo, pace: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-[#FFB700]"
                  >
                    <option value="slow">Slow & Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active & Fast</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#FFB700] mb-3">
                Included Services ({packageItems.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {packageItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {item.business_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.parent_type_name} → {item.child_type_name}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-red-500 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
              >
                Back
              </button>

              <button
                onClick={handleSavePackage}
                disabled={loading}
                className="flex-1 px-6 py-2 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] disabled:opacity-50"
              >
                {loading ? 'Saving...' : '✓ Create Package'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
