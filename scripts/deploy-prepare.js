const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Deployment Preparation Script
 * Creates a clean 'deploy_bundle' directory by copying only necessary files.
 */

const rootDir = path.join(__dirname, '..');
const bundleDir = path.join(rootDir, 'deploy_bundle');

const filesToInclude = [
  'src',
  'public',
  'scripts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.ts',
  '.env',
  '.env.example',
  'server.js',
  '.next',
  'schema.sql',
  'DEPLOYMENT.md'
];

console.log('🏗️  Preparing deployment bundle...');

// 1. Clear previous bundle
if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
fs.mkdirSync(bundleDir);

// 2. Map through and copy
filesToInclude.forEach(entry => {
  const srcPath = path.join(rootDir, entry);
  if (!fs.existsSync(srcPath)) return;
  
  const destPath = path.join(bundleDir, entry);
  
  // Use shell command for recursive copy to be safe on various systems
  if (process.platform === 'win32') {
    if (fs.lstatSync(srcPath).isDirectory()) {
      execSync(`xcopy /E /I /Y "${srcPath}" "${destPath}"`, { stdio: 'ignore' });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  } else {
    execSync(`cp -R "${srcPath}" "${destPath}"`);
  }
  
  console.log(`  ✅ Included: ${entry}`);
});

// Clean up cache and local uploads in bundle to reduce size and avoid conflict
const cachePath = path.join(bundleDir, '.next', 'cache');
if (fs.existsSync(cachePath)) {
  fs.rmSync(cachePath, { recursive: true, force: true });
  console.log('  🧹 Cleared Next.js compilation cache in bundle');
}

const uploadsPath = path.join(bundleDir, 'public', 'uploads');
if (fs.existsSync(uploadsPath)) {
  const uploadFiles = fs.readdirSync(uploadsPath);
  uploadFiles.forEach(file => {
    if (file !== '.gitkeep') {
      fs.rmSync(path.join(uploadsPath, file), { recursive: true, force: true });
    }
  });
  console.log('  🧹 Cleared local upload files from public/uploads/ in bundle');
}

// Create tmp/restart.txt for automatic Passenger restart on cPanel
const tmpDir = path.join(bundleDir, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}
fs.writeFileSync(path.join(tmpDir, 'restart.txt'), new Date().toISOString());
console.log('  🧹 Created tmp/restart.txt for automatic server restart');

console.log(`\n🎉  Success! Your deployment bundle is ready at: ${bundleDir}`);
console.log('👉  Next Step: Zip the contents of \'deploy_bundle\' and upload to cPanel.');

// 3. Fix package.json for cPanel compatibility
const packageJsonPath = path.join(bundleDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update build scripts for cPanel compatibility — use stderr-suppressing wrapper
  packageJson.scripts.build = 'node scripts/cpanel-build.js';
  packageJson.scripts['build:production'] = 'node scripts/cpanel-build.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('  ✅ Fixed package.json for cPanel compatibility');
}

// 4. Create .htaccess for proper routing
const htaccessContent = `RewriteEngine On
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
const htaccessPath = path.join(bundleDir, '.htaccess');
fs.writeFileSync(htaccessPath, htaccessContent);
console.log('  ✅ Created .htaccess for cPanel routing');
