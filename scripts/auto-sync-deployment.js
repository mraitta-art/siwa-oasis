#!/usr/bin/env node

/**
 * Auto-Sync Deployment Script
 * 
 * Watches for local file changes and automatically updates deployment bundles.
 * Can be run manually or set up as a watch process.
 * 
 * Usage:
 *   Manual: node scripts/auto-sync-deployment.js
 *   Watch:  node scripts/auto-sync-deployment.js --watch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const configPath = path.join(rootDir, 'deployment-config.json');

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading deployment-config.json:', error.message);
  process.exit(1);
}

// ========================================
// FILE CHANGE DETECTION
// ========================================

/**
 * Get file hash for change detection
 */
function getFileHash(filePath) {
  const crypto = require('crypto');
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Check if files have changed since last sync
 */
function checkForChanges() {
  const hashFilePath = path.join(rootDir, '.last-sync-hashes.json');
  let previousHashes = {};
  
  if (fs.existsSync(hashFilePath)) {
    previousHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf8'));
  }
  
  const currentHashes = {};
  const changedFiles = [];
  
  // Check all watched files
  const watchPatterns = config.autoSync.watchFiles || [];
  
  watchPatterns.forEach(pattern => {
    // Simple glob pattern matching
    const files = getFilesFromPattern(pattern);
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const hash = getFileHash(file);
        currentHashes[file] = hash;
        
        if (!previousHashes[file] || previousHashes[file] !== hash) {
          changedFiles.push(file);
        }
      }
    });
  });
  
  return { changedFiles, currentHashes, previousHashes };
}

/**
 * Simple pattern to files converter
 */
function getFilesFromPattern(pattern) {
  const files = [];
  
  // Handle **/* patterns
  if (pattern.includes('**/*')) {
    const baseDir = pattern.split('**')[0];
    const fullPath = path.join(rootDir, baseDir);
    
    if (fs.existsSync(fullPath)) {
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else {
            files.push(fullPath);
          }
        });
      };
      
      walkDir(fullPath);
    }
  } else {
    // Single file
    const fullPath = path.join(rootDir, pattern);
    if (fs.existsSync(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Save current hashes for next comparison
 */
function saveHashes(hashes) {
  const hashFilePath = path.join(rootDir, '.last-sync-hashes.json');
  fs.writeFileSync(hashFilePath, JSON.stringify(hashes, null, 2));
}

// ========================================
// DEPLOYMENT BUNDLE GENERATION
// ========================================

/**
 * Run the advanced deployment preparation script
 */
function generateBundles() {
  console.log('📦 Generating deployment bundles...');
  
  try {
    const scriptPath = path.join(rootDir, 'scripts', 'prepare-deployment-advanced.js');
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log('✅ Bundles generated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error generating bundles:', error.message);
    return false;
  }
}

/**
 * Generate deployment manifest summary
 */
function generateManifestSummary() {
  const manifestPath = path.join(rootDir, 'deploy_bundle_cpanel', 'deployment-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('⚠️  No manifest found. Run bundle generation first.');
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log();
  console.log('='.repeat(70));
  console.log('📊 DEPLOYMENT MANIFEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Version: ${manifest.version}`);
  console.log(`Environment: ${manifest.environment}`);
  console.log(`Generated: ${manifest.generated}`);
  console.log(`Node.js: ${manifest.nodeVersion}`);
  console.log();
  console.log('Files included:');
  manifest.files.forEach(file => {
    const size = file.size > 1024 * 1024 
      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
      : file.size > 1024
        ? `${(file.size / 1024).toFixed(2)} KB`
        : `${file.size} B`;
    console.log(`  ${file.type === 'directory' ? '📁' : '📄'} ${file.name} (${size})`);
  });
  console.log('='.repeat(70));
}

// ========================================
// WATCH MODE
// ========================================

/**
 * Watch for file changes and auto-sync
 */
function watchForChanges() {
  console.log('👀 Watching for file changes...');
  console.log('   Press Ctrl+C to stop');
  console.log();
  
  // Initial check
  const { changedFiles, currentHashes } = checkForChanges();
  
  if (changedFiles.length > 0) {
    console.log(`🔄 Detected ${changedFiles.length} changed file(s)`);
    console.log('   Generating new deployment bundles...');
    generateBundles();
  }
  
  saveHashes(currentHashes);
  
  // Set up file watchers
  const watchPaths = [
    path.join(rootDir, 'src'),
    path.join(rootDir, 'public'),
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'next.config.ts'),
    path.join(rootDir, 'server.js'),
    path.join(rootDir, 'tsconfig.json')
  ];
  
  watchPaths.forEach(watchPath => {
    if (fs.existsSync(watchPath)) {
      const stat = fs.statSync(watchPath);
      
      if (stat.isDirectory()) {
        // Watch directory recursively
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename) {
            console.log(`📝 File changed: ${filename}`);
            debounceSync();
          }
        });
      } else {
        // Watch single file
        fs.watch(watchPath, (eventType, filename) => {
          console.log(`📝 File changed: ${path.basename(watchPath)}`);
          debounceSync();
        });
      }
    }
  });
  
  console.log('✅ Watching active. Changes will trigger automatic bundle regeneration.');
}

// Debounce to prevent multiple rapid syncs
let syncTimeout;
function debounceSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    console.log();
    console.log('🔄 Changes detected, syncing deployment bundles...');
    const { currentHashes } = checkForChanges();
    generateBundles();
    saveHashes(currentHashes);
    console.log('✅ Sync complete!');
    console.log();
  }, 2000); // Wait 2 seconds after last change
}

// ========================================
// MAIN EXECUTION
// ========================================

const isWatchMode = process.argv.includes('--watch');

console.log('='.repeat(70));
console.log('🔄 AUTO-SYNC DEPLOYMENT SYSTEM');
console.log('='.repeat(70));
console.log();

if (isWatchMode) {
  console.log('Mode: WATCH (auto-sync on changes)');
  console.log();
  watchForChanges();
} else {
  console.log('Mode: MANUAL (one-time sync)');
  console.log();
  
  console.log('🔍 Checking for changes...');
  const { changedFiles, currentHashes, previousHashes } = checkForChanges();
  
  const isForceMode = process.argv.includes('--force');
  
  if (changedFiles.length === 0 && !isForceMode) {
    console.log('✅ No changes detected since last sync.');
    console.log('   To force regeneration, run with --force flag');
  } else {
    if (isForceMode && changedFiles.length === 0) {
      console.log('🚀 Force mode enabled. Regenerating bundles...');
    } else {
      console.log(`🔄 Detected ${changedFiles.length} changed file(s):`);
      changedFiles.forEach(file => {
        console.log(`   • ${path.relative(rootDir, file)}`);
      });
    }
    console.log();
    console.log('Generating updated deployment bundles...');
    generateBundles();
    saveHashes(currentHashes);
    console.log();
  }
  
  // Generate manifest summary
  generateManifestSummary();
  
  console.log();
  console.log('💡 Tips:');
  console.log('   • Run with --watch to auto-sync on changes');
  console.log('   • Run with --force to regenerate even without changes');
  console.log('   • Edit deployment-config.json to customize settings');
  console.log();
}
