import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * GOLD STANDARD SEEDER
 * Materializes industry-standard fields for Parent Typologies.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Ensure Sections exist
    const sectionDefinitions = [
      { id: 'facilities', name: 'Amenities & Features', icon: 'fa-swimming-pool' },
      { id: 'star_rating', name: 'Industry Rating', icon: 'fa-star' },
      { id: 'room_types', name: 'Room & Stay Options', icon: 'fa-bed' },
      { id: 'business_metrics', name: 'Business Metrics', icon: 'fa-chart-line', vendor_editable: true, show_on_public: false },
      { id: 'verification', name: 'Admin Verification', icon: 'fa-shield-alt', vendor_editable: false, show_on_public: false }
    ];

    for (const s of sectionDefinitions) {
      await execute(
        'INSERT IGNORE INTO sections (id, name, icon, vendor_editable, show_on_public) VALUES (?, ?, ?, ?, ?)',
        [s.id, s.name, s.icon, s.vendor_editable ?? true, s.show_on_public ?? true]
      );
    }

    // 2. Update Parent Typology Section Mappings
    await execute(
      'UPDATE business_types SET sections = ? WHERE id = ?',
      [JSON.stringify(["basic", "location", "contact", "facilities", "star_rating", "room_types", "business_metrics", "verification"]), 'accommodation']
    );

    const standards = [
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
      { type: 'logistics', section: 'sec_8_rates_offers', name: 'transport_rates', label: 'Standard Trip Tariffs', field_type: 'textarea' },

      // 📊 BUSINESS METRICS (Internal)
      { type: 'accommodation', section: 'business_metrics', name: 'avg_revenue', label: 'Avg Monthly Revenue', field_type: 'text' },
      { type: 'accommodation', section: 'business_metrics', name: 'occupancy_rate', label: 'Occupancy Rate %', field_type: 'text' },
      { type: 'accommodation', section: 'business_metrics', name: 'employee_count', label: 'Total Employee Count', field_type: 'text' },
      
      // 🛡️ ADMIN VERIFICATION (Admin Only)
      { type: 'accommodation', section: 'verification', name: 'verification_status', label: 'Verification Status', field_type: 'select', options: ['Pending','Verified','Rejected','Suspended'] },
      { type: 'accommodation', section: 'verification', name: 'quality_rating', label: 'Quality Audit Rating (1-10)', field_type: 'text' },
      { type: 'accommodation', section: 'verification', name: 'priority_listing', label: 'Priority Search Listing', field_type: 'boolean' },
      { type: 'accommodation', section: 'verification', name: 'admin_notes', label: 'Internal Admin Notes', field_type: 'textarea' },

      
      // 🍽️ FOOD & BEVERAGE STANDARDS
      { type: 'food', section: 'menu', name: 'cuisine_standard', label: 'Primary Cuisine Style', field_type: 'select', options: ['Traditional Siwan','Egyptian','Mediterranean','International'] },
      { type: 'food', section: 'basic', name: 'dietary', label: 'Dietary Options', field_type: 'checkbox', options: ['Vegan','Vegetarian','Gluten-Free','Halal'] },
      { type: 'food', section: 'basic', name: 'seating', label: 'Seating Capacity', field_type: 'text' },

      // 🐪 ADVENTURE STANDARDS
      { type: 'adventure', section: 'schedule', name: 'difficulty', label: 'Difficulty Level', field_type: 'select', options: ['Easy','Moderate','Challenging','Extreme'] },
      { type: 'adventure', section: 'basic', name: 'duration_std', label: 'Typical Duration', field_type: 'text' },
      { type: 'adventure', section: 'basic', name: 'gear', label: 'Gear Provided', field_type: 'checkbox', options: ['Helmet','Water','Camping Gear','Sandboards'] },

      // 🎨 CRAFTS STANDARDS
      { type: 'crafts', section: 'products', name: 'origin', label: 'Material Origin', field_type: 'select', options: ['Siwa Oasis','Matrouh Region','Lower Egypt','Imported'] },
      { type: 'crafts', section: 'basic', name: 'method', label: 'Production Method', field_type: 'select', options: ['Handmade','Machine-assisted','Bespoke'] }
    ];

    const results = [];

    for (const s of standards) {
      try {
        await execute(
          'INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, options, section_origin) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [randomUUID(), s.type, s.section, s.name, s.label, s.field_type, JSON.stringify(s.options || []), 'own']
        );
        results.push({ field: s.name, status: 'Materialized' });
      } catch (e) {
        // If already exists, update the field type and options to match gold standard
        await execute(
          'UPDATE form_fields SET field_type = ?, options = ? WHERE business_type_id = ? AND name = ?',
          [s.field_type, JSON.stringify(s.options || []), s.type, s.name]
        );
        results.push({ field: s.name, status: 'Updated to Standard' });
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

