const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function synchronizeAll() {
  const root = process.cwd();
  const bundleDir = path.join(root, 'deploy_bundle_cpanel');
  
  console.log('🚀 INITIALIZING FULL SYSTEM SYNCHRONIZATION...');

  // 1. Run Health Check
  try {
    console.log('\n🛡️ Step 1: Governance Health Check...');
    execSync('node scripts/pre-deployment-health-check.js', { stdio: 'inherit' });
  } catch (e) {
    console.error('\n❌ SYNC STOPPED: Health check failed.');
    process.exit(1);
  }

  // 2. Build Production
  try {
    console.log('\n🏗️ Step 2: Building Production Assets...');
    // We run the build directly to ensure we get the latest .next folder
    execSync('npm run build:cpanel', { stdio: 'inherit' });
  } catch (e) {
    console.error('\n❌ SYNC STOPPED: Build failed.');
    process.exit(1);
  }

  // 3. Prepare Bundle Directory
  console.log('\n📂 Step 3: Preparing deploy_bundle_cpanel...');
  if (fs.existsSync(bundleDir)) {
    fs.rmSync(bundleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(bundleDir);

  // 4. Copy Files
  const entries = [
    '.next', 'public', 'scripts', 'src', 
    'package.json', 'package-lock.json', 'server.js', 
    '.env', '.env.production', 'schema.sql', 'next.config.ts'
  ];

  entries.forEach(entry => {
    const src = path.join(root, entry);
    const dest = path.join(bundleDir, entry);
    if (!fs.existsSync(src)) return;

    if (fs.lstatSync(src).isDirectory()) {
      if (process.platform === 'win32') {
        execSync(`xcopy /E /I /Y "${src}" "${dest}"`, { stdio: 'ignore' });
      } else {
        execSync(`cp -R "${src}" "${dest}"`);
      }
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`  ✅ Synced: ${entry}`);
  });

  console.log('\n✨ ALL SYSTEMS SYNCHRONIZED.');
  console.log(`👉 Your production-ready bundle is at: ${bundleDir}`);
}

synchronizeAll().catch(e => {
  console.error('\n❌ CRITICAL SYNC ERROR:', e.message);
  process.exit(1);
});
