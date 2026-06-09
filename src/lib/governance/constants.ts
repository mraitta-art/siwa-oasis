// ================================================================
// SIWA OASIS: Governance Constants
// Ported from siwa-oasis-master.html — all 7 RBAC tiers,
// 17 field types, website components, card layouts/fields,
// and Siwa-specific definitions.
// ================================================================

export const ROLES = {
  super_admin:   { level: 1, name: 'Super Admin',   permissions: ['*'] },
  content_admin: { level: 2, name: 'Content Admin',  permissions: ['manage_types', 'manage_sections', 'manage_forms', 'manage_cards', 'manage_website', 'manage_policies'] },
  sales_manager: { level: 3, name: 'Sales Manager',  permissions: ['view_all_businesses', 'approve_upgrades', 'assign_tiers', 'create_businesses', 'view_sales_stats'] },
  support_agent: { level: 4, name: 'Support Agent',  permissions: ['view_businesses', 'edit_contact_info'] },
  salesman:      { level: 5, name: 'Salesman',       permissions: ['create_free_businesses', 'submit_upgrades', 'view_own_clients'] },
  vendor:        { level: 6, name: 'Vendor',         permissions: ['manage_own_business', 'request_upgrades', 'upload_images'] },
  public:        { level: 7, name: 'Public',         permissions: ['browse', 'search', 'claim_businesses'] },
} as const;

export type RoleKey = keyof typeof ROLES;

export const FIELD_TYPES = {
  text:           { name: 'Short Text',         icon: 'fa-font',         hasOptions: false },
  textarea:       { name: 'Long Text / Teaser', icon: 'fa-align-left',   hasOptions: false },
  rich_text:      { name: 'Advanced Narrative', icon: 'fa-feather',      hasOptions: false },
  number:         { name: 'Number / Price',     icon: 'fa-hashtag',      hasOptions: false },
  checkbox_group: { name: 'Multiple Choice',    icon: 'fa-check-double', hasOptions: true  },
  select:         { name: 'Dropdown Menu',      icon: 'fa-caret-down',   hasOptions: true  },
  multiselect:    { name: 'Multi-Select Tags',  icon: 'fa-tasks',        hasOptions: true  },
  url:            { name: 'Web Link',           icon: 'fa-link',         hasOptions: false },
  map:            { name: 'Location & Altitude', icon: 'fa-map-marker-alt', hasOptions: false },
  gallery:        { name: 'Media Gallery',      icon: 'fa-images',       hasOptions: true  },
  youtube:        { name: 'YouTube Cinematic',  icon: 'fa-video',        hasOptions: false },
  action_button:  { name: 'Call to Action',     icon: 'fa-bolt',         hasOptions: false },
  star_rating:    { name: 'Star Rating',        icon: 'fa-star',         hasOptions: false },
  boolean:        { name: 'Binary Toggle',      icon: 'fa-toggle-on',    hasOptions: false },
  tel:            { name: 'Telephone',          icon: 'fa-phone',        hasOptions: false },
  email:          { name: 'Email Address',      icon: 'fa-envelope',     hasOptions: false },
  component:      { name: 'Interactive Component', icon: 'fa-cube',       hasOptions: true  },
} as const;

export type FieldTypeKey = keyof typeof FIELD_TYPES;

