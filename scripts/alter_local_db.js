const mysql = require('mysql2/promise');

const sql = `
ALTER TABLE journey_templates
ADD COLUMN is_investment_journey BOOLEAN DEFAULT 0,
ADD COLUMN investment_types JSON,
ADD COLUMN investment_description TEXT,
ADD COLUMN minimum_investment_usd INT DEFAULT 0,
ADD COLUMN estimated_roi_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN investment_partner_name VARCHAR(255),
ADD COLUMN investment_partner_contact VARCHAR(255),
ADD COLUMN featured_properties JSON,
ADD COLUMN success_stories JSON,
ADD COLUMN requirements_text TEXT;
`;

async function run() {
  try {
    const dbLocal = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'siwa_oasis'
    });
    console.log('Connected to Local DB');
    await dbLocal.query(sql);
    console.log('✅ Local DB altered successfully.');
    dbLocal.end();
  } catch (err) {
    console.log('Local DB error (might be already altered):', err.message);
  }
}
run();
