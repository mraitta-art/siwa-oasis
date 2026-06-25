/**
 * Shared database configuration loader for scripts.
 * Reads credentials from .env.production (for prod) or .env.local (for local).
 * NEVER hardcode credentials in script files — use this module instead.
 *
 * Usage:
 *   const { localConfig, prodConfig } = require('./db-config');
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadEnv(filename) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return {};
  const vars = {};
  fs.readFileSync(filePath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) return;
    const key   = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  });
  return vars;
}

// Load in order: .env.local overrides .env
const localEnv = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const prodEnv  = { ...loadEnv('.env'), ...loadEnv('.env.production') };

/** Config for LOCAL database */
const localConfig = {
  host:     localEnv.DB_HOST     || '127.0.0.1',
  port:     parseInt(localEnv.DB_PORT || '3306'),
  user:     localEnv.DB_USER     || 'root',
  password: localEnv.DB_PASSWORD || '',
  database: localEnv.DB_NAME     || 'siwa_oasis',
};

/** Config for PRODUCTION database (TiDB / cPanel / remote) */
const prodConfig = {
  host:     prodEnv.PROD_DB_HOST     || prodEnv.DB_HOST     || '',
  port:     parseInt(prodEnv.PROD_DB_PORT || prodEnv.DB_PORT || '4000'),
  user:     prodEnv.PROD_DB_USER     || prodEnv.DB_USER     || '',
  password: prodEnv.PROD_DB_PASSWORD || prodEnv.DB_PASSWORD || '',
  database: prodEnv.PROD_DB_NAME     || prodEnv.DB_NAME     || 'siwa_oasis',
  ssl:      { rejectUnauthorized: false },
};

function validateConfig(config, label) {
  const missing = [];
  if (!config.host)     missing.push('host');
  if (!config.user)     missing.push('user');
  if (!config.database) missing.push('database');
  if (missing.length > 0) {
    console.error(`❌ ${label} DB config missing: ${missing.join(', ')}`);
    console.error(`   Set them in ${label === 'LOCAL' ? '.env.local' : '.env.production'}`);
    process.exit(1);
  }
}

module.exports = { localConfig, prodConfig, validateConfig };
