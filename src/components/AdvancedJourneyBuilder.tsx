'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, MapPin } from 'lucide-react';

interface TimelineItem {
  id: string;
  day_number: number;
  time: string; // HH:MM format
  business_id: string;
  business_name: string;
  parent_type_id: string;
  parent_type_name: string;
  child_type_name: string;
  notes?: string;
  duration_minutes?: number;
}

interface ItineraryDay {
  day: number;
  items: TimelineItem[];
}

interface AdvancedJourneyPackage {
  name: string;
  description: string;
  duration_days: number;
  vibe: string;
  pace: string;
  price_usd?: number;
  itinerary: ItineraryDay[];
}

interface Business {
  id: string;
  name: string;
  type_id: string;
}

export default function AdvancedJourneyBuilder() {
  const [step, setStep] = useState(1); // 1: Setup, 2: Build Timeline, 3: Review
  const [packageInfo, setPackageInfo] = useState<AdvancedJourneyPackage>({
    name: '',
    description: '',
    duration_days: 3,
    vibe: 'adventure',
    pace: 'moderate',
    itinerary: Array.from({ length: 3 }, (_, i) => ({
      day: i + 1,
      items: [],
    })),
  });

  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessNotes, setBusinessNotes] = useState('');
  const [businessDuration, setBusinessDuration] = useState(120);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sample businesses data
  const allBusinesses: Business[] = [
    { id: 'b1', name: 'Siwa Paradise Hotel', type_id: 'hotel' },
    { id: 'b3', name: 'Traditional Siwan Heritage Lodge', type_id: 'siwa_lodge' },
    { id: 'b7', name: 'Cleopatra Restaurant', type_id: 'restaurant' },
    { id: 'b9', name: "Grandma Fatima's Traditional Kitchen", type_id: 'siwan_kitchen' },
    { id: 'b12', name: 'Great Sand Sea Safari Tours', type_id: 'safari_4x4' },
    { id: 'b14', name: 'Nomadic Camel Expeditions', type_id: 'camel_trek' },
    { id: 'b17', name: 'Siwa Therapeutic Sand Spa', type_id: 'sand_bath' },
    { id: 'b18', name: 'Salt Lake Wellness Center', type_id: 'salt_therapy' },
    { id: 'b20', name: 'Siwan Embroidery Workshop', type_id: 'embroidery' },
  ];

  // Add item to timeline
  const handleAddItem = (business: Business) => {
    if (!selectedTime) {
      alert('Please select a time');
      return;
    }

    const currentDay = packageInfo.itinerary[selectedDay - 1];
    const newItem: TimelineItem = {
      id: `item_${Date.now()}`,
      day_number: selectedDay,
      time: selectedTime,
      business_id: business.id,
      business_name: business.name,
      parent_type_id: 'parent', // Simplified for demo
      parent_type_name: 'Service',
      child_type_name: business.type_id,
      notes: businessNotes,
      duration_minutes: businessDuration,
    };

    const updatedItinerary = packageInfo.itinerary.map((day) =>
      day.day === selectedDay
        ? { ...day, items: [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time)) }
        : day
    );

    setPackageInfo({ ...packageInfo, itinerary: updatedItinerary });
    setShowBusinessPicker(false);
    setBusinessNotes('');
    setBusinessDuration(120);
  };

  // Remove item from timeline
  const handleRemoveItem = (itemId: string) => {
    const updatedItinerary = packageInfo.itinerary.map((day) => ({
      ...day,
      items: day.items.filter((item) => item.id !== itemId),
    }));
    setPackageInfo({ ...packageInfo, itinerary: updatedItinerary });
  };

  // Update duration days
  const handleChangeDays = (days: number) => {
    const newItinerary = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      items: packageInfo.itinerary[i]?.items || [],
    }));
    setPackageInfo({ ...packageInfo, duration_days: days, itinerary: newItinerary });
    if (selectedDay > days) setSelectedDay(days);
  };

  // Save package
  const handleSavePackage = async () => {
    if (!packageInfo.name.trim()) {
      alert('Please enter a package name');
      return;
    }

    const totalItems = packageInfo.itinerary.reduce((sum, day) => sum + day.items.length, 0);
    if (totalItems === 0) {
      alert('Please add at least one activity to your itinerary');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/custom-journey-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...packageInfo,
          items: packageInfo.itinerary.flatMap((day) => day.items),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setStep(1);
          window.location.href = '/journey-builder?success=true';
        }, 2000);
      }
    } catch (error) {
      alert('Error saving package: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const currentDayItems = packageInfo.itinerary[selectedDay - 1]?.items || [];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-[#556B2F] to-[#6B8E23] rounded-lg shadow-xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFB700] mb-2">
          🗓️ Advanced Itinerary Builder
        </h1>
        <p className="text-gray-100">
          Create detailed day-by-day itineraries with multiple activities per day at specific times
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500 text-white rounded-lg">
          ✓ Itinerary created successfully!
        </div>
      )}

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="bg-gray-900 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-[#FFB700] mb-6">Step 1: Package Details</h2>

          <div className="space-y-6">
            {/* Package Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Package Name *</label>
              <input
                type="text"
                value={packageInfo.name}
                onChange={(e) => setPackageInfo({ ...packageInfo, name: e.target.value })}
                placeholder="e.g., Wellness Escape 4-Day Journey"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={packageInfo.description}
                onChange={(e) => setPackageInfo({ ...packageInfo, description: e.target.value })}
                placeholder="Describe your journey..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700] focus:outline-none"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold mb-2">Duration (Days) *</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={packageInfo.duration_days}
                  onChange={(e) => handleChangeDays(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-2xl font-bold text-[#FFB700] w-12 text-center">
                  {packageInfo.duration_days}
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[2, 3, 4, 5, 7, 10].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleChangeDays(days)}
                    className={`px-3 py-1 rounded font-semibold transition-all ${
                      packageInfo.duration_days === days
                        ? 'bg-[#FFB700] text-[#556B2F]'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe & Pace */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Vibe</label>
                <select
                  value={packageInfo.vibe}
                  onChange={(e) => setPackageInfo({ ...packageInfo, vibe: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white focus:border-[#FFB700] focus:outline-none"
                >
                  <option value="adventure">🏜️ Adventure</option>
                  <option value="wellness">🧘 Wellness</option>
                  <option value="culinary">🍽️ Culinary</option>
                  <option value="cultural">🏛️ Cultural</option>
                  <option value="luxury">👑 Luxury</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Pace</label>
                <select
                  value={packageInfo.pace}
                  onChange={(e) => setPackageInfo({ ...packageInfo, pace: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white focus:border-[#FFB700] focus:outline-none"
                >
                  <option value="slow">Slow & Relaxed</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active & Fast</option>
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold mb-2">Total Price (USD)</label>
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
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700] focus:outline-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-6 py-3 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] transition-all text-lg"
            >
              Next: Build Timeline →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Build Itinerary Timeline */}
      {step === 2 && (
        <div className="bg-gray-900 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-[#FFB700] mb-6">Step 2: Build Your Itinerary</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day Selector */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold mb-3">📅 Select Day</h3>
              <div className="space-y-2">
                {packageInfo.itinerary.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`w-full p-3 rounded-lg border-2 font-semibold transition-all ${
                      selectedDay === day.day
                        ? 'bg-[#FFB700] text-[#556B2F] border-[#FFB700]'
                        : 'bg-gray-800 border-gray-600 hover:border-[#FFB700]'
                    }`}
                  >
                    Day {day.day}
                    {day.items.length > 0 && (
                      <span className="text-xs ml-2 opacity-75">
                        ({day.items.length} activities)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline for Selected Day */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold mb-4">
                ⏰ Day {selectedDay} Timeline
              </h3>

              {/* Current Day's Activities */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {currentDayItems.length === 0 ? (
                  <div className="p-4 bg-gray-800 rounded text-gray-400 text-center border-2 border-dashed border-gray-600">
                    No activities added yet. Click "Add Activity" below to add one.
                  </div>
                ) : (
                  currentDayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-800 rounded-lg border-l-4 border-[#FFB700] hover:bg-gray-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={18} className="text-[#FFB700]" />
                            <span className="font-bold text-lg text-[#FFB700]">{item.time}</span>
                            {item.duration_minutes && (
                              <span className="text-xs text-gray-400">
                                ({Math.ceil(item.duration_minutes / 60)}h {item.duration_minutes % 60}m)
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-white text-lg">
                            {item.business_name}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {item.child_type_name}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-300 mt-2 italic">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-4 p-2 text-red-500 hover:bg-red-500/20 rounded transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Activity Form */}
              <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700">
                <h4 className="font-bold text-[#FFB700] mb-4 flex items-center gap-2">
                  <Plus size={20} />
                  Add Activity to Day {selectedDay}
                </h4>

                <div className="space-y-4">
                  {/* Time Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Time</label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-[#FFB700] focus:outline-none"
                    />
                  </div>

                  {/* Business Selector */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Business/Activity</label>
                    <button
                      onClick={() => setShowBusinessPicker(!showBusinessPicker)}
                      className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded text-white hover:border-[#FFB700] transition-all text-left flex items-center justify-between"
                    >
                      <span>
                        {selectedBusiness ? selectedBusiness.name : 'Select a business...'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${showBusinessPicker ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Business Dropdown */}
                    {showBusinessPicker && (
                      <div className="mt-2 bg-gray-700 rounded border border-gray-600 max-h-48 overflow-y-auto">
                        {allBusinesses.map((business) => (
                          <button
                            key={business.id}
                            onClick={() => {
                              setSelectedBusiness(business);
                              setShowBusinessPicker(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-600 transition-all border-b border-gray-600 last:border-b-0"
                          >
                            <div className="font-semibold">{business.name}</div>
                            <div className="text-xs text-gray-400">{business.type_id}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Duration (minutes): {businessDuration}
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="480"
                      step="30"
                      value={businessDuration}
                      onChange={(e) => setBusinessDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg cursor-pointer"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.floor(businessDuration / 60)}h{' '}
                      {businessDuration % 60 > 0 && `${businessDuration % 60}m`}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                    <input
                      type="text"
                      value={businessNotes}
                      onChange={(e) => setBusinessNotes(e.target.value)}
                      placeholder="e.g., Pre-book by 2pm, bring comfortable shoes"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-[#FFB700] focus:outline-none text-sm"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (selectedBusiness) {
                        handleAddItem(selectedBusiness);
                      } else {
                        alert('Please select a business');
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#FFB700] text-[#556B2F] font-bold rounded hover:bg-[#FFD700] transition-all"
                  >
                    + Add to Timeline
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 bg-[#FFB700] text-[#556B2F] font-bold rounded hover:bg-[#FFD700] transition-all text-lg"
            >
              Review Itinerary →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-gray-900 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-[#FFB700] mb-6">Step 3: Review Your Journey</h2>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded p-4">
              <div className="text-gray-400 text-sm">Package Name</div>
              <div className="font-bold text-lg text-[#FFB700]">{packageInfo.name}</div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-gray-400 text-sm">Duration</div>
              <div className="font-bold text-lg text-[#FFB700]">{packageInfo.duration_days} days</div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-gray-400 text-sm">Total Activities</div>
              <div className="font-bold text-lg text-[#FFB700]">
                {packageInfo.itinerary.reduce((sum, day) => sum + day.items.length, 0)}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-gray-400 text-sm">Price</div>
              <div className="font-bold text-lg text-[#FFB700]">
                {packageInfo.price_usd ? `$${packageInfo.price_usd}` : 'TBD'}
              </div>
            </div>
          </div>

          {/* Full Itinerary */}
          <div className="space-y-6 mb-8">
            {packageInfo.itinerary.map((day) => (
              <div key={day.day} className="border-l-4 border-[#FFB700] pl-4">
                <h3 className="text-2xl font-bold text-[#FFB700] mb-3">
                  📅 Day {day.day}
                </h3>
                {day.items.length === 0 ? (
                  <div className="text-gray-400 italic">No activities scheduled</div>
                ) : (
                  <div className="space-y-2">
                    {day.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 bg-gray-800 rounded">
                        <div className="font-bold text-[#FFB700] w-16 flex-shrink-0">
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{item.business_name}</div>
                          <div className="text-xs text-gray-400">{item.child_type_name}</div>
                          {item.notes && (
                            <div className="text-xs text-gray-300 mt-1">🗒️ {item.notes}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {Math.floor(item.duration_minutes! / 60)}h
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-all"
            >
              ← Edit Timeline
            </button>
            <button
              onClick={handleSavePackage}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#FFB700] text-[#556B2F] font-bold rounded hover:bg-[#FFD700] disabled:opacity-50 transition-all text-lg"
            >
              {loading ? 'Saving...' : '✨ Create Journey Package'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
