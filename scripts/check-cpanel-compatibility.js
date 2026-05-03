#!/usr/bin/env node

/**
 * cPanel Environment Compatibility Checker
 * 
 * This script helps you verify if your cPanel hosting environment
 * is compatible with deploying a Next.js 15 application.
 * 
 * Usage: node scripts/check-cpanel-compatibility.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🔍 CPANEL COMPATIBILITY CHECKER FOR NEXT.JS 15');
console.log('='.repeat(60));
console.log();

let allChecks = [];
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

function check(name, condition, message, type = 'error') {
  const status = condition ? '✅ PASS' : (type === 'warning' ? '⚠️  WARN' : '❌ FAIL');
  allChecks.push({ name, status, message, type });
  
  if (condition) {
    passedChecks++;
  } else if (type === 'warning') {
    warningChecks++;
  } else {
    failedChecks++;
  }
  
  console.log(`${status} - ${name}`);
  if (!condition) {
    console.log(`      ${message}`);
  }
}

// ========================================
// SECTION 1: LOCAL ENVIRONMENT CHECKS
// ========================================

console.log('📦 SECTION 1: LOCAL ENVIRONMENT CHECKS');
console.log('-'.repeat(60));

// Check Node.js version
const nodeVersion = process.version;
const nodeMajorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
check(
  'Node.js Version',
  nodeMajorVersion >= 18,
  `Current: ${nodeVersion}. Required: 18.x or 20.x. Upgrade Node.js!`,
  'error'
);

check(
  'Node.js Version (Optimal)',
  nodeMajorVersion === 18 || nodeMajorVersion === 20,
  `Current: ${nodeVersion}. Recommended: 18.x or 20.x LTS.`,
  'warning'
);

// Check npm version
const npmVersion = require('child_process').execSync('npm --version').toString().trim();
const npmMajorVersion = parseInt(npmVersion.split('.')[0]);
check(
  'npm Version',
  npmMajorVersion >= 7,
  `Current: ${npmVersion}. Recommended: 7.x or higher.`,
  'warning'
);

// Check if deploy_bundle exists
const deployBundlePath = path.join(__dirname, '..', 'deploy_bundle');
check(
  'Deploy Bundle Directory',
  fs.existsSync(deployBundlePath),
  'Run: node scripts/deploy-prepare.js',
  'error'
);

// Check if deploy_bundle/package.json exists
const deployPackageJsonPath = path.join(deployBundlePath, 'package.json');
check(
  'Deploy Bundle package.json',
  fs.existsSync(deployPackageJsonPath),
  'Deploy bundle not prepared. Run: node scripts/deploy-prepare.js',
  'error'
);

// Check package.json build script
if (fs.existsSync(deployPackageJsonPath)) {
  const deployPackageJson = JSON.parse(fs.readFileSync(deployPackageJsonPath, 'utf8'));
  const buildScript = deployPackageJson.scripts?.build || '';
  check(
    'Build Script Compatibility',
    buildScript === 'next build',
    `Current: "${buildScript}". Should be: "next build"`,
    'error'
  );
}

// Check if .htaccess exists in deploy_bundle
const htaccessPath = path.join(deployBundlePath, '.htaccess');
check(
  '.htaccess File in Bundle',
  fs.existsSync(htaccessPath),
  'Missing .htaccess for cPanel routing. Re-run: node scripts/deploy-prepare.js',
  'error'
);

// Check if .next directory exists
const nextDirPath = path.join(deployBundlePath, '.next');
check(
  '.next Build Directory',
  fs.existsSync(nextDirPath) && fs.readdirSync(nextDirPath).length > 0,
  'No build output. Run: npm run build',
  'warning'
);

// Check if server.js exists
const serverJsPath = path.join(deployBundlePath, 'server.js');
check(
  'server.js File',
  fs.existsSync(serverJsPath),
  'Missing server.js startup file',
  'error'
);

// Check if schema.sql exists
const schemaSqlPath = path.join(deployBundlePath, 'schema.sql');
check(
  'schema.sql File',
  fs.existsSync(schemaSqlPath),
  'Missing database schema file',
  'error'
);

console.log();

// ========================================
// SECTION 2: PROJECT CONFIGURATION CHECKS
// ========================================

console.log('⚙️  SECTION 2: PROJECT CONFIGURATION CHECKS');
console.log('-'.repeat(60));

// Check main package.json
const mainPackageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(mainPackageJsonPath)) {
  const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
  
  // Check Next.js version
  const nextVersion = mainPackageJson.dependencies?.next || 'not found';
  check(
    'Next.js Version',
    nextVersion.includes('15'),
    `Current: ${nextVersion}. This guide is for Next.js 15.x`,
    'warning'
  );
  
  // Check React version
  const reactVersion = mainPackageJson.dependencies?.react || 'not found';
  check(
    'React Version',
    reactVersion.includes('19') || reactVersion.includes('18'),
    `Current: ${reactVersion}. Required: 18.x or 19.x`,
    'error'
  );
  
  // Check engines
  const nodeEngine = mainPackageJson.engines?.node || 'not specified';
  check(
    'Node.js Engine Requirement',
    nodeEngine !== 'not specified',
    'No Node.js version requirement specified in package.json',
    'warning'
  );
}

// Check next.config.ts
const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  check(
    'TypeScript Build Errors Ignored',
    nextConfigContent.includes('ignoreBuildErrors: true'),
    'Add typescript.ignoreBuildErrors: true to next.config.ts',
    'warning'
  );
  
  check(
    'ESLint Build Errors Ignored',
    nextConfigContent.includes('ignoreDuringBuilds: true'),
    'Add eslint.ignoreDuringBuilds: true to next.config.ts',
    'warning'
  );
  
  check(
    'No Deprecated swcMinify',
    !nextConfigContent.includes('swcMinify: true'),
    'Remove swcMinify: true (deprecated in Next.js 15)',
    'warning'
  );
}

// Check .env.local exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
check(
  'Local Environment File',
  fs.existsSync(envLocalPath),
  'Missing .env.local for local development',
  'warning'
);

// Check .env.example exists
const envExamplePath = path.join(__dirname, '..', '.env.example');
check(
  'Environment Example File',
  fs.existsSync(envExamplePath),
  'Missing .env.example template',
  'error'
);

console.log();

// ========================================
// SECTION 3: CPANEL REQUIREMENTS CHECKLIST
// ========================================

console.log('🌐 SECTION 3: CPANEL REQUIREMENTS (MANUAL VERIFICATION NEEDED)');
console.log('-'.repeat(60));

console.log();
console.log('⚠️  The following checks require you to login to your cPanel:');
console.log();

const cpanelChecks = [
  {
    name: 'Setup Node.js App Available',
    description: 'Login to cPanel and check if "Setup Node.js App" or "Node.js Selector" exists in Software section',
    critical: true
  },
  {
    name: 'Node.js Version 18.x or 20.x Available',
    description: 'In Setup Node.js App, check available versions in dropdown. Need 18.x or 20.x.',
    critical: true
  },
  {
    name: 'Memory Limit 1024MB+ Available',
    description: 'In Setup Node.js App settings, check if you can set memory limit to at least 1024 MB',
    critical: true
  },
  {
    name: 'MySQL Databases Feature Available',
    description: 'Check if "MySQL Databases" icon exists in cPanel Database section',
    critical: true
  },
  {
    name: 'phpMyAdmin Available',
    description: 'Check if "phpMyAdmin" icon exists in cPanel Database section',
    critical: true
  },
  {
    name: 'File Manager Available',
    description: 'Check if "File Manager" icon exists in cPanel Files section',
    critical: true
  },
  {
    name: 'At Least 2GB Free Disk Space',
    description: 'Check cPanel home page Statistics sidebar for available disk space',
    critical: true
  },
  {
    name: 'Apache mod_rewrite Enabled',
    description: 'Contact hosting support to confirm mod_rewrite is enabled (usually is by default)',
    critical: false
  },
  {
    name: 'Apache mod_proxy Enabled',
    description: 'Contact hosting support to confirm mod_proxy is enabled (usually is by default)',
    critical: false
  },
  {
    name: 'Phusion Passenger 5.x+ Installed',
    description: 'Ask hosting support what version of Passenger is installed for Node.js apps',
    critical: false
  }
];

cpanelChecks.forEach((item, index) => {
  const icon = item.critical ? '❗' : 'ℹ️ ';
  console.log(`${icon} ${index + 1}. ${item.name}`);
  console.log(`   ${item.description}`);
  console.log();
});

console.log('='.repeat(60));
console.log('📊 CHECK RESULTS SUMMARY');
console.log('='.repeat(60));
console.log();
console.log(`✅ Passed:   ${passedChecks}`);
console.log(`❌ Failed:   ${failedChecks}`);
console.log(`⚠️  Warnings: ${warningChecks}`);
console.log();

if (failedChecks === 0) {
  console.log('🎉 GREAT! All critical local checks passed!');
  console.log();
  console.log('📋 NEXT STEPS:');
  console.log('1. Review the warnings above and fix if possible');
  console.log('2. Login to cPanel and verify the manual checks in Section 3');
  console.log('3. Fill out: CPANEL_PRE_DEPLOYMENT_CHECKLIST.md');
  console.log('4. Use: DEPLOYMENT_QUICK_REFERENCE.md during deployment');
  console.log();
} else {
  console.log('⚠️  CRITICAL ISSUES FOUND!');
  console.log();
  console.log('🚨 You MUST fix the failed checks before deploying to cPanel.');
  console.log();
  console.log('📋 FIX INSTRUCTIONS:');
  allChecks.filter(c => c.type === 'error' && c.status === '❌ FAIL').forEach(c => {
    console.log(`  • ${c.name}: ${c.message}`);
  });
  console.log();
}

console.log('='.repeat(60));
console.log('📚 DOCUMENTATION FILES TO REVIEW:');
console.log('='.repeat(60));
console.log();
console.log('1. CPANEL_PRE_DEPLOYMENT_CHECKLIST.md');
console.log('   → Complete this BEFORE starting deployment');
console.log('   → Gather all credentials and verify compatibility');
console.log();
console.log('2. DEPLOYMENT_QUICK_REFERENCE.md');
console.log('   → Print this and keep it handy during deployment');
console.log('   → Quick reference for steps and troubleshooting');
console.log();
console.log('3. TESTING_AND_DEPLOYMENT_FIXES.md');
console.log('   → Detailed troubleshooting guide');
console.log('   → Solutions to common cPanel deployment issues');
console.log();
console.log('4. DEPLOYMENT.md');
console.log('   → Quick deployment overview');
console.log('   → High-level steps summary');
console.log();

console.log('='.repeat(60));

// Exit with error code if critical checks failed
if (failedChecks > 0) {
  console.log();
  console.log('❌ DEPLOYMENT NOT READY - Fix the errors above first!');
  process.exit(1);
} else {
  console.log();
  console.log('✅ READY FOR CPANEL DEPLOYMENT (after manual verification)');
  process.exit(0);
}
