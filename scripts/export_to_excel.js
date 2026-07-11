/**
 * export_to_excel.js
 * Exports the entire Siwa Oasis business type taxonomy + section fields
 * to a single Excel workbook with 4 sheets:
 *   1. Business Types     — all parent & child types
 *   2. Sections           — all section records
 *   3. Form Fields        — all form fields with their section / type assignment
 *   4. Type-Section Map   — which types use which sections (pivot view)
 *
 * Usage: node scripts/export_to_excel.js
 * Output: exports/siwa_business_taxonomy_backup.xlsx
 */

const mysql = require('mysql2/promise');
const XLSX  = require('xlsx');
const path  = require('path');
const fs    = require('fs');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     Number(process.env.DB_PORT || 3306)
  });

  console.log('\n=== SIWA OASIS — EXCEL BACKUP EXPORT ===\n');

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 1: Business Types
  // ─────────────────────────────────────────────────────────────────────────
  const [types] = await c.query(`
    SELECT
      bt.id,
      bt.name,
      CASE WHEN bt.is_parent=1 THEN 'PARENT' ELSE 'Child' END AS type_level,
      COALESCE(parent.name, '—') AS parent_category,
      bt.parent_id,
      bt.icon,
      bt.icon_color,
      bt.description,
      bt.own_sections,
      bt.sort_order
    FROM business_types bt
    LEFT JOIN business_types parent ON parent.id = bt.parent_id
    ORDER BY COALESCE(bt.parent_id, bt.id), bt.is_parent DESC, bt.name
  `);

  const typesSheet = types.map(t => ({
    'Type ID':           t.id,
    'Type Name':         t.name,
    'Level':             t.type_level,
    'Parent Category':   t.parent_category,
    'Parent ID':         t.parent_id || '',
    'Icon':              t.icon || '',
    'Icon Color':        t.icon_color || '',
    'Own Sections':      (() => {
      try { return JSON.parse(t.own_sections || '[]').join(', '); } catch { return ''; }
    })(),
    'Description':       t.description || '',
    'Sort Order':        t.sort_order
  }));
  console.log(`  Sheet 1 — Business Types: ${typesSheet.length} rows`);

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 2: Sections
  // ─────────────────────────────────────────────────────────────────────────
  const [sections] = await c.query(`
    SELECT
      id,
      name,
      icon,
      description,
      is_universal,
      show_on_public,
      show_on_minisite,
      is_filterable,
      show_on_card,
      section_type,
      sort_order,
      active
    FROM sections
    ORDER BY is_universal DESC, sort_order, name
  `);

  const sectionsSheet = sections.map(s => ({
    'Section ID':         s.id,
    'Section Name':       s.name,
    'Icon':               s.icon || '',
    'Universal?':         s.is_universal ? 'YES' : 'No',
    'Show on Public':     s.show_on_public ? 'Yes' : 'No',
    'Show on Minisite':   s.show_on_minisite ? 'Yes' : 'No',
    'Filterable':         s.is_filterable ? 'Yes' : 'No',
    'Show on Card':       s.show_on_card ? 'Yes' : 'No',
    'Section Type':       s.section_type || '',
    'Sort Order':         s.sort_order,
    'Active':             s.active ? 'Yes' : 'No',
    'Description':        s.description || ''
  }));
  console.log(`  Sheet 2 — Sections: ${sectionsSheet.length} rows`);

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 3: Form Fields
  // ─────────────────────────────────────────────────────────────────────────
  const [fields] = await c.query(`
    SELECT
      ff.id,
      ff.section_id,
      s.name AS section_name,
      ff.business_type_id,
      ff.name AS field_name,
      ff.label,
      ff.field_type,
      ff.required,
      ff.vendor_editable,
      ff.searchable,
      ff.sort_order,
      ff.options,
      ff.section_origin,
      ff.help_text
    FROM form_fields ff
    LEFT JOIN sections s ON s.id = ff.section_id
    ORDER BY ff.section_id, ff.sort_order, ff.name
  `);

  const fieldsSheet = fields.map(f => {
    let optsList = '';
    try {
      const parsed = JSON.parse(f.options || 'null');
      if (Array.isArray(parsed)) optsList = parsed.join(' | ');
    } catch {}
    return {
      'Field ID':           f.id,
      'Section ID':         f.section_id,
      'Section Name':       f.section_name || '',
      'Business Type Scope':f.business_type_id || 'SECTION_TEMPLATE',
      'Field Name':         f.field_name,
      'Label':              f.label,
      'Field Type':         f.field_type,
      'Required':           f.required ? 'Yes' : 'No',
      'Vendor Editable':    f.vendor_editable ? 'Yes' : 'No',
      'Searchable':         f.searchable ? 'Yes' : 'No',
      'Sort Order':         f.sort_order,
      'Options':            optsList,
      'Help Text':          f.help_text || '',
      'Origin':             f.section_origin || ''
    };
  });
  console.log(`  Sheet 3 — Form Fields: ${fieldsSheet.length} rows`);

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 4: Type→Section Mapping Pivot
  // ─────────────────────────────────────────────────────────────────────────
  const pivotRows = [];
  for (const t of types) {
    if (t.type_level === 'PARENT') continue; // skip containers
    let ownSecs = [];
    try { ownSecs = JSON.parse(t.own_sections || '[]'); } catch {}
    
    // Get universal sections
    const uniSecs = sections.filter(s => s.is_universal).map(s => s.id);
    const allSecs = [...new Set([...uniSecs, ...ownSecs])];

    pivotRows.push({
      'Business Type':      t.name,
      'Type ID':            t.id,
      'Parent Category':    t.parent_category,
      'Universal Sections': uniSecs.join(', '),
      'Own Sections':       ownSecs.join(', '),
      'All Sections (Total)': allSecs.length,
      'Section List':       allSecs.join(', ')
    });
  }
  console.log(`  Sheet 4 — Type-Section Map: ${pivotRows.length} rows`);

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD WORKBOOK
  // ─────────────────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const addSheet = (name, data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-width columns
    const colWidths = {};
    data.forEach(row => {
      Object.entries(row).forEach(([k, v]) => {
        const len = Math.max(String(k).length, String(v || '').length);
        colWidths[k] = Math.min(Math.max(colWidths[k] || 10, len + 2), 60);
      });
    });
    ws['!cols'] = Object.keys(data[0] || {}).map(k => ({ wch: colWidths[k] || 15 }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet('Business Types',    typesSheet);
  addSheet('Sections',          sectionsSheet);
  addSheet('Form Fields',       fieldsSheet);
  addSheet('Type-Section Map',  pivotRows);

  // ─────────────────────────────────────────────────────────────────────────
  // WRITE FILE
  // ─────────────────────────────────────────────────────────────────────────
  const outDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outFile = path.join(outDir, `siwa_business_taxonomy_${timestamp}.xlsx`);

  XLSX.writeFile(wb, outFile);

  console.log(`\n✅  Excel backup saved to:\n    ${outFile}\n`);
  console.log('=== EXPORT COMPLETE ===\n');

  await c.end();
}

main().catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
