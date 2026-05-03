# 📝 Blog Integration Examples

## Example 1: Add Blog to Homepage

```tsx
// src/app/page.tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section 
        style={{ 
          padding: '6rem 2rem', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff'
        }}
      >
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>
          Welcome to Siwa Oasis
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
          Discover amazing businesses and services
        </p>
      </section>

      {/* Featured Blog Section */}
      <EasyBlogSection 
        preset="landingFeatured" 
        loadFromAPI={true}
        postCount={4}
        title="Latest News & Updates"
        subtitle="Stay informed with our latest stories"
      />

      {/* Services Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>
          Our Services
        </h2>
        <p>Services content here...</p>
      </section>

      {/* Standard Blog Grid */}
      <EasyBlogSection 
        preset="miniSiteStandard" 
        loadFromAPI={true}
        postCount={6}
        title="More Articles"
        subtitle="Explore our complete blog library"
      />

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc' }}>
        <p>© 2024 Siwa Oasis. All rights reserved.</p>
      </footer>
    </div>
  );
}
```

---

## Example 2: Add Blog to Minisite

```tsx
// src/app/minisite/[businessId]/page.tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function MiniSite({ params }: { params: { businessId: string } }) {
  return (
    <div>
      {/* Business Header */}
      <header style={{ 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>
          Business Name
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Welcome to our minisite
        </p>
      </header>

      {/* About Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
          About Us
        </h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#64748b' }}>
          We are a local business dedicated to providing excellent services...
        </p>
      </section>

      {/* Services Section */}
      <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
            Our Services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {/* Service cards */}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <EasyBlogSection 
        preset="miniSiteStandard" 
        loadFromAPI={true}
        postCount={6}
        title="From Our Blog"
        subtitle="Latest updates and insights from our team"
      />

      {/* Contact Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
          Contact Us
        </h2>
        <p>Email: contact@business.com</p>
        <p>Phone: +123 456 7890</p>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', color: '#fff' }}>
        <p>© 2024 Business Name. All rights reserved.</p>
      </footer>
    </div>
  );
}
```

---

## Example 3: Add Blog to Form Page

```tsx
// src/app/forms/registration/page.tsx
import { EasyBlogSection, BlogPost } from '@/lib/blog-integration';

export default function RegistrationForm() {
  // Help articles for the form
  const helpPosts: BlogPost[] = [
    {
      id: 1,
      title: 'How to Fill This Form',
      excerpt: 'Step-by-step guide to completing your business registration. Learn about required fields and documents.',
      featured_image: '/images/guide.jpg',
      category_name: 'Guide',
      created_at: '2024-01-10',
      reading_time: 5
    },
    {
      id: 2,
      title: 'Required Documents',
      excerpt: 'Complete list of documents you need to prepare before starting your registration process.',
      featured_image: '/images/documents.jpg',
      category_name: 'Requirements',
      created_at: '2024-01-08',
      reading_time: 3
    },
    {
      id: 3,
      title: 'Common Mistakes to Avoid',
      excerpt: 'Learn from others mistakes. Here are the most common errors during registration and how to avoid them.',
      featured_image: '/images/tips.jpg',
      category_name: 'Tips',
      created_at: '2024-01-05',
      reading_time: 4
    }
  ];

  return (
    <div>
      {/* Form Header */}
      <div style={{ 
        padding: '3rem 2rem', 
        background: '#f8fafc',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          Business Registration
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Complete the form below to register your business
        </p>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 2rem' }}>
        <form style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Business Information
          </h2>
          
          {/* Form fields */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Business Name *
            </label>
            <input 
              type="text" 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px'
              }}
              placeholder="Enter business name"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Description *
            </label>
            <textarea 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                minHeight: '120px'
              }}
              placeholder="Describe your business"
            />
          </div>

          {/* More form fields... */}

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Submit Registration
          </button>
        </form>
      </div>

      {/* Help Resources Section */}
      <EasyBlogSection 
        preset="formHelp" 
        posts={helpPosts}
        title="Helpful Resources"
        subtitle="Learn how to complete your registration successfully"
      />
    </div>
  );
}
```

---

## Example 4: Add Blog to About Page

