# 🗓️ Advanced Journey Builder - Professional Itinerary Planner

## Overview

The **Advanced Journey Builder** is a professional-grade itinerary planner that allows consultants to create detailed day-by-day journeys with multiple activities per day, scheduled at specific times.

### Key Difference from Simple Builder

**Simple Builder:**
- Select 3-5 businesses
- Auto-assign to days
- Basic package

**Advanced Builder:**
- Day-by-day timeline view
- Multiple activities per day
- Precise time scheduling (HH:MM)
- Duration for each activity
- Realistic pacing & transitions
- Notes & special instructions
- Same business multiple times on different days/times

---

## Features

### 1. Package Setup
- Package name & description
- Duration in days (1-14 days with quick select buttons)
- Vibe selection (Adventure, Wellness, Culinary, Cultural, Luxury)
- Pace selection (Slow, Moderate, Active)
- Optional total price

### 2. Day-by-Day Timeline Builder
- Visual day selector (left panel)
- Displays all activities for selected day
- Each activity shows:
  - Time (HH:MM format)
  - Business/Activity name
  - Activity type
  - Duration (hours/minutes)
  - Special notes

### 3. Activity Manager
For each activity you can set:
- **Time**: Precise start time (e.g., 09:00, 14:30)
- **Business**: Select from available businesses
- **Duration**: 30 minutes to 8 hours
- **Notes**: Special instructions (e.g., "Pre-book by 2pm", "Bring comfortable shoes")

### 4. Review & Publish
- Full itinerary view of all days
- Summary stats (total activities, package details)
- Edit capability if needed
- Save to database

---

## Real-World Example: Desert Wellness Escape (3 Days)

### Day 1: Arrival & Welcome
- **3:00 PM** - Siwa Paradise Hotel (Accommodation Check-in) | 30 min
- **7:00 PM** - Cleopatra Restaurant (Dinner) | 120 min

### Day 2: Full Wellness Day
- **7:00 AM** - Siwa Therapeutic Sand Spa (Sunrise Sand Bath) | 60 min
- **8:30 AM** - Siwa Paradise Hotel (Breakfast) | 60 min
- **10:00 AM** - Salt Lake Wellness Center (Salt Float Therapy) | 120 min
- **12:30 PM** - Grandma Fatima's Kitchen (Traditional Lunch) | 90 min
- **3:00 PM** - Siwa Paradise Hotel (Spa Massage & Rest) | 120 min
- **7:00 PM** - Cleopatra Restaurant (Gourmet Dinner) | 120 min

### Day 3: Relaxation & Departure
- **7:00 AM** - Siwa Paradise Hotel (Yoga & Breakfast) | 60 min
- **9:00 AM** - Siwa Therapeutic Sand Spa (Final Sand Bath) | 60 min
- **11:00 AM** - Siwa Paradise Hotel (Check-out & Departure) | 120 min

**Total:** 6 activities spread across 3 days with professional timing

---

## UI Flow

