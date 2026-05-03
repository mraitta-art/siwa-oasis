# 🚀 Quick Start - Add Blog to Any Page

## Super Quick Start (Copy & Paste)

### Option 1: Load from Database (Easiest)

```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

// Add anywhere in your page:
<EasyBlogSection 
  preset="miniSiteStandard" 
  loadFromAPI={true}
  title="Latest Blog Posts"
/>
```

### Option 2: With Your Own Posts

```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

const posts = [
  {
    id: 1,
    title: 'My First Post',
    excerpt: 'This is the excerpt...',
    featured_image: '/image1.jpg'
  }
];

<EasyBlogSection 
  preset="miniSiteStandard" 
  posts={posts}
  title="My Blog"
/>
```

---

## 🎯 Choose Your Layout

| Preset | Best For | Code |
|--------|----------|------|
| **Standard Grid** | Mini-sites, general use | `preset="miniSiteStandard"` |
| **Featured Hero** | Landing pages | `preset="landingFeatured"` |
| **List View** | Forms, help sections | `preset="formHelp"` |
| **Compact** | Sidebars, footers | `preset="compactGrid"` |
| **Minimal Text** | Clean layouts | `preset="minimalText"` |
| **Magazine** | Professional sites | `preset="magazineStyle"` |

---

## 📝 Complete Examples

### Homepage
```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome</h1>
      <EasyBlogSection 
        preset="landingFeatured" 
        loadFromAPI={true} 
        title="Latest News"
      />
    </div>
  );
}
```

### Minisite
```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function MiniSite() {
  return (
    <div>
      <h1>Business Name</h1>
      <EasyBlogSection 
        preset="miniSiteStandard" 
        loadFromAPI={true}
        postCount={6}
        title="Our Blog"
      />
    </div>
  );
}
```

### Form Help
```tsx
import { EasyBlogSection } from '@/lib/blog-integration';

export default function FormPage() {
  return (
    <div>
      <h1>Registration Form</h1>
      <form>{/* form fields */}</form>
      <EasyBlogSection 
        preset="formHelp" 
        posts={helpPosts}
        title="Help Resources"
      />
    </div>
  );
}
```

---

## 🔧 Full Control (Advanced)

```tsx
import { BlogGridSection } from '@/lib/blog-integration';

<BlogGridSection config={{
  id: 'my-blog',
  layout: 'grid',
  columns: 3,
  posts: myPosts,
  showImage: true,
  showTitle: true,
  showExcerpt: true,
  showAuthor: false,
  showDate: true,
  showCategory: true,
  showReadMore: true,
  showSectionTitle: true,
  postCount: 6,
  gap: 24,
  cardStyle: 'elevated',
  imageHeight: 200,
  borderRadius: 12,
  title: 'Blog',
  backgroundColor: '#ffffff',
  padding: '4rem 2rem'
}} />
```

---

## 📦 Available Components

1. **EasyBlogSection** - One-line integration with presets
2. **BlogGridSection** - Grid layout (1-4 columns)
3. **BlogListSection** - Vertical list layout
4. **BlogFeaturedSection** - Hero + grid layout
5. **BlogMinimalSection** - Text-focused layout

---

## 🌐 Demo Page

Visit `/demo/blog-layouts` to see all layouts in action!

---

## 📖 Full Documentation

See `BLOG_INTEGRATION_GUIDE.md` for complete documentation.

---

## ✅ That's It!

Just pick a preset and add it to your page. Everything else is handled automatically! 🎉
