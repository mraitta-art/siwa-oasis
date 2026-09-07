'use strict';

const { prodConfig } = require('./db-config');
const mysql = require('mysql2/promise');

if (process.env.RESET_CONFIRMED !== 'YES') {
  throw new Error('Refusing reset. Set RESET_CONFIRMED=YES after verifying the backup.');
}

const businessOwnedTables = [
  'business_media',
  'business_posts',
  'business_section_controls',
  'field_requests',
  'investment_contact_verifications',
  'lead_conversion_log',
  'page_views',
  'section_blogs',
  'upgrade_requests',
  'vendor_gallery'
];

const vendorOwnedTables = [
  'revenue_tracking',
  'vendor_sales_pipeline',
  'visitor_recommendations'
];

async function tableExists(connection, table) {
  const [rows] = await connection.query('SHOW TABLES LIKE ?', [table]);
  return rows.length > 0;
}

(async () => {
  const connection = await mysql.createConnection(prodConfig);
  try {
    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of businessOwnedTables) {
      if (await tableExists(connection, table)) {
        const [result] = await connection.query(`DELETE FROM \`${table}\``);
        console.log(`CLEARED_BUSINESS_TABLE ${table}:${result.affectedRows}`);
      }
    }

    for (const table of vendorOwnedTables) {
      if (await tableExists(connection, table)) {
        const [result] = await connection.query(`DELETE FROM \`${table}\``);
        console.log(`CLEARED_VENDOR_TABLE ${table}:${result.affectedRows}`);
      }
    }

    if (await tableExists(connection, 'businesses')) {
      const [result] = await connection.query('DELETE FROM businesses');
      console.log(`CLEARED businesses:${result.affectedRows}`);
    }

    if (await tableExists(connection, 'locations')) {
      const [result] = await connection.query('DELETE FROM locations');
      console.log(`CLEARED locations:${result.affectedRows}`);
    }

    const protectedRoles = ['super_admin', 'content_admin', 'sales_manager', 'support_agent'];
    const rolePlaceholders = protectedRoles.map(() => '?').join(',');
    const [profilesToDelete] = await connection.query(
      `SELECT id FROM profiles WHERE role NOT IN (${rolePlaceholders})`,
      protectedRoles
    );
    const profileIds = profilesToDelete.map(profile => profile.id);
    const profilePlaceholders = profileIds.map(() => '?').join(',');

    if (profileIds.length > 0) {
      const [profileResult] = await connection.query(
        `DELETE FROM profiles WHERE id IN (${profilePlaceholders})`,
        profileIds
      );
      console.log(`DELETED_NON_ADMIN_PROFILES:${profileResult.affectedRows}`);
    } else {
      console.log('DELETED_NON_ADMIN_PROFILES:0');
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    console.log('RESET_COMPLETE:businesses_and_non_admin_accounts_removed');
  } catch (error) {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    await connection.rollback();
    console.error(`RESET_FAILED:${error.message}`);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
})();
