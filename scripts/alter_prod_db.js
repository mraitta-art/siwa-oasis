const mysql = require('mysql2/promise');
const { prodConfig, validateConfig } = require('./db-config');

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
  validateConfig(prodConfig, 'PROD');
  try {
    const dbProd = await mysql.createConnection(prodConfig);
    console.log('Connected to Prod DB');
    await dbProd.query(sql);
    console.log('✅ Prod DB altered successfully.');
    dbProd.end();
  } catch (err) {
    console.log('Prod DB error (might be already altered):', err.message);
  }
}
run();

