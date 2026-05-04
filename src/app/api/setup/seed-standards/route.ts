import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * GOLD STANDARD SEEDER
 * Materializes industry-standard fields for Parent Typologies.
 */
export async function GET(req: NextRequest) {
  try {
    const standards = [
      // 🏨 ACCOMMODATION STANDARDS
      { type: 'accommodation', section: 'basic', name: 'price_range', label: 'Standard Price Range', field_type: 'select', options: ['Budget','Mid-range','Luxury','Elite'] },
      { type: 'accommodation', section: 'facilities', name: 'amenities', label: 'Standard Amenities', field_type: 'checkbox', options: ['WiFi','Pool','Air Conditioning','Traditional Breakfast','Shuttle Service'] },
      { type: 'accommodation', section: 'basic', name: 'check_policy', label: 'Check-in/Out Policy', field_type: 'textarea' },
      
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
        results.push({ field: s.name, status: 'Already Exists or Error' });
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
