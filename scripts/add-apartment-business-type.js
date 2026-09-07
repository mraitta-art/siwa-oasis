'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  try {
    const [parents] = await connection.query(
      'SELECT id, is_parent, active FROM business_types WHERE id = ?',
      ['accommodation']
    );
    if (!parents.length || !parents[0].is_parent || !parents[0].active) {
      throw new Error('Active accommodation parent category was not found.');
    }

    await connection.query(
      `INSERT INTO business_types
        (id, name, icon, icon_color, description, is_parent, parent_id, sections, own_sections, sort_order, active, default_template_id)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1, NULL)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        icon = VALUES(icon),
        icon_color = VALUES(icon_color),
        description = VALUES(description),
        is_parent = 0,
        parent_id = VALUES(parent_id),
        active = 1`,
      [
        'apartment_rental',
        'Apartment Rental',
        'fas fa-building',
        '#0ea5e9',
        'Furnished and serviced apartments available for short-term or long-term rental.',
        'accommodation',
        JSON.stringify(['basic', 'vibe', 'experience', 'location', 'gallery', 'offers', 'testimonials']),
        JSON.stringify([]),
        20
      ]
    );

    const [rows] = await connection.query(
      'SELECT id, name, parent_id, active FROM business_types WHERE id = ?',
      ['apartment_rental']
    );
    console.log(`APARTMENT_TYPE_READY:${JSON.stringify(rows[0])}`);
  } finally {
    await connection.end();
  }
})().catch(error => {
  console.error(`APARTMENT_TYPE_FAILED:${error.message}`);
  process.exit(1);
});
