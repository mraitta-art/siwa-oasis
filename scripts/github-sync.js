#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * SIWA OASIS GitHub Sync - Automated Repository Synchronization
 * 
 * Features:
 *   - Auto-commit local changes to git
 *   - Push to GitHub remote
 *   - Pull latest production changes from GitHub
 *   - Maintains sync history
 *   - Prevents accidental data loss
 * 
 * Usage:
 *   node scripts/github-sync.js              # Full sync
 *   node scripts/github-sync.js --pull-only  # Pull from GitHub
 *   node scripts/github-sync.js --push-only  # Push to GitHub
 *   node scripts/github-sync.js --force      # Force sync (skip checks)
 * ═══════════════════════════════════════════════════════════════════
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const PULL_ONLY = argv.includes('--pull-only');
const PUSH_ONLY = argv.includes('--push-only');
const FORCE = argv.includes('--force');
const DRY = argv.includes('--dry');

const rootDir = path.join(__dirname, '..');
const logFile = path.join(rootDir, 'sync-git.log');

function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  }[level] || 'ℹ️';
  
  const line = `[${timestamp}] ${prefix} ${msg}`;
  console.log(line);
  
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch (e) {
    // Ignore log write errors
  }
}

function git(cmd) {
  try {
    const result = execSync(`git ${cmd}`, { cwd: rootDir, encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    throw new Error(`Git command failed: ${cmd}\n${e.message}`);
  }
}

function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         SIWA OASIS GitHub Synchronization                      ║
║         Auto-Sync Local ↔ GitHub ↔ Production                  ║
╚════════════════════════════════════════════════════════════════╝
`);

  try {
    // Check git status
    log('Checking git status...');
    const status = git('status --porcelain');
    const branch = git('rev-parse --abbrev-ref HEAD');
    const latestHash = git('rev-parse HEAD').substring(0, 7);
    
    log(`Current branch: ${branch}`);
    log(`Latest commit: ${latestHash}`);

    // PHASE 1: PULL FROM GITHUB (if not push-only)
    if (!PUSH_ONLY) {
      console.log(`
════════════════════════════════════════════════════════════════
  PHASE 1: PULL FROM GITHUB
════════════════════════════════════════════════════════════════`);
      
      try {
        log('Fetching from origin...');
        git('fetch origin');
        
        const commits = git(`log HEAD..origin/${branch} --oneline`);
        if (commits) {
          log(`Found ${commits.split('\n').length} commits to pull`);
          if (!DRY) {
            git('pull origin ' + branch);
            log('Successfully pulled latest changes', 'success');
          } else {
            log('(DRY MODE) Would pull: ' + commits.split('\n')[0]);
          }
        } else {
          log('Already up-to-date with origin');
        }
      } catch (e) {
        log(`Pull failed: ${e.message}`, 'error');
        if (!FORCE) throw e;
      }
    }

    // PHASE 2: COMMIT LOCAL CHANGES (if not pull-only)
    if (!PULL_ONLY) {
      console.log(`
════════════════════════════════════════════════════════════════
  PHASE 2: COMMIT LOCAL CHANGES
════════════════════════════════════════════════════════════════`);
      
      if (status) {
        log(`${status.split('\n').length} files changed`);
        
        if (DRY) {
          log('(DRY MODE) Files to be committed:');
          status.split('\n').forEach(line => line && log('  ' + line));
        } else {
          // Add all changes
          git('add .');
          
          // Create commit message
          const timestamp = new Date().toISOString();
          const message = `Auto-sync: Local changes ${timestamp}`;
          
          // Commit if there are changes
          try {
            git(`commit -m "${message}"`);
            const newHash = git('rev-parse HEAD').substring(0, 7);
            log(`Created commit: ${newHash}`, 'success');
          } catch (e) {
            if (e.message.includes('nothing to commit')) {
              log('No changes to commit');
            } else {
              throw e;
            }
          }
        }
      } else {
        log('No local changes to commit');
      }
    }

    // PHASE 3: PUSH TO GITHUB (if not pull-only)
    if (!PULL_ONLY) {
      console.log(`
════════════════════════════════════════════════════════════════
  PHASE 3: PUSH TO GITHUB
════════════════════════════════════════════════════════════════`);
      
      const unpushed = git(`log origin/${branch}..HEAD --oneline`);
      if (unpushed) {
        log(`Found ${unpushed.split('\n').length} commits to push`);
        
        if (DRY) {
          log('(DRY MODE) Would push:');
          unpushed.split('\n').forEach(line => line && log('  ' + line));
        } else {
          git(`push origin ${branch}`);
          log('Successfully pushed to GitHub', 'success');
        }
      } else {
        log('Already up-to-date with GitHub');
      }
    }

    // PHASE 4: SYNC REPORT
    console.log(`
════════════════════════════════════════════════════════════════
  PHASE 4: SYNC REPORT
════════════════════════════════════════════════════════════════`);

    const currentHash = git('rev-parse HEAD').substring(0, 7);
    const remoteSha = git(`rev-parse origin/${branch}`).substring(0, 7);
    const isInSync = currentHash === remoteSha;

    log(`Local HEAD:     ${currentHash}`);
    log(`Remote HEAD:    ${remoteSha}`);
    log(`Sync Status:    ${isInSync ? 'IN SYNC ✓' : 'DIVERGED ⚠️'}`);
    
    if (DRY) {
      log('DRY MODE - No changes were made');
    }

    console.log(`
════════════════════════════════════════════════════════════════
  ✅ SYNC COMPLETE
════════════════════════════════════════════════════════════════

  Local ↔ GitHub Synchronization: ${isInSync ? 'SUCCESS' : 'NEEDS ATTENTION'}
  
  Next Steps:
  1. Verify changes: git log --oneline -10
  2. Check status:   git status
  3. View diff:      git diff

  View sync log:     ${logFile}
`);

    process.exit(0);
  } catch (e) {
    log(`SYNC FAILED: ${e.message}`, 'error');
    console.error(`\n❌ ERROR: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { git, log };
