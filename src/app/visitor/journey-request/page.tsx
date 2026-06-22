'use client';

import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

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
    special_requirements: '',
    dietary_restrictions: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('duration') || name.includes('budget') || name.includes('group_size') 
        ? parseInt(value) 
        : value
    }));
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
          request_type: 'custom_request'
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit request');
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
