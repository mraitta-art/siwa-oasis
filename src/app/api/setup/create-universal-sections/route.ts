import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

/**
 * POST /api/setup/create-universal-sections
 * Creates universal sections that work across ALL business types.
 * These sections appear automatically for every business in the Unified Studio.
 * 
 * Marketplace Sections:
 *   - Investment Opportunity  → feeds /investment-opportunities
 *   - Auction & Bidding       → feeds /auctions  
 *   - Offers & Packages       → feeds /offers via /api/discovery/offers
 *   - Discounts & Promotions  → feeds /discounts
 *   - Sponsorship             → feeds /investment-opportunities (tab)
 * 
 * Experience Sections:
 *   - Vibe & Atmosphere       → comparison matrix
 *   - Experience Highlights   → comparison matrix
 */

// ═══════════════════════════════════════════════════════════════════
//  UNIVERSAL SECTIONS — appear for every business type automatically
// ═══════════════════════════════════════════════════════════════════
const UNIVERSAL_SECTIONS = [
  {
    id: 'vibe',
    name: 'Vibe & Atmosphere',
    icon: '✨',
    description: 'The feeling and experience — used for cross-business comparison',
    is_universal: true,
    sort_order: 10,
  },
  {
    id: 'experience',
    name: 'Experience Highlights',
    icon: '🎯',
    description: 'What makes this business special — key differentiators',
    is_universal: true,
    sort_order: 20,
  },
  {
    id: 'investment-opportunity',
    name: 'Investment Opportunity',
    icon: '💰',
    description: 'Investment pitch, ROI, and partnership details — feeds the main site Investment Marketplace',
    is_universal: true,
    sort_order: 30,
  },
  {
    id: 'auction',
    name: 'Auction & Bidding',
    icon: '🔨',
    description: 'Time-limited bidding opportunities — assets, services, experiences, or licenses',
    is_universal: true,
    sort_order: 40,
  },
  {
    id: 'offers-packages',
    name: 'Offers & Packages',
    icon: '🎁',
    description: 'Special offers, seasonal packages, group deals — feeds the main site Offers page',
    is_universal: true,
    sort_order: 50,
  },
  {
    id: 'discounts-promotions',
    name: 'Discounts & Promotions',
    icon: '🏷️',
    description: 'Seasonal discounts, early-bird rates, group pricing, loyalty rewards',
    is_universal: true,
    sort_order: 60,
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship & Partnerships',
    icon: '🤝',
    description: 'Sponsorship packages, naming rights, event partnerships',
    is_universal: true,
    sort_order: 70,
  },
];

// ═══════════════════════════════════════════════════════════════════
//  SECTION FIELDS — each section's dedicated form fields
// ═══════════════════════════════════════════════════════════════════

