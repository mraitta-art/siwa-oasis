#!/usr/bin/env node
/**
 * Points the platform logo setting at the generated SiWiFy emblem.
 *
 * The header reads `site_settings.logo_url` from `website_configs`, so a stale
 * Cloudinary upload there wins over the code default. This rewrites only the
 * `logo_url` / `logo_height` keys and leaves every other setting untouched.
 *
 * Usage:
 *   node scripts/update-site-logo.js --dry-run
 *   node scripts/update-site-logo.js
 */
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const LOGO_URL = '/brand/siwify-emblem-128.png?v=siwify-gold-2026';
const LOGO_HEIGHT = 34;
const CONFIG_TYPE = 'website_main';

const dryRun = process.argv.includes('--dry-run');

function connectionOptions() {
  const ssl =
    process.env.DB_SSL === 'true' ||
    String(process.env.DB_HOST || '').includes('tidbcloud')
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : undefined;

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis',
    charset: 'utf8mb4',
    ssl,
    connectTimeout: 20000,
  };
}

async function main() {
  const connection = await mysql.createConnection(connectionOptions());
  try {
    const [rows] = await connection.execute(
      'SELECT type, config FROM website_configs WHERE type = ? LIMIT 1',
      [CONFIG_TYPE]
    );
    if (!rows.length) {
      throw new Error(`No website_configs row found for type "${CONFIG_TYPE}".`);
    }

    const row = rows[0];
    const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config || {};
    const settings = config.site_settings || {};

    console.log('Before:', {
      logo_url: settings.logo_url || '(empty)',
      logo_height: settings.logo_height || '(empty)',
    });

    if (dryRun) {
      console.log('Dry run — nothing written.');
      return;
    }

    const nextConfig = {
      ...config,
      site_settings: {
        ...settings,
        logo_url: LOGO_URL,
        logo_height: LOGO_HEIGHT,
      },
    };

    await connection.execute(
      'UPDATE website_configs SET config = ?, updated_at = NOW() WHERE type = ?',
      [JSON.stringify(nextConfig), CONFIG_TYPE]
    );

    console.log('After:', { logo_url: LOGO_URL, logo_height: LOGO_HEIGHT });
    console.log('Updated. Restart the dev server or wait for the settings cache to expire.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Logo setting update failed:', error.message);
  process.exit(1);
});