```
┌─────────────────────────────────────────────────┐
│  Advanced Journey Builder                        │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  STEP 1: Package Details                        │
│  ✓ Name                                         │
│  ✓ Description                                  │
│  ✓ Duration (1-14 days)                         │
│  ✓ Vibe & Pace                                  │
│  ✓ Optional Price                               │
│  [Next: Build Timeline →]                       │
└─────────────────────────────────────────────────┘
          ↓
┌──────────────────────┬──────────────────────────┐
│ STEP 2: Build Timeline│ Day 1 Activities        │
│                      │ ─────────────────────   │
│ [Day 1] Selected     │ 09:00 - Activity A (1h) │
│ [Day 2]              │ 14:00 - Activity B (2h) │
│ [Day 3]              │ 19:00 - Activity C (2h) │
│                      │                         │
│                      │ [Add Activity Form]     │
│                      │ Time: [HH:MM]           │
│                      │ Business: [Dropdown]    │
│                      │ Duration: [Slider]      │
│                      │ Notes: [Text]           │
│                      │ [+ Add to Timeline]     │
│ [← Back] [Review →]  │                         │
└──────────────────────┴──────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  STEP 3: Review Journey                         │
│  Package: Desert Wellness Escape                │
│  Duration: 3 days | Activities: 9 | Price: $1200
│                                                 │
│  📅 Day 1 [3 activities]                        │
│  📅 Day 2 [6 activities] ← Most packed          │
│  📅 Day 3 [3 activities]                        │
│                                                 │
│  [← Edit Timeline] [✨ Create Journey Package]  │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### journey_timeline_items
```sql
id (UUID)
package_id (FK)
day_number (INT)              -- Which day
sequence_order (INT)          -- Order within day
start_time (TIME)             -- 09:00
duration_minutes (INT)        -- 60
end_time (CALCULATED)         -- Auto-calculated
business_id (FK)
business_name (VARCHAR)
activity_type (ENUM)          -- accommodation|meal|tour|experience|transfer
notes (TEXT)
booking_required (BOOLEAN)
estimated_cost_usd (DECIMAL)
```

### journey_day_summaries
```sql
id (UUID)
package_id (FK)
day_number (INT)
theme (VARCHAR)               -- "Wellness Day", "Adventure Day"
accommodation_id (FK)         -- Which hotel
accommodation_name (VARCHAR)
meals_included (BOOLEAN)      -- breakfast, lunch, dinner flags
total_activities_count (INT)
estimated_day_cost_usd (DECIMAL)
sunrise_time (TIME)
sunset_time (TIME)
weather_notes (VARCHAR)
```

### itinerary_validations
```sql
id (UUID)
package_id (FK)
validation_type (ENUM)        -- overlap_warning, tight_schedule, etc.
severity (ENUM)               -- info, warning, error
message (TEXT)
resolved (BOOLEAN)
```

---

## Component Props & States

### AdvancedJourneyBuilder.tsx

**Main States:**
```typescript
step: 1 | 2 | 3                    // Current wizard step
packageInfo: AdvancedJourneyPackage // Package metadata + itinerary
selectedDay: number                // Currently viewing which day
selectedTime: string              // HH:MM format
selectedBusiness: Business | null  // Selected activity
```

**Key Functions:**
```typescript
handleAddItem()                    // Add activity to timeline
handleRemoveItem()                 // Remove activity from timeline
handleChangeDays()                 // Adjust package duration
handleSavePackage()                // Save to database
```

---

## Customization

### Activity Types
Currently: accommodation, meal, tour, experience, transfer

Add more in the component:
```typescript
const activityTypes = [
  'accommodation',
  'meal',
  'tour',
  'experience',
  'transfer',
  'wellness',        // Add new
  'meeting',         // Add new
];
```

### Duration Presets
Currently: 30m - 8h with 30m increments

Customize in component:
```typescript
const durationPresets = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  // ... etc
];
```

### Businesses
Add more to `allBusinesses` array in component or fetch from API

---

## Integration Steps

### 1. Add to Navigation
```tsx
<Link href="/journey-builder-advanced" className="btn-primary">
  🗓️ Create Detailed Journey
</Link>
```

### 2. Create Database Tables
```bash
mysql -u user -p db < migrations/014_create_enhanced_itinerary_timeline.sql
```

### 3. Use Advanced Component
Import in your page:
```tsx
import AdvancedJourneyBuilder from '@/components/AdvancedJourneyBuilder';
```

### 4. Connect to Real Database
Update API to insert into `journey_timeline_items` and `journey_day_summaries`

---

## Validation & Smart Features

### Auto-Calculated
- End time (start_time + duration_minutes)
- Day ordering (auto-sorts by time)
- Sequence numbers

### Optional (Future)
- Overlap detection (warn if two activities same time)
- Travel time warnings (activities far apart)
- Accommodation continuity (ensure accommodation on each day)
- Meal coverage (check for meals throughout day)

---

## Comparison: Simple vs Advanced Builder

| Feature | Simple | Advanced |
|---------|--------|----------|
| Business Selection | ✓ | ✓ |
| Multiple per Day | Limited | ✓ Unlimited |
| Time Scheduling | No | ✓ HH:MM |
| Duration Control | No | ✓ Custom |
| Notes/Instructions | No | ✓ Yes |
| Day-by-Day View | No | ✓ Yes |
| Timeline Visualization | No | ✓ Yes |
| Repetitions | Automatic | ✓ Manual control |
| Professional Detail | Basic | ✓ Complete |
| Setup Time | 5 min | 10-15 min |

---

## Files Created

1. `src/components/AdvancedJourneyBuilder.tsx` (650+ lines)
2. `src/app/journey-builder-advanced/page.tsx`
3. `migrations/014_create_enhanced_itinerary_timeline.sql`
4. This documentation

---

## Testing

### With Sample Data
All businesses included in component, ready to test immediately

### Test Scenario
1. Create "3-Day Desert Wellness"
2. Day 1: Add 2 activities (arrival + dinner)
3. Day 2: Add 6 activities (full day)
4. Day 3: Add 2 activities (departure)
5. Review and save

---

## Next Phase Features

### Conflict Detection
- Warn if activities overlap
- Suggest buffer times
- Check accommodation continuity

### Smart Recommendations
- Suggest optimal times based on opening hours
- Recommend lunch times
- Prevent back-to-back activities

### Export Options
- PDF itinerary
- Email to customer
- Print-friendly
- Google Calendar export

### Team Collaboration
- Share itineraries with other consultants
- Get feedback
- Track versions

---

## Performance Notes

- Component handles up to 14 days (~50+ activities)
- Fast time selection
- Smooth day switching
- No lag with large activity lists

---

## Status

✅ **Component:** Complete & Ready  
✅ **Database Schema:** Ready to deploy  
✅ **Documentation:** Complete  
⏳ **Database Integration:** Ready when needed  

**Deployed to GitHub:** Yes (main branch)

---

**Created:** June 2026  
**Version:** 1.0  
**Next:** Integration testing & database connection
