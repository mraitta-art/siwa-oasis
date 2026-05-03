'use client';

import React from 'react';

interface BlogComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  code: string;
  tags: string[];
}

const blogComponents: BlogComponent[] = [
  {
    id: 'blog-card-basic',
    name: 'Basic Blog Card',
    category: 'Blog Cards',
    description: 'Simple, clean blog card with image, title, excerpt, and read more link',
    preview: '/components/blog-card-basic.png',
    code: `<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <img src="/blog-image.jpg" alt="Blog" className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">Blog Title</h3>
    <p className="text-gray-600 mb-4">Brief excerpt of the blog post...</p>
    <a href="/blog/post" className="text-blue-600 font-semibold hover:underline">
      Read More →
    </a>
  </div>
</div>`,
    tags: ['card', 'basic', 'responsive']
  },
  {
    id: 'blog-card-featured',
    name: 'Featured Blog Card',
    category: 'Blog Cards',
    description: 'Large featured card with gradient overlay, category badge, and author info',
    preview: '/components/blog-card-featured.png',
    code: `<div className="relative rounded-xl overflow-hidden shadow-2xl">
  <img src="/blog-image.jpg" alt="Featured" className="w-full h-96 object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
  <div className="absolute top-4 left-4">
    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
      FEATURED
    </span>
  </div>
  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
    <h2 className="text-3xl font-bold mb-2">Featured Blog Post</h2>
    <p className="text-gray-200 mb-4">Compelling excerpt...</p>
    <div className="flex items-center gap-3">
      <img src="/avatar.jpg" className="w-10 h-10 rounded-full" />
      <div>
        <p className="font-semibold">Author Name</p>
        <p className="text-sm text-gray-300">Jan 15, 2024 · 5 min read</p>
      </div>
    </div>
  </div>
</div>`,
    tags: ['featured', 'hero', 'gradient', 'author']
  },
  {
    id: 'blog-card-horizontal',
    name: 'Horizontal Blog Card',
    category: 'Blog Cards',
    description: 'Side-by-side layout with image on left, content on right',
    preview: '/components/blog-card-horizontal.png',
    code: `<div className="flex bg-white rounded-lg shadow-md overflow-hidden">
  <img src="/blog-image.jpg" alt="Blog" className="w-1/3 object-cover" />
  <div className="flex-1 p-6">
    <span className="text-sm text-blue-600 font-semibold">Category</span>
    <h3 className="text-2xl font-bold mt-2 mb-3">Blog Title</h3>
    <p className="text-gray-600 mb-4">Detailed excerpt with more context...</p>
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">Jan 15, 2024</span>
      <a href="/blog/post" className="text-blue-600 font-semibold hover:underline">
        Read More →
      </a>
    </div>
  </div>
</div>`,
    tags: ['horizontal', 'layout', 'flex']
  },
  {
    id: 'blog-grid-3col',
    name: '3-Column Blog Grid',
    category: 'Blog Grids',
    description: 'Responsive 3-column grid layout for multiple blog posts',
    preview: '/components/blog-grid-3col.png',
    code: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {posts.map((post) => (
    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{post.title}</h3>
        <p className="text-gray-600 mb-4">{post.excerpt}</p>
        <a href={post.url} className="text-blue-600 font-semibold hover:underline">
          Read More →
        </a>
      </div>
    </div>
  ))}
</div>`,
    tags: ['grid', 'responsive', 'layout', '3-column']
  },
  {
    id: 'blog-list-view',
    name: 'Blog List View',
    category: 'Blog Lists',
    description: 'Vertical list layout with dividers, perfect for news feeds',
    preview: '/components/blog-list-view.png',
    code: `<div className="space-y-6">
  {posts.map((post) => (
    <article key={post.id} className="flex gap-6 pb-6 border-b">
      <img src={post.image} alt={post.title} className="w-48 h-32 object-cover rounded-lg" />
      <div className="flex-1">
        <span className="text-sm text-blue-600 font-semibold">{post.category}</span>
        <h3 className="text-2xl font-bold mt-1 mb-2">{post.title}</h3>
        <p className="text-gray-600 mb-3">{post.excerpt}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{post.author}</span>
          <span>{post.date}</span>
          <span>{post.readTime} read</span>
        </div>
      </div>
    </article>
  ))}
</div>`,
    tags: ['list', 'vertical', 'feed', 'news']
  },
  {
    id: 'blog-masonry',
    name: 'Masonry Blog Layout',
    category: 'Blog Grids',
    description: 'Pinterest-style masonry grid with varying card heights',
    preview: '/components/blog-masonry.png',
    code: `<div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
  {posts.map((post) => (
    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden break-inside-avoid">
      <img src={post.image} alt={post.title} className="w-full" />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{post.title}</h3>
        <p className="text-gray-600">{post.excerpt}</p>
      </div>
    </div>
  ))}
</div>`,
    tags: ['masonry', 'pinterest', 'creative', 'columns']
  },
  {
    id: 'blog-hero-section',
    name: 'Blog Hero Section',
    category: 'Page Sections',
    description: 'Full-width hero section with featured post and grid below',
    preview: '/components/blog-hero-section.png',
    code: `<section className="py-16">
  {/* Featured Post */}
  <div className="relative rounded-2xl overflow-hidden mb-12">
    <img src="/featured.jpg" className="w-full h-[500px] object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="absolute bottom-0 left-0 p-12 text-white max-w-3xl">
      <span className="bg-yellow-500 px-4 py-1 rounded-full text-sm font-bold">FEATURED</span>
      <h1 className="text-5xl font-bold mt-4 mb-4">Featured Blog Title</h1>
      <p className="text-xl text-gray-200 mb-6">Compelling description...</p>
      <a href="/blog/featured" className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
        Read Article
      </a>
    </div>
  </div>
  
  {/* Recent Posts Grid */}
  <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
  <div className="grid grid-cols-3 gap-6">
    {/* Blog cards here */}
  </div>
</section>`,
    tags: ['hero', 'featured', 'section', 'full-width']
  },
  {
    id: 'blog-sidebar-layout',
    name: 'Blog with Sidebar',
    category: 'Page Layouts',
    description: 'Two-column layout with blog posts and sidebar widgets',
    preview: '/components/blog-sidebar-layout.png',
    code: `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main Content */}
  <div className="lg:col-span-2 space-y-8">
    {posts.map((post) => (
      <article key={post.id} className="bg-white rounded-lg shadow-md p-6">
        <img src={post.image} className="w-full h-64 object-cover rounded-lg mb-4" />
        <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
        <p className="text-gray-600">{post.excerpt}</p>
      </article>
    ))}
  </div>
  
  {/* Sidebar */}
  <aside className="space-y-6">
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Search</h3>
      <input type="text" placeholder="Search..." className="w-full px-4 py-2 border rounded-lg" />
    </div>
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Categories</h3>
      {/* Category list */}
    </div>
  </aside>
</div>`,
    tags: ['sidebar', 'layout', 'two-column', 'widgets']
  },
  {
    id: 'blog-minimal',
    name: 'Minimal Blog Card',
    category: 'Blog Cards',
    description: 'Clean, typography-focused design with minimal styling',
    preview: '/components/blog-minimal.png',
    code: `<article className="max-w-2xl mx-auto py-8">
  <span className="text-sm text-gray-500 uppercase tracking-wider">Category · Jan 15, 2024</span>
  <h2 className="text-3xl font-bold mt-2 mb-4">Blog Title</h2>
  <p className="text-gray-700 text-lg leading-relaxed mb-6">
    Clean, readable excerpt focusing on content...
  </p>
  <a href="/blog/post" className="text-gray-900 font-semibold border-b-2 border-gray-900 hover:text-gray-600">
    Continue Reading
  </a>
</article>`,
    tags: ['minimal', 'clean', 'typography', 'simple']
  },
  {
    id: 'blog-newsletter-cta',
    name: 'Blog Newsletter CTA',
    category: 'Page Sections',
    description: 'Call-to-action section for newsletter subscription between blog posts',
    preview: '/components/blog-newsletter-cta.png',
    code: `<section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white my-12">
  <h2 className="text-4xl font-bold mb-4">Stay Updated</h2>
  <p className="text-xl mb-8 text-blue-100">Get the latest blog posts delivered to your inbox</p>
  <form className="max-w-md mx-auto flex gap-4">
    <input 
      type="email" 
      placeholder="Enter your email"
      className="flex-1 px-6 py-3 rounded-lg text-gray-900"
    />
    <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
      Subscribe
    </button>
  </form>
</section>`,
    tags: ['newsletter', 'cta', 'subscription', 'email']
  }
];

export default blogComponents;
