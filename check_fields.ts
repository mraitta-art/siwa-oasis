import { query } from './src/lib/db';

async function run() {
  try {
    const fields = await query("SELECT * FROM form_fields WHERE field_type = 'richtext' OR field_type = 'textarea'");
    console.log(JSON.stringify(fields, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
