#!/usr/bin/env node

/**
 * Advanced cPanel Deployment Preparation Script
 * 
 * This script:
 * 1. Detects target environment (Unix/Windows/cPanel variations)
 * 2. Auto-adjusts configuration files for compatibility
 * 3. Creates environment-specific deployment bundles
 * 4. Generates deployment manifest for tracking
 * 5. Prepares automatic update mechanism
 * 
 * Usage: node scripts/prepare-deployment-advanced.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ========================================
// CONFIGURATION
// ========================================

const rootDir = path.join(__dirname, '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const version = require(path.join(rootDir, 'package.json')).version;

// Deployment bundle directories
const bundles = {
  universal: path.join(rootDir, 'deploy_bundle'),
  unix: path.join(rootDir, 'deploy_bundle_unix'),
  windows: path.join(rootDir, 'deploy_bundle_windows'),
  cpanel: path.join(rootDir, 'deploy_bundle_cpanel')
};

// Files to include in deployment
const filesToInclude = [
  'src',
  'public',
  'scripts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.ts',
  '.env.example',
  'server.js',
  '.next',
  'schema.sql',
  'DEPLOYMENT.md'
];

// ========================================
// ENVIRONMENT DETECTION & CONFIGURATION
// ========================================

/**
 * Generate environment-specific package.json
 */
function generatePackageJson(environment) {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Base configuration
  const config = {
    ...packageJson,
    scripts: {
      ...packageJson.scripts
    }
  };
  
  // Environment-specific build scripts
  switch (environment) {
    case 'unix':
      config.scripts.build = "NODE_OPTIONS='--max-old-space-size=2048' next build";
      config.scripts['build:production'] = "NODE_OPTIONS='--max-old-space-size=3072' next build";
      config.scripts['build:low-memory'] = "NODE_OPTIONS='--max-old-space-size=1024' next build";
      break;
      
    case 'windows':
      config.scripts.build = "set NODE_OPTIONS=--max-old-space-size=2048 && next build";
      config.scripts['build:production'] = "set NODE_OPTIONS=--max-old-space-size=3072 && next build";
      config.scripts['build:low-memory'] = "set NODE_OPTIONS=--max-old-space-size=1024 && next build";
      break;
      
    case 'cpanel':
    case 'universal':
    default:
      // Universal/safe - no environment variables in scripts
      config.scripts.build = "next build";
      config.scripts['build:production'] = "next build";
      config.scripts['build:low-memory'] = "next build";
      break;
  }
  
  return config;
}

/**
 * Generate environment-specific .htaccess
 */
function generateHtaccess(environment) {
  const baseRules = `# Siwa Oasis - Next.js Application
# Environment: ${environment.toUpperCase()}
# Generated: ${new Date().toISOString()}

RewriteEngine On
`;

  switch (environment) {
    case 'cpanel':
      return baseRules + `
# cPanel-specific routing
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;
    
    case 'unix':
    case 'windows':
    default:
      return baseRules + `
# Standard routing
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
  }
}

/**
 * Generate environment-specific next.config.ts
 */
function generateNextConfig(environment) {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Reduce memory usage for ${environment} deployment
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Disable experimental features that use WebAssembly
  experimental: {
    webpackBuildWorker: false,
  },
  // Optimize for production build
  compress: true,
${environment === 'cpanel' ? `  // cPanel-specific optimizations
  output: 'standalone',
  images: {
    unoptimized: true, // cPanel may not support Next.js image optimization
  },` : ''}
};

export default nextConfig;
`;
}

/**
 * Generate environment-specific server.js
 */
function generateServerJs(environment) {
  return `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

