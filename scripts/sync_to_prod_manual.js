const { spawnSync } = require('child_process');

console.log('🚀 PUSHING LOCAL CHANGES TO PRODUCTION DATABASE...');

const prodEnv = {
  ...process.env,
  DB_HOST: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  DB_PORT: '4000',
  DB_USER: '3iv5fPeLo2ze3jn.root',
  DB_PASSWORD: 'Dj2teUVtQyMYghF3',
  DB_NAME: 'siwa_oasis'
};

const scriptsToRun = [
  'scripts/migrate_business_section_controls.js',
  'scripts/fix_slug.js',
  'scripts/seed_sections.js',
  'scripts/seed_trip_planner_types.js',
  'scripts/seed_dummy_businesses.js'
];

for (const script of scriptsToRun) {
  console.log(`\n▶️ Running ${script} on PRODUCTION...`);
  const result = spawnSync('node', [script], { env: prodEnv, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`❌ FAILED: ${script}`);
    process.exit(1);
  }
}

console.log('\n✅ ALL SYNCS TO PRODUCTION COMPLETE!');
