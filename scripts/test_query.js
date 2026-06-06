const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: '', database: 'siwa_oasis'
  });
  
  const id = 'test-journey-999';
  const name = 'Test Edit';
  const sql = `
    INSERT INTO journey_templates (
        id, name, description, subtitle, duration_days, themes, services,
        featured_image_url, icon, color, highlights, itinerary_details,
        featured_businesses, estimated_cost_usd_min, estimated_cost_usd_max,
        difficulty_level, best_season, max_group_size, admin_notes, display_order,
        is_investment_journey, investment_types, investment_description, minimum_investment_usd,
        estimated_roi_percent, investment_partner_name, investment_partner_contact,
        featured_properties, success_stories, requirements_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        subtitle = VALUES(subtitle),
        duration_days = VALUES(duration_days),
        themes = VALUES(themes),
        services = VALUES(services),
        featured_image_url = VALUES(featured_image_url),
        icon = VALUES(icon),
        color = VALUES(color),
        highlights = VALUES(highlights),
        itinerary_details = VALUES(itinerary_details),
        featured_businesses = VALUES(featured_businesses),
        estimated_cost_usd_min = VALUES(estimated_cost_usd_min),
        estimated_cost_usd_max = VALUES(estimated_cost_usd_max),
        difficulty_level = VALUES(difficulty_level),
        best_season = VALUES(best_season),
        max_group_size = VALUES(max_group_size),
        admin_notes = VALUES(admin_notes),
        display_order = VALUES(display_order),
        is_investment_journey = VALUES(is_investment_journey),
        investment_types = VALUES(investment_types),
        investment_description = VALUES(investment_description),
        minimum_investment_usd = VALUES(minimum_investment_usd),
        estimated_roi_percent = VALUES(estimated_roi_percent),
        investment_partner_name = VALUES(investment_partner_name),
        investment_partner_contact = VALUES(investment_partner_contact),
        featured_properties = VALUES(featured_properties),
        success_stories = VALUES(success_stories),
        requirements_text = VALUES(requirements_text)
  `;
  
  const params = [
      id, name, null, null, 3, '[]', '[]',
      null, null, null, '[]', '[]', '[]',
      null, null, 'moderate', null, null, null, 0,
      0, '[]', null, null, null, null, null,
      '[]', '[]', null
  ];
  
  try {
    await db.query(sql, params);
    console.log('✅ INSERT successful');
    
    // Now edit
    await db.query(sql, params);
    console.log('✅ EDIT successful');
  } catch (err) {
    console.error('❌ Query Error:', err.message);
  }
  db.end();
}
run();
