#!/usr/bin/env node
/**
 * Production Deployment via Node.js
 * Handles git operations when shell commands hang
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.join(__dirname);

function runCommand(cmd, description) {
  console.log(`\n📦 ${description}`);
  console.log(`   Command: ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });
    console.log(`✅ ${description} complete\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function deploy() {
  console.log('\n🚀 PRODUCTION DEPLOYMENT\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check status
    console.log('\n1️⃣  Checking git status...');
    const status = runCommand('git status --short', 'Git status check');
    if (status.trim()) {
      console.log('Modified files:');
      console.log(status);
    } else {
      console.log('✓ No pending changes');
    }

    // Step 2: Stage changes
    runCommand('git add -A', 'Staging all changes');

    // Step 3: Check what will be committed
    const staged = runCommand('git diff --cached --name-only', 'Checking staged files');
    if (staged.trim()) {
      console.log('Files staged for commit:');
      staged.split('\n').filter(f => f).forEach(f => console.log(`  - ${f}`));
    }

    // Step 4: Commit
    const commitMsg = `Feature: Smart Business Comparison Engine with Universal Sections

- Add business comparison API with type validation
- Create universal sections for cross-type comparison (Vibe, Experience, Investment)
- Add investment opportunity section with 5 standard fields
- Implement ComparisonTable component with matrix display
- Add comparison controls (checkbox + sticky bar)
- Create useComparison React hook with state management
- Add /compare page for dedicated comparison view
- Add /admin/homepage-guide for editor instructions
- Add database verification endpoint for schema checking
- Add comparison matrix caching table
- Add updated indexes for performance optimization

BREAKING: Requires running POST /api/setup/database-verification and /api/setup/create-universal-sections`;

    try {
      const commit = runCommand(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, 'Creating commit');
      console.log('Commit output:', commit);
    } catch (e) {
      if (e.message.includes('nothing to commit')) {
        console.log('⚠️  No changes to commit');
      } else {
        throw e;
      }
    }

    // Step 5: Show commit log
    const log = runCommand('git log --oneline -3', 'Recent commits');
    console.log('\nRecent commits:');
    console.log(log);

    // Step 6: Push to remote
    console.log('\n2️⃣  Pushing to remote...');
    const branch = runCommand('git rev-parse --abbrev-ref HEAD', 'Getting current branch').trim();
    console.log(`✓ Current branch: ${branch}`);
    
    runCommand(`git push origin ${branch}`, `Pushing ${branch} to origin`);

    // Step 7: Verify push
    const remote = runCommand('git log -1 --oneline', 'Latest commit').trim();
    console.log(`\n✅ Latest commit: ${remote}`);

    // Done
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DEPLOYMENT COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. POST /api/setup/database-verification');
    console.log('2. POST /api/setup/create-universal-sections');
    console.log('3. npm run build');
    console.log('4. npm start\n');

  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deploy().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
