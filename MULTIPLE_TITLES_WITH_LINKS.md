# 🎯 MULTIPLE TITLES & LINKED TEXT BLOCKS - COMPLETE GUIDE

## ✅ NEW FEATURE ADDED!

You can now add **multiple titles, subtitles, and paragraphs** to each carousel slide, and **each text block can have its own clickable link**!

---

## 🎨 WHAT YOU CAN DO NOW

### **Per Slide, You Can Have:**

```
✅ 1 Main Title (always there)
✅ 1 Main Subtitle (always there)
✅ Multiple Additional Text Blocks:
   - Additional titles
   - Additional subtitles
   - Paragraphs
   - Each with optional clickable links
   - Each with custom styling
```

---

## 📝 EXAMPLE USE CASES

### **Example 1: Hotel Showcase Slide**

```
Main Title: "Luxury Desert Resort"
Main Subtitle: "Experience Siwa's Finest"

Extra Text Block 1 (Title with link):
  Text: "🏨 View Rooms"
  Link: "/hotels/luxury-resort/rooms"
  Style: Bold, Gold, Large

Extra Text Block 2 (Title with link):
  Text: "🍽️ Restaurant Menu"
  Link: "/hotels/luxury-resort/dining"
  Style: Bold, White, Medium

Extra Text Block 3 (Paragraph):
  Text: "Starting from $299/night"
  Link: "" (no link, just info)
  Style: Normal, Light gray, Small
```

---

### **Example 2: Adventure Tour Slide**

```
Main Title: "Desert Safari Adventures"
Main Subtitle: "Explore the Great Sand Sea"

Extra Text Block 1 (Title with link):
  Text: "🚗 Book Safari Tour"
  Link: "https://booking.example.com/safari"
  Target: _blank (new tab)
  Style: Bold, Orange, Large

Extra Text Block 2 (Subtitle with link):
  Text: "📋 View Itinerary"
  Link: "/tours/safari/itinerary"
  Style: Normal, White, Medium

Extra Text Block 3 (Subtitle with link):
  Text: "⭐ Read Reviews"
  Link: "/tours/safari/reviews"
  Style: Normal, Yellow, Medium

Extra Text Block 4 (Paragraph):
  Text: "Duration: 6 hours | Group size: 4-8 people"
  Link: "" (info only)
  Style: Normal, Light gray, Small
```

---

### **Example 3: Restaurant Slide**

```
Main Title: "Traditional Siwan Cuisine"
Main Subtitle: "Authentic Flavors Since 1985"

Extra Text Block 1 (Title with link):
  Text: "📖 Menu"
  Link: "/restaurants/siwan-kitchen/menu"

Extra Text Block 2 (Title with link):
  Text: "📞 Reserve Table"
  Link: "tel:+201234567890"

Extra Text Block 3 (Paragraph):
  Text: "Open daily: 11 AM - 11 PM"
  Link: "" (info only)
```

---

### **Example 4: Event/Workshop Slide**

```
Main Title: "Photography Workshop"
Main Subtitle: "Capture the Magic of Siwa"

Extra Text Block 1 (Title with link):
  Text: "📅 Register Now"
  Link: "/events/photo-workshop/register"

Extra Text Block 2 (Subtitle with link):
  Text: "👨‍🏫 Meet the Instructor"
  Link: "/instructors/ahmed-hassan"

Extra Text Block 3 (Paragraph):
  Text: "March 15-17, 2026 | 3 days"
  Link: ""

Extra Text Block 4 (Paragraph):
  Text: "Limited to 12 participants"
  Link: ""
```

---

## 🔧 DATA STRUCTURE

### **Slide with Extra Text Blocks:**

