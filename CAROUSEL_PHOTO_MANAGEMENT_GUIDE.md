# 🎠 Complete Guide: Managing Carousel & Photos on Siwa Main Page

## Quick Access
- **Hero Carousel Manager:** http://localhost:3004/jana/hero-carousel
- **Media Upload:** Built into carousel manager
- **Image Curation:** http://localhost:3004/admin/image-curation
- **Page Builder:** http://localhost:3004/jana/website

---

## ✅ Current System Features

Your siwa-oasis already has **5 powerful tools** for managing carousel slides and photos:

### 1. **Hero Carousel Manager** (Admin Tool)
**Location:** `/jana/hero-carousel`

**What it does:**
- Add unlimited carousel slides
- Upload images or video files (MP4, MOV)
- Add YouTube video URLs
- Set slide titles, subtitles, and captions
- Configure CTAs (buttons with links)
- Adjust image fit (cover/contain)
- Reorder slides by drag-drop
- Delete slides

**Upload Methods:**
- 📁 Upload from device (50MB max)
- 📸 Take photo with camera
- 🎥 Paste YouTube URL
- 🌐 Paste direct image/video URL

---

## 📋 Step-by-Step: How to Change Photos & Slides

### **Step 1: Access Carousel Manager**
1. Go to http://localhost:3004/jana/hero-carousel (when logged in as admin)
2. You'll see all current slides listed

### **Step 2: Add a New Slide**

#### **Option A: Upload Image from Device**
1. Click the **"UPLOAD"** button in the form
2. Select an image file (JPG, PNG, WebP)
3. System auto-detects it as "image" type
4. Fill in slide details:
   - **Title:** Headline (e.g., "Discover Siwa")
   - **Subtitle:** Description (e.g., "Experience the oasis magic")
   - **Caption:** Small badge text (e.g., "FEATURED")
   - **Media URL:** Auto-filled after upload

#### **Option B: Take Photo with Camera**
1. Click the **"CAMERA"** button in the form
2. Grant camera permission
3. Take a photo
4. Fill in slide details
5. Photo auto-uploads

#### **Option C: Add YouTube Video**
1. Go to YouTube and find your video
2. Copy the URL (any of these formats work):
   - `https://youtube.com/watch?v=xxxxx`
   - `https://youtu.be/xxxxx`
   - `https://youtube.com/shorts/xxxxx`
3. Paste into **Media URL** field
4. Select type: **"youtube"**
5. Fill in slide details (title, subtitle, caption)

#### **Option D: Upload Video File**
1. Click **"UPLOAD"** button
2. Select video file (MP4, MOV, WebM)
3. System auto-detects it as "video" type
4. Add slide details
5. Video displays as background with controls

### **Step 3: Configure Slide Display**

#### **Media Adjustment**
- **Fit:** Choose how image/video fills the screen
  - `cover` = Image fills entire screen (may crop)
  - `contain` = Full image visible (may have empty space)
- **Position:** Where to anchor the image
  - `center` = Balanced on all sides
  - `top` = Focus on top portion
  - `bottom` = Focus on bottom portion

#### **Call-to-Action (CTA)**
- **CTA Text:** Button label (e.g., "Book Now", "Learn More")
- **CTA Link:** Where button goes
  - `/vendor-page` = Internal page
  - `https://example.com` = External URL
  - `/search?vibe=adventure` = Search with filters

#### **Overlay & Animation**
- **Overlay Opacity:** How dark/transparent the overlay is (0-1)
  - 0.3 = Very transparent
  - 0.7 = Very dark (good for text visibility)
- **Animation:** Transition effect
  - `fade` = Simple fade-in
  - `zoom` = Ken Burns zoom effect
  - `kenburns` = Professional cinematic zoom
  - `slide` = Slide from side

### **Step 4: Save & Preview**

1. Click **"SAVE SLIDE"** button
2. Slide appears in the list above
3. Click **"PREVIEW"** link to see live on page

---

## 🎨 Edit Existing Slides

### **Change Slide Content**
1. Click slide in the list
2. Click **"EDIT"** button
3. Modify any field:
   - Title, subtitle, caption
   - Upload new image/video
   - Adjust fit and position
   - Update CTA text/link
