'use client';

import Link from 'next/link';

export default function CategoriesPage() {
  const categories = [
    {
      id: 1,
      name: 'Hotels & Resorts',
      icon: '🏨',
      description: 'Desert accommodations and lodging',
      count: 24,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 2,
      name: 'Tours & Guides',
      icon: '🐪',
      description: 'Safari and adventure experiences',
      count: 18,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      id: 3,
      name: 'Restaurants',
      icon: '🍽️',
      description: 'Dining and food services',
      count: 15,
      color: 'from-red-500 to-pink-600',
    },
    {
      id: 4,
      name: 'Car Rentals',
      icon: '🚙',
      description: 'Transportation and rentals',
      count: 12,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 5,
      name: 'Local Crafts',
      icon: '🎨',
      description: 'Souvenirs and handicrafts',
      count: 20,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 6,
      name: 'Wellness',
      icon: '🧘',
      description: 'Spa and relaxation',
      count: 8,
      color: 'from-teal-500 to-cyan-600',
    },
    {
      id: 7,
      name: 'Adventure Sports',
      icon: '🪂',
      description: 'Extreme activities and sports',
      count: 10,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 8,
      name: 'Shopping Markets',
      icon: '🛍️',
      description: 'Markets and retail',
      count: 14,
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 9,
      name: 'Cultural Sites',
      icon: '🏛️',
      description: 'Historical landmarks',
      count: 9,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 10,
      name: 'Entertainment',
      icon: '🎭',
      description: 'Shows and events',
      count: 7,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 11,
      name: 'Photography',
      icon: '📸',
      description: 'Photography services',
      count: 11,
      color: 'from-slate-500 to-gray-600',
    },
    {
      id: 12,
      name: 'Education',
      icon: '📚',
      description: 'Courses and training',
      count: 5,
      color: 'from-blue-600 to-indigo-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
              Browse Categories
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Explore businesses and services organized by category
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/search?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group relative overflow-hidden rounded-lg border border-gray-800 hover:border-[#D4AF37] transition-all"
            >
              <div className={`bg-gradient-to-br ${category.color} p-8 h-full`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />

                <div className="relative z-10">
                  <div className="text-5xl mb-3">{category.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-gray-100 text-sm mb-4">{category.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-100">{category.count} listings</span>
                    <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white to-transparent transition-opacity rounded-lg" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-[#D4AF37] mb-2">12</div>
            <div className="text-gray-400">Categories</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#D4AF37] mb-2">153</div>
            <div className="text-gray-400">Total Listings</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#D4AF37] mb-2">100%</div>
            <div className="text-gray-400">Verified</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-8">Filter by Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Price Range', 'Rating', 'Open Now', 'Featured'].map((filter, idx) => (
            <button
              key={idx}
              className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-[#D4AF37] transition-colors text-left"
            >
              <div className="text-sm font-semibold text-gray-400 mb-2">{filter}</div>
              <div className="text-gray-500 text-xs">Select options →</div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">List Your Business</h3>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Join hundreds of businesses already listed in the Siwa Oasis marketplace
        </p>
        <Link
          href="/vendor-signup"
          className="inline-block px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Become a Vendor
        </Link>
      </div>
    </div>
  );
}
