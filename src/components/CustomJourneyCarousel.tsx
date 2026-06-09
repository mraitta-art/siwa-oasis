'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface JourneyPackage {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price_usd?: number;
  vibe: string;
  consultant_name: string;
  total_items: number;
  image_url?: string;
}

export default function CustomJourneyCarousel() {
  const [packages, setPackages] = useState<JourneyPackage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sample data for demonstration
  const samplePackages: JourneyPackage[] = [
    {
      id: 'pkg_1',
      name: 'Desert Wellness Escape',
      description: 'Therapeutic sand baths, salt spring immersion, and yoga sessions with gourmet healthy cuisine',
      duration_days: 4,
      price_usd: 1200,
      vibe: 'wellness',
      consultant_name: 'Amira Al-Siwi',
      total_items: 5,
      image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
    },
    {
      id: 'pkg_2',
      name: 'Adventure Explorer\'s Dream',
      description: '4x4 desert safari, camel trekking, ancient site exploration, and stargazing under the Milky Way',
      duration_days: 5,
      price_usd: 1500,
      vibe: 'adventure',
      consultant_name: 'Hassan Mohamed',
      total_items: 6,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    },
    {
      id: 'pkg_3',
      name: 'Culinary Heritage Journey',
      description: 'Cooking classes, organic date harvest, traditional kitchen experiences, and farm-to-table dining',
      duration_days: 3,
      price_usd: 900,
      vibe: 'culinary',
      consultant_name: 'Fatima El-Siwi',
      total_items: 4,
      image_url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800',
    },
    {
      id: 'pkg_4',
      name: 'Cultural Deep Dive',
      description: 'Homestays, museum tours, elder storytelling, traditional ceremonies, and artisan workshops',
      duration_days: 6,
      price_usd: 1400,
      vibe: 'cultural',
      consultant_name: 'Khalil Hassan',
      total_items: 7,
      image_url: 'https://images.unsplash.com/photo-1516026672322-5e36f05c2ce7?q=80&w=800',
    },
  ];

  useEffect(() => {
    const loadPackages = async () => {
      try {
        // In production, fetch from API
        // const res = await fetch('/api/custom-journey-packages?is_featured=true');
        // const data = await res.json();
        // setPackages(data.packages);

        // For now, use sample data
        setPackages(samplePackages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading packages:', error);
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? packages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === packages.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return <div className="text-center py-12">Loading custom journeys...</div>;
  }

  if (packages.length === 0) {
    return null;
  }

  const vibeColors: Record<string, string> = {
    wellness: 'from-green-500 to-teal-500',
    adventure: 'from-orange-500 to-red-500',
    culinary: 'from-amber-500 to-orange-500',
    cultural: 'from-purple-500 to-pink-500',
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-[#556B2F]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#FFB700] mb-4">
            <Zap className="inline mr-3" size={40} />
            Custom Journey Packages
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Expertly crafted packages by our local consultants. Mix and match accommodations, tours, food, and experiences!
          </p>
          <Link
            href="/journey-builder"
            className="inline-block px-8 py-3 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] transition-all shadow-lg"
          >
            ✨ Create Your Own Package
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Main Slide */}
          <div className="mb-8 overflow-hidden rounded-xl shadow-2xl">
            {packages.length > 0 && (
              <div
                className={`relative h-96 md:h-[500px] bg-gradient-to-r ${
                  vibeColors[packages[currentIndex].vibe]
                } overflow-hidden`}
              >
                {/* Background Image */}
                {packages[currentIndex].image_url && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `url(${packages[currentIndex].image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}

                {/* Content */}
                <div className="relative h-full flex items-end p-8 md:p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="text-white max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#FFB700] text-[#556B2F] text-xs font-bold rounded-full uppercase">
                        {packages[currentIndex].vibe}
                      </span>
                      <span className="text-sm text-gray-300">
                        by {packages[currentIndex].consultant_name}
                      </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold mb-3">
                      {packages[currentIndex].name}
                    </h3>

                    <p className="text-gray-100 text-lg mb-4 line-clamp-2">
                      {packages[currentIndex].description}
                    </p>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Duration:</span>
                        <span className="text-xl font-bold text-[#FFB700]">
                          {packages[currentIndex].duration_days} Days
                        </span>
                      </div>

                      {packages[currentIndex].price_usd && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">From:</span>
                          <span className="text-2xl font-bold text-[#FFB700]">
                            ${packages[currentIndex].price_usd}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Services:</span>
                        <span className="text-lg font-bold text-[#FFB700]">
                          {packages[currentIndex].total_items}
                        </span>
                      </div>
                    </div>

                    <button className="mt-6 px-6 py-2 bg-[#FFB700] text-[#556B2F] font-bold rounded-lg hover:bg-[#FFD700] transition-all">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrevious}
              className="p-3 bg-[#FFB700] text-[#556B2F] rounded-full hover:bg-[#FFD700] transition-all shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Indicators */}
            <div className="flex gap-2">
              {packages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-[#FFB700] w-8'
                      : 'bg-gray-600 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 bg-[#FFB700] text-[#556B2F] rounded-full hover:bg-[#FFD700] transition-all shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {packages.map((pkg, idx) => (
              <button
                key={pkg.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-[#FFB700] shadow-lg'
                    : 'border-gray-600 hover:border-[#FFB700]'
                }`}
              >
                {pkg.image_url && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${pkg.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-end p-2">
                  <span className="text-xs font-bold text-white line-clamp-2">
                    {pkg.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
