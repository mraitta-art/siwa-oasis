import mysql from 'mysql2/promise';
import { prodConfig } from './db-config.js';

const canonicalSections = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_3_facilities',
  'sec_4_gastronomy',
  'sec_5_experiences',
  'sec_6_guardian',
  'sec_7_investment',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
];

const legacySections = ['identity', 'experience', 'facilities', 'testimonials', 'location', 'offers-packages'];
const connection = await mysql.createConnection(prodConfig);

try {
  await connection.beginTransaction();

  await connection.query(
    `UPDATE sections SET active = 1, show_on_public = 1, show_on_minisite = 1 WHERE id IN (${canonicalSections.map(() => '?').join(',')})`,
    canonicalSections,
  );
  await connection.query(
    `UPDATE sections SET active = 0, show_on_public = 0, show_on_minisite = 0 WHERE id IN (${legacySections.map(() => '?').join(',')})`,
    legacySections,
  );
  await connection.query(
    `UPDATE business_types SET sections = ?, own_sections = ? WHERE id IN ('adventure', 'travel_agency')`,
    [JSON.stringify(canonicalSections), JSON.stringify(canonicalSections)],
  );

  await connection.commit();
  console.log(`CANONICAL_TRAVEL_COMPLETE: sections=${canonicalSections.length}; legacy_archived=${legacySections.length}`);
} catch (error) {
  await connection.rollback();
  console.error(`CANONICAL_TRAVEL_FAILED:${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}