const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const NEW_TYPES = [
  // 🏛️ Investment & Real Estate (Parent category)
  {
    id: 'investment_parent',
    name: 'Investment & Capital Development',
    icon: 'fa-city',
    icon_color: '#d97706',
    description: 'Capital projects, agricultural developments, and ecolodge land opportunities',
    is_parent: 1,
    parent_id: null
  },
  // Subcategories
  {
    id: 'land_investment',
    name: 'Agricultural & Land Investment',
    icon: 'fa-seedling',
    icon_color: '#16a34a',
    description: 'Olive groves, date farms, and water well investment opportunities',
    is_parent: 0,
    parent_id: 'investment_parent'
  },
  {
    id: 'ecolodge_development',
    name: 'Ecolodge & Tour Development',
    icon: 'fa-hotel',
    icon_color: '#eab308',
    description: 'Hospitality development, tourist camp builds, and joint ventures',
    is_parent: 0,
    parent_id: 'investment_parent'
  },
  {
    id: 'residential_sales',
    name: 'Real Estate & Long-Term Rentals',
    icon: 'fa-home',
    icon_color: '#3b82f6',
    description: 'Traditional mud-brick house sales and long-term rental villas in Siwa',
    is_parent: 0,
    parent_id: 'investment_parent'
  },

  // ✈️ Logistics & Transfers additions
  {
    id: 'airport_transfer',
    name: 'Long-Range Transfers & Car Rental',
    icon: 'fa-car-side',
    icon_color: '#ef4444',
    description: 'Cairo, Alexandria, and Matrouh airport shuttle transfers to Siwa Oasis',
    is_parent: 0,
    parent_id: 'logistics'
  },
  {
    id: 'local_guide_service',
    name: 'Siwan Guide & Translation Services',
    icon: 'fa-map-marked-alt',
    icon_color: '#8b5cf6',
    description: 'Licensed local desert guides, translators, and historic storytellers',
    is_parent: 0,
    parent_id: 'logistics'
  },

  // 🧘 Wellness & Spa additions
  {
    id: 'yoga_meditation',
    name: 'Yoga & Meditation Retreats',
    icon: 'fa-peace',
    icon_color: '#ec4899',
    description: 'Stargazing yoga, sand dune meditation, and spiritual detox retreats',
    is_parent: 0,
    parent_id: 'wellness'
  },
  {
    id: 'spa_massage',
    name: 'Natural Spa & Massage Therapy',
    icon: 'fa-hands',
    icon_color: '#14b8a6',
    description: 'Salt spring scrubs, warm oil massage, and traditional thermal therapies',
    is_parent: 0,
    parent_id: 'wellness'
  },

  // 🍽️ Dining & Gastronomy additions (under parent: food)
  {
    id: 'fine_dining',
    name: 'Fine Dining & Sunset Dinners',
    icon: 'fa-utensils',
    icon_color: '#ea580c',
    description: 'Candlelit gourmet dinners, salt lake sunset restaurants, and organic farm dining',
    is_parent: 0,
    parent_id: 'food'
  },
  {
    id: 'desert_dining_event',
    name: 'Bedouin Desert Dinners & Camps',
    icon: 'fa-campground',
    icon_color: '#b45309',
    description: 'Traditional slow-cooked Abu-Mardam pits, campfire dinners, and desert music events',
    is_parent: 0,
    parent_id: 'food'
  },
  {
    id: 'street_food_stall',
    name: 'Local Street Food & Market Stalls',
    icon: 'fa-hotdog',
    icon_color: '#ca8a04',
    description: 'Shali market area local street grills, tea stalls, and quick eats',
    is_parent: 0,
    parent_id: 'food'
  },

  // 🎁 Local Products & Crafts additions (under parent: crafts)
  {
    id: 'salt_crafts',
    name: 'Salt Crystal Lamps & Decor',
    icon: 'fa-gem',
    icon_color: '#f43f5e',
    description: 'Authentic Siwa salt block lanterns, crystal lamps, and home decor workshops',
    is_parent: 0,
    parent_id: 'crafts'
  },
  {
    id: 'herbal_cosmetics',
    name: 'Herbs & Organic Cosmetics',
    icon: 'fa-mortar-pestle',
    icon_color: '#0d9488',
    description: 'Siwan medicinal herbs, organic lemongrass, natural oils, and date-seed cosmetics',
    is_parent: 0,
    parent_id: 'crafts'
  },
  {
    id: 'date_packers',
    name: 'Dates & Olives Packaging Wholesalers',
    icon: 'fa-boxes',
    icon_color: '#4f46e5',
    description: 'Siwa date factories, packaging lines, and bulk olive distributors for global shipping',
    is_parent: 0,
    parent_id: 'crafts'
  }
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  });

  console.log("Connected to database. Seeding additional trip planner categories...");

  for (const t of NEW_TYPES) {
    const [existing] = await connection.query(
      'SELECT id FROM business_types WHERE id = ?',
      [t.id]
    );

    if (existing.length === 0) {
      await connection.query(
        `INSERT INTO business_types (id, name, icon, icon_color, description, is_parent, parent_id, sections, own_sections, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '[]', 90)`,
        [t.id, t.name, t.icon, t.icon_color, t.description, t.is_parent, t.parent_id]
      );
      console.log(`+ Created typology: ${t.name} (${t.id})`);
    } else {
      await connection.query(
        `UPDATE business_types SET name = ?, icon = ?, icon_color = ?, description = ?, is_parent = ?, parent_id = ?
         WHERE id = ?`,
        [t.name, t.icon, t.icon_color, t.description, t.is_parent, t.parent_id, t.id]
      );
      console.log(`~ Updated typology: ${t.name} (${t.id})`);
    }
  }

  await connection.end();
  console.log("Seeding complete successfully!");
}

main().catch(console.error);