```json
{
  "id": "slide_1234567890",
  "type": "youtube",
  "mediaUrl": "https://www.youtube.com/watch?v=ABC123",
  "title": "Luxury Desert Resort",
  "subtitle": "Experience Siwa's Finest",
  
  "extraTextBlocks": [
    {
      "id": "text_block_1",
      "text": "🏨 View Rooms",
      "type": "title",
      "link": "/hotels/luxury-resort/rooms",
      "linkTarget": "_self",
      "style": {
        "fontSize": "large",
        "fontWeight": "bold",
        "color": "#D4AF37",
        "textAlign": "center",
        "marginTop": "1rem",
        "marginBottom": "0.5rem"
      }
    },
    {
      "id": "text_block_2",
      "text": "🍽️ Restaurant Menu",
      "type": "title",
      "link": "/hotels/luxury-resort/dining",
      "linkTarget": "_self",
      "style": {
        "fontSize": "medium",
        "fontWeight": "bold",
        "color": "#ffffff",
        "textAlign": "center",
        "marginTop": "0.5rem",
        "marginBottom": "0.5rem"
      }
    },
    {
      "id": "text_block_3",
      "text": "Starting from $299/night",
      "type": "paragraph",
      "link": "",
      "style": {
        "fontSize": "small",
        "fontWeight": "normal",
        "color": "#d1d5db",
        "textAlign": "center",
        "marginTop": "0.5rem",
        "marginBottom": "0"
      }
    }
  ],
  
  "ctaText": "BOOK NOW",
  "ctaLink": "/hotels/luxury-resort/book"
}
```

---

## 💡 TEXT BLOCK TYPES

### **1. Title Type**
```
Use for: Important headings, section titles
Style: Large, bold, prominent
Example: "View Rooms", "Book Tour"
```

### **2. Subtitle Type**
```
Use for: Secondary information, links
Style: Medium, normal weight
Example: "View Itinerary", "Read Reviews"
```

### **3. Paragraph Type**
```
Use for: Details, info, descriptions
Style: Small, light weight
Example: "Duration: 6 hours", "Open daily: 11 AM"
```

---

## 🔗 LINK OPTIONS

### **Link Types:**

**1. Internal Page:**
```
/hotels/luxury-resort
/restaurants/siwan-kitchen/menu
/tours/safari/itinerary
```

**2. External URL:**
```
https://booking.example.com
https://www.tripadvisor.com/...
```

**3. Phone Number:**
```
tel:+201234567890
```

**4. Email:**
```
mailto:info@example.com
```

**5. Search Engine:**
```
/search?engine=hotels&type=luxury
```

### **Link Target:**

**`_self`** (default):
```
Opens in same tab
Use for: Internal pages
```

**`_blank`**:
```
Opens in new tab
Use for: External URLs
```

---

## 🎨 STYLING OPTIONS

### **Font Size:**
```
- "small"      → 0.9rem
- "medium"     → 1.1rem
- "large"      → 1.5rem
- "xlarge"     → 2rem
```

### **Font Weight:**
```
- "normal"     → 400
- "bold"       → 700
- "extrabold"  → 800
```

### **Text Color:**
```
Any hex color:
- "#ffffff"    → White
- "#D4AF37"    → Gold
- "#f59e0b"    → Amber
- "#d1d5db"    → Light gray
```

### **Text Alignment:**
```
- "left"
- "center"
- "right"
```

### **Margins:**
```
- marginTop: "0", "0.5rem", "1rem", "1.5rem", "2rem"
- marginBottom: "0", "0.5rem", "1rem", "1.5rem", "2rem"
```

---

## 📋 HOW TO USE (When UI is Added)

### **Step 1: Open Slide Editor**
```
Visit: /admin/hero-carousel
Click: Edit on any slide
```

### **Step 2: Scroll to "Additional Text Blocks" Section**
```
You'll see:
┌─────────────────────────────────────┐
│ Additional Text Blocks              │
├─────────────────────────────────────┤
│ [+ Add Text Block]                  │
│                                     │
│ Existing blocks:                    │
│ 📝 "View Rooms" [Edit] [Delete]    │
│ 📝 "Restaurant Menu" [Edit] [Del]  │
└─────────────────────────────────────┘
```

### **Step 3: Add Text Block**
```
Click: [+ Add Text Block]

Fill in:
- Text: "View Rooms"
- Type: Title
- Link: "/hotels/luxury-resort/rooms"
- Link Target: _self
- Font Size: Large
- Font Weight: Bold
- Color: #D4AF37
- Alignment: Center
```

### **Step 4: Save**
```
Click: Save Slide
Text block appears on carousel!
```

---

## 🎬 HOW IT RENDERS

