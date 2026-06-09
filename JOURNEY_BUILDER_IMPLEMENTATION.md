# 🗺️ Journey Package Builder - Implementation Guide

## Overview

The **Journey Package Builder** allows consultants and users to create custom tour packages by combining specific child businesses (hotels, restaurants, tours, etc.) from your existing database.

## What's Been Built

### 1. **Database Schema** (`migrations/013_create_custom_journey_packages.sql`)
- `custom_journey_packages` - stores packaged journeys
- `custom_journey_items` - links businesses to packages
- `custom_journey_bookings` - tracks visitor inquiries/bookings

### 2. **React Components**

#### `JourneyPackageBuilder.tsx` (4-step wizard)
- Step 1: Select Parent Categories (Accommodation, Food, Adventure, Wellness, Crafts, Logistics)
- Step 2: Select Child Types (e.g., "Hotel", "Restaurant", "4x4 Safari")
- Step 3: Select Specific Businesses (e.g., "Siwa Paradise Hotel", "Cleopatra Restaurant")
- Step 4: Review, Name, and Save Package

**Features:**
- Visual step indicator
- Category selection with icons
- Business picker with descriptions
- Package details form (name, description, duration, vibe, pace, price)
- Dark olive theme matching your site

#### `CustomJourneyCarousel.tsx` (Homepage display)
- Beautiful carousel showing featured custom packages
- Consultant names and descriptions
- Package details (duration, price, number of services)
- Click to create your own package link
- Responsive design with thumbnail navigation

### 3. **API Endpoints**

#### `/api/business-types`
```typescript
GET ?is_parent=true              // Get parent categories
GET ?parent_ids=accommodation,food  // Get child types for parents
```

#### `/api/businesses`
```typescript
GET ?type_id=hotel              // Get businesses of a specific type
```

#### `/api/custom-journey-packages`
```typescript
POST { name, description, items, ... }  // Save new package
GET ?is_featured=true               // Get featured packages
```

### 4. **Routes**

- `/journey-builder` - Full page for creating packages

## How to Integrate

### Step 1: Add Database Tables
```bash
# Run in your database (phpMyAdmin/cPanel)
mysql -u your_user -p your_database < migrations/013_create_custom_journey_packages.sql
```

### Step 2: Add Homepage Carousel
Edit your homepage (`src/app/page.tsx`):

```tsx
import CustomJourneyCarousel from '@/components/CustomJourneyCarousel';

export default function HomePage() {
  return (
    <div>
      {/* ... existing sections ... */}
      
      {/* Add the custom journey carousel */}
      <CustomJourneyCarousel />
      
      {/* ... rest of page ... */}
    </div>
  );
}
```

### Step 3: Add Link to Journey Builder
Add to your navigation header:

```tsx
<Link 
  href="/journey-builder" 
  className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#556B2F] rounded font-bold"
>
  <Zap size={18} />
  Build Journey
</Link>
```

### Step 4: Connect to Real Database
Currently, the API endpoints use sample data. To connect to your actual database:

**Option A: Use Existing Database Connection**
If you have a database utility, update the API routes:

```typescript
// src/app/api/custom-journey-packages/route.ts
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Insert into custom_journey_packages
  const packageId = await db.query(
    'INSERT INTO custom_journey_packages (name, description, ...) VALUES (?, ?, ...)',
    [body.name, body.description, ...]
  );
  
  // Insert items into custom_journey_items
  for (const item of body.items) {
    await db.query(
      'INSERT INTO custom_journey_items (package_id, business_id, ...) VALUES (?, ?, ...)',
      [packageId, item.business_id, ...]
    );
  }
  
  return NextResponse.json({ success: true, id: packageId });
}
```

**Option B: Keep Sample Data (For Testing)**
The current implementation works with sample data, great for demos!

## User Flow

### For Visitors/Consultants Creating Packages:

1. **Homepage** → Click "Build Journey" button
2. **Journey Builder Page** opens
3. **Step 1**: Select categories (e.g., Accommodation + Food + Adventure)
4. **Step 2**: Select specific types (e.g., "Hotel" + "Restaurant" + "4x4 Safari")
5. **Step 3**: Select actual businesses from each type
6. **Step 4**: Name package, set details, review businesses
7. **Save**: Package created and becomes public/featured

### For Website Visitors:

1. **Homepage** → See featured custom packages in carousel
2. **Click "Learn More"** → View full package details
3. **Click "Create Your Own"** → Redirected to journey builder

## Customization Options

### Colors (Edit Components)
```tsx
// Primary olive color
bg-[#556B2F]
// Accent golden
text-[#FFB700]
// Hover state
hover:bg-[#FFD700]
```

