import mysql from 'mysql2/promise';
import { prodConfig } from './db-config.js';

const parentSections = [
  'identity',
  'experience',
  'facilities',
  'testimonials',
  'location',
  'offers-packages',
];

const travelAgencySections = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_5_experiences',
  'sec_9_marketplace_catalog',
  'sec_8_connector',
  'location',
  'sec_10_testimonials_faqs',
];

const sectionIds = [...new Set([...parentSections, ...travelAgencySections])];
const connection = await mysql.createConnection(prodConfig);

try {
  await connection.beginTransaction();

  await connection.query(
    `UPDATE sections
     SET active = 1, show_on_public = 1, show_on_minisite = 1
     WHERE id IN (${sectionIds.map(() => '?').join(',')})`,
    sectionIds,
  );

  await connection.query(
    `UPDATE business_types
     SET sections = ?, own_sections = ?
     WHERE id = 'adventure'`,
    [JSON.stringify(parentSections), JSON.stringify(parentSections)],
  );

  await connection.query(
    `UPDATE business_types
     SET sections = ?, own_sections = ?
     WHERE id = 'travel_agency'`,
    [JSON.stringify(travelAgencySections), JSON.stringify(travelAgencySections)],
  );

  await connection.commit();
  console.log(`TRAVEL_REBUILD_COMPLETE: parent=adventure; child=travel_agency; sections=${sectionIds.length}`);
} catch (error) {
  await connection.rollback();
  console.error(`TRAVEL_REBUILD_FAILED:${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}