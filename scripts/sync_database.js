const mysql = require('mysql2/promise');

// ============================================================
// FULL DATABASE SYNC: LOCAL <-> PRODUCTION
// Strategy:
//   - Tables with MORE rows locally → push LOCAL → PROD
//   - Tables existing only on PROD → create on LOCAL
//   - activity_log / audit_log → push LOCAL → PROD (local has more)
//   - businesses → MERGE (keep both, upsert)
//   - website_configs → push LOCAL → PROD (local has more)
// ============================================================

const LOCAL_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'siwa_oasis'
};

const PROD_CONFIG = {
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3iv5fPeLo2ze3jn.root',
  password: 'Dj2teUVtQyMYghF3',
  database: 'siwa_oasis',
  ssl: { rejectUnauthorized: false }
};

async function connect(config, label) {
  console.log(`Connecting to ${label}...`);
  const conn = await mysql.createConnection(config);
  console.log(`  ✅ Connected to ${label}`);
  return conn;
}

async function getTableRowCounts(conn) {
  const [tables] = await conn.query('SHOW TABLES');
  const result = {};
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [[countRow]] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    result[tableName] = countRow.cnt;
  }
  return result;
}

async function getColumns(conn, table) {
  const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  return cols.map(c => c.Field);
}

async function getCreateTable(conn, table) {
  const [[row]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
  return row['Create Table'];
}

async function getAllRows(conn, table) {
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  return rows;
}

async function getPrimaryKey(conn, table) {
  const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  const pkCols = cols.filter(c => c.Key === 'PRI').map(c => c.Field);
  return pkCols;
}

// Upsert rows from source to target
async function upsertRows(conn, table, rows, columns) {
  if (rows.length === 0) return 0;
  
  let inserted = 0;
  for (const row of rows) {
    const vals = columns.map(c => row[c]);
    const escapedCols = columns.map(c => `\`${c}\``);
    const placeholders = vals.map(() => '?').join(', ');
    const updateClauses = columns.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
    
    const sql = `INSERT INTO \`${table}\` (${escapedCols.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClauses}`;
    
    try {
      await conn.query(sql, vals);
      inserted++;
    } catch (err) {
      console.error(`    ⚠️  Error upserting into ${table}: ${err.message}`);
    }
  }
  return inserted;
}

// Replace all rows in target table with source rows
async function replaceAllRows(conn, table, rows, columns) {
  if (rows.length === 0) {
    console.log(`    ℹ️  No rows to sync for ${table}`);
    return 0;
  }
  
  // Truncate target
  await conn.query(`DELETE FROM \`${table}\``);
  
  let inserted = 0;
  for (const row of rows) {
    const vals = columns.map(c => row[c]);
    const escapedCols = columns.map(c => `\`${c}\``);
    const placeholders = vals.map(() => '?').join(', ');
    
    const sql = `INSERT INTO \`${table}\` (${escapedCols.join(', ')}) VALUES (${placeholders})`;
    
    try {
      await conn.query(sql, vals);
      inserted++;
    } catch (err) {
      console.error(`    ⚠️  Error inserting into ${table}: ${err.message}`);
    }
  }
  return inserted;
}

async function main() {
  const localConn = await connect(LOCAL_CONFIG, 'LOCAL (MySQL/XAMPP)');
  const prodConn = await connect(PROD_CONFIG, 'PRODUCTION (TiDB Cloud)');

  // ========================================
  // PHASE 1: Compare tables
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1: DATABASE COMPARISON');
  console.log('='.repeat(60));

  const localCounts = await getTableRowCounts(localConn);
  const prodCounts = await getTableRowCounts(prodConn);

  const allTables = [...new Set([...Object.keys(localCounts), ...Object.keys(prodCounts)])].sort();

  const mismatched = [];
  const localOnly = [];
  const prodOnly = [];

  for (const table of allTables) {
    const hasLocal = table in localCounts;
    const hasProd = table in prodCounts;
    const lc = hasLocal ? localCounts[table] : 'N/A';
    const pc = hasProd ? prodCounts[table] : 'N/A';

    let status = '';
    if (hasLocal && hasProd) {
      if (lc !== pc) {
        status = `MISMATCH (L:${lc} P:${pc})`;
        mismatched.push(table);
      } else {
        status = `✅ Match (${lc})`;
      }
    } else if (hasLocal) {
      status = `⚠️  LOCAL ONLY (${lc})`;
      localOnly.push(table);
    } else {
      status = `⚠️  PROD ONLY (${pc})`;
      prodOnly.push(table);
    }
    console.log(`  ${table.padEnd(35)} ${status}`);
  }

  console.log(`\nMismatched: ${mismatched.length} | Local Only: ${localOnly.length} | Prod Only: ${prodOnly.length}`);

  // ========================================
  // PHASE 2: Create missing tables
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: CREATE MISSING TABLES');
  console.log('='.repeat(60));

  // Create prod-only tables on local
  for (const table of prodOnly) {
    console.log(`\n  Creating '${table}' on LOCAL...`);
    try {
      const createSQL = await getCreateTable(prodConn, table);
      await localConn.query(createSQL);
      console.log(`  ✅ Created '${table}' on LOCAL`);

      // Copy data too
      const columns = await getColumns(prodConn, table);
      const rows = await getAllRows(prodConn, table);
      if (rows.length > 0) {
        const count = await replaceAllRows(localConn, table, rows, columns);
        console.log(`  ✅ Copied ${count} rows from PROD → LOCAL for '${table}'`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to create '${table}' on LOCAL: ${err.message}`);
    }
  }

  // Create local-only tables on prod
  for (const table of localOnly) {
    console.log(`\n  Creating '${table}' on PROD...`);
    try {
      const createSQL = await getCreateTable(localConn, table);
      await prodConn.query(createSQL);
      console.log(`  ✅ Created '${table}' on PROD`);

      const columns = await getColumns(localConn, table);
      const rows = await getAllRows(localConn, table);
      if (rows.length > 0) {
        const count = await replaceAllRows(prodConn, table, rows, columns);
        console.log(`  ✅ Copied ${count} rows from LOCAL → PROD for '${table}'`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to create '${table}' on PROD: ${err.message}`);
    }
  }

  // ========================================
  // PHASE 3: Sync mismatched tables
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: SYNC MISMATCHED TABLES');
  console.log('='.repeat(60));

  for (const table of mismatched) {
    const lc = localCounts[table];
    const pc = prodCounts[table];
    console.log(`\n  Syncing '${table}' (Local: ${lc}, Prod: ${pc})...`);

    try {
      // Check schema compatibility - get columns from both
      const localCols = await getColumns(localConn, table);
      const prodCols = await getColumns(prodConn, table);

      // Find common columns for data transfer
      const commonCols = localCols.filter(c => prodCols.includes(c));

      if (table === 'businesses') {
        // MERGE strategy: upsert from both directions
        console.log(`    Strategy: MERGE (upsert both directions)`);

        // First: push local → prod
        const localRows = await getAllRows(localConn, table);
        const upsertedToProd = await upsertRows(prodConn, table, localRows, commonCols);
        console.log(`    ✅ Upserted ${upsertedToProd} rows LOCAL → PROD`);

        // Then: pull prod → local (to get any prod-only rows)
        const prodRows = await getAllRows(prodConn, table);
        const upsertedToLocal = await upsertRows(localConn, table, prodRows, commonCols);
        console.log(`    ✅ Upserted ${upsertedToLocal} rows PROD → LOCAL`);

      } else if (table === 'activity_log' || table === 'audit_log') {
        // MERGE strategy for logs: upsert both ways
        console.log(`    Strategy: MERGE logs (upsert both directions)`);

        const localRows = await getAllRows(localConn, table);
        const upsertedToProd = await upsertRows(prodConn, table, localRows, commonCols);
        console.log(`    ✅ Upserted ${upsertedToProd} rows LOCAL → PROD`);

        const prodRows = await getAllRows(prodConn, table);
        const upsertedToLocal = await upsertRows(localConn, table, prodRows, commonCols);
        console.log(`    ✅ Upserted ${upsertedToLocal} rows PROD → LOCAL`);

      } else if (table === 'website_configs') {
        // LOCAL has more configs (14 vs 5), so push LOCAL → PROD
        console.log(`    Strategy: LOCAL → PROD (local has ${lc} vs prod ${pc})`);

        // Check if schemas match
        const localOnlyCols = localCols.filter(c => !prodCols.includes(c));
        const prodOnlyCols = prodCols.filter(c => !localCols.includes(c));

        if (localOnlyCols.length > 0 || prodOnlyCols.length > 0) {
          console.log(`    ⚠️  Schema mismatch detected!`);
          console.log(`       Local-only columns: ${localOnlyCols.join(', ') || 'none'}`);
          console.log(`       Prod-only columns: ${prodOnlyCols.join(', ') || 'none'}`);

          // Add missing columns to prod
          for (const col of localOnlyCols) {
            const [[colInfo]] = await localConn.query(`SHOW COLUMNS FROM \`${table}\` WHERE Field = ?`, [col]);
            const colType = colInfo.Type;
            const nullable = colInfo.Null === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = colInfo.Default !== null ? `DEFAULT '${colInfo.Default}'` : (colInfo.Null === 'YES' ? 'DEFAULT NULL' : '');
            try {
              await prodConn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${colType} ${nullable} ${defaultVal}`);
              console.log(`    ✅ Added column '${col}' to PROD '${table}'`);
            } catch (err) {
              if (err.message.includes('Duplicate column')) {
                console.log(`    ℹ️  Column '${col}' already exists on PROD`);
              } else {
                console.error(`    ❌ Failed to add column '${col}': ${err.message}`);
              }
            }
          }

          // Add missing columns to local
          for (const col of prodOnlyCols) {
            const [[colInfo]] = await prodConn.query(`SHOW COLUMNS FROM \`${table}\` WHERE Field = ?`, [col]);
            const colType = colInfo.Type;
            const nullable = colInfo.Null === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = colInfo.Default !== null ? `DEFAULT '${colInfo.Default}'` : (colInfo.Null === 'YES' ? 'DEFAULT NULL' : '');
            try {
              await localConn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${colType} ${nullable} ${defaultVal}`);
              console.log(`    ✅ Added column '${col}' to LOCAL '${table}'`);
            } catch (err) {
              if (err.message.includes('Duplicate column')) {
                console.log(`    ℹ️  Column '${col}' already exists on LOCAL`);
              } else {
                console.error(`    ❌ Failed to add column '${col}': ${err.message}`);
              }
            }
          }
        }

        // Now get the full updated column list
        const updatedCols = await getColumns(localConn, table);
        const updatedProdCols = await getColumns(prodConn, table);
        const syncCols = updatedCols.filter(c => updatedProdCols.includes(c));

        // Upsert local → prod
        const localRows = await getAllRows(localConn, table);
        const count = await upsertRows(prodConn, table, localRows, syncCols);
        console.log(`    ✅ Upserted ${count} rows LOCAL → PROD`);

        // Pull back any prod-only rows
        const prodRows = await getAllRows(prodConn, table);
        const count2 = await upsertRows(localConn, table, prodRows, syncCols);
        console.log(`    ✅ Upserted ${count2} rows PROD → LOCAL`);

      } else {
        // Default: local has more, push local → prod with upsert
        console.log(`    Strategy: UPSERT LOCAL → PROD`);
        const localRows = await getAllRows(localConn, table);
        const count = await upsertRows(prodConn, table, localRows, commonCols);
        console.log(`    ✅ Upserted ${count} rows LOCAL → PROD`);
      }
    } catch (err) {
      console.error(`  ❌ Error syncing '${table}': ${err.message}`);
    }
  }

  // ========================================
  // PHASE 4: Verify final state
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 4: FINAL VERIFICATION');
  console.log('='.repeat(60));

  const finalLocalCounts = await getTableRowCounts(localConn);
  const finalProdCounts = await getTableRowCounts(prodConn);
  const finalAll = [...new Set([...Object.keys(finalLocalCounts), ...Object.keys(finalProdCounts)])].sort();

  let allMatch = true;
  for (const table of finalAll) {
    const lc = finalLocalCounts[table] || 0;
    const pc = finalProdCounts[table] || 0;
    const status = lc === pc ? '✅' : '❌';
    if (lc !== pc) allMatch = false;
    console.log(`  ${status} ${table.padEnd(35)} Local: ${String(lc).padStart(5)}  Prod: ${String(pc).padStart(5)}`);
  }

  console.log('\n' + '='.repeat(60));
  if (allMatch) {
    console.log('🎉 ALL DATABASES FULLY SYNCHRONIZED!');
  } else {
    console.log('⚠️  Some tables still differ - review above');
  }
  console.log('='.repeat(60));

  await localConn.end();
  await prodConn.end();
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
