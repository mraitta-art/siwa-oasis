## Plan: Parent-Aware Package And Offer Architecture

We’ll create one shared package, offer, itinerary, discount, approval, and permission system. Each parent typology will provide its own sections and components through a registry.

**Steps**

1. Define one canonical product model using `tour_products`.
2. Add parent/child component capability templates.
3. Support itinerary items for:
   - Activities
   - Destinations
   - Dining
   - Accommodation
   - Transfers
   - Shopping and visits
4. Support multiple items per day with:
   - Start/end time
   - Duration
   - Location and coordinates
   - Sequence
   - Optional/required state
   - Pricing
   - Capacity
   - Meal details
   - Accommodation nights
5. Unify offers and discounts with:
   - Percentage and fixed discounts
   - Tiered and group discounts
   - Seasonal pricing
   - Coupon codes
   - Minimum spend
   - Minimum group size
   - Date windows
   - Usage limits
   - Automatic and stackable rules
6. Add shared permissions:
   - Admin can define capabilities.
   - Vendors can create drafts only when allowed.
   - Admin controls approval and publication.
   - Parent and child typologies can have different limits.
7. Secure and converge the APIs.
8. Reuse the current Tour Builder timeline for admin and vendor editing.
9. Replace mock admin package, offer, and discount pages with real API-backed workflows.
10. Update the public website, minisites, discovery pages, and journey requests to use approved canonical products.
11. Migrate existing package, offer, discount, and section data without deleting legacy records.
12. Test Travel Agency, Accommodation, Food & Beverage, Wellness, and Crafts templates.

**Key files**

- [Tour Builder API](siwatoday/siwa-oasis/src/app/api/jana/tour-builder/route.ts)
- [Tour Builder UI](siwatoday/siwa-oasis/src/app/jana/tour-builder/page.tsx)
- [Advanced Journey Builder](siwatoday/siwa-oasis/src/components/AdvancedJourneyBuilder.tsx)
- [Section registry](siwatoday/siwa-oasis/src/lib/section-registry.ts)
- [Blueprint core](siwatoday/siwa-oasis/src/lib/governance/blueprint-core.ts)
- [Auth and roles](siwatoday/siwa-oasis/src/lib/auth.ts)
- [Admin package page](siwatoday/siwa-oasis/src/app/admin/packages/page.tsx)
- [Vendor package page](siwatoday/siwa-oasis/src/app/vendor/packages/page.tsx)
- [Public offers API](siwatoday/siwa-oasis/src/app/api/discovery/offers/route.ts)

**Decisions**

- One shared engine for every parent typology.
- Parent-specific sections and components come from configuration, not separate systems.
- Vendors create drafts; admins approve and publish.
- Existing data remains preserved during migration.
- `journey_offers` remains separate for customer-request responses.

The plan is saved in `/memories/session/plan.md`. No implementation changes were made for this larger architecture yet.
