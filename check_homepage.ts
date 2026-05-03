import { query } from './src/lib/db';

async function run() {
  try {
    const pages = await query("SELECT * FROM orchestrator_pages WHERE slug = 'index' OR slug = 'home'");
    console.log(JSON.stringify(pages, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