export const COMPONENTS = {
  header: {
    navigation:    { name: 'Navigation Bar',          icon: 'fa-bars',          category: 'navigation' },
    hero:          { name: 'Hero Section',             icon: 'fa-image',         category: 'media'      },
    logo:          { name: 'Logo Area',                icon: 'fa-heading',       category: 'navigation' },
    search_bar:    { name: 'Site Search Bar',          icon: 'fa-search',        category: 'navigation' },
    access_button: { name: 'Login/Dashboard Button',   icon: 'fa-user-circle',   category: 'navigation' },
  },
  body: {
    gallery:             { name: 'Photo Gallery',               icon: 'fa-images',       category: 'media'       },
    testimonials:        { name: 'Testimonials Area',            icon: 'fa-quote-left',   category: 'content'     },
    services:            { name: 'Services Grid',                icon: 'fa-briefcase',    category: 'content'     },
    blog:                { name: 'Recent Blog Posts',             icon: 'fa-newspaper',    category: 'content'     },
    map:                 { name: 'Interactive Map',              icon: 'fa-map-marked-alt', category: 'interactive' },
    carousel:            { name: 'Media Carousel',               icon: 'fa-images',       category: 'media'       },
    video:               { name: 'Universal Video Embed',        icon: 'fa-video',        category: 'media'       },
    features:            { name: 'Feature Highlights',           icon: 'fa-star',         category: 'content'     },
    cta_banner:          { name: 'Call to Action Banner',        icon: 'fa-bullhorn',     category: 'interactive' },
    newsletter:          { name: 'Newsletter Signup',            icon: 'fa-paper-plane',  category: 'interactive' },
    hero_carousel:       { name: 'Cinematic Hero Carousel',     icon: 'fa-film',         category: 'media',       hasSlides: true, description: 'Full-screen carousel with YouTube, images, captions & CTAs' },
    cinematic_carousel:  { name: 'Cinematic Portal Carousel',   icon: 'fa-film',         category: 'media',       hasSlides: true },
  },
  footer: {
    contact:   { name: 'Contact Information', icon: 'fa-envelope',   category: 'navigation'  },
    social:    { name: 'Social Media Links',  icon: 'fa-share-alt',  category: 'interactive' },
    copyright: { name: 'Copyright Bar',       icon: 'fa-copyright',  category: 'navigation'  },
  },
} as const;

export const CARD_LAYOUTS = {
  compact:  { id: 'compact',  name: 'Compact',   icon: 'fa-th-large', description: 'Minimal info'       },
  standard: { id: 'standard', name: 'Standard',  icon: 'fa-th',       description: 'Balanced layout'    },
  detailed: { id: 'detailed', name: 'Detailed',  icon: 'fa-th-list',  description: 'Full info'          },
  hero:     { id: 'hero',     name: 'Hero Card', icon: 'fa-image',    description: 'Large image overlay' },
  data_rich: { id: 'data_rich', name: 'Data-Rich', icon: 'fa-tags',     description: 'Highlight tags & vibe' },
} as const;

export const CARD_FIELDS = {
  title:        { displayName: 'Title',          section: 'header', defaultShow: true  },
  image:        { displayName: 'Main Image',     section: 'header', defaultShow: true  },
  rating:       { displayName: 'Rating',         section: 'header', defaultShow: true  },
  category:     { displayName: 'Category',       section: 'header', defaultShow: true  },
  price:        { displayName: 'Price',          section: 'body',   defaultShow: true  },
  description:  { displayName: 'Description',    section: 'body',   defaultShow: true  },
  location:     { displayName: 'Location',       section: 'body',   defaultShow: false },
  contact:      { displayName: 'Contact Info',   section: 'body',   defaultShow: false },
  availability: { displayName: 'Availability',   section: 'body',   defaultShow: false },
  tags:         { displayName: 'Tags',           section: 'footer', defaultShow: false },
  cta:          { displayName: 'Call-to-Action',  section: 'footer', defaultShow: true  },
} as const;

