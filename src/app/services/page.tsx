'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      id: 1,
      name: 'Accommodation',
      icon: '🏨',
      description: 'Desert hotels, camps, and resorts',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 2,
      name: 'Tours & Experiences',
      icon: '🐪',
      description: 'Desert safaris, hiking, and guides',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 3,
      name: 'Food & Beverage',
      icon: '🍽️',
      description: 'Restaurants, cafes, and dining',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 4,
      name: 'Transportation',
      icon: '🚗',
      description: 'Rentals, taxis, and transfers',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 5,
      name: 'Shopping',
      icon: '🛍️',
      description: 'Souvenirs, crafts, and local products',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 6,
      name: 'Entertainment',
      icon: '🎪',
      description: 'Shows, cultural events, and activities',
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 7,
      name: 'Wellness',
      icon: '🧘',
      description: 'Spa, yoga, and relaxation',
      color: 'from-teal-500 to-teal-600',
    },
    {
      id: 8,
      name: 'Photography',
      icon: '📸',
      description: 'Photography services and tours',
      color: 'from-indigo-500 to-indigo-600',
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
              Siwa Services
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Discover the best services and experiences in the Siwa Oasis
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/search/${service.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group relative overflow-hidden rounded-lg"
            >
              <div className={`bg-gradient-to-br ${service.color} p-8 h-full`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-100 mb-4">{service.description}</p>

                  <div className="inline-flex items-center text-white group-hover:translate-x-2 transition-transform">
                    <span className="text-sm font-semibold">Explore</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white to-transparent transition-opacity rounded-lg" />
            </Link>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Search All Services</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="text"
              placeholder="Search services..."
              className="px-6 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] w-full sm:w-96"
            />
            <button className="px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/search/${service.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-[#D4AF37] transition-colors text-center group"
            >
              <div className="text-3xl mb-2">{service.icon}</div>
              <p className="text-gray-300 group-hover:text-[#D4AF37] transition-colors">
                {service.name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Can't find what you're looking for?</h3>
        <p className="text-gray-400 mb-8">Browse all businesses in the Siwa Oasis marketplace</p>
        <Link
          href="/search"
          className="inline-block px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Explore All Businesses
        </Link>
      </div>
    </div>
  );
}
