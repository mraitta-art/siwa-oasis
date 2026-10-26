/**
 * Normalize every stored vendor number to one canonical form.
 *
 * History left the same phone written several ways across columns
 * ('01222597304', '+20 12 2259 7304', '00201222597304', '012-2259-7304').
 * Phone-first login treats the number as identity, so identity must not depend
 * on punctuation. This rewrites the digits in place — it never invents, drops,
 * or reorders a subscriber number: it only strips decoration and applies the
 * Egyptian 01X → 20 1X country-code rule.
 *
 * Dry run by default. Apply with:  npx tsx scripts/normalize-vendor-phones.ts --apply
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { execute, query } from '../src/lib/db';
import { normalizePhoneValue } from '../src/lib/egypt-phone';

const APPLY = process.argv.includes('--apply');

const digitsOf = (v: unknown) => String(v ?? '').replace(/\D/g, '');

/** True only when this is a safe reformat: same meaning, prettier form. */
function safeCanonical(stored: string): string | null {
  const canonical = normalizePhoneValue(stored);
  if (canonical.length < 8 || canonical.length > 15) return null;
  // Never rewrite landline-looking or odd-length originals we can't explain.
  const bare = digitsOf(stored);
  const sameMeaning =
    bare === canonical ||
    bare === `0${canonical.slice(2)}` ||          // local form vs +20 form
    bare === canonical.slice(2) ||               // trunk-0 dropped by the writer
    bare === `00${canonical}`;                   // 00 international prefix
  if (!sameMeaning) return null;
  return canonical;
}

async function normalizeColumn(table: string, column: string, prefix: string) {
  let rows: any[] = [];
  try {
    rows = await query<any>(
      `SELECT id, \`${column}\` AS current FROM \`${table}\`
        WHERE \`${column}\` IS NOT NULL AND \`${column}\` <> '' LIMIT 2000`
    );
  } catch {
    console.log(`  skip ${table}.${column} (column missing)`);
    return;
  }
  let changed = 0;
  for (const row of rows) {
    const stored = String(row.current ?? '');
    const canonical = safeCanonical(stored);
    if (!canonical) continue;
    const next = `${prefix}${canonical}`;
    if (next === stored) continue;
    changed += 1;
    console.log(`  ${table}.${column} ${row.id}: "${stored}" -> "${next}"`);
    if (APPLY) {
      try {
        await execute(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ?`, [next, row.id]);
      } catch (e: any) {
        console.log(`    FAILED: ${e.message}`);
      }
    }
  }
  console.log(`${APPLY ? 'updated' : 'would update'} ${changed} row(s) in ${table}.${column}`);
}

(async () => {
  console.log(APPLY ? 'APPLYING normalization' : 'DRY RUN — pass --apply to write');
  // businesses keeps bare digits (wa.me-safe); profiles keep +E.164 (the auth
  // module writes plusPhone(digits)); handoffs keep bare digits like the intake.
  await normalizeColumn('businesses', 'vendor_phone', '');
  await normalizeColumn('businesses', 'phone', '');
  await normalizeColumn('businesses', 'whatsapp', '');
  await normalizeColumn('profiles', 'phone', '+');
  await normalizeColumn('minisite_vendor_handoffs', 'vendor_phone', '');
  console.log('done.');
  process.exit(0);
})().catch((e) => {
  console.error('normalization aborted:', e.message);
  process.exit(1);
});
