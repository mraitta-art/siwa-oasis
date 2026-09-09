import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { CANONICAL_SECTION_IDS, resolveSectionId } from '@/lib/section-registry';

/**
 * GOLD STANDARD SEEDER
 * Materializes industry-standard fields for Parent Typologies.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. We no longer define sections here. 
    // They are exclusively governed by /api/jana/init-8-chapters

    // Keep accommodation subtypes in the same hierarchy used by the signup
    // and journey flows. Their fields are inherited from the parent type.
    await execute(
      `INSERT IGNORE INTO business_types
       (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order, active)
       VALUES
       ('accommodation', 'Accommodation', 'fas fa-bed', '#8b5cf6', TRUE, NULL, JSON_ARRAY(), 1, TRUE),
       ('apartment', 'Apartment', 'fas fa-building', '#3b82f6', FALSE, 'accommodation', JSON_ARRAY(), 1.5, TRUE),
       ('villa', 'Villa', 'fas fa-house', '#10b981', FALSE, 'accommodation', JSON_ARRAY(), 1.6, TRUE),
       ('hotel', 'Hotel', 'fas fa-hotel', '#0ea5e9', FALSE, 'accommodation', JSON_ARRAY(), 1.7, TRUE),
       ('eco_lodge', 'Eco Lodge', 'fas fa-leaf', '#16a34a', FALSE, 'accommodation', JSON_ARRAY(), 1.8, TRUE),
       ('guest_house', 'Guest House', 'fas fa-house-user', '#f59e0b', FALSE, 'accommodation', JSON_ARRAY(), 1.9, TRUE),
       ('camp', 'Desert Camp', 'fas fa-campground', '#b45309', FALSE, 'accommodation', JSON_ARRAY(), 2, TRUE),
       ('resort', 'Resort', 'fas fa-umbrella-beach', '#7c3aed', FALSE, 'accommodation', JSON_ARRAY(), 2.1, TRUE)`
    );

    // Every parent and child receives the same 10 section containers. Existing
    // custom section assignments are retained and merged with the registry.
    const accommodationTypes = ['accommodation', 'apartment', 'villa', 'hotel', 'eco_lodge', 'guest_house', 'camp', 'resort'];
    for (const typeId of accommodationTypes) {
      const type = await queryOne('SELECT sections FROM business_types WHERE id = ?', [typeId]) as any;
      if (!type) continue;
      let existingSections: string[] = [];
      try {
        existingSections = typeof type.sections === 'string' ? JSON.parse(type.sections || '[]') : (type.sections || []);
      } catch { existingSections = []; }
      const sections = [...new Set([...CANONICAL_SECTION_IDS, ...existingSections.map(resolveSectionId)])];
      await execute('UPDATE business_types SET sections = ? WHERE id = ?', [JSON.stringify(sections), typeId]);
    }
    
    const standards = [
      // PROPERTY LISTING MODE (shared by apartments, villas, and other accommodation)
      { type: 'accommodation', section: 'sec_7_investment', name: 'listing_purpose', label: 'Listing Purpose', field_type: 'select', options: ['sale', 'rent', 'long_term_rent', 'short_term_rent', 'holiday_rent'], required: true, searchable: true },
      { type: 'accommodation', section: 'sec_7_investment', name: 'rental_term', label: 'Rental Term', field_type: 'select', options: ['nightly', 'weekly', 'monthly', 'yearly'], searchable: true },
      { type: 'accommodation', section: 'sec_7_investment', name: 'price_amount', label: 'Price Amount', field_type: 'number', required: true, searchable: true },
      { type: 'accommodation', section: 'sec_7_investment', name: 'price_currency', label: 'Price Currency', field_type: 'select', options: ['EGP', 'USD', 'EUR'], searchable: false },

      // PROPERTY CHARACTERISTICS
      { type: 'accommodation', section: 'sec_3_facilities', name: 'property_area_sqm', label: 'Property Area (m²)', field_type: 'number', searchable: true },
      { type: 'accommodation', section: 'sec_3_facilities', name: 'bedroom_count', label: 'Bedrooms', field_type: 'number', searchable: true },
      { type: 'accommodation', section: 'sec_3_facilities', name: 'bathroom_count', label: 'Bathrooms', field_type: 'number', searchable: true },
      { type: 'accommodation', section: 'sec_3_facilities', name: 'furnishing', label: 'Furnishing', field_type: 'select', options: ['unfurnished', 'semi_furnished', 'fully_furnished'], searchable: true },

      // 🏨 ACCOMMODATION STANDARDS
      // BLOCK 1: GENERAL IDENTITY
      { type: 'accommodation', section: 'sec_1_identity', name: 'display_name', label: 'Official Business Name', field_type: 'text' },
      { type: 'accommodation', section: 'sec_1_identity', name: 'establishment_info', label: 'Establishment Date/Era', field_type: 'text' },
      
      // BLOCK 2: CONSTRUCTION & HERITAGE
      { type: 'accommodation', section: 'sec_2_ambience', name: 'construction_materials', label: 'Primary Construction Materials', field_type: 'checkbox_group', options: ['Kershef (Salt Brick)','Palm Wood','Mud/Clay','Stone','Modern Materials'] },
      { type: 'accommodation', section: 'sec_2_ambience', name: 'construction_era', label: 'Historical Era', field_type: 'select', options: ['Ancient','Traditional Siwan','Modern','Contemporary'] },
      { type: 'accommodation', section: 'sec_2_ambience', name: 'property_philosophy', label: 'Architectural Philosophy', field_type: 'textarea' },
      
      // BLOCK 3: EXPERIENCE & VIBE
      { type: 'accommodation', section: 'sec_3_services', name: 'experience_focus', label: 'Experience Focus (Multiselect)', field_type: 'checkbox_group', options: ['Honeymoon','Desert Adventure','Spiritual Retreat','Family Escape','Digital Nomad Friendly'] },
      { type: 'accommodation', section: 'sec_3_services', name: 'view_types', label: 'Surroundings & Views (Multiselect)', field_type: 'checkbox_group', options: ['Great Sand Sea Dunes','Salt Lake View','Palm Groves','Ancient Ruins','Temple Proximity'] },
      
      // BLOCK 4: FACILITIES
      { type: 'accommodation', section: 'sec_4_facilities', name: 'amenities', label: 'Property Amenities', field_type: 'checkbox', options: ['WiFi','Pool','Air Conditioning','Traditional Breakfast','Shuttle Service', 'Spa', 'Desert View'] },
      { type: 'accommodation', section: 'sec_4_facilities', name: 'total_rooms', label: 'Total Rooms', field_type: 'text' },
      
      // BLOCK 5: CONNECTIVITY & CONTACTS
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'whatsapp_number', label: 'WhatsApp for Business', field_type: 'text' },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'official_website', label: 'Primary Website URL', field_type: 'text' },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'social_presence', label: 'Social Media Channels', field_type: 'checkbox_group', options: ['Instagram','Facebook','TikTok','TripAdvisor','YouTube'] },
      
      // BLOCK 6: GEOGRAPHIC INTELLIGENCE
      { type: 'accommodation', section: 'sec_6_geographic', name: 'map_coordinates', label: 'GPS Coordinates (Lat, Lng)', field_type: 'map' },
      { type: 'accommodation', section: 'sec_6_geographic', name: 'proximity_landmarks', label: 'Nearby Historical Landmarks', field_type: 'checkbox_group', options: ['Shali Fortress','Temple of the Oracle','Cleopatra Spring','Mountain of the Dead','Fatnas Island'] },
      { type: 'accommodation', section: 'sec_6_geographic', name: 'access_instructions', label: 'Driving/Access Instructions', field_type: 'textarea' },

      // BLOCK 7: INVESTMENT & GROWTH
      { type: 'accommodation', section: 'sec_7_investment', name: 'investment_models', label: 'Investment & Partnership Models', field_type: 'checkbox_group', options: ['Time-Share','Long-Term Lease','Seasonal Ownership','Expansion Partnership','Direct Investment'] },
      { type: 'accommodation', section: 'sec_7_investment', name: 'group_capability', label: 'Group & Tour Capabilities', field_type: 'checkbox_group', options: ['Corporate Retreats','Private Tours','Workshop Hosting','Large Group Catering'] },
      { type: 'accommodation', section: 'sec_7_investment', name: 'expansion_roadmap', label: 'Expansion Roadmap (Narrative)', field_type: 'textarea' },

      // BLOCK 8: RATES & OFFERS
      { type: 'accommodation', section: 'sec_8_rates_offers', name: 'price_standard', label: 'Standard Room Rate', field_type: 'text' },
      { type: 'accommodation', section: 'sec_8_rates_offers', name: 'active_discounts', label: 'Active Discounts & Deals', field_type: 'checkbox_group', options: ['Early Bird (15%)', 'Long Stay (20%)', 'Last Minute', 'Siwan Resident Discount'] },
      { type: 'accommodation', section: 'sec_8_rates_offers', name: 'special_conditions', label: 'Booking Conditions', field_type: 'textarea' },

      // GENERAL ACCOMMODATION FIELDS: inherited by every accommodation child
      { type: 'accommodation', section: 'sec_1_identity', name: 'business_description', label: 'Business Description', field_type: 'textarea', required: true },
      { type: 'accommodation', section: 'sec_1_identity', name: 'short_summary', label: 'Short Summary', field_type: 'textarea' },
      { type: 'accommodation', section: 'sec_1_identity', name: 'business_logo', label: 'Business Logo', field_type: 'image' },
      { type: 'accommodation', section: 'sec_1_identity', name: 'accommodation_type', label: 'Accommodation Type', field_type: 'select', options: ['Hotel', 'Eco Lodge', 'Guest House', 'Camp', 'Resort', 'Apartment', 'Villa'], required: true, searchable: true },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'contact_phone', label: 'Contact Phone', field_type: 'text', required: true },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'contact_email', label: 'Contact Email', field_type: 'email' },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'check_in_time', label: 'Check-in Time', field_type: 'text' },
      { type: 'accommodation', section: 'sec_5_connectivity', name: 'check_out_time', label: 'Check-out Time', field_type: 'text' },
      { type: 'accommodation', section: 'sec_6_geographic', name: 'address', label: 'Physical Address', field_type: 'textarea', required: true, searchable: true },
      { type: 'accommodation', section: 'sec_6_geographic', name: 'city_or_oasis', label: 'City or Oasis', field_type: 'text', searchable: true },
      { type: 'accommodation', section: 'sec_4_facilities', name: 'guest_capacity', label: 'Maximum Guest Capacity', field_type: 'number', searchable: true },
      { type: 'accommodation', section: 'sec_4_facilities', name: 'languages', label: 'Languages Spoken', field_type: 'multiselect', options: ['Arabic', 'English', 'French', 'German', 'Italian'], searchable: true },
      { type: 'accommodation', section: 'sec_4_facilities', name: 'payment_methods', label: 'Payment Methods', field_type: 'checkbox_group', options: ['Cash', 'Bank Transfer', 'Visa', 'Mastercard', 'Online Payment'] },
      { type: 'accommodation', section: 'sec_3_services', name: 'included_services', label: 'Included Services', field_type: 'checkbox_group', options: ['Breakfast', 'Airport Transfer', 'Housekeeping', 'Room Service', 'Laundry', 'Tour Booking'] },
      { type: 'accommodation', section: 'sec_7_investment', name: 'booking_url', label: 'Booking URL', field_type: 'url' },
      { type: 'accommodation', section: 'sec_7_investment', name: 'cancellation_policy', label: 'Cancellation Policy', field_type: 'rich_text' },

      // CHILD-SPECIFIC FIELDS: only the named child receives these fields
      { type: 'eco_lodge', section: 'sec_2_ambience', name: 'sustainability_practices', label: 'Sustainability Practices', field_type: 'checkbox_group', options: ['Solar Energy', 'Water Recycling', 'Organic Garden', 'Plastic Reduction', 'Natural Materials'] },
      { type: 'eco_lodge', section: 'sec_2_ambience', name: 'environmental_certification', label: 'Environmental Certification', field_type: 'text' },
      { type: 'eco_lodge', section: 'sec_3_services', name: 'nature_activities', label: 'Nature Activities', field_type: 'checkbox_group', options: ['Bird Watching', 'Desert Walks', 'Salt Lake Floating', 'Stargazing', 'Palm Grove Tour'] },
      { type: 'hotel', section: 'sec_1_identity', name: 'star_rating', label: 'Star Rating', field_type: 'select', options: ['1', '2', '3', '4', '5'], searchable: true },
      { type: 'hotel', section: 'sec_4_facilities', name: 'reception_services', label: 'Reception Services', field_type: 'checkbox_group', options: ['24 Hour Reception', 'Concierge', 'Luggage Storage', 'Wake-up Service'] },
      { type: 'hotel', section: 'sec_3_services', name: 'hotel_facilities', label: 'Hotel Facilities', field_type: 'checkbox_group', options: ['Conference Room', 'Restaurant', 'Spa', 'Gym', 'Business Center'] },
      { type: 'guest_house', section: 'sec_3_services', name: 'host_services', label: 'Host Services', field_type: 'checkbox_group', options: ['Local Recommendations', 'Home Cooking', 'Airport Pickup', 'Guided Walks'] },
      { type: 'camp', section: 'sec_4_facilities', name: 'tent_types', label: 'Tent Types', field_type: 'checkbox_group', options: ['Private Tent', 'Family Tent', 'Luxury Tent', 'Shared Tent'] },
      { type: 'camp', section: 'sec_3_services', name: 'camp_activities', label: 'Camp Activities', field_type: 'checkbox_group', options: ['4x4 Safari', 'Sandboarding', 'Campfire', 'Camel Ride', 'Stargazing'] },
      { type: 'resort', section: 'sec_4_facilities', name: 'resort_facilities', label: 'Resort Facilities', field_type: 'checkbox_group', options: ['Swimming Pool', 'Spa', 'Kids Club', 'Beach Access', 'Multiple Restaurants'] },
      { type: 'resort', section: 'sec_3_services', name: 'resort_programs', label: 'Resort Programs', field_type: 'checkbox_group', options: ['Wellness Retreat', 'Family Program', 'Wedding Venue', 'Corporate Retreat'] },
      { type: 'apartment', section: 'sec_4_facilities', name: 'apartment_features', label: 'Apartment Features', field_type: 'checkbox_group', options: ['Kitchen', 'Living Room', 'Private Entrance', 'Washing Machine', 'Workspace'] },
      { type: 'villa', section: 'sec_4_facilities', name: 'villa_features', label: 'Villa Features', field_type: 'checkbox_group', options: ['Private Pool', 'Private Garden', 'Kitchen', 'Outdoor Dining', 'Staff Accommodation'] },

      // 🍽️ FOOD & BEVERAGE STANDARDS (Mapping to the same 8 Blocks)
      { type: 'food', section: 'sec_1_identity', name: 'restaurant_logo', label: 'Restaurant Branding/Logo', field_type: 'gallery' },
      { type: 'food', section: 'sec_3_services', name: 'cuisine_style', label: 'Cuisine Style', field_type: 'checkbox_group', options: ['Traditional Siwan','Egyptian','Mediterranean','International'] },
      { type: 'food', section: 'sec_4_facilities', name: 'seating_type', label: 'Seating Style', field_type: 'checkbox_group', options: ['Floor Seating (Traditional)','Table Seating','Outdoor Terrace','Sunset View Table'] },
      { type: 'food', section: 'sec_8_rates_offers', name: 'avg_meal_price', label: 'Average Meal Price', field_type: 'text' },

      // 🐪 ADVENTURE & SAFARI STANDARDS (Mapping to the same 8 Blocks)
      { type: 'adventure', section: 'sec_3_services', name: 'activity_difficulty', label: 'Difficulty Level', field_type: 'select', options: ['Easy','Moderate','Challenging','Extreme'] },
      { type: 'adventure', section: 'sec_4_facilities', name: 'gear_provided', label: 'Equipment & Gear Included', field_type: 'checkbox_group', options: ['4x4 Vehicle','Camping Gear','Sandboards','Helmets','Water/Snacks'] },
      { type: 'adventure', section: 'sec_8_rates_offers', name: 'group_discounts', label: 'Group & Seasonal Rates', field_type: 'textarea' },

      // 🏺 TRADE & CRAFTS STANDARDS (Shops)
      { type: 'crafts', section: 'sec_3_services', name: 'product_categories', label: 'Product Categories', field_type: 'checkbox_group', options: ['Dates & Olives','Siwan Embroidery','Salt Lamps','Traditional Jewelry','Handmade Pottery'] },
      { type: 'crafts', section: 'sec_4_facilities', name: 'store_services', label: 'Store Capabilities', field_type: 'checkbox_group', options: ['International Shipping','Custom Orders','Wholesale Available','Gift Wrapping'] },
      { type: 'crafts', section: 'sec_8_rates_offers', name: 'shipping_info', label: 'Shipping & Bulk Rates', field_type: 'textarea' },

      // 🛺 LOGISTICS & TRANSPORT STANDARDS
      { type: 'logistics', section: 'sec_3_services', name: 'vehicle_types', label: 'Fleet & Vehicle Types', field_type: 'checkbox_group', options: ['4x4 Desert Jeep','Local Tuk-Tuk','Private Mini-Bus','Bicycle/Scooter Rental'] },
      { type: 'logistics', section: 'sec_4_facilities', name: 'coverage_area', label: 'Service Coverage', field_type: 'checkbox_group', options: ['Within Siwa Oasis','Airport Transfers (Cairo/Alex)','Desert Rescue/Retrieval','Cross-Country Trips'] },
      
      // BLOCK 7: INVESTMENT & GROWTH
      { type: 'accommodation', section: 'sec_7_investment', name: 'admin_verification_status', label: 'ADMIN: Verification Status', field_type: 'select', options: ['Pending','Verified','Rejected','Suspended'] },
      { type: 'accommodation', section: 'sec_7_investment', name: 'quality_audit_score', label: 'ADMIN: Quality Audit (1-10)', field_type: 'text' }
    ];

    const results = [];

    for (const s of standards) {
      try {
        const sectionId = resolveSectionId(s.section);
        const existing = await queryOne('SELECT id FROM form_fields WHERE business_type_id = ? AND name = ? ORDER BY id LIMIT 1', [s.type, s.name]) as any;
        if (existing) {
          await execute(
            'UPDATE form_fields SET section_id = ?, label = ?, field_type = ?, options = ?, required = ?, searchable = ? WHERE id = ?',
            [sectionId, s.label, s.field_type, JSON.stringify(s.options || []), s.required ? 1 : 0, s.searchable ? 1 : 0, existing.id]
          );
          results.push({ field: s.name, status: 'Updated to Standard' });
        } else {
          await execute(
            'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, options, required, searchable, section_origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [`standard_${s.type}_${s.name}`, s.type, sectionId, s.name, s.label, s.field_type, JSON.stringify(s.options || []), s.required ? 1 : 0, s.searchable ? 1 : 0, 'own']
          );
          results.push({ field: s.name, status: 'Materialized' });
        }
      } catch (e) {
        results.push({ field: s.name, status: 'Skipped', error: e instanceof Error ? e.message : String(e) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Industry Standards Materialized Successfully',
      details: results
    });

  } catch (error) {
    console.error('Seeder Error:', error);
    return NextResponse.json({ error: 'Failed to seed standards' }, { status: 500 });
  }
}

