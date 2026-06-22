import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * POST /api/setup/create-universal-sections
 * Creates universal sections that work across all business types
 * These enable comparison between different business types
 */

const UNIVERSAL_SECTIONS = [
  {
    id: 'vibe',
    name: 'Vibe & Atmosphere',
    icon: '✨',
    description: 'The feeling and experience',
    is_universal: true,
  },
  {
    id: 'experience',
    name: 'Experience Highlights',
    icon: '🎯',
    description: 'What makes this special',
    is_universal: true,
  },
  {
    id: 'investment-opportunity',
    name: 'Investment Opportunity',
    icon: '💰',
    description: 'Budget, revenue, and partnership details',
    is_universal: true,
  },
];

const INVESTMENT_FIELDS = [
  {
    name: 'budget_range',
    label: 'Budget/Investment Range',
    field_type: 'text',
    required: false,
    vendor_editable: true,
    is_searchable: true,
    is_filterable: true,
    sort_order: 1,
  },
  {
    name: 'annual_revenue',
    label: 'Annual Revenue (Optional)',
    field_type: 'text',
    required: false,
    vendor_editable: true,
    sort_order: 2,
  },
  {
    name: 'roi_potential',
    label: 'ROI Potential',
    field_type: 'text',
    required: false,
    vendor_editable: true,
    is_searchable: true,
    sort_order: 3,
  },
  {
    name: 'contact_for_details',
    label: 'Contact Us for Details',
    field_type: 'boolean',
    required: false,
    vendor_editable: true,
    sort_order: 4,
  },
  {
    name: 'investment_contact',
    label: 'Investment Contact Phone',
    field_type: 'phone',
    required: false,
    vendor_editable: true,
    sort_order: 5,
  },
];

export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // 1. Create or update universal sections
    for (const section of UNIVERSAL_SECTIONS) {
      // Check if exists
      const existing = await query('SELECT id FROM sections WHERE id = ?', [section.id]);

      if (existing.length === 0) {
        await execute(
          `INSERT INTO sections 
           (id, name, icon, description, is_universal, active, display_order) 
           VALUES (?, ?, ?, ?, 1, 1, ?)`,
          [section.id, section.name, section.icon, section.description, UNIVERSAL_SECTIONS.indexOf(section) * 10]
        );
        results.push({
          section: section.name,
          action: 'created',
        });
      } else {
        results.push({
          section: section.name,
          action: 'already exists',
        });
      }
    }

    // 2. Add Investment Opportunity fields if not exist
    for (const field of INVESTMENT_FIELDS) {
      const existing = await query(
        'SELECT id FROM form_fields WHERE section_id = ? AND name = ?',
        ['investment-opportunity', field.name]
      );

      if (existing.length === 0) {
        await execute(
          `INSERT INTO form_fields 
           (section_id, name, label, field_type, required, vendor_editable, is_searchable, is_filterable, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'investment-opportunity',
            field.name,
            field.label,
            field.field_type,
            field.required ? 1 : 0,
            field.vendor_editable ? 1 : 0,
            field.is_searchable ? 1 : 0,
            field.is_filterable ? 1 : 0,
            field.sort_order,
          ]
        );
      }
    }

    results.push({
      fields: INVESTMENT_FIELDS.length,
      action: 'investment fields processed',
    });

    return NextResponse.json({
      success: true,
      message: 'Universal sections created successfully',
      details: results,
      sections: UNIVERSAL_SECTIONS.map(s => ({
        id: s.id,
        name: s.name,
        description: 'Comparable across all business types',
      })),
    });
  } catch (error: any) {
    console.error('Setup Error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}