4. Click **"SAVE CHANGES"**

### **Reorder Slides**
1. Each slide shows a **"Display Order"** number
2. Lower numbers = appear first
3. Use up/down arrows or edit the order number
4. Click **"SAVE"** when done

### **Delete Slide**
1. Click slide in list
2. Click **"DELETE"** button
3. Confirm deletion
4. Slide removed from carousel

---

## 🏢 Using Builder to Display Carousel on Main Page

### **The Carousel Already Appears On:**
- Main homepage at `/` (displays "main" carousel)
- Carousel test page at `/carousel`

### **To Add Carousel to Custom Pages:**

1. Go to `/jana/website` (Website Builder)
2. Select page (or create new one)
3. Click **"ADD SECTION"**
4. Select **"Hero Carousel"** from components
5. Set carousel name (default: "discovery")
6. Configure options:
   - Auto-play interval (default 8000ms)
   - Show indicators (dots)
   - Show arrows (navigation)
   - Show progress bar
7. Save page
8. Carousel now displays at that URL

---

## 📸 Advanced: Image Curation Dashboard

**Location:** `/admin/image-curation`

**What it does:**
- Reviews all vendor-uploaded images
- Approve/reject images for homepage carousel
- Mark images as "hero" (featured on carousel)
- Filter by vendor, status, business type

**How to use:**
1. Go to `/admin/image-curation`
2. See all uploaded images waiting for approval
3. **Approve** images to make them public
4. **Mark as Hero** to add to homepage carousel
5. **Reject** low-quality images
6. Filter by status (pending, approved, rejected)

---

## 🎬 Video Management

### **Supported Video Sources**
1. **YouTube** - Most reliable, no upload needed
   - Copy URL from youtube.com
   - Auto-embeds in carousel
   - Plays with YouTube player

2. **Direct Video Files** (MP4, MOV, WebM)
   - Upload to your server
   - Displays with custom HTML5 player
   - Best for short clips (<10MB)

3. **Hosted Videos** (Vimeo, etc.)
   - Paste embed URL or direct link
   - Should work if URL is accessible

### **Video Best Practices**
- 🎥 Keep videos 10-30 seconds for carousels
- 📏 Use 16:9 aspect ratio
- 🔊 Mute by default (less distracting)
- ⏱️ Set max duration to prevent overly long autoplay

---

## 🔄 Bulk Operations (If You Add Enhancement)

**Currently Not Available, But Can Be Added:**
- [ ] Drag-and-drop slide reordering
- [ ] Bulk upload multiple slides at once
- [ ] Bulk delete slides
- [ ] Duplicate slide
- [ ] Batch edit properties
- [ ] Schedule slides (show/hide by date)
- [ ] Slide analytics (clicks, views)

---

## 📊 Carousel Data Model

### **What You're Managing:**

```
website_configs table:
├── type: "hero_carousel_main" (or other carousel names)
├── config: JSON with slides array
│   ├── id: unique slide ID
│   ├── type: "image" | "youtube" | "video"
│   ├── mediaUrl: URL to the media file
│   ├── title: Slide headline
│   ├── subtitle: Description text
│   ├── caption: Small badge (e.g., "FEATURED")
│   ├── ctaText: Button label
│   ├── ctaLink: Button destination
│   ├── imageFit: "cover" | "contain"
│   ├── imagePosition: "center" | "top" | "bottom"
│   ├── overlayOpacity: 0-1 transparency
│   ├── animation: effect type
│   ├── displayOrder: sort order
│   └── bgColor: background fallback color
```

---

## 🚀 Quick Workflows

### **Workflow 1: Update Hero Carousel for Holiday Season**

```
1. Go to /jana/hero-carousel
2. Delete old summer slides (click DELETE)
3. Upload 5 new holiday-themed images
4. Set captions: "HOLIDAY SPECIAL"
5. Add CTA: "Book Holiday Package" → /journey-request
6. Reorder: most exciting slide first
7. Save and visit homepage to verify
8. ✅ Live in 2 minutes!
```

### **Workflow 2: Feature New Vendor Partnership**