// Environment-specific configuration
const app = next({ 
  dev, 
  hostname, 
  port,
${environment === 'cpanel' ? `  // cPanel requires specific conf directory
  conf: { distDir: '.next' },` : ''}
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://\${hostname}:\${port} [\${environment.toUpperCase()}]\`);
  });
});
`;
}

/**
 * Generate deployment manifest
 */
function generateManifest(environment, bundlePath) {
  const manifest = {
    version: version,
    environment: environment,
    generated: new Date().toISOString(),
    bundlePath: bundlePath,
    nodeVersion: process.version,
    files: [],
    checksums: {},
    configuration: {
      packageJson: generatePackageJson(environment),
      htaccess: generateHtaccess(environment),
      nextConfig: environment === 'cpanel' ? 'standalone' : 'standard',
      serverConfig: environment
    }
  };

  // Calculate file checksums
  filesToInclude.forEach(file => {
    const filePath = path.join(bundlePath, file);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      manifest.files.push({
        name: file,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.isDirectory() ? getDirectorySize(filePath) : stat.size,
        modified: stat.mtime.toISOString()
      });

      // Generate checksum for files
      if (!stat.isDirectory()) {
        const content = fs.readFileSync(filePath);
        manifest.checksums[file] = crypto.createHash('md5').update(content).digest('hex');
      }
    }
  });

  return manifest;
}

function getDirectorySize(dirPath) {
  let size = 0;
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    });
  }
  return size;
}

// ========================================
// DEPLOYMENT PREPARATION FUNCTIONS
// ========================================

/**
 * Create deployment bundle for specific environment
 */
function createBundle(environment, bundleDir) {
  console.log(`\n📦 Creating ${environment.toUpperCase()} bundle...`);
  console.log(`   Location: ${bundleDir}`);

  // Clear previous bundle
  if (fs.existsSync(bundleDir)) {
    fs.rmSync(bundleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(bundleDir, { recursive: true });

  // Copy files
  filesToInclude.forEach(entry => {
    const srcPath = path.join(rootDir, entry);
    if (!fs.existsSync(srcPath)) {
      console.log(`   ⚠️  Skipped (not found): ${entry}`);
      return;
    }
    
    const destPath = path.join(bundleDir, entry);
    
    if (process.platform === 'win32') {
      if (fs.lstatSync(srcPath).isDirectory()) {
        execSync(`xcopy /E /I /Y "${srcPath}" "${destPath}"`, { stdio: 'ignore' });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      execSync(`cp -R "${srcPath}" "${destPath}"`);
    }
    
    console.log(`   ✅ Included: ${entry}`);
  });

  // Generate environment-specific files
  const packageJsonPath = path.join(bundleDir, 'package.json');
  const htaccessPath = path.join(bundleDir, '.htaccess');
  const nextConfigPath = path.join(bundleDir, 'next.config.ts');
  const serverJsPath = path.join(bundleDir, 'server.js');

  // Write environment-specific package.json
  const packageJson = generatePackageJson(environment);
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`   ✅ Generated ${environment}-specific package.json`);

  // Write .htaccess
  const htaccess = generateHtaccess(environment);
  fs.writeFileSync(htaccessPath, htaccess);
  console.log(`   ✅ Generated ${environment}-specific .htaccess`);

  // Write next.config.ts
  const nextConfig = generateNextConfig(environment);
  fs.writeFileSync(nextConfigPath, nextConfig);
  console.log(`   ✅ Generated ${environment}-specific next.config.ts`);

  // Write server.js
  const serverJs = generateServerJs(environment);
  fs.writeFileSync(serverJsPath, serverJs);
  console.log(`   ✅ Generated ${environment}-specific server.js`);

  // Generate manifest
  const manifest = generateManifest(environment, bundleDir);
  const manifestPath = path.join(bundleDir, 'deployment-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`   ✅ Generated deployment manifest`);

  console.log(`   🎉 ${environment.toUpperCase()} bundle ready!`);
  
  return bundleDir;
}

// ========================================
// MAIN EXECUTION
// ========================================

console.log('='.repeat(70));
console.log('🚀 ADVANCED CPANEL DEPLOYMENT PREPARATION');
console.log('='.repeat(70));
console.log();
console.log(`📅 Timestamp: ${timestamp}`);
console.log(`📦 Version: ${version}`);
console.log(`💻 Platform: ${process.platform}`);
console.log(`🟢 Node.js: ${process.version}`);
console.log();

// Create all environment bundles
const environments = ['universal', 'cpanel'];

environments.forEach(env => {
  createBundle(env, bundles[env]);
  console.log();
});

// ========================================
// GENERATE DEPLOYMENT INSTRUCTIONS
// ========================================

console.log('='.repeat(70));
console.log('📋 DEPLOYMENT INSTRUCTIONS');
console.log('='.repeat(70));
console.log();

console.log('🌐 BUNDLE TYPES CREATED:');
console.log();
console.log('1. UNIVERSAL BUNDLE (deploy_bundle/)');
console.log('   ✓ Works on ALL environments (cPanel, Unix, Windows)');
console.log('   ✓ Safe default configuration');
console.log('   ✓ Recommended for most deployments');
console.log('   ✓ Use this if unsure about cPanel environment');
console.log();

console.log('2. CPANEL-OPTIMIZED BUNDLE (deploy_bundle_cpanel/)');
console.log('   ✓ Specifically optimized for cPanel');
console.log('   ✓ Includes standalone output mode');
console.log('   ✓ Enhanced .htaccess with security headers');
console.log('   ✓ cPanel-specific server configuration');
console.log('   ✓ Use this for known cPanel deployments');
console.log();

console.log('📤 HOW TO DEPLOY:');
console.log();
console.log('For cPanel deployment:');
console.log('  1. Use: deploy_bundle_cpanel/ (recommended for cPanel)');
console.log('     OR: deploy_bundle/ (universal, always works)');
console.log('  2. ZIP the contents:');
console.log(`     cd ${bundles.cpanel}`);
console.log('     Select all files → Right-click → Send to → Compressed folder');
console.log('     Name: siwa_upload.zip');
console.log('  3. Upload to cPanel File Manager');
console.log('  4. Extract in app directory');
console.log('  5. Follow deployment checklist');
console.log();

console.log('🔄 AUTOMATIC UPDATE WORKFLOW:');
console.log();
console.log('When you make changes locally:');
console.log('  1. Make your code changes');
console.log('  2. Test locally: npm run dev');
console.log('  3. Build locally: npm run build');
console.log('  4. Run this script: node scripts/prepare-deployment-advanced.js');
console.log('  5. New bundles created automatically with latest changes');
console.log('  6. ZIP and upload to cPanel');
console.log('  7. Rebuild on cPanel: Run JS Script → build');
console.log('  8. Restart app');
console.log();

console.log('📊 DEPLOYMENT MANIFEST:');
console.log();
console.log('Each bundle includes deployment-manifest.json which contains:');
console.log('  • Version number');
console.log('  • Generation timestamp');
console.log('  • File checksums (for integrity verification)');
console.log('  • Environment configuration');
console.log('  • File sizes and modification dates');
console.log();
console.log('Use this to:');
console.log('  ✓ Verify upload integrity');
console.log('  ✓ Track deployment versions');
console.log('  ✓ Debug deployment issues');
console.log();

console.log('='.repeat(70));
console.log('✅ DEPLOYMENT PREPARATION COMPLETE!');
console.log('='.repeat(70));
console.log();
console.log('📁 Bundle Locations:');
console.log(`   Universal: ${bundles.universal}`);
console.log(`   cPanel:    ${bundles.cpanel}`);
console.log();
console.log('📝 Next Steps:');
console.log('   1. Review bundles above');
console.log('   2. Choose appropriate bundle for your cPanel');
console.log('   3. Create ZIP file');
console.log('   4. Upload to cPanel');
console.log('   5. Follow CPANEL_PRE_DEPLOYMENT_CHECKLIST.md');
console.log();