### Vibe Categories (Add More)
Edit both `JourneyPackageBuilder.tsx` and `CustomJourneyCarousel.tsx`:
```tsx
const vibeOptions = [
  'adventure',
  'wellness',
  'culinary',
  'cultural',
  'luxury',  // Add new
  'budget',  // Add new
];
```

### Service Categories (Add More)
Edit `/api/business-types` endpoint:
```typescript
{
  id: 'entertainment',
  name: 'Entertainment & Nightlife',
  icon: '🎭',
  is_parent: true,
  children: [
    { id: 'night_club', name: 'Night Club', icon: '🍾' },
    { id: 'theater', name: 'Cultural Theater', icon: '🎪' },
  ],
}
```

## Database Schema Details

### custom_journey_packages
```sql
id (UUID)
name (VARCHAR 255)
description (TEXT)
consultant_id (VARCHAR 36) - who created it
consultant_name (VARCHAR 255)
duration_days (INT)
vibe (VARCHAR 100) - adventure|wellness|culinary|cultural
pace (VARCHAR 50) - slow|moderate|active
price_usd (DECIMAL)
is_public (BOOLEAN) - visible to all
is_featured (BOOLEAN) - displayed on homepage
view_count (INT)
booking_count (INT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### custom_journey_items
```sql
id (INT AUTO INCREMENT)
package_id (VARCHAR 36) -> custom_journey_packages.id
business_id (VARCHAR 36) -> businesses.id
parent_type_id (VARCHAR 100) - accommodation|food|adventure...
parent_type_name (VARCHAR 255) - "Accommodation"|"Food & Beverage"
child_type_id (VARCHAR 100) - hotel|siwa_lodge|restaurant...
child_type_name (VARCHAR 255) - "Full-Service Hotel"|"Restaurant"
business_name (VARCHAR 255)
description (TEXT)
image_url (VARCHAR 500)
price_usd (DECIMAL)
sequence_order (INT)
day_number (INT)
created_at (TIMESTAMP)
```

### custom_journey_bookings
```sql
id (UUID)
package_id (VARCHAR 36) -> custom_journey_packages.id
visitor_name (VARCHAR 255)
visitor_email (VARCHAR 255)
visitor_phone (VARCHAR 50)
group_size (INT)
arrival_date (DATE)
departure_date (DATE)
total_price_usd (DECIMAL)
special_requests (TEXT)
status (ENUM: inquiry|booked|completed|cancelled)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## Admin Features (Future)

Once integrated with database, add admin panel to:
- [ ] Approve/reject custom packages before making public
- [ ] Feature packages on homepage
- [ ] Track booking inquiries
- [ ] View package analytics (views, bookings)
- [ ] Manage consultant accounts
- [ ] Set pricing guidelines

## Example Package Flow

**Consultant Creates: "Desert Wellness Escape"**

1. Selects: Accommodation + Food & Beverage + Wellness
2. Selects child types: 
   - Accommodation → Eco-Lodge
   - Food → Siwan Kitchen
   - Wellness → Sand Bath
3. Selects businesses:
   - Siwa Eco-Sanctuary
   - Grandma Fatima's Traditional Kitchen
   - Siwa Therapeutic Sand Spa
4. Names package: "Desert Wellness Escape"
5. Sets: 4 days, Wellness vibe, Slow pace, $1,200

**Result:** Package appears in carousel on homepage with link to "Create Your Own Package"

## Testing

### Sample Data Available
The API endpoints include sample data for:
- Business types (all 6 parent + children)
- Sample businesses for each type
- Ready to test immediately

### Test Flow
1. Visit `/journey-builder`
2. Select any parent categories
3. Select any child types
4. Select any businesses
5. Name and save package
6. (If DB connected) Package appears in carousel

## Next Steps

1. ✅ Run database migration
2. ✅ Add components to your app
3. ✅ Add carousel to homepage
4. ✅ Connect to real database
5. ✅ Customize colors/text
6. ✅ Add admin approval workflow
7. ✅ Deploy!

## Support & Troubleshooting

**Issue: Components not found**
- Ensure components are in `src/components/`
- Check import paths

**Issue: API endpoints returning 404**
- Ensure route files are in `src/app/api/`
- Check folder structure

**Issue: Database errors**
- Run migration first
- Check database credentials
- Verify SQL syntax

**Issue: Styling not working**
- Confirm Tailwind CSS is configured
- Check color codes ([#556B2F], [#FFB700])
- Verify dark mode settings

---

**Created:** June 2026  
**Status:** ✅ Ready for Integration  
**Next Review:** After deployment
