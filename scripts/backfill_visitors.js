/**
 * Backfill visitor_profiles from existing journey_requests by customer_email
 * Usage:
 *   node backfill_visitors.js --dry
 *   node backfill_visitors.js
 *
 * Requires environment variables:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *
 * This script:
 *  - finds distinct customer_email values
 *  - creates a visitor_profiles row per email (if none exists)
 *  - updates journey_requests.visitor_id to point to the profile
 *  - logs actions to audit_log
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry') || argv.includes('-d');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'siwa';

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
  console.log('Connected to DB', host, database, 'dryRun=', dryRun);

  try {
    // 1) Get distinct emails
    const [rows] = await conn.execute("SELECT DISTINCT customer_email FROM journey_requests WHERE customer_email IS NOT NULL AND customer_email != ''");
    const emails = rows.map(r => r.customer_email).filter(Boolean);
    console.log('Found', emails.length, 'distinct emails in journey_requests');

    for (const email of emails) {
      // check if profile exists that contains this email
      const [matches] = await conn.execute('SELECT id, emails FROM visitor_profiles WHERE JSON_CONTAINS(emails, JSON_QUOTE(?))', [email]);
      let profileId;
      if (matches.length > 0) {
        profileId = matches[0].id;
        console.log('[exists]', email, '->', profileId);
      } else {
        profileId = uuidv4();
        const profile = { id: profileId, primary_name: null, emails: JSON.stringify([email]), phones: JSON.stringify([]), metadata: JSON.stringify({ created_by: 'backfill_script' }) };
        if (!dryRun) {
          await conn.execute('INSERT INTO visitor_profiles (id, primary_name, emails, phones, metadata) VALUES (?, ?, ?, ?, ?)', [profile.id, profile.primary_name, profile.emails, profile.phones, profile.metadata]);
          console.log('[created]', email, '->', profileId);
          await conn.execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [uuidv4(), null, 'system', 'system', 'backfill:create_profile', JSON.stringify({ email, profileId })]);
        } else {
          console.log('[dry-create]', email, '->', profileId);
        }
      }

      // update journey_requests rows for this email
      if (!dryRun) {
        const [res] = await conn.execute('UPDATE journey_requests SET visitor_id = ? WHERE customer_email = ? AND (visitor_id IS NULL OR visitor_id = "")', [profileId, email]);
        console.log('[updated requests]', email, 'rows:', res.affectedRows);
        if (res.affectedRows > 0) {
          await conn.execute('INSERT INTO audit_log (id, user_id, user_email, user_role, action, details) VALUES (?, ?, ?, ?, ?, ?)', [uuidv4(), null, 'system', 'system', 'backfill:link_requests', JSON.stringify({ email, profileId, updated: res.affectedRows })]);
        }
      } else {
        console.log('[dry-update-requests]', email);
      }
    }

    console.log('Backfill complete');
  } catch (err) {
    console.error('Error during backfill', err);
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