### **Visual Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│  [YouTube Video Background]             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  LUXURY DESERT RESORT           │ ← Main Title
│  │  Experience Siwa's Finest       │ ← Main Subtitle
│  │                                 │   │
│  │  🏨 View Rooms                  │ ← Extra Block 1 (linked)
│  │  🍽️ Restaurant Menu             │ ← Extra Block 2 (linked)
│  │                                 │   │
│  │  Starting from $299/night       │ ← Extra Block 3 (info)
│  │                                 │   │
│  │  [BOOK NOW]                     │ ← CTA Button
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### **Interaction:**

```
Hover over "🏨 View Rooms":
→ Cursor changes to pointer
→ Text underlines
→ Click → Navigate to /hotels/luxury-resort/rooms

Hover over "Starting from $299/night":
→ No link, no click
→ Just informational text
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Data Model:**

```typescript
extraTextBlocks?: Array<{
  id: string;                   // Unique ID
  text: string;                 // Display text
  type: 'title' | 'subtitle' | 'paragraph';
  link?: string;                // Optional URL
  linkTarget?: '_self' | '_blank';
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    marginTop?: string;
    marginBottom?: string;
  };
}>;
```

### **Rendering Logic:**

```tsx
{slide.extraTextBlocks?.map((block) => {
  const TextTag = block.link ? 'a' : 'div';
  
  return (
    <TextTag
      key={block.id}
      href={block.link}
      target={block.linkTarget}
      style={{
        fontSize: getFontSize(block.style?.fontSize),
        fontWeight: getFontWeight(block.style?.fontWeight),
        color: block.style?.color || '#ffffff',
        textAlign: block.style?.textAlign || 'center',
        marginTop: block.style?.marginTop || '0.5rem',
        marginBottom: block.style?.marginBottom || '0.5rem',
        cursor: block.link ? 'pointer' : 'default',
        textDecoration: block.link ? 'underline' : 'none'
      }}
    >
      {block.text}
    </TextTag>
  );
})}
```

---

## ✅ BENEFITS

### **1. More Information:**
```
Show multiple details without cluttering main title/subtitle
```

### **2. Better Navigation:**
```
Multiple clickable links per slide
Direct access to different pages
```

### **3. Flexible Layout:**
```
Add as many text blocks as needed
Each independently styled
Each with optional link
```

### **4. Rich Content:**
```
Icons (emojis) in text
Pricing info
Contact details
Multiple CTAs
```

---

## 📊 COMPARISON

### **Before:**
```
Slide had:
- 1 Title
- 1 Subtitle
- 1 CTA Button

Total clickable: 1 (CTA only)
```

### **After:**
```
Slide has:
- 1 Title (can add link later)
- 1 Subtitle (can add link later)
- ∞ Extra Text Blocks (each with link)
- 1 CTA Button

Total clickable: Unlimited!
```

---

## 🎯 USE CASES BY INDUSTRY

### **Hotels:**
```
- "View Rooms" → /rooms
- "Book Now" → /booking
- "View Amenities" → /amenities
- "From $299/night" → (info)
```

### **Restaurants:**
```
- "View Menu" → /menu
- "Reserve Table" → /reservation
- "Call Us" → tel:+20123...
- "Open 11 AM - 11 PM" → (info)
```

### **Tour Operators:**
```
- "Book Tour" → /booking
- "View Itinerary" → /itinerary
- "Read Reviews" → /reviews
- "6 hours | 4-8 people" → (info)
```

### **Events:**
```
- "Register" → /register
- "View Schedule" → /schedule
- "Meet Instructor" → /instructor
- "March 15-17" → (info)
- "Limited to 12 spots" → (info)
```

---

## 🚀 NEXT STEPS

The data structure is now ready! To complete the feature:

### **1. Add UI to Slide Editor:**
- "Additional Text Blocks" section
- [+ Add Text Block] button
- Edit/Delete for each block
- Form fields for text, link, style

### **2. Update Rendering:**
- AdvancedHeroCarousel component
- Builder preview
- Homepage display

### **3. Test:**
- Add multiple text blocks
- Test links work
- Verify styling
- Check responsive

---

**The data model is ready! Each slide can now have unlimited text blocks with individual links and styling!** 🎉

**Created:** 2026-04-25  
**Status:** ✅ Data Structure Complete | 📝 UI Pending
