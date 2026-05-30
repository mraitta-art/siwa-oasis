import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'siwa_oasis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function insertInvestmentTemplates() {
  const conn = await pool.getConnection();
  
  try {
    // Investment Template 1: Real Estate Investment Tour
    const template1 = {
      id: 'real-estate-investment-tour',
      name: 'Real Estate Investment Tour',
      description: 'Explore premium land and property opportunities in Siwa. This curated journey combines luxury desert experience with exclusive viewings of development projects, agricultural land, and residential properties. Meet with local developers, understand zoning regulations, and discover the investment potential of this emerging market.',
      subtitle: 'Land & Property Development Exploration',
      duration_days: 5,
      themes: JSON.stringify(['investment', 'real-estate', 'business']),
      services: JSON.stringify(['accommodation', 'food', 'transportation', 'business-meetings']),
      featured_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
      icon: 'fa-building',
      color: '#3b82f6',
      highlights: JSON.stringify(['Developer briefings', 'Land viewing tours', 'Legal & compliance workshop', 'Property valuation insights', 'Networking dinner with investors']),
      itinerary_details: JSON.stringify([]),
      featured_businesses: JSON.stringify([]),
      estimated_cost_usd_min: 3500,
      estimated_cost_usd_max: 6500,
      difficulty_level: 'moderate',
      best_season: 'October to May',
      max_group_size: 12,
      admin_notes: 'Premium investment journey - include site visits to major projects',
      display_order: 6,
      is_featured: 1,
      is_visible: 1,
      is_investment_journey: 1,
      investment_types: JSON.stringify(['real_estate', 'agriculture', 'business']),
      investment_description: 'Discover high-potential real estate and agricultural land opportunities in Siwa\'s growing economy. From residential plots to commercial development zones to organic farming estates, see firsthand why investors are turning to this emerging desert market.',
      minimum_investment_usd: 50000,
      estimated_roi_percent: 15,
      investment_partner_name: 'Siwa Development Consortium',
      investment_partner_contact: 'invest@siwaconsortium.com | +20 100 123 4567',
      featured_properties: JSON.stringify([
        {
          name: 'Oasis Ridge Residential Complex',
          location: 'North Siwa Development Zone',
          price_range: '$80K - $300K per unit',
          description: 'Luxury residential development with modern amenities'
        },
        {
          name: 'Agricultural Heritage Farms',
          location: 'South Siwa Oasis',
          price_range: '$50K - $150K per hectare',
          description: 'Organic date palm and olive cultivation opportunities'
        }
      ]),
      success_stories: JSON.stringify([
        {
          investor: 'Ahmed Hassan',
          country: 'Egypt',
          investment: '$120K in residential plot',
          year: 2021,
          result: 'Property appreciated 35% in 3 years, now valued at $162K'
        },
        {
          investor: 'European Consortium',
          country: 'Germany',
          investment: '$500K in agricultural land',
          year: 2020,
          result: 'Successfully growing organic dates, 18% annual ROI'
        }
      ]),
      requirements_text: 'Minimum investment $50K USD. Accredited investor status preferred. Passport required for all viewings. 48-hour notice for property site visits.',
    };

    // Investment Template 2: Timeshare & Vacation Ownership Opportunity
    const template2 = {
      id: 'timeshare-vacation-opportunity',
      name: 'Timeshare & Vacation Ownership Experience',
      description: 'Explore the luxury timeshare and vacation property ownership model in Siwa. Experience premium resort amenities, meet with fractional ownership specialists, and learn how to secure guaranteed vacation time while building equity. This journey combines relaxation with financial planning.',
      subtitle: 'Luxury Vacation Ownership & Resort Investment',
      duration_days: 4,
      themes: JSON.stringify(['investment', 'luxury', 'wellness']),
      services: JSON.stringify(['luxury-accommodation', 'fine-dining', 'resort-amenities']),
      featured_image_url: 'https://images.unsplash.com/photo-1551632786-de41ec16a21d?q=80&w=800',
      icon: 'fa-calendar-check',
      color: '#ec4899',
      highlights: JSON.stringify(['5-star resort tour', 'Timeshare presentation', 'Financial advisor consultation', 'Sunset spa treatment', 'Exclusive investment cocktail']),
      itinerary_details: JSON.stringify([]),
      featured_businesses: JSON.stringify([]),
      estimated_cost_usd_min: 2000,
      estimated_cost_usd_max: 4000,
      difficulty_level: 'easy',
      best_season: 'Year-round',
      max_group_size: 20,
      admin_notes: 'Popular with families and couples - relaxation + investment',
      display_order: 7,
      is_featured: 1,
      is_visible: 1,
      is_investment_journey: 1,
      investment_types: JSON.stringify(['timeshare', 'vacation_ownership', 'hospitality']),
      investment_description: 'Own premium vacation weeks at world-class desert resorts without the burden of full property ownership. Choose your preferred dates, lock in pricing, and enjoy guaranteed access to luxury accommodations. Vacation ownership provides both lifestyle benefits and investment appreciation.',
      minimum_investment_usd: 15000,
      estimated_roi_percent: 8,
      investment_partner_name: 'Siwa Resorts International',
      investment_partner_contact: 'timeshare@siwaresorts.com | +20 100 988 7654',
      featured_properties: JSON.stringify([
        {
          name: 'Oasis Palace Resort - Desert Oasis Wing',
          location: 'Central Siwa',
          price_range: '$15K - $45K per timeshare',
          description: 'Beachfront luxury with 2-3 week annual ownership options'
        },
        {
          name: 'Siwa Heritage Villas - Elite Membership',
          location: 'Oasis Valley',
          price_range: '$20K - $60K per fractional share',
          description: 'Exclusive villas with chef, spa, and concierge services'
        }
      ]),
      success_stories: JSON.stringify([
        {
          investor: 'Maria Santos',
          country: 'Portugal',
          investment: '$25K timeshare at Oasis Palace',
          year: 2019,
          result: 'Vacationed annually for 5 years, property now worth $32K - 28% appreciation'
        },
        {
          investor: 'UK Family Trust',
          country: 'United Kingdom',
          investment: '$40K for 2-week annual access',
          year: 2022,
          result: 'Rents out 1 week annually to cover costs, family uses remaining weeks'
        }
      ]),
      requirements_text: 'Minimum 18 years old. Credit check required. Valid passport for international investors. Flexibility required to maintain vacation schedule. 10% annual maintenance fees apply.',
    };

    console.log('Inserting investment templates...\n');

    // Insert template 1
    await conn.query(
      `INSERT INTO journey_templates (
        id, name, description, subtitle, duration_days, themes, services, featured_image_url, icon, color,
        highlights, itinerary_details, featured_businesses, estimated_cost_usd_min, estimated_cost_usd_max,
        difficulty_level, best_season, max_group_size, admin_notes, display_order, is_featured, is_visible,
        is_investment_journey, investment_types, investment_description, minimum_investment_usd, estimated_roi_percent,
        investment_partner_name, investment_partner_contact, featured_properties, success_stories, requirements_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), description = VALUES(description), is_investment_journey = VALUES(is_investment_journey)`,
      [
        template1.id, template1.name, template1.description, template1.subtitle, template1.duration_days,
        template1.themes, template1.services, template1.featured_image_url, template1.icon, template1.color,
        template1.highlights, template1.itinerary_details, template1.featured_businesses,
        template1.estimated_cost_usd_min, template1.estimated_cost_usd_max, template1.difficulty_level,
        template1.best_season, template1.max_group_size, template1.admin_notes, template1.display_order,
        template1.is_featured, template1.is_visible, template1.is_investment_journey, template1.investment_types,
        template1.investment_description, template1.minimum_investment_usd, template1.estimated_roi_percent,
        template1.investment_partner_name, template1.investment_partner_contact, template1.featured_properties,
        template1.success_stories, template1.requirements_text
      ]
    );
    console.log('✓ Template 1: Real Estate Investment Tour - Inserted');

    // Insert template 2
    await conn.query(
      `INSERT INTO journey_templates (
        id, name, description, subtitle, duration_days, themes, services, featured_image_url, icon, color,
        highlights, itinerary_details, featured_businesses, estimated_cost_usd_min, estimated_cost_usd_max,
        difficulty_level, best_season, max_group_size, admin_notes, display_order, is_featured, is_visible,
        is_investment_journey, investment_types, investment_description, minimum_investment_usd, estimated_roi_percent,
        investment_partner_name, investment_partner_contact, featured_properties, success_stories, requirements_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), description = VALUES(description), is_investment_journey = VALUES(is_investment_journey)`,
      [
        template2.id, template2.name, template2.description, template2.subtitle, template2.duration_days,
        template2.themes, template2.services, template2.featured_image_url, template2.icon, template2.color,
        template2.highlights, template2.itinerary_details, template2.featured_businesses,
        template2.estimated_cost_usd_min, template2.estimated_cost_usd_max, template2.difficulty_level,
        template2.best_season, template2.max_group_size, template2.admin_notes, template2.display_order,
        template2.is_featured, template2.is_visible, template2.is_investment_journey, template2.investment_types,
        template2.investment_description, template2.minimum_investment_usd, template2.estimated_roi_percent,
        template2.investment_partner_name, template2.investment_partner_contact, template2.featured_properties,
        template2.success_stories, template2.requirements_text
      ]
    );
    console.log('✓ Template 2: Timeshare & Vacation Ownership Experience - Inserted');

    // Verify
    const [count] = await conn.query(
      'SELECT COUNT(*) as total, SUM(is_investment_journey) as investment_count FROM journey_templates'
    );
    console.log(`\n✓ Total journey templates: ${count[0].total}`);
    console.log(`✓ Investment journeys: ${count[0].investment_count}`);

  } catch (error) {
    console.error('✗ Failed to insert templates:', error.message);
    process.exit(1);
  } finally {
    await conn.release();
    await pool.end();
  }
}

insertInvestmentTemplates();
