const mysql = require('mysql2/promise');
console.log("Loading dotenv...");
require('dotenv').config({ path: '.env.local' });

console.log("DB config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const UNIVERSAL_SECTIONS = [
  {
    id: 'business_info',
    name: 'Business Information & Contacts',
    icon: 'fa-store',
    description: 'Basic business profile info, location, contact channels, and social media links',
    is_universal: 1,
    sort_order: 5,
  },
  {
    id: 'vibe',
    name: 'Vibe & Atmosphere',
    icon: '✨',
    description: 'The feeling and experience — used for cross-business comparison',
    is_universal: 1,
    sort_order: 10,
  },
  {
    id: 'experience',
    name: 'Experience Highlights',
    icon: '🎯',
    description: 'What makes this business special — key differentiators',
    is_universal: 1,
    sort_order: 20,
  },
  {
    id: 'investment-opportunity',
    name: 'Investment Opportunity',
    icon: '💰',
    description: 'Investment pitch, ROI, and partnership details — feeds the main site Investment Marketplace',
    is_universal: 1,
    sort_order: 30,
  },
  {
    id: 'auction',
    name: 'Auction & Bidding',
    icon: '🔨',
    description: 'Time-limited bidding opportunities — assets, services, experiences, or licenses',
    is_universal: 1,
    sort_order: 40,
  },
  {
    id: 'offers-packages',
    name: 'Offers & Packages',
    icon: '🎁',
    description: 'Special offers, seasonal packages, group deals — feeds the main site Offers page',
    is_universal: 1,
    sort_order: 50,
  },
  {
    id: 'discounts-promotions',
    name: 'Discounts & Promotions',
    icon: '🏷️',
    description: 'Seasonal discounts, early-bird rates, group pricing, loyalty rewards',
    is_universal: 1,
    sort_order: 60,
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship & Partnerships',
    icon: '🤝',
    description: 'Sponsorship packages, naming rights, event partnerships',
    is_universal: 1,
    sort_order: 70,
  },
];

const BUSINESS_INFO_FIELDS = [
  { name: 'phone',            label: 'Contact Phone',          field_type: 'text', required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'Public contact phone number' },
  { name: 'email',            label: 'Contact Email',          field_type: 'text', required: 0, sort_order: 2,  is_searchable: 1,  is_filterable: 0, help: 'Public contact email address' },
  { name: 'address',          label: 'Physical Address',       field_type: 'text', required: 0, sort_order: 3,  is_searchable: 1,  is_filterable: 0, help: 'Location address in Siwa' },
  { name: 'business_logo',    label: 'Business Logo URL',      field_type: 'text', required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 0, help: 'Direct URL to the business logo image' },
  { name: 'instagram_handle', label: 'Instagram Username',     field_type: 'text', required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 0, help: 'e.g. siwatoday' },
  { name: 'facebook_link',    label: 'Facebook Page URL',      field_type: 'text', required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 0, help: 'Full link to your Facebook page' },
  { name: 'tiktok_handle',    label: 'TikTok Username',        field_type: 'text', required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'e.g. siwa_experience' },
  { name: 'wechat_id',        label: 'WeChat ID',              field_type: 'text', required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 0, help: 'WeChat ID for Chinese guests' },
  { name: 'whatsapp_number',  label: 'WhatsApp Number',        field_type: 'text', required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'International format phone number (e.g. +20123456789)' },
];

const VIBE_FIELDS = [
  { name: 'vibe_tags',     label: 'Vibe & Atmosphere Tags', field_type: 'multiselect', required: 1,  sort_order: 1, is_searchable: 1, is_filterable: 1, help: 'Select all vibe descriptors that match this business.', options: ['Eco-Luxury', 'Traditional', 'Modern', 'Wellness', 'Adventure', 'Quiet & Cozy', 'Scenic Views', 'Cultural', 'Rustic', 'Heritage', 'Organic', 'Historic', 'Luxury', 'Family Friendly', 'Romantic'] },
  { name: 'music_style',   label: 'Music & Ambient Sound',   field_type: 'select',      required: 0, sort_order: 2, is_searchable: 1, is_filterable: 1, help: 'Select the ambient sound style.', options: ['None / Silence', 'Soft Ambient', 'Traditional Instrumental', 'Live Acoustic', 'Lounge / Chillout', 'Upbeat / Modern', 'Nature Sounds'] },
  { name: 'lighting_level',label: 'Lighting Level',          field_type: 'select',      required: 0, sort_order: 3, is_searchable: 1, is_filterable: 1, help: 'What is the primary lighting atmosphere?', options: ['Bright & Airy', 'Soft / Warm', 'Dim / Candlelit', 'Natural / Sunlit'] },
];