export const SIWA_DEFS = {
  propertyTypes: [
    { id: 'luxury_hotel',  name: 'Luxury Hotel',              icon: 'fa-hotel',      category: 'hotel'       },
    { id: 'boutique_hotel', name: 'Boutique Hotel',            icon: 'fa-hotel',      category: 'hotel'       },
    { id: 'private_villa', name: 'Private Villa',              icon: 'fa-home',       category: 'villa'       },
    { id: 'siwan_house',   name: 'Traditional Siwan House',    icon: 'fa-archway',    category: 'traditional' },
    { id: 'kertshef_house', name: 'Kertshef House',            icon: 'fa-cube',       category: 'traditional' },
    { id: 'desert_camp',   name: 'Desert Camp',                icon: 'fa-campground', category: 'camp'        },
    { id: 'eco_camp',      name: 'Eco Camp',                   icon: 'fa-leaf',       category: 'camp'        },
  ],
  architectureStyles: [
    { id: 'traditional_kertshef', name: 'Traditional Kertshef',  features: 'natural insulation,authentic'    },
    { id: 'restored_kertshef',    name: 'Restored Kertshef',     features: 'heritage,modern comfort'         },
    { id: 'modern_kertshef',      name: 'Modern Kertshef Fusion', features: 'fusion,modern design'           },
    { id: 'contemporary_modern',  name: 'Contemporary Modern',   features: 'modern,minimalist'               },
    { id: 'fully_eco',            name: 'Fully Eco / Off-Grid',  features: 'solar,sustainable,off_grid'      },
  ],
  experienceTypes: [
    { id: 'romantic',   name: 'Romantic / Honeymoon',  icon: 'fa-heart',    color: '#e74c3c' },
    { id: 'family',     name: 'Family Friendly',       icon: 'fa-users',    color: '#3498db' },
    { id: 'adventure',  name: 'Adventure',             icon: 'fa-mountain', color: '#e67e22' },
    { id: 'cultural',   name: 'Cultural / Heritage',   icon: 'fa-landmark', color: '#9b59b6' },
    { id: 'luxury',     name: 'Luxury',                icon: 'fa-gem',      color: '#D4AF37' },
    { id: 'meditation', name: 'Meditation / Wellness', icon: 'fa-spa',      color: '#27ae60' },
  ],
  amenities: [
    { id: 'private_pool',     name: 'Private Pool',  icon: 'fa-swimmer'  },
    { id: 'wifi',             name: 'WiFi',          icon: 'fa-wifi'     },
    { id: 'parking',          name: 'Parking',       icon: 'fa-parking'  },
    { id: 'spa',              name: 'Spa',           icon: 'fa-spa'      },
    { id: 'restaurant_onsite', name: 'Restaurant',   icon: 'fa-utensils' },
    { id: 'ac',               name: 'Air Conditioning', icon: 'fa-snowflake' },
    { id: 'garden',           name: 'Garden',        icon: 'fa-leaf'     },
  ],
  viewTypes: [
    { id: 'dune_view',   name: 'Dune View',    icon: 'fa-mountain' },
    { id: 'oasis_view',  name: 'Oasis View',   icon: 'fa-tree'     },
    { id: 'sunset_view', name: 'Sunset View',  icon: 'fa-sun'      },
    { id: 'star_gazing', name: 'Star Gazing',  icon: 'fa-star'     },
  ],
  sectionStandards: [
    { name: 'section_gallery', label: 'Visual Gallery',        field_type: 'gallery',   sort_order: 0 },
    { name: 'section_blog',    label: 'Section Blog / Story',   field_type: 'rich_text', sort_order: 1 },
    { name: 'feature_on_main', label: 'Feature on Main Page',  field_type: 'boolean',   sort_order: 2 },
    { name: 'section_news',    label: 'Latest News Teaser',     field_type: 'textarea',  sort_order: 3 },
    { name: 'show_on_minisite', label: 'Show on Minisite',      field_type: 'boolean',   sort_order: 4 },
  ],
  sectionIcons: [
    'fa-cubes', 'fa-map', 'fa-info-circle', 'fa-camera-retro', 'fa-hotel', 'fa-concierge-bell',
    'fa-box', 'fa-star', 'fa-bed', 'fa-wifi', 'fa-campground', 'fa-fire',
    'fa-cube', 'fa-clock', 'fa-feather', 'fa-utensils', 'fa-chair', 'fa-mug-hot',
    'fa-route', 'fa-hourglass', 'fa-language', 'fa-tags', 'fa-water', 'fa-landmark'
  ],
  fieldLibrary: [
    { id: 'text', name: 'Short Text', icon: 'fa-font', color: '#3b82f6' },
    { id: 'textarea', name: 'Long Text / Teaser', icon: 'fa-align-left', color: '#8b5cf6' },
    { id: 'rich_text', name: 'Rich Text Blog', icon: 'fa-paragraph', color: '#7c3aed' },
    { id: 'number', name: 'Number / Price', icon: 'fa-hashtag', color: '#10b981' },
    { id: 'select', name: 'Dropdown List', icon: 'fa-list-ul', color: '#f59e0b' },
    { id: 'multiselect', name: 'Multi-Select Tags', icon: 'fa-tasks', color: '#d946ef' },
    { id: 'checkbox_group', name: 'Checkbox Group', icon: 'fa-check-double', color: '#8b5cf6' },
    { id: 'checkbox', name: 'Yes/No Toggle', icon: 'fa-check-square', color: '#06b6d4' },
    { id: 'gallery', name: 'Image Gallery', icon: 'fa-images', color: '#ec4899' },
    { id: 'url', name: 'Link / URL', icon: 'fa-link', color: '#64748b' },
    { id: 'email', name: 'Email Address', icon: 'fa-envelope', color: '#0ea5e9' },
    { id: 'phone', name: 'Phone Number', icon: 'fa-phone', color: '#16a34a' },
    { id: 'component', name: 'Interactive Component', icon: 'fa-cube', color: '#6366f1' }
  ]
} as const;
