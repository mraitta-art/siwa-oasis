const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  });

  try {
    const [result] = await pool.query(
      `INSERT INTO business_types (id, name, icon, icon_color, description, is_parent, parent_id, sections, own_sections, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['test_child', 'Test Child', 'fas fa-building', '#8b5cf6', '', 0, 'food', JSON.stringify([]), JSON.stringify([]), 99]
    );
    console.log("Success:", result);
  } catch (err) {
    console.log("Error Name:", err.name);
    console.log("Error Message:", err.message);
    console.log("Error Code:", err.code);
    console.log("SQL State:", err.sqlState);
  }
  process.exit();
}

test();
