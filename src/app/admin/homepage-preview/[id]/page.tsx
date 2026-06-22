'use client';

import Link from 'next/link';

export default function HomepagePreviewPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/admin/homepage-editor/${params.id}`} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
            ← Edit
          </Link>
          <div>
            <div className="text-white text-sm font-semibold">Preview: Hotels & Resorts</div>
            <div className="text-gray-400 text-xs">Last saved: 2 min ago</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-900 rounded text-green-200 text-sm font-semibold hover:bg-green-800 transition-colors">
            ✓ Publish
          </button>
          <button className="px-4 py-2 bg-gray-800 rounded text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="pt-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] py-16 sm:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-[#556B2F] via-transparent to-[#D4AF37]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFB700] bg-clip-text text-transparent">
                Hotels & Resorts
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Experience luxury and comfort in the heart of Siwa Oasis
            </p>
            <button className="mt-8 px-8 py-3 bg-gradient-to-r from-[#556B2F] to-[#D4AF37] rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
              Browse Hotels
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-[#1a1a1a] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Why Choose Our Hotels</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['🏨 Premium Comfort', '⭐ Top Rated', '🌟 Luxury Amenities'].map((feature, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center hover:border-[#D4AF37] transition-colors">
                  <div className="text-4xl mb-4">{feature.split(' ')[0]}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.split(' ').slice(1).join(' ')}</h3>
                  <p className="text-gray-400">Experience world-class service and amenities</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Hotels */}
        <div className="bg-[#0f0f0f] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Featured Properties</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#D4AF37] transition-colors group">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 flex items-center justify-center text-6xl group-hover:opacity-80 transition-opacity">
                    🏨
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Desert Paradise Hotel</h3>
                    <p className="text-gray-400 text-sm mb-4">Luxury accommodation with all modern amenities</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] font-semibold">From $150/night</span>
                      <button className="text-sm font-semibold text-white bg-[#556B2F] px-4 py-2 rounded hover:opacity-90 transition-opacity">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-[#1a1a1a] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Guest Reviews</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-white">Guest Name</div>
                      <div className="text-sm text-yellow-500">⭐⭐⭐⭐⭐</div>
                    </div>
                  </div>
                  <p className="text-gray-400">Amazing experience! The staff was incredibly welcoming and the views were breathtaking.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#D4AF37] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Book?</h2>
            <p className="text-gray-100 mb-8 max-w-2xl mx-auto">
              Reserve your perfect desert retreat today
            </p>
            <button className="px-8 py-3 bg-white rounded-lg text-[#556B2F] font-semibold hover:opacity-90 transition-opacity">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
