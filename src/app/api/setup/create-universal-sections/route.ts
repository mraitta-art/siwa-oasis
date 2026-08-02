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
    id: 'business_info',
    name: 'Business Information & Contacts',
    icon: 'fa-store',
    description: 'Basic business profile info, location, contact channels, and social media links',
    is_universal: true,
    sort_order: 5,
  },
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
    id: 'invest',
    name: 'Investments & Partnerships',
    icon: '💸',
    description: 'Investment and partnership opportunities — a dedicated channel for investor interest',
    is_universal: true,
    sort_order: 32,
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
    id: 'offers-promotions',
    name: 'Offers & Promotions',
    icon: '🎁',
    description: 'Promotional deals, limited-time offers, and special pricing — separate from package bundles',
    is_universal: true,
    sort_order: 50,
  },
  {
    id: 'package',
    name: 'Packages & Bundles',
    icon: '📦',
    description: 'Curated packages, bundled experiences, and multi-day deals',
    is_universal: true,
    sort_order: 55,
  },
  {
    id: 'discount',
    name: 'Discounts',
    icon: '🏷️',
    description: 'Seasonal discounts and promotional savings — separate from offers and packages',
    is_universal: true,
    sort_order: 60,
  },
  {
    id: 'discounts-promotions',
    name: 'Discounts & Promotions (Legacy)',
    icon: '🏷️',
    description: 'Legacy discounts and promotional campaign fields for compatibility with older business data',
    is_universal: true,
    sort_order: 61,
  },
  {
    id: 'offers-packages',
    name: 'Offers & Packages (Legacy)',
    icon: '🎁',
    description: 'Legacy combined offers and package fields for compatibility with existing business data',
    is_universal: true,
    sort_order: 62,
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

const BUSINESS_INFO_FIELDS = [
  { name: 'phone',            label: 'Contact Phone',          field_type: 'text', required: true,  sort_order: 1,  is_searchable: true,  is_filterable: false, help: 'Public contact phone number' },
  { name: 'email',            label: 'Contact Email',          field_type: 'text', required: false, sort_order: 2,  is_searchable: true,  is_filterable: false, help: 'Public contact email address' },
  { name: 'address',          label: 'Physical Address',       field_type: 'text', required: false, sort_order: 3,  is_searchable: true,  is_filterable: false, help: 'Location address in Siwa' },
  { name: 'business_logo',    label: 'Business Logo URL',      field_type: 'text', required: false, sort_order: 4,  is_searchable: false, is_filterable: false, help: 'Direct URL to the business logo image' },
  { name: 'instagram_handle', label: 'Instagram Username',     field_type: 'text', required: false, sort_order: 5,  is_searchable: false, is_filterable: false, help: 'e.g. siwatoday' },
  { name: 'facebook_link',    label: 'Facebook Page URL',      field_type: 'text', required: false, sort_order: 6,  is_searchable: false, is_filterable: false, help: 'Full link to your Facebook page' },
  { name: 'tiktok_handle',    label: 'TikTok Username',        field_type: 'text', required: false, sort_order: 7,  is_searchable: false, is_filterable: false, help: 'e.g. siwa_experience' },
  { name: 'wechat_id',        label: 'WeChat ID',              field_type: 'text', required: false, sort_order: 8,  is_searchable: false, is_filterable: false, help: 'WeChat ID for Chinese guests' },
  { name: 'whatsapp_number',  label: 'WhatsApp Number',        field_type: 'text', required: false, sort_order: 9,  is_searchable: false, is_filterable: false, help: 'International format phone number (e.g. +20123456789)' },
];

const VIBE_FIELDS = [
  { name: 'vibe_tags',     label: 'Vibe & Atmosphere Tags', field_type: 'multiselect', required: true,  sort_order: 1, is_searchable: true, is_filterable: true, help: 'Select all vibe descriptors that match this business.', options: ['Eco-Luxury', 'Traditional', 'Modern', 'Wellness', 'Adventure', 'Quiet & Cozy', 'Scenic Views', 'Cultural', 'Rustic', 'Heritage', 'Organic', 'Historic', 'Luxury', 'Family Friendly', 'Romantic'] },
  { name: 'music_style',   label: 'Music & Ambient Sound',   field_type: 'select',      required: false, sort_order: 2, is_searchable: true, is_filterable: true, help: 'Select the ambient sound style.', options: ['None / Silence', 'Soft Ambient', 'Traditional Instrumental', 'Live Acoustic', 'Lounge / Chillout', 'Upbeat / Modern', 'Nature Sounds'] },
  { name: 'lighting_level',label: 'Lighting Level',          field_type: 'select',      required: false, sort_order: 3, is_searchable: true, is_filterable: true, help: 'What is the primary lighting atmosphere?', options: ['Bright & Airy', 'Soft / Warm', 'Dim / Candlelit', 'Natural / Sunlit'] },
];

const EXPERIENCE_FIELDS = [
  { name: 'experience_type',   label: 'Experience Type',             field_type: 'select',      required: true,  sort_order: 1, is_searchable: true, is_filterable: true, help: 'Primary type of experience offered.', options: ['Sightseeing', 'Wellness & Spa', 'Culinary', 'Active Adventure', 'Workshop / Learning', 'Relaxation', 'Wildlife / Nature', 'Archaeological / History'] },
  { name: 'best_time_to_visit',label: 'Best Time to Experience',      field_type: 'select',      required: false, sort_order: 2, is_searchable: true, is_filterable: true, help: 'Recommended time to experience this establishment.', options: ['Sunrise', 'Morning', 'Midday', 'Sunset', 'Night', 'All Day'] },
  { name: 'duration_hours',    label: 'Recommended Duration (Hours)', field_type: 'text',        required: false, sort_order: 3, is_searchable: false, is_filterable: false, help: 'How long should visitors allocate for this experience?' },
  { name: 'experience_tags',   label: 'Experience Tags',             field_type: 'multiselect', required: false, sort_order: 4, is_searchable: true, is_filterable: true, help: 'Select specific activity tags.', options: ['Wellness', 'Hiking', 'Hot Springs', 'Safari', 'Guided Tour', 'Sandboarding', 'Handicrafts', 'Date Tasting', 'Traditional Food', 'Yoga', 'Meditation', 'Museum', 'Star Gazing', 'Camping'] },
];

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
  // Slot 1
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

  // Slot 2
  { name: 'offer_title_2',            label: 'Offer 2: Title',                    field_type: 'text',       required: false, sort_order: 21, is_searchable: true,  is_filterable: false, help: 'Title for second offer slot' },
  { name: 'offer_type_2',             label: 'Offer 2: Type',                     field_type: 'select',     required: false, sort_order: 22, is_searchable: false, is_filterable: true,  help: 'Category of offer 2', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price_2',            label: 'Offer 2: Price (USD)',              field_type: 'text',       required: false, sort_order: 23, is_searchable: false, is_filterable: true,  help: 'Price of offer 2' },
  { name: 'offer_original_price_2',   label: 'Offer 2: Original Price (before discount)', field_type: 'text', required: false, sort_order: 24, is_searchable: false, is_filterable: false, help: 'Strikethrough price for offer 2' },
  { name: 'offer_discount_2',         label: 'Offer 2: Discount %',               field_type: 'text',       required: false, sort_order: 25, is_searchable: false, is_filterable: true,  help: 'Discount percentage of offer 2' },
  { name: 'offer_description_2',      label: 'Offer 2: Description',              field_type: 'rich_text',  required: false, sort_order: 26, is_searchable: false, is_filterable: false, help: 'Full description of offer 2' },
  { name: 'offer_inclusions_2',       label: 'Offer 2: What\'s Included',         field_type: 'textarea',   required: false, sort_order: 27, is_searchable: false, is_filterable: false, help: 'Inclusions for offer 2' },
  { name: 'offer_valid_from_2',       label: 'Offer 2: Valid From',               field_type: 'text',       required: false, sort_order: 28, is_searchable: false, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until_2',      label: 'Offer 2: Valid Until / Expiry',     field_type: 'text',       required: false, sort_order: 29, is_searchable: false, is_filterable: false, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests_2',       label: 'Offer 2: Minimum Guests / Pax',     field_type: 'text',       required: false, sort_order: 30, is_searchable: false, is_filterable: false, help: 'Minimum guest count' },
  { name: 'offer_max_guests_2',       label: 'Offer 2: Maximum Guests / Pax',     field_type: 'text',       required: false, sort_order: 31, is_searchable: false, is_filterable: false, help: 'Maximum capacity' },
  { name: 'offer_cta_link_2',         label: 'Offer 2: Booking / CTA Link',       field_type: 'text',       required: false, sort_order: 32, is_searchable: false, is_filterable: false, help: 'Inquiry link' },
  { name: 'offer_image_2',            label: 'Offer 2: Cover Image URL',          field_type: 'text',       required: false, sort_order: 33, is_searchable: false, is_filterable: false, help: 'Hero image' },
  { name: 'visibility_on_main_site_2',label: 'Offer 2: Show on Main Offers Page', field_type: 'boolean',    required: false, sort_order: 34, is_searchable: false, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_2',            label: 'Offer 2: Feature on Top',           field_type: 'boolean',    required: false, sort_order: 35, is_searchable: false, is_filterable: false, help: 'Pin to top' },

  // Slot 3
  { name: 'offer_title_3',            label: 'Offer 3: Title',                    field_type: 'text',       required: false, sort_order: 41, is_searchable: true,  is_filterable: false, help: 'Title for third offer slot' },
  { name: 'offer_type_3',             label: 'Offer 3: Type',                     field_type: 'select',     required: false, sort_order: 42, is_searchable: false, is_filterable: true,  help: 'Category of offer 3', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price_3',            label: 'Offer 3: Price (USD)',              field_type: 'text',       required: false, sort_order: 43, is_searchable: false, is_filterable: true,  help: 'Price of offer 3' },
  { name: 'offer_original_price_3',   label: 'Offer 3: Original Price (before discount)', field_type: 'text', required: false, sort_order: 44, is_searchable: false, is_filterable: false, help: 'Strikethrough price for offer 3' },
  { name: 'offer_discount_3',         label: 'Offer 3: Discount %',               field_type: 'text',       required: false, sort_order: 45, is_searchable: false, is_filterable: true,  help: 'Discount percentage of offer 3' },
  { name: 'offer_description_3',      label: 'Offer 3: Description',              field_type: 'rich_text',  required: false, sort_order: 46, is_searchable: false, is_filterable: false, help: 'Full description of offer 3' },
  { name: 'offer_inclusions_3',       label: 'Offer 3: What\'s Included',         field_type: 'textarea',   required: false, sort_order: 47, is_searchable: false, is_filterable: false, help: 'Inclusions for offer 3' },
  { name: 'offer_valid_from_3',       label: 'Offer 3: Valid From',               field_type: 'text',       required: false, sort_order: 48, is_searchable: false, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until_3',      label: 'Offer 3: Valid Until / Expiry',     field_type: 'text',       required: false, sort_order: 49, is_searchable: false, is_filterable: false, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests_3',       label: 'Offer 3: Minimum Guests / Pax',     field_type: 'text',       required: false, sort_order: 50, is_searchable: false, is_filterable: false, help: 'Minimum guest count' },
  { name: 'offer_max_guests_3',       label: 'Offer 3: Maximum Guests / Pax',     field_type: 'text',       required: false, sort_order: 51, is_searchable: false, is_filterable: false, help: 'Maximum capacity' },
  { name: 'offer_cta_link_3',         label: 'Offer 3: Booking / CTA Link',       field_type: 'text',       required: false, sort_order: 52, is_searchable: false, is_filterable: false, help: 'Inquiry link' },
  { name: 'offer_image_3',            label: 'Offer 3: Cover Image URL',          field_type: 'text',       required: false, sort_order: 53, is_searchable: false, is_filterable: false, help: 'Hero image' },
  { name: 'visibility_on_main_site_3',label: 'Offer 3: Show on Main Offers Page', field_type: 'boolean',    required: false, sort_order: 54, is_searchable: false, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_3',            label: 'Offer 3: Feature on Top',           field_type: 'boolean',    required: false, sort_order: 55, is_searchable: false, is_filterable: false, help: 'Pin to top of the offers page' },
];

const PACKAGE_FIELDS = OFFERS_PACKAGES_FIELDS;
const OFFERS_PROMOTIONS_FIELDS = OFFERS_PACKAGES_FIELDS;

const DISCOUNTS_FIELDS = [
  // Slot 1
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

  // Slot 2
  { name: 'discount_name_2',          label: 'Discount 2: Campaign Name',         field_type: 'text',       required: false, sort_order: 21, is_searchable: true,  is_filterable: false, help: 'Name of the discount campaign 2' },
  { name: 'discount_type_2',          label: 'Discount 2: Type',                  field_type: 'select',     required: false, sort_order: 22, is_searchable: false, is_filterable: true,  help: 'How applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value_2',         label: 'Discount 2: Value',                 field_type: 'text',       required: false, sort_order: 23, is_searchable: false, is_filterable: true,  help: 'Value of discount 2' },
  { name: 'applies_to_2',             label: 'Discount 2: Applies To',            field_type: 'select',     required: false, sort_order: 24, is_searchable: false, is_filterable: true,  help: 'Applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size_2',         label: 'Discount 2: Minimum Group Size',    field_type: 'text',       required: false, sort_order: 25, is_searchable: false, is_filterable: false, help: 'Minimum group size' },
  { name: 'season_2',                 label: 'Discount 2: Season / Period',       field_type: 'select',     required: false, sort_order: 26, is_searchable: false, is_filterable: true,  help: 'Season', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from_2',             label: 'Discount 2: Valid From',            field_type: 'text',       required: false, sort_order: 27, is_searchable: false, is_filterable: false, help: 'Start date' },
  { name: 'valid_until_2',            label: 'Discount 2: Valid Until',           field_type: 'text',       required: false, sort_order: 28, is_searchable: false, is_filterable: false, help: 'Expiry date' },
  { name: 'discount_description_2',   label: 'Discount 2: Description / Terms',   field_type: 'textarea',   required: false, sort_order: 29, is_searchable: false, is_filterable: false, help: 'Description' },
  { name: 'promo_code_2',             label: 'Discount 2: Promo Code',            field_type: 'text',       required: false, sort_order: 30, is_searchable: false, is_filterable: false, help: 'Coupon code' },
  { name: 'discount_status_2',        label: 'Discount 2: Status',                field_type: 'select',     required: false, sort_order: 31, is_searchable: false, is_filterable: true,  help: 'Status', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site_2',label: 'Discount 2: Show on Discounts Page', field_type: 'boolean',    required: false, sort_order: 32, is_searchable: false, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_2',            label: 'Discount 2: Feature on Top',        field_type: 'boolean',    required: false, sort_order: 33, is_searchable: false, is_filterable: false, help: 'Pin to top' },

  // Slot 3
  { name: 'discount_name_3',          label: 'Discount 3: Campaign Name',         field_type: 'text',       required: false, sort_order: 41, is_searchable: true,  is_filterable: false, help: 'Name of the discount campaign 3' },
  { name: 'discount_type_3',          label: 'Discount 3: Type',                  field_type: 'select',     required: false, sort_order: 42, is_searchable: false, is_filterable: true,  help: 'How applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value_3',         label: 'Discount 3: Value',                 field_type: 'text',       required: false, sort_order: 43, is_searchable: false, is_filterable: true,  help: 'Value of discount 3' },
  { name: 'applies_to_3',             label: 'Discount 3: Applies To',            field_type: 'select',     required: false, sort_order: 44, is_searchable: false, is_filterable: true,  help: 'Applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size_3',         label: 'Discount 3: Minimum Group Size',    field_type: 'text',       required: false, sort_order: 45, is_searchable: false, is_filterable: false, help: 'Minimum group size' },
  { name: 'season_3',                 label: 'Discount 3: Season / Period',       field_type: 'select',     required: false, sort_order: 46, is_searchable: false, is_filterable: true,  help: 'Season', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from_3',             label: 'Discount 3: Valid From',            field_type: 'text',       required: false, sort_order: 47, is_searchable: false, is_filterable: false, help: 'Start date' },
  { name: 'valid_until_3',            label: 'Discount 3: Valid Until',           field_type: 'text',       required: false, sort_order: 48, is_searchable: false, is_filterable: false, help: 'Expiry date' },
  { name: 'discount_description_3',   label: 'Discount 3: Description / Terms',   field_type: 'textarea',   required: false, sort_order: 49, is_searchable: false, is_filterable: false, help: 'Description' },
  { name: 'promo_code_3',             label: 'Discount 3: Promo Code',            field_type: 'text',       required: false, sort_order: 50, is_searchable: false, is_filterable: false, help: 'Coupon code' },
  { name: 'discount_status_3',        label: 'Discount 3: Status',                field_type: 'select',     required: false, sort_order: 51, is_searchable: false, is_filterable: true,  help: 'Status', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site_3',label: 'Discount 3: Show on Discounts Page', field_type: 'boolean',    required: false, sort_order: 52, is_searchable: false, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_3',            label: 'Discount 3: Feature on Top',        field_type: 'boolean',    required: false, sort_order: 53, is_searchable: false, is_filterable: false, help: 'Pin to top' },
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
  'business_info':         BUSINESS_INFO_FIELDS,
  'vibe':                  VIBE_FIELDS,
  'experience':            EXPERIENCE_FIELDS,
  'investment-opportunity': INVESTMENT_FIELDS,
  'invest':                INVESTMENT_FIELDS,
  'auction':               AUCTION_FIELDS,
  'offers-promotions':     OFFERS_PROMOTIONS_FIELDS,
  'package':               PACKAGE_FIELDS,
  'discount':              DISCOUNTS_FIELDS,
  'discounts-promotions':  DISCOUNTS_FIELDS,
  'offers-packages':       OFFERS_PACKAGES_FIELDS,
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