const INVESTMENT_FIELDS = [
  { name: 'opportunity_title',       label: 'Investment Title',                  field_type: 'text',       required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'A compelling headline for this investment opportunity' },
  { name: 'opportunity_type',        label: 'Opportunity Type',                  field_type: 'select',     required: true,  sort_order: 2,  is_searchable: false, is_filterable: true,  help: 'Category of investment', options: ['equity','partnership','franchise','joint_venture','sponsorship'] },
  { name: 'investment_amount_min',   label: 'Minimum Investment (USD)',           field_type: 'text',       required: false, sort_order: 3,  is_searchable: false, is_filterable: true,  help: 'Lowest amount an investor can commit' },
  { name: 'investment_amount_max',   label: 'Maximum Investment (USD)',           field_type: 'text',       required: false, sort_order: 4,  is_searchable: false, is_filterable: true,  help: 'Upper limit of the investment round' },
  { name: 'expected_roi_percent',    label: 'Expected ROI (%)',                  field_type: 'text',       required: false, sort_order: 5,  is_searchable: false, is_filterable: true,  help: 'Projected return on investment' },
  { name: 'business_stage',          label: 'Business Stage',                    field_type: 'select',     required: false, sort_order: 6,  is_searchable: false, is_filterable: true,  help: 'Current phase of the business', options: ['startup','growth','expansion','mature','turnaround'] },
  { name: 'annual_revenue',          label: 'Annual Revenue (Optional)',          field_type: 'text',       required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'Current annual revenue figure' },
  { name: 'investment_status',       label: 'Investment Status',                 field_type: 'select',     required: false, sort_order: 8,  is_searchable: false, is_filterable: true,  help: 'Current state of the opportunity', options: ['open','closing_soon','closed','funded'] },
  { name: 'target_investors',        label: 'Target Number of Investors',        field_type: 'text',       required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'How many investors you are seeking' },
  { name: 'investment_description',  label: 'Investment Pitch',                  field_type: 'rich_text',  required: false, sort_order: 10, is_searchable: false, is_filterable: false, help: 'Full investment pitch — tell the story' },
  { name: 'investment_highlights',   label: 'Key Highlights',                    field_type: 'textarea',   required: false, sort_order: 11, is_searchable: false, is_filterable: false, help: 'Bullet-point selling points (one per line)' },
  { name: 'roi_potential',           label: 'ROI Breakdown / Potential',          field_type: 'textarea',   required: false, sort_order: 12, is_searchable: false, is_filterable: false, help: 'Detailed ROI analysis or breakdown' },
  { name: 'visibility_on_main_site', label: 'Show on Main Investment Page',      field_type: 'boolean',    required: false, sort_order: 13, is_searchable: false, is_filterable: false, help: 'Toggle to display on /investment-opportunities collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: false, sort_order: 14, is_searchable: false, is_filterable: false, help: 'Pin this opportunity to the top of the page' },
  { name: 'contact_for_details',    label: 'Prefer Contact for Details',        field_type: 'boolean',    required: false, sort_order: 15, is_searchable: false, is_filterable: false, help: 'Prompt investors to call rather than invest online' },
  { name: 'investment_contact',     label: 'Investment Contact Phone',          field_type: 'text',       required: false, sort_order: 16, is_searchable: false, is_filterable: false, help: 'Direct contact number for investor inquiries' },
];

const AUCTION_FIELDS = [
  { name: 'auction_title',          label: 'Auction Title',                     field_type: 'text',       required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'Name of the auction listing' },
  { name: 'auction_type',           label: 'Auction Type',                      field_type: 'select',     required: true,  sort_order: 2,  is_searchable: false, is_filterable: true,  help: 'What is being auctioned', options: ['asset','service','experience','property','license','equipment','rights'] },
  { name: 'starting_price',         label: 'Starting Price (USD)',              field_type: 'text',       required: false, sort_order: 3,  is_searchable: false, is_filterable: true,  help: 'Opening bid amount' },
  { name: 'reserve_price',          label: 'Reserve Price (USD)',               field_type: 'text',       required: false, sort_order: 4,  is_searchable: false, is_filterable: false, help: 'Minimum price to sell (hidden from bidders)' },
  { name: 'buy_now_price',          label: 'Buy Now Price (Optional)',          field_type: 'text',       required: false, sort_order: 5,  is_searchable: false, is_filterable: true,  help: 'Instant purchase price — skip the bidding' },
  { name: 'auction_start',          label: 'Auction Start Date',                field_type: 'text',       required: false, sort_order: 6,  is_searchable: false, is_filterable: false, help: 'When bidding opens (YYYY-MM-DD)' },
  { name: 'auction_end',            label: 'Auction End Date',                  field_type: 'text',       required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'When bidding closes (YYYY-MM-DD)' },
  { name: 'auction_status',         label: 'Auction Status',                    field_type: 'select',     required: false, sort_order: 8,  is_searchable: false, is_filterable: true,  help: 'Current status', options: ['upcoming','live','ended','sold','cancelled'] },
  { name: 'auction_description',    label: 'Full Description',                  field_type: 'rich_text',  required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'Detailed description of the auctioned item/service' },
  { name: 'auction_terms',          label: 'Terms & Conditions',                field_type: 'textarea',   required: false, sort_order: 10, is_searchable: false, is_filterable: false, help: 'Bidding terms, payment conditions, delivery terms' },
  { name: 'auction_contact',        label: 'Contact for Bidding',               field_type: 'text',       required: false, sort_order: 11, is_searchable: false, is_filterable: false, help: 'Phone or email for auction inquiries' },
  { name: 'visibility_on_main_site',label: 'Show on Auction Collector Page',    field_type: 'boolean',    required: false, sort_order: 12, is_searchable: false, is_filterable: false, help: 'Display on /auctions page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: false, sort_order: 13, is_searchable: false, is_filterable: false, help: 'Pin to the top of the auctions page' },
];

const OFFERS_PACKAGES_FIELDS = [
  { name: 'offer_title',            label: 'Offer / Package Title',             field_type: 'text',       required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'Name of the offer or package' },
  { name: 'offer_type',             label: 'Offer Type',                        field_type: 'select',     required: false, sort_order: 2,  is_searchable: false, is_filterable: true,  help: 'Category', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price',            label: 'Price (USD)',                       field_type: 'text',       required: false, sort_order: 3,  is_searchable: false, is_filterable: true,  help: 'Package price or starting-from price' },
  { name: 'offer_original_price',   label: 'Original Price (before discount)',  field_type: 'text',       required: false, sort_order: 4,  is_searchable: false, is_filterable: false, help: 'Strikethrough price for comparison' },
  { name: 'offer_discount',         label: 'Discount %',                        field_type: 'text',       required: false, sort_order: 5,  is_searchable: false, is_filterable: true,  help: 'Percentage off the original price' },
  { name: 'offer_description',      label: 'Description',                       field_type: 'rich_text',  required: false, sort_order: 6,  is_searchable: false, is_filterable: false, help: 'Full description of what is included' },
  { name: 'offer_inclusions',       label: 'What\'s Included',                  field_type: 'textarea',   required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'Bullet-point list of inclusions (one per line)' },
  { name: 'offer_valid_from',       label: 'Valid From',                        field_type: 'text',       required: false, sort_order: 8,  is_searchable: false, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until',      label: 'Valid Until / Expiry',              field_type: 'text',       required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests',       label: 'Minimum Guests / Pax',             field_type: 'text',       required: false, sort_order: 10, is_searchable: false, is_filterable: false, help: 'Minimum group size for this offer' },
  { name: 'offer_max_guests',       label: 'Maximum Guests / Pax',             field_type: 'text',       required: false, sort_order: 11, is_searchable: false, is_filterable: false, help: 'Maximum capacity for this package' },
  { name: 'offer_cta_link',         label: 'Booking / CTA Link',               field_type: 'text',       required: false, sort_order: 12, is_searchable: false, is_filterable: false, help: 'Direct link for booking or inquiry' },
  { name: 'offer_image',            label: 'Cover Image URL',                  field_type: 'text',       required: false, sort_order: 13, is_searchable: false, is_filterable: false, help: 'Hero image for this offer card' },
  { name: 'visibility_on_main_site',label: 'Show on Main Offers Page',          field_type: 'boolean',    required: false, sort_order: 14, is_searchable: false, is_filterable: false, help: 'Display on /offers collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: false, sort_order: 15, is_searchable: false, is_filterable: false, help: 'Pin to top of the offers page' },
];

const DISCOUNTS_FIELDS = [
  { name: 'discount_name',          label: 'Discount Campaign Name',            field_type: 'text',       required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'Name of the discount campaign' },
  { name: 'discount_type',          label: 'Discount Type',                     field_type: 'select',     required: true,  sort_order: 2,  is_searchable: false, is_filterable: true,  help: 'How the discount is applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value',         label: 'Discount Value',                    field_type: 'text',       required: false, sort_order: 3,  is_searchable: false, is_filterable: true,  help: 'Amount or percentage of the discount' },
  { name: 'applies_to',             label: 'Applies To',                        field_type: 'select',     required: false, sort_order: 4,  is_searchable: false, is_filterable: true,  help: 'What the discount applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size',         label: 'Minimum Group Size',                field_type: 'text',       required: false, sort_order: 5,  is_searchable: false, is_filterable: false, help: 'For group discounts — minimum pax' },
  { name: 'season',                 label: 'Season / Period',                   field_type: 'select',     required: false, sort_order: 6,  is_searchable: false, is_filterable: true,  help: 'Which season this discount applies to', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from',             label: 'Valid From',                        field_type: 'text',       required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'valid_until',            label: 'Valid Until',                       field_type: 'text',       required: false, sort_order: 8,  is_searchable: false, is_filterable: false, help: 'Expiry date (YYYY-MM-DD)' },
  { name: 'discount_description',   label: 'Description / Terms',               field_type: 'textarea',   required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'Details and conditions of the discount' },
  { name: 'promo_code',             label: 'Promo Code (Optional)',             field_type: 'text',       required: false, sort_order: 10, is_searchable: false, is_filterable: false, help: 'Coupon code visitors can use' },
  { name: 'discount_status',        label: 'Status',                            field_type: 'select',     required: false, sort_order: 11, is_searchable: false, is_filterable: true,  help: 'Current state', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site',label: 'Show on Discounts Page',            field_type: 'boolean',    required: false, sort_order: 12, is_searchable: false, is_filterable: false, help: 'Display on /discounts collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: false, sort_order: 13, is_searchable: false, is_filterable: false, help: 'Pin to top' },
];

const SPONSORSHIP_FIELDS = [
  { name: 'sponsorship_title',      label: 'Sponsorship Title',                 field_type: 'text',       required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'Name of the sponsorship package' },
  { name: 'sponsorship_type',       label: 'Sponsorship Type',                  field_type: 'select',     required: false, sort_order: 2,  is_searchable: false, is_filterable: true,  help: 'Category', options: ['naming_rights','event_sponsor','media_partner','product_placement','community','environmental','cultural'] },
  { name: 'sponsorship_tier',       label: 'Sponsorship Tier',                  field_type: 'select',     required: false, sort_order: 3,  is_searchable: false, is_filterable: true,  help: 'Package level', options: ['platinum','gold','silver','bronze','custom'] },
  { name: 'sponsorship_value',      label: 'Package Value (USD)',               field_type: 'text',       required: false, sort_order: 4,  is_searchable: false, is_filterable: true,  help: 'Price of this sponsorship package' },
  { name: 'sponsorship_benefits',   label: 'Sponsor Benefits',                  field_type: 'textarea',   required: false, sort_order: 5,  is_searchable: false, is_filterable: false, help: 'What sponsors receive (one benefit per line)' },
  { name: 'sponsorship_duration',   label: 'Duration',                          field_type: 'text',       required: false, sort_order: 6,  is_searchable: false, is_filterable: false, help: 'How long the sponsorship lasts' },
  { name: 'sponsorship_description',label: 'Full Description',                  field_type: 'rich_text',  required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'Detailed pitch for potential sponsors' },
  { name: 'visibility_on_main_site',label: 'Show on Main Site',                 field_type: 'boolean',    required: false, sort_order: 8,  is_searchable: false, is_filterable: false, help: 'Display publicly' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'Pin to top' },
];

// ═══════════════════════════════════════════════════════════════════
//  MAP section_id → its field definitions
// ═══════════════════════════════════════════════════════════════════
const SECTION_FIELDS_MAP: Record<string, typeof INVESTMENT_FIELDS> = {
  'investment-opportunity': INVESTMENT_FIELDS,
  'auction':               AUCTION_FIELDS,
  'offers-packages':       OFFERS_PACKAGES_FIELDS,
  'discounts-promotions':  DISCOUNTS_FIELDS,
  'sponsorship':           SPONSORSHIP_FIELDS,
};

// ═══════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // 1. Create or update universal sections
    for (const section of UNIVERSAL_SECTIONS) {
      const existing = await query('SELECT id FROM sections WHERE id = ?', [section.id]);

      if (existing.length === 0) {
        await execute(
          `INSERT INTO sections 
           (id, name, icon, description, is_universal, active, display_order, sort_order) 
           VALUES (?, ?, ?, ?, 1, 1, ?, ?)`,
          [section.id, section.name, section.icon, section.description, section.sort_order, section.sort_order]
        );
        results.push({ section: section.name, action: 'CREATED' });
      } else {
        // Update sort_order and description if section already exists
        await execute(
          `UPDATE sections SET description = ?, sort_order = ?, is_universal = 1, active = 1 WHERE id = ?`,
          [section.description, section.sort_order, section.id]
        );
        results.push({ section: section.name, action: 'EXISTS (updated)' });
      }
    }

    // 2. Seed fields for each marketplace section
    for (const [sectionId, fieldDefs] of Object.entries(SECTION_FIELDS_MAP)) {
      let created = 0;
      let skipped = 0;

      for (const field of fieldDefs) {
        const existing = await query(
          'SELECT id FROM form_fields WHERE section_id = ? AND name = ?',
          [sectionId, field.name]
        );

        if (existing.length === 0) {
          await execute(
            `INSERT INTO form_fields 
             (section_id, name, label, field_type, required, vendor_editable, is_searchable, is_filterable, sort_order, help_text, options)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            [
              sectionId,
              field.name,
              field.label,
              field.field_type,
              field.required ? 1 : 0,
              field.is_searchable ? 1 : 0,
              field.is_filterable ? 1 : 0,
              field.sort_order,
              field.help || null,
              (field as any).options ? JSON.stringify((field as any).options) : null,
            ]
          );
          created++;
        } else {
          skipped++;
        }
      }

      results.push({
        section: sectionId,
        fields_created: created,
        fields_skipped: skipped,
        total: fieldDefs.length,
        action: 'fields processed',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All universal marketplace sections created successfully',
      details: results,
      sections: UNIVERSAL_SECTIONS.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        description: s.description,
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

// GET alias — allows triggering from a browser
export const GET = POST;
