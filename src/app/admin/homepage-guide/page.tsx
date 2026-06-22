'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomepageGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900">
      {/* Header */}
      <div className="bg-black bg-opacity-50 border-b border-amber-600 sticky top-0 z-50 py-4">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-amber-400">📖 Homepage Editor Guide</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Go to Editor */}
          <Link
            href="/jana/website"
            className="bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg p-8 text-white shadow-xl transition transform hover:scale-105"
          >
            <div className="text-5xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold mb-2">Go to Homepage Editor</h2>
            <p className="text-amber-100">
              Launch the visual homepage builder and start editing
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold">Click to open editor →</span>
            </div>
          </Link>

          {/* Manage Components */}
          <Link
            href="/jana/hero-carousel"
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-8 text-white shadow-xl transition transform hover:scale-105"
          >
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">Manage Hero Carousel</h2>
            <p className="text-blue-100">
              Upload images, videos, and manage carousel slides
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold">Manage slides →</span>
            </div>
          </Link>
        </div>

        {/* Step-by-Step Guide */}
        <div className="bg-gray-800 bg-opacity-80 rounded-lg p-8 border border-amber-600 mb-8">
          <h2 className="text-3xl font-bold text-amber-400 mb-8">🎯 Step-by-Step Guide</h2>

          {/* Step 1 */}
          <div className="mb-12 pb-8 border-b border-gray-700">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Choose Your Page</h3>
                <p className="text-gray-300 mb-4">
                  The editor opens with the "main" homepage by default. You can:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">✓</span>
                    <span className="text-gray-300">Edit the <strong>"main"</strong> homepage (default landing page)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">✓</span>
                    <span className="text-gray-300">Create new pages with <strong>"+ New Page"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">✓</span>
                    <span className="text-gray-300">Create page templates for business types</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-12 pb-8 border-b border-gray-700">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Select a Zone</h3>
                <p className="text-gray-300 mb-4">
                  Every page has 3 zones - click to organize your components:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-yellow-600 bg-opacity-30 border border-yellow-500 rounded p-4">
                    <div className="font-bold text-yellow-300 mb-2">📌 Header Zone</div>
                    <p className="text-sm text-gray-300">Hero carousel, search bar at top</p>
                  </div>
                  <div className="bg-green-600 bg-opacity-30 border border-green-500 rounded p-4">
                    <div className="font-bold text-green-300 mb-2">📄 Body Zone</div>
                    <p className="text-sm text-gray-300">Main content sections, businesses, blog</p>
                  </div>
                  <div className="bg-slate-600 bg-opacity-30 border border-slate-500 rounded p-4">
                    <div className="font-bold text-slate-300 mb-2">🔗 Footer Zone</div>
                    <p className="text-sm text-gray-300">Links, copyright, bottom content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-12 pb-8 border-b border-gray-700">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Add Components</h3>
                <p className="text-gray-300 mb-4">
                  The palette shows all available components. For each zone:
                </p>
                <div className="bg-gray-900 rounded p-6 my-4">
                  <p className="text-gray-300 mb-4">Click <strong>"+ Add"</strong> button below the zone to select from:</p>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>🎬 <strong>Hero Carousel</strong> - Full-screen slides with videos</div>
                    <div>🔍 <strong>Search Bar</strong> - Discovery search engine</div>
                    <div>🏛️ <strong>Services Hub</strong> - Show all business categories</div>
                    <div>🎭 <strong>Experience Categories</strong> - Interactive cards</div>
                    <div>📖 <strong>Storytelling</strong> - Heritage narratives</div>
                    <div>🗓️ <strong>Journey Planner</strong> - Trip planning tool</div>
                    <div>💎 <strong>Investment Marketplace</strong> - Business opportunities</div>
                    <div>📰 <strong>Blog Feed</strong> - Latest articles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-12 pb-8 border-b border-gray-700">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Configure Components</h3>
                <p className="text-gray-300 mb-4">
                  Each component can be configured:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">🔧</span>
                    <div>
                      <strong className="text-white">Hero Carousel:</strong>
                      <p className="text-gray-300 text-sm">Go to <Link href="/jana/hero-carousel" className="text-blue-400 hover:underline">/jana/hero-carousel</Link> to manage slides, upload images/videos</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">🔧</span>
                    <div>
                      <strong className="text-white">Search Engine:</strong>
                      <p className="text-gray-300 text-sm">Choose which search engine to display</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">🔧</span>
                    <div>
                      <strong className="text-white">Reorder & Remove:</strong>
                      <p className="text-gray-300 text-sm">Use up/down arrows to reorder components, X to remove</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-12 pb-0">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">5</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">Save & Preview</h3>
                <p className="text-gray-300 mb-4">
                  When done editing:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">💾</span>
                    <span className="text-gray-300">Click <strong>"Save"</strong> button (or press Ctrl+S)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">👁️</span>
                    <span className="text-gray-300">Click <strong>"Preview"</strong> to see live changes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400">✓</span>
                    <span className="text-gray-300">Green checkmark = saved successfully</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-900 bg-opacity-40 border border-blue-500 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-blue-300 mb-6">💡 Tips & Tricks</h3>
          <div className="space-y-4 text-gray-200">
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">⌨️</span>
              <div>
                <strong>Keyboard Shortcuts:</strong>
                <p className="text-sm text-gray-400">Ctrl+S or Cmd+S to save quickly</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">🎯</span>
              <div>
                <strong>Component Order:</strong>
                <p className="text-sm text-gray-400">Use arrows to reorder components - what's on top appears first on the page</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">🔄</span>
              <div>
                <strong>Zone Strategy:</strong>
                <p className="text-sm text-gray-400">Header = attention grabbers. Body = main content. Footer = navigation & info</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">🎨</span>
              <div>
                <strong>Site Settings:</strong>
                <p className="text-sm text-gray-400">Customize colors, logo, and autoplay settings in the "Site Settings" section</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">📱</span>
              <div>
                <strong>Responsive:</strong>
                <p className="text-sm text-gray-400">All components are responsive - test on mobile before publishing</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Edit?</h3>
          <p className="text-amber-100 mb-6 text-lg">
            Open the homepage editor and start building your perfect page
          </p>
          <Link
            href="/jana/website"
            className="inline-block bg-white hover:bg-gray-100 text-amber-700 font-bold py-4 px-8 rounded-lg transition transform hover:scale-105"
          >
            🚀 Launch Homepage Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