```tsx
// src/app/about/page.tsx
import { EasyBlogSection, BlogPost } from '@/lib/blog-integration';

export default function AboutPage() {
  // Related articles
  const relatedPosts: BlogPost[] = [
    {
      id: 1,
      title: 'Our Mission and Vision',
      excerpt: 'Learn about our goals and how we plan to transform the local business landscape.',
      featured_image: '/images/mission.jpg',
      category_name: 'Company',
      created_at: '2024-01-15'
    },
    {
      id: 2,
      title: 'Meet Our Team',
      excerpt: 'Introduction to the dedicated professionals behind Siwa Oasis marketplace.',
      featured_image: '/images/team.jpg',
      category_name: 'Team',
      created_at: '2024-01-10'
    },
    {
      id: 3,
      title: 'Our Impact on Local Community',
      excerpt: 'How we are supporting local businesses and contributing to economic growth.',
      featured_image: '/images/impact.jpg',
      category_name: 'Impact',
      created_at: '2024-01-05'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{ 
        padding: '6rem 2rem', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>
          About Siwa Oasis
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
          Empowering local businesses through digital transformation
        </p>
      </section>

      {/* Our Story */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          Our Story
        </h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#64748b', marginBottom: '1.5rem' }}>
          Founded in 2024, Siwa Oasis was created with a simple mission: to help local businesses 
          thrive in the digital age. We believe that every business, regardless of size, deserves 
          access to powerful online tools.
        </p>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#64748b' }}>
          Our platform connects businesses with customers, provides marketing tools, and creates 
          opportunities for growth in the vibrant Siwa Oasis community.
        </p>
      </section>

      {/* Values */}
      <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem', textAlign: 'center' }}>
            Our Values
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>🎯 Mission-Driven</h3>
              <p style={{ color: '#64748b' }}>We focus on creating real value for our community.</p>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>🤝 Partnership</h3>
              <p style={{ color: '#64748b' }}>We succeed when our businesses succeed.</p>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>💡 Innovation</h3>
              <p style={{ color: '#64748b' }}>We continuously improve our platform and services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <EasyBlogSection 
        preset="miniSiteStandard" 
        posts={relatedPosts}
        title="Learn More About Us"
        subtitle="Read more about our mission, team, and impact"
      />

      {/* CTA */}
      <section style={{ 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Ready to Get Started?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
          Join hundreds of businesses already growing with Siwa Oasis
        </p>
        <a 
          href="/forms/registration"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: '#fff',
            color: '#3b82f6',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1.1rem'
          }}
        >
          Register Your Business
        </a>
      </section>
    </div>
  );
}
```

---

## Example 5: Multiple Blog Sections on One Page

```tsx
// src/app/blog-showcase/page.tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function BlogShowcase() {
  return (
    <div>
      {/* Page Header */}
      <div style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        background: '#f8fafc'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          Blog Showcase
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Explore our content in different layouts
        </p>
      </div>

      {/* Section 1: Featured Stories */}
      <EasyBlogSection 
        preset="landingFeatured" 
        loadFromAPI={true}
        postCount={4}
        title="Featured Stories"
        subtitle="Our most popular and important articles"
      />

      {/* Section 2: All Articles Grid */}
      <EasyBlogSection 
        preset="magazineStyle" 
        loadFromAPI={true}
        postCount={9}
        title="All Articles"
        subtitle="Browse our complete library of content"
      />

      {/* Section 3: Quick Reads (Minimal) */}
      <EasyBlogSection 
        preset="minimalText" 
        loadFromAPI={true}
        postCount={6}
        title="Quick Reads"
        subtitle="Short articles you can read in minutes"
      />

      {/* Section 4: Recent Posts (Compact) */}
      <EasyBlogSection 
        preset="compactGrid" 
        loadFromAPI={true}
        postCount={8}
      />
    </div>
  );
}
```

---

## Example 6: Blog in Sidebar Layout

```tsx
// src/app/layout-with-sidebar/page.tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function LayoutWithSidebar() {
  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Main Content */}
      <main style={{ flex: 2 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>
          Main Content
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#64748b' }}>
          Your main page content goes here...
        </p>
      </main>

      {/* Sidebar */}
      <aside style={{ flex: 1 }}>
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Recent Posts
          </h3>
          <EasyBlogSection 
            preset="compactGrid" 
            loadFromAPI={true}
            postCount={4}
          />
        </div>

        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Popular Categories
          </h3>
          {/* Categories content */}
        </div>
      </aside>
    </div>
  );
}
```

---

## 🎯 Key Takeaways

1. **One Line Integration**: Just import and add `<EasyBlogSection>` anywhere
2. **Choose Preset**: Pick from 6 professional layouts
3. **Data Source**: Use `loadFromAPI={true}` or provide `posts` manually
4. **Customize**: Add `title`, `subtitle`, and `postCount`
5. **Stack Multiple**: Add multiple blog sections to one page
6. **Mix & Match**: Use different presets on the same page

---

## 🚀 Quick Copy-Paste Template

```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

// Add this anywhere in your page:
<EasyBlogSection 
  preset="miniSiteStandard"  // Change preset as needed
  loadFromAPI={true}          // Or use posts={yourPosts}
  postCount={6}               // Number of posts to show
  title="Blog Section"        // Section title
  subtitle="Optional subtitle" // Optional subtitle
/>
```

**That's it!** 🎉