```
1. Get vendor's best photos (3-5 images)
2. Go to /jana/hero-carousel
3. Upload vendor images
4. Title: "Featured Partner: [Vendor Name]"
5. Subtitle: "[Vendor Description]"
6. CTA: "Explore & Request" → /p/vendor-slug
7. Set to display first (order: 1)
8. Save
9. ✅ New partner featured on homepage!
```

### **Workflow 3: Add YouTube Promotional Video**

```
1. Create/upload video to YouTube channel
2. Copy video URL
3. Go to /jana/hero-carousel
4. Paste URL into Media URL field
5. Select type: "youtube"
6. Add title: "Siwa Experiences"
7. Subtitle: "Watch what awaits you"
8. Set overlay opacity: 0.5 (so video shows through)
9. Save
10. ✅ Video plays as first slide!
```

---

## 💡 Tips & Best Practices

### **Image Specifications**
- **Size:** 1920x1080 (16:9 aspect ratio)
- **Format:** JPG, PNG, WebP (WebP is smallest)
- **File Size:** < 2MB for fast loading
- **Quality:** Use high-quality originals

### **Text Best Practices**
- **Title:** 2-5 words, all caps for impact
- **Subtitle:** 1-2 sentences, 10-20 words max
- **Caption:** Single word or short phrase

### **Animation Selection**
- `kenburns` = Elegant, professional
- `fade` = Simple, clean
- `zoom` = Energetic, modern
- `slide` = Directional feel

### **Overlay Opacity**
- 0.3-0.4 = Light, image-focused
- 0.5-0.6 = Balanced
- 0.7-0.8 = Text-focused, image behind

---

## 🔗 Related Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Hero Carousel Manager | `/jana/hero-carousel` | Add/edit/delete slides |
| Media Curation | `/admin/image-curation` | Approve vendor images |
| Website Builder | `/jana/website` | Add carousel to pages |
| Carousel Test | `/carousel` | Preview full carousel |
| Blueprint Manager | `/jana/blueprints/[id]` | Business photo galleries |
| Blog Editor | `/jana/blog/editor` | Create blog posts with images |

---

## 🆘 Troubleshooting

### **Uploaded image doesn't appear**
- Check image size (< 50MB)
- Try JPG or PNG format
- Wait 2-3 seconds for upload
- Refresh page
- Check browser console for errors (F12)

### **YouTube video shows error**
- Verify URL is public (not private)
- Check YouTube video is not deleted
- Try other YouTube URL formats:
  - `https://youtu.be/[ID]`
  - `https://youtube.com/watch?v=[ID]`

### **Slides not showing in order**
- Check "Display Order" values
- Ensure each slide has unique order number
- Save changes
- Refresh page (Ctrl+F5 for hard refresh)

### **Cannot upload: "File too large"**
- Compress image (use TinyPNG.com)
- Or use smaller dimensions
- Or upload to YouTube instead of server

### **Carousel not appearing on homepage**
- Verify carousel ID matches in page builder
- Check carousel exists in `/jana/hero-carousel`
- Visit `/carousel` to test
- Check browser console (F12) for JavaScript errors

---

## ✨ Enhancement Opportunities

Would you like me to **add these features** to your carousel system?

### **1. Enhanced Slide Editor** ⭐
- Side-by-side preview
- Drag-and-drop reordering
- Bulk slide upload
- Slide templates
- Duplicate slide

### **2. Scheduling & Publishing**
- Schedule slides to show on specific dates
- Publish/unpublish slides
- Version control & history
- Revert to previous carousel state

### **3. Analytics & Performance**
- Track slide views & clicks
- A/B test different slides
- Best performing slide rankings
- Export performance reports

### **4. Advanced Video Features**
- Video trimming editor
- Custom video thumbnails
- Auto-captions/subtitles
- Video metadata (duration, size)

### **5. Smart Media Management**
- Image cropping tool
- Batch resize/optimize
- Organize into folders/albums
- Tag & categorize slides

### **6. AI-Powered Features**
- Auto-generate captions from image
- Suggest best image crops
- Auto-resize for different devices
- Color matching for brand consistency

---

## Next Steps

**Choose your path:**

1. **Just use it** - Everything you need is already there! ✅
2. **Add enhancements** - Pick from the list above and I'll implement them
3. **Custom workflow** - Tell me your specific needs and I'll build it

What would you like to do?
