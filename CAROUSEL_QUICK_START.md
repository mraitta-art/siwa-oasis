# 🎬 Carousel Integration - Quick Start

## Super Quick Start (30 Seconds)

### Step 1: Import
```tsx
import { EasyCarouselSection } from '@/lib/carousel-integration';
```

### Step 2: Add to Page
```tsx
<EasyCarouselSection 
  preset="heroFullwidth" 
  loadFromAPI={true}
/>
```

### Step 3: Done! 🎉

---

## 🎯 Choose Your Layout

| Preset | Best For | Code |
|--------|----------|------|
| **Hero Full-Width** | Homepage hero | `preset="heroFullwidth"` |
| **Compact Contained** | Content sections | `preset="compactContained"` |
| **Thumbnail Nav** | Galleries | `preset="thumbnailNav"` |
| **Minimal Clean** | Modern designs | `preset="minimalClean"` |
| **Fullscreen Edge** | Dramatic impact | `preset="fullscreenEdge"` |
| **Card Container** | Sidebars, blocks | `preset="cardContainer"` |

---

## 📝 Quick Examples

### Homepage Hero
```tsx
import { EasyCarouselSection } from '@/lib/carousel-integration';

export default function HomePage() {
  return (
    <div>
      <EasyCarouselSection 
        preset="heroFullwidth" 
        loadFromAPI={true}
      />
      {/* Rest of page */}
    </div>
  );
}
```

### About Page
```tsx
<EasyCarouselSection 
  preset="compactContained" 
  loadFromAPI={true}
/>
```

### Gallery
```tsx
<EasyCarouselSection 
  preset="thumbnailNav" 
  loadFromAPI={true}
/>
```

### Minisite
```tsx
<EasyCarouselSection 
  preset="cardContainer" 
  loadFromAPI={true}
  title="Our Gallery"
  subtitle="Browse our work"
/>
```

---

## 🔧 With Custom Slides

```tsx
import { EasyCarouselSection, CarouselSlide } from '@/lib/carousel-integration';

const slides: CarouselSlide[] = [
  {
    id: '1',
    type: 'image',
    mediaUrl: '/images/slide1.jpg',
    title: 'My Slide',
    subtitle: 'Description here'
  }
];

<EasyCarouselSection 
  preset="heroFullwidth" 
  slides={slides}
/>
```

---

## 🎬 YouTube Video Slides

```tsx
const slides: CarouselSlide[] = [
  {
    id: '1',
    type: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
    title: 'Video Title',
    subtitle: 'Watch our video'
  }
];

<EasyCarouselSection 
  preset="heroFullwidth" 
  slides={slides}
/>
```

---

## 🌐 Access Points

- **Demo**: `/demo/carousel-layouts`
- **Manage Slides**: `/admin/hero-carousel`
- **Full Guide**: `CAROUSEL_INTEGRATION_GUIDE.md`

---

## ✅ That's It!

Just pick a preset and add it to your page. Everything else is handled automatically! 🚀
