#!/usr/bin/env node
/**
 * cPanel-Safe Build Script
 * 
 * WHY THIS EXISTS:
 * cPanel's Node.js Application Manager treats ANY stderr output as a failure,
 * causing "Script exit code: 1" even when `next build` succeeds.
 * 
 * This wrapper:
 * 1. Redirects stderr → stdout so warnings don't trigger cPanel's error detection
 * 2. Sets reasonable memory limits for shared hosting
 * 3. Reports the actual exit code from `next build`
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

// Memory limit — adjust based on your cPanel plan (512MB is safe for most shared plans)
const MEMORY_LIMIT = process.env.BUILD_MEMORY || '1024';

console.log('=== cPanel Build Script ===');

// --- INTEGRITY CHECK ---
try {
  console.log('🛡️ Running Governance Integrity Check...');
  execSync('node scripts/pre-deployment-health-check.js', { stdio: 'inherit' });
  console.log('✅ Integrity Check Passed.');
} catch (e) {
  console.error('❌ DEPLOYMENT BLOCKED: Health check found critical issues.');
  console.error('Please fix the "ALARMS" before building for production.');
  process.exit(1);
}
// -----------------------

console.log(`Memory limit: ${MEMORY_LIMIT}MB`);
const nextCli = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn('node', [
  `--max-old-space-size=${MEMORY_LIMIT}`,
  nextCli,
  'build'
], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
  // KEY FIX: pipe stderr so we can redirect it to stdout
  stdio: ['inherit', 'inherit', 'pipe']
});

// Redirect stderr to stdout (so cPanel doesn't interpret warnings as failures)
child.stderr.on('data', (data) => {
  // Write stderr content to stdout instead
  process.stdout.write(data);
});

child.on('close', (code) => {
  console.log('');
  console.log(`=== Build finished with exit code: ${code} ===`);
  process.exit(code);
});

child.on('error', (err) => {
  console.log('Build process error:', err.message);
  process.exit(1);
});