const EXPERIENCE_FIELDS = [
  { name: 'experience_type',   label: 'Experience Type',             field_type: 'select',      required: 1,  sort_order: 1, is_searchable: 1, is_filterable: 1, help: 'Primary type of experience offered.', options: ['Sightseeing', 'Wellness & Spa', 'Culinary', 'Active Adventure', 'Workshop / Learning', 'Relaxation', 'Wildlife / Nature', 'Archaeological / History'] },
  { name: 'best_time_to_visit',label: 'Best Time to Experience',      field_type: 'select',      required: 0, sort_order: 2, is_searchable: 1, is_filterable: 1, help: 'Recommended time to experience this establishment.', options: ['Sunrise', 'Morning', 'Midday', 'Sunset', 'Night', 'All Day'] },
  { name: 'duration_hours',    label: 'Recommended Duration (Hours)', field_type: 'text',        required: 0, sort_order: 3, is_searchable: 0, is_filterable: 0, help: 'How long should visitors allocate for this experience?' },
  { name: 'experience_tags',   label: 'Experience Tags',             field_type: 'multiselect', required: 0, sort_order: 4, is_searchable: 1, is_filterable: 1, help: 'Select specific activity tags.', options: ['Wellness', 'Hiking', 'Hot Springs', 'Safari', 'Guided Tour', 'Sandboarding', 'Handicrafts', 'Date Tasting', 'Traditional Food', 'Yoga', 'Meditation', 'Museum', 'Star Gazing', 'Camping'] },
];

const INVESTMENT_FIELDS = [
  { name: 'opportunity_title',       label: 'Investment Title',                  field_type: 'text',       required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'A compelling headline for this investment opportunity' },
  { name: 'opportunity_type',        label: 'Opportunity Type',                  field_type: 'select',     required: 1,  sort_order: 2,  is_searchable: 0, is_filterable: 1,  help: 'Category of investment', options: ['equity','partnership','franchise','joint_venture','sponsorship'] },
  { name: 'investment_amount_min',   label: 'Minimum Investment (USD)',           field_type: 'text',       required: 0, sort_order: 3,  is_searchable: 0, is_filterable: 1,  help: 'Lowest amount an investor can commit' },
  { name: 'investment_amount_max',   label: 'Maximum Investment (USD)',           field_type: 'text',       required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 1,  help: 'Upper limit of the investment round' },
  { name: 'expected_roi_percent',    label: 'Expected ROI (%)',                  field_type: 'text',       required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 1,  help: 'Projected return on investment' },
  { name: 'business_stage',          label: 'Business Stage',                    field_type: 'select',     required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 1,  help: 'Current phase of the business', options: ['startup','growth','expansion','mature','turnaround'] },
  { name: 'annual_revenue',          label: 'Annual Revenue (Optional)',          field_type: 'text',       required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'Current annual revenue figure' },
  { name: 'investment_status',       label: 'Investment Status',                 field_type: 'select',     required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 1,  help: 'Current state of the opportunity', options: ['open','closing_soon','closed','funded'] },
  { name: 'target_investors',        label: 'Target Number of Investors',        field_type: 'text',       required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'How many investors you are seeking' },
  { name: 'investment_description',  label: 'Investment Pitch',                  field_type: 'rich_text',  required: 0, sort_order: 10, is_searchable: 0, is_filterable: 0, help: 'Full investment pitch — tell the story' },
  { name: 'investment_highlights',   label: 'Key Highlights',                    field_type: 'textarea',   required: 0, sort_order: 11, is_searchable: 0, is_filterable: 0, help: 'Bullet-point selling points (one per line)' },
  { name: 'roi_potential',           label: 'ROI Breakdown / Potential',          field_type: 'textarea',   required: 0, sort_order: 12, is_searchable: 0, is_filterable: 0, help: 'Detailed ROI analysis or breakdown' },
  { name: 'visibility_on_main_site', label: 'Show on Main Investment Page',      field_type: 'boolean',    required: 0, sort_order: 13, is_searchable: 0, is_filterable: 0, help: 'Toggle to display on /investment-opportunities collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: 0, sort_order: 14, is_searchable: 0, is_filterable: 0, help: 'Pin this opportunity to the top of the page' },
  { name: 'contact_for_details',    label: 'Prefer Contact for Details',        field_type: 'boolean',    required: 0, sort_order: 15, is_searchable: 0, is_filterable: 0, help: 'Prompt investors to call rather than invest online' },
  { name: 'investment_contact',     label: 'Investment Contact Phone',          field_type: 'text',       required: 0, sort_order: 16, is_searchable: 0, is_filterable: 0, help: 'Direct contact number for investor inquiries' },
];

const AUCTION_FIELDS = [
  { name: 'auction_title',          label: 'Auction Title',                     field_type: 'text',       required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'Name of the auction listing' },
  { name: 'auction_type',           label: 'Auction Type',                      field_type: 'select',     required: 1,  sort_order: 2,  is_searchable: 0, is_filterable: 1,  help: 'What is being auctioned', options: ['asset','service','experience','property','license','equipment','rights'] },
  { name: 'starting_price',         label: 'Starting Price (USD)',              field_type: 'text',       required: 0, sort_order: 3,  is_searchable: 0, is_filterable: 1,  help: 'Opening bid amount' },
  { name: 'reserve_price',          label: 'Reserve Price (USD)',               field_type: 'text',       required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 0, help: 'Minimum price to sell (hidden from bidders)' },
  { name: 'buy_now_price',          label: 'Buy Now Price (Optional)',          field_type: 'text',       required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 1,  help: 'Instant purchase price — skip the bidding' },
  { name: 'auction_start',          label: 'Auction Start Date',                field_type: 'text',       required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 0, help: 'When bidding opens (YYYY-MM-DD)' },
  { name: 'auction_end',            label: 'Auction End Date',                  field_type: 'text',       required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'When bidding closes (YYYY-MM-DD)' },
  { name: 'auction_status',         label: 'Auction Status',                    field_type: 'select',     required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 1,  help: 'Current status', options: ['upcoming','live','ended','sold','cancelled'] },
  { name: 'auction_description',    label: 'Full Description',                  field_type: 'rich_text',  required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'Detailed description of the auctioned item/service' },
  { name: 'auction_terms',          label: 'Terms & Conditions',                field_type: 'textarea',   required: 0, sort_order: 10, is_searchable: 0, is_filterable: 0, help: 'Bidding terms, payment conditions, delivery terms' },
  { name: 'auction_contact',        label: 'Contact for Bidding',               field_type: 'text',       required: 0, sort_order: 11, is_searchable: 0, is_filterable: 0, help: 'Phone or email for auction inquiries' },
  { name: 'visibility_on_main_site',label: 'Show on Auction Collector Page',    field_type: 'boolean',    required: 0, sort_order: 12, is_searchable: 0, is_filterable: 0, help: 'Display on /auctions page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: 0, sort_order: 13, is_searchable: 0, is_filterable: 0, help: 'Pin to the top of the auctions page' },
];

const OFFERS_PACKAGES_FIELDS = [
  // Slot 1
  { name: 'offer_title',            label: 'Offer / Package Title',             field_type: 'text',       required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'Name of the offer or package' },
  { name: 'offer_type',             label: 'Offer Type',                        field_type: 'select',     required: 0, sort_order: 2,  is_searchable: 0, is_filterable: 1,  help: 'Category', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price',            label: 'Price (USD)',                       field_type: 'text',       required: 0, sort_order: 3,  is_searchable: 0, is_filterable: 1,  help: 'Package price or starting-from price' },
  { name: 'offer_original_price',   label: 'Original Price (before discount)',  field_type: 'text',       required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 0, help: 'Strikethrough price for comparison' },
  { name: 'offer_discount',         label: 'Discount %',                        field_type: 'text',       required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 1,  help: 'Percentage off the original price' },
  { name: 'offer_description',      label: 'Description',                       field_type: 'rich_text',  required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 0, help: 'Full description of what is included' },
  { name: 'offer_inclusions',       label: 'What\'s Included',                  field_type: 'textarea',   required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'Bullet-point list of inclusions (one per line)' },
  { name: 'offer_valid_from',       label: 'Valid From',                        field_type: 'text',       required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 0, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until',      label: 'Valid Until / Expiry',              field_type: 'text',       required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests',       label: 'Minimum Guests / Pax',             field_type: 'text',       required: 0, sort_order: 10, is_searchable: 0, is_filterable: 0, help: 'Minimum group size for this offer' },
  { name: 'offer_max_guests',       label: 'Maximum Guests / Pax',             field_type: 'text',       required: 0, sort_order: 11, is_searchable: 0, is_filterable: 0, help: 'Maximum capacity for this package' },
  { name: 'offer_cta_link',         label: 'Booking / CTA Link',               field_type: 'text',       required: 0, sort_order: 12, is_searchable: 0, is_filterable: 0, help: 'Direct link for booking or inquiry' },
  { name: 'offer_image',            label: 'Cover Image URL',                  field_type: 'text',       required: 0, sort_order: 13, is_searchable: 0, is_filterable: 0, help: 'Hero image for this offer card' },
  { name: 'visibility_on_main_site',label: 'Show on Main Offers Page',          field_type: 'boolean',    required: 0, sort_order: 14, is_searchable: 0, is_filterable: 0, help: 'Display on /offers collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: 0, sort_order: 15, is_searchable: 0, is_filterable: 0, help: 'Pin to top of the offers page' },

  // Slot 2
  { name: 'offer_title_2',            label: 'Offer 2: Title',                    field_type: 'text',       required: false, sort_order: 21, is_searchable: 1,  is_filterable: 0, help: 'Title for second offer slot' },
  { name: 'offer_type_2',             label: 'Offer 2: Type',                     field_type: 'select',     required: false, sort_order: 22, is_searchable: 0, is_filterable: 1,  help: 'Category of offer 2', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price_2',            label: 'Offer 2: Price (USD)',              field_type: 'text',       required: false, sort_order: 23, is_searchable: 0, is_filterable: 1,  help: 'Price of offer 2' },
  { name: 'offer_original_price_2',   label: 'Offer 2: Original Price (before discount)', field_type: 'text', required: false, sort_order: 24, is_searchable: 0, is_filterable: 0, help: 'Strikethrough price for offer 2' },
  { name: 'offer_discount_2',         label: 'Offer 2: Discount %',               field_type: 'text',       required: false, sort_order: 25, is_searchable: 0, is_filterable: 1,  help: 'Discount percentage of offer 2' },
  { name: 'offer_description_2',      label: 'Offer 2: Description',              field_type: 'rich_text',  required: false, sort_order: 26, is_searchable: 0, is_filterable: 0, help: 'Full description of offer 2' },
  { name: 'offer_inclusions_2',       label: 'Offer 2: What\'s Included',         field_type: 'textarea',   required: false, sort_order: 27, is_searchable: 0, is_filterable: 0, help: 'Inclusions for offer 2' },
  { name: 'offer_valid_from_2',       label: 'Offer 2: Valid From',               field_type: 'text',       required: false, sort_order: 28, is_searchable: 0, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until_2',      label: 'Offer 2: Valid Until / Expiry',     field_type: 'text',       required: false, sort_order: 29, is_searchable: 0, is_filterable: false, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests_2',       label: 'Offer 2: Minimum Guests / Pax',     field_type: 'text',       required: false, sort_order: 30, is_searchable: 0, is_filterable: false, help: 'Minimum guest count' },
  { name: 'offer_max_guests_2',       label: 'Offer 2: Maximum Guests / Pax',     field_type: 'text',       required: false, sort_order: 31, is_searchable: 0, is_filterable: false, help: 'Maximum capacity' },
  { name: 'offer_cta_link_2',         label: 'Offer 2: Booking / CTA Link',       field_type: 'text',       required: false, sort_order: 32, is_searchable: 0, is_filterable: false, help: 'Inquiry link' },
  { name: 'offer_image_2',            label: 'Offer 2: Cover Image URL',          field_type: 'text',       required: false, sort_order: 33, is_searchable: 0, is_filterable: false, help: 'Hero image' },
  { name: 'visibility_on_main_site_2',label: 'Offer 2: Show on Main Offers Page', field_type: 'boolean',    required: false, sort_order: 34, is_searchable: 0, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_2',            label: 'Offer 2: Feature on Top',           field_type: 'boolean',    required: false, sort_order: 35, is_searchable: 0, is_filterable: false, help: 'Pin to top' },

  // Slot 3
  { name: 'offer_title_3',            label: 'Offer 3: Title',                    field_type: 'text',       required: false, sort_order: 41, is_searchable: 1,  is_filterable: 0, help: 'Title for third offer slot' },
  { name: 'offer_type_3',             label: 'Offer 3: Type',                     field_type: 'select',     required: false, sort_order: 42, is_searchable: 0, is_filterable: 1,  help: 'Category of offer 3', options: ['package','special_offer','seasonal','group_deal','early_bird','last_minute','bundle','loyalty'] },
  { name: 'offer_price_3',            label: 'Offer 3: Price (USD)',              field_type: 'text',       required: false, sort_order: 43, is_searchable: 0, is_filterable: 1,  help: 'Price of offer 3' },
  { name: 'offer_original_price_3',   label: 'Offer 3: Original Price (before discount)', field_type: 'text', required: false, sort_order: 44, is_searchable: 0, is_filterable: 0, help: 'Strikethrough price for offer 3' },
  { name: 'offer_discount_3',         label: 'Offer 3: Discount %',               field_type: 'text',       required: false, sort_order: 45, is_searchable: 0, is_filterable: 1,  help: 'Discount percentage of offer 3' },
  { name: 'offer_description_3',      label: 'Offer 3: Description',              field_type: 'rich_text',  required: false, sort_order: 46, is_searchable: 0, is_filterable: 0, help: 'Full description of offer 3' },
  { name: 'offer_inclusions_3',       label: 'Offer 3: What\'s Included',         field_type: 'textarea',   required: false, sort_order: 47, is_searchable: 0, is_filterable: 0, help: 'Inclusions for offer 3' },
  { name: 'offer_valid_from_3',       label: 'Offer 3: Valid From',               field_type: 'text',       required: false, sort_order: 48, is_searchable: 0, is_filterable: false, help: 'Start date (YYYY-MM-DD)' },
  { name: 'offer_valid_until_3',      label: 'Offer 3: Valid Until / Expiry',     field_type: 'text',       required: false, sort_order: 49, is_searchable: 0, is_filterable: false, help: 'End date (YYYY-MM-DD)' },
  { name: 'offer_min_guests_3',       label: 'Offer 3: Minimum Guests / Pax',     field_type: 'text',       required: false, sort_order: 50, is_searchable: 0, is_filterable: false, help: 'Minimum guest count' },
  { name: 'offer_max_guests_3',       label: 'Offer 3: Maximum Guests / Pax',     field_type: 'text',       required: false, sort_order: 51, is_searchable: 0, is_filterable: false, help: 'Maximum capacity' },
  { name: 'offer_cta_link_3',         label: 'Offer 3: Booking / CTA Link',       field_type: 'text',       required: false, sort_order: 52, is_searchable: 0, is_filterable: false, help: 'Inquiry link' },
  { name: 'offer_image_3',            label: 'Offer 3: Cover Image URL',          field_type: 'text',       required: false, sort_order: 53, is_searchable: 0, is_filterable: false, help: 'Hero image' },
  { name: 'visibility_on_main_site_3',label: 'Offer 3: Show on Main Offers Page', field_type: 'boolean',    required: false, sort_order: 54, is_searchable: 0, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_3',            label: 'Offer 3: Feature on Top',           field_type: 'boolean',    required: false, sort_order: 55, is_searchable: 0, is_filterable: false, help: 'Pin to top' },
];

const DISCOUNTS_FIELDS = [
  // Slot 1
  { name: 'discount_name',          label: 'Discount Campaign Name',            field_type: 'text',       required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'Name of the discount campaign' },
  { name: 'discount_type',          label: 'Discount Type',                     field_type: 'select',     required: 1,  sort_order: 2,  is_searchable: 0, is_filterable: 1,  help: 'How the discount is applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value',         label: 'Discount Value',                    field_type: 'text',       required: 0, sort_order: 3,  is_searchable: 0, is_filterable: 1,  help: 'Amount or percentage of the discount' },
  { name: 'applies_to',             label: 'Applies To',                        field_type: 'select',     required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 1,  help: 'What the discount applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size',         label: 'Minimum Group Size',                field_type: 'text',       required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 0, help: 'For group discounts — minimum pax' },
  { name: 'season',                 label: 'Season / Period',                   field_type: 'select',     required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 1,  help: 'Which season this discount applies to', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from',             label: 'Valid From',                        field_type: 'text',       required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'Start date (YYYY-MM-DD)' },
  { name: 'valid_until',            label: 'Valid Until',                       field_type: 'text',       required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 0, help: 'Expiry date (YYYY-MM-DD)' },
  { name: 'discount_description',   label: 'Description / Terms',               field_type: 'textarea',   required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'Details and conditions of the discount' },
  { name: 'promo_code',             label: 'Promo Code (Optional)',             field_type: 'text',       required: 0, sort_order: 10, is_searchable: 0, is_filterable: 0, help: 'Coupon code visitors can use' },
  { name: 'discount_status',        label: 'Status',                            field_type: 'select',     required: 0, sort_order: 11, is_searchable: 0, is_filterable: 1,  help: 'Current state', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site',label: 'Show on Discounts Page',            field_type: 'boolean',    required: 0, sort_order: 12, is_searchable: 0, is_filterable: 0, help: 'Display on /discounts collector page' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: 0, sort_order: 13, is_searchable: 0, is_filterable: 0, help: 'Pin to top' },

  // Slot 2
  { name: 'discount_name_2',          label: 'Discount 2: Campaign Name',         field_type: 'text',       required: false, sort_order: 21, is_searchable: 1,  is_filterable: 0, help: 'Name of the discount campaign 2' },
  { name: 'discount_type_2',          label: 'Discount 2: Type',                  field_type: 'select',     required: false, sort_order: 22, is_searchable: 0, is_filterable: 1,  help: 'How applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value_2',         label: 'Discount 2: Value',                 field_type: 'text',       required: false, sort_order: 23, is_searchable: 0, is_filterable: 1,  help: 'Value of discount 2' },
  { name: 'applies_to_2',             label: 'Discount 2: Applies To',            field_type: 'select',     required: false, sort_order: 24, is_searchable: 0, is_filterable: 1,  help: 'Applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size_2',         label: 'Discount 2: Minimum Group Size',    field_type: 'text',       required: false, sort_order: 25, is_searchable: 0, is_filterable: false, help: 'Minimum group size' },
  { name: 'season_2',                 label: 'Discount 2: Season / Period',       field_type: 'select',     required: false, sort_order: 26, is_searchable: 0, is_filterable: 1,  help: 'Season', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from_2',             label: 'Discount 2: Valid From',            field_type: 'text',       required: false, sort_order: 27, is_searchable: 0, is_filterable: false, help: 'Start date' },
  { name: 'valid_until_2',            label: 'Discount 2: Valid Until',           field_type: 'text',       required: false, sort_order: 28, is_searchable: 0, is_filterable: false, help: 'Expiry date' },
  { name: 'discount_description_2',   label: 'Discount 2: Description / Terms',   field_type: 'textarea',   required: false, sort_order: 29, is_searchable: 0, is_filterable: false, help: 'Description' },
  { name: 'promo_code_2',             label: 'Discount 2: Promo Code',            field_type: 'text',       required: false, sort_order: 30, is_searchable: 0, is_filterable: false, help: 'Coupon code' },
  { name: 'discount_status_2',        label: 'Discount 2: Status',                field_type: 'select',     required: false, sort_order: 31, is_searchable: 0, is_filterable: true,  help: 'Status', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site_2',label: 'Discount 2: Show on Discounts Page', field_type: 'boolean',    required: false, sort_order: 32, is_searchable: 0, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_2',            label: 'Discount 2: Feature on Top',        field_type: 'boolean',    required: false, sort_order: 33, is_searchable: 0, is_filterable: false, help: 'Pin to top' },

  // Slot 3
  { name: 'discount_name_3',          label: 'Discount 3: Campaign Name',         field_type: 'text',       required: false, sort_order: 41, is_searchable: 1,  is_filterable: 0, help: 'Name of the discount campaign 3' },
  { name: 'discount_type_3',          label: 'Discount 3: Type',                  field_type: 'select',     required: false, sort_order: 42, is_searchable: 0, is_filterable: 1,  help: 'How applied', options: ['percent','fixed_amount','seasonal','early_bird','group','loyalty','reservation','flash_sale','student','senior'] },
  { name: 'discount_value_3',         label: 'Discount 3: Value',                 field_type: 'text',       required: false, sort_order: 43, is_searchable: 0, is_filterable: 1,  help: 'Value of discount 3' },
  { name: 'applies_to_3',             label: 'Discount 3: Applies To',            field_type: 'select',     required: false, sort_order: 44, is_searchable: 0, is_filterable: 1,  help: 'Applies to', options: ['all_services','specific_package','reservation','group_booking','repeat_customer','first_time','seasonal_stay'] },
  { name: 'min_group_size_3',         label: 'Discount 3: Minimum Group Size',    field_type: 'text',       required: false, sort_order: 45, is_searchable: 0, is_filterable: false, help: 'Minimum group size' },
  { name: 'season_3',                 label: 'Discount 3: Season / Period',       field_type: 'select',     required: false, sort_order: 46, is_searchable: 0, is_filterable: 1,  help: 'Season', options: ['all_year','winter','spring','summer','autumn','ramadan','holidays','off_peak','peak'] },
  { name: 'valid_from_3',             label: 'Discount 3: Valid From',            field_type: 'text',       required: false, sort_order: 47, is_searchable: 0, is_filterable: false, help: 'Start date' },
  { name: 'valid_until_3',            label: 'Discount 3: Valid Until',           field_type: 'text',       required: false, sort_order: 48, is_searchable: 0, is_filterable: false, help: 'Expiry date' },
  { name: 'discount_description_3',   label: 'Discount 3: Description / Terms',   field_type: 'textarea',   required: false, sort_order: 49, is_searchable: 0, is_filterable: false, help: 'Description' },
  { name: 'promo_code_3',             label: 'Discount 3: Promo Code',            field_type: 'text',       required: false, sort_order: 50, is_searchable: 0, is_filterable: false, help: 'Coupon code' },
  { name: 'discount_status_3',        label: 'Discount 3: Status',                field_type: 'select',     required: false, sort_order: 51, is_searchable: 0, is_filterable: true,  help: 'Status', options: ['active','scheduled','expired','paused'] },
  { name: 'visibility_on_main_site_3',label: 'Discount 3: Show on Discounts Page', field_type: 'boolean',    required: false, sort_order: 52, is_searchable: 0, is_filterable: false, help: 'Display on collector page' },
  { name: 'is_featured_3',            label: 'Discount 3: Feature on Top',        field_type: 'boolean',    required: false, sort_order: 53, is_searchable: 0, is_filterable: false, help: 'Pin to top' },
];

const SPONSORSHIP_FIELDS = [
  { name: 'sponsorship_title',      label: 'Sponsorship Title',                 field_type: 'text',       required: 1,  sort_order: 1,  is_searchable: 1,  is_filterable: 0, help: 'Name of the sponsorship package' },
  { name: 'sponsorship_type',       label: 'Sponsorship Type',                  field_type: 'select',     required: 0, sort_order: 2,  is_searchable: 0, is_filterable: 1,  help: 'Category', options: ['naming_rights','event_sponsor','media_partner','product_placement','community','environmental','cultural'] },
  { name: 'sponsorship_tier',       label: 'Sponsorship Tier',                  field_type: 'select',     required: 0, sort_order: 3,  is_searchable: 0, is_filterable: 1,  help: 'Package level', options: ['platinum','gold','silver','bronze','custom'] },
  { name: 'sponsorship_value',      label: 'Package Value (USD)',               field_type: 'text',       required: 0, sort_order: 4,  is_searchable: 0, is_filterable: 1,  help: 'Price of this sponsorship package' },
  { name: 'sponsorship_benefits',   label: 'Sponsor Benefits',                  field_type: 'textarea',   required: 0, sort_order: 5,  is_searchable: 0, is_filterable: 0, help: 'What sponsors receive (one benefit per line)' },
  { name: 'sponsorship_duration',   label: 'Duration',                          field_type: 'text',       required: 0, sort_order: 6,  is_searchable: 0, is_filterable: 0, help: 'How long the sponsorship lasts' },
  { name: 'sponsorship_description',label: 'Full Description',                  field_type: 'rich_text',  required: 0, sort_order: 7,  is_searchable: 0, is_filterable: 0, help: 'Detailed pitch for potential sponsors' },
  { name: 'visibility_on_main_site',label: 'Show on Main Site',                 field_type: 'boolean',    required: 0, sort_order: 8,  is_searchable: 0, is_filterable: 0, help: 'Display publicly' },
  { name: 'is_featured',            label: 'Feature on Top',                    field_type: 'boolean',    required: 0, sort_order: 9,  is_searchable: 0, is_filterable: 0, help: 'Pin to top' },
];

const SECTION_FIELDS_MAP = {
  'business_info':         BUSINESS_INFO_FIELDS,
  'vibe':                  VIBE_FIELDS,
  'experience':            EXPERIENCE_FIELDS,
  'investment-opportunity': INVESTMENT_FIELDS,
  'auction':               AUCTION_FIELDS,
  'offers-packages':       OFFERS_PACKAGES_FIELDS,
  'discounts-promotions':  DISCOUNTS_FIELDS,
  'sponsorship':           SPONSORSHIP_FIELDS,
};

async function main() {
  console.log("Connecting...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis',
    port: parseInt(process.env.DB_PORT || '3306')
  });
  console.log("Connected!");

  // Ensure SECTION_TEMPLATE dummy type exists for foreign key checks
  await connection.query(
    `INSERT IGNORE INTO business_types (id, name, is_parent) VALUES ('SECTION_TEMPLATE', 'Universal Section Template', 0)`
  );
  console.log("Verified SECTION_TEMPLATE business type!");

  const crypto = require('crypto');
  function makeFieldId(sectionId, name) {
    const full = `auto_${sectionId}_${name}`;
    if (full.length <= 36) return full;
    const hash = crypto.createHash('md5').update(`${sectionId}:${name}`).digest('hex');
    return `auto_${hash.slice(0, 31)}`;
  }

  // 1. Create or update sections
  for (const section of UNIVERSAL_SECTIONS) {
    const [existing] = await connection.query('SELECT id FROM sections WHERE id = ?', [section.id]);
    if (existing.length === 0) {
      await connection.query(
        `INSERT INTO sections 
         (id, name, icon, description, is_universal, active, display_order, sort_order) 
         VALUES (?, ?, ?, ?, 1, 1, ?, ?)`,
        [section.id, section.name, section.icon, section.description, section.sort_order, section.sort_order]
      );
      console.log(`Created Section: ${section.name}`);
    } else {
      await connection.query(
        `UPDATE sections SET name = ?, icon = ?, description = ?, sort_order = ?, is_universal = 1, active = 1 WHERE id = ?`,
        [section.name, section.icon, section.description, section.sort_order, section.id]
      );
      console.log(`Updated Section: ${section.name}`);
    }
  }

  // 2. Create fields for each section
  for (const [sectionId, fieldDefs] of Object.entries(SECTION_FIELDS_MAP)) {
    let created = 0;
    let updated = 0;

    for (const field of fieldDefs) {
      const fieldId = makeFieldId(sectionId, field.name);
      
      const [existing] = await connection.query(
        'SELECT id FROM form_fields WHERE id = ? OR (section_id = ? AND name = ?)',
        [fieldId, sectionId, field.name]
      );

      const optionsJson = field.options ? JSON.stringify(field.options) : null;
      const aclJson = JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] });

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO form_fields 
           (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, sort_order, help_text, options, section_origin, acl)
           VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'template', ?)`,
          [
            fieldId,
            sectionId,
            field.name,
            field.label,
            field.field_type,
            field.required ? 1 : 0,
            field.is_searchable ? 1 : 0,
            field.sort_order,
            field.help || null,
            optionsJson,
            aclJson
          ]
        );
        created++;
      } else {
        await connection.query(
          `UPDATE form_fields SET 
             label = ?, field_type = ?, required = ?, searchable = ?, sort_order = ?, help_text = ?, options = ?
           WHERE id = ?`,
          [
            field.label,
            field.field_type,
            field.required ? 1 : 0,
            field.is_searchable ? 1 : 0,
            field.sort_order,
            field.help || null,
            optionsJson,
            existing[0]?.id || fieldId
          ]
        );
        updated++;
      }
    }
    console.log(`Processed fields for section ${sectionId}: ${created} created, ${updated} updated`);
  }

  // Also verify that the structural auto-genesis DNA fields exist for the new vibe, experience, and business_info sections
  const structuralFields = [
    { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'boolean', order: -3, help: 'Toggle this to promote to homepage.' },
    { name: 'section_news', label: 'Carousel Cinematic Teaser', type: 'text', order: -2, help: 'Short text for carousel captions.' },
    { name: 'section_gallery', label: 'Section Gallery (Serialized Captions)', type: 'gallery', order: -1, help: 'Section photos with captions.' },
    { name: 'section_blog', label: 'Master Section Story (Rich Text)', type: 'rich_text', order: 1, help: 'Full rich-text story for this section.' }
  ];

  for (const sId of ['business_info', 'vibe', 'experience', 'investment-opportunity', 'auction', 'offers-packages', 'discounts-promotions', 'sponsorship']) {
    for (const field of structuralFields) {
      const fid = makeFieldId(sId, field.name);
      const [existing] = await connection.query('SELECT id FROM form_fields WHERE id = ?', [fid]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO form_fields 
          (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, required_feature, acl, validation)
          VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 0, ?, ?, 'template', 'hero_automation', ?, ?)`,
          [
            fid, sId, field.name, field.label, field.type, field.help, field.order,
            JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
            JSON.stringify({})
          ]
        );
        console.log(`Created structural field ${fid} for ${sId}`);
      }
    }
  }

  await connection.end();
  console.log("Done!");
}

main().catch(console.error);
