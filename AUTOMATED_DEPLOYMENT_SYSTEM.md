# 🚀 AUTOMATED CPANEL DEPLOYMENT SYSTEM

## Overview

This system automatically prepares your Next.js application for cPanel deployment, handling all environment-specific configurations, cross-platform compatibility, and providing an easy update workflow.

---

## 📁 What's Included

### 1. **Master Configuration File**
**File:** `deployment-config.json`

This is your central control panel for all deployment settings. Edit this file to:
- Configure which bundles to generate
- Set environment-specific options
- Define file inclusion/exclusion rules
- Customize cPanel settings
- Control auto-sync behavior

### 2. **Advanced Deployment Preparation Script**
**File:** `scripts/prepare-deployment-advanced.js`

Creates environment-specific deployment bundles:
- ✅ **Universal Bundle** (`deploy_bundle/`) - Works everywhere
- ✅ **cPanel-Optimized Bundle** (`deploy_bundle_cpanel/`) - Best for cPanel

Each bundle includes:
- Environment-specific `package.json` with correct build scripts
- Optimized `.htaccess` with security headers
- Tuned `next.config.ts` for the target environment
- Custom `server.js` configuration
- `deployment-manifest.json` for tracking

### 3. **Auto-Sync System**
**File:** `scripts/auto-sync-deployment.js`

Watches for local changes and automatically regenerates deployment bundles:
- Monitors `src/`, `public/`, config files
- Detects file changes via MD5 hashing
- Auto-regenerates bundles when changes detected
- Debounced to prevent excessive rebuilding

### 4. **Compatibility Checker**
**File:** `scripts/check-cpanel-compatibility.js`

Verifies your environment is ready for cPanel deployment:
- Checks Node.js version
- Validates project configuration
- Lists cPanel requirements
- Identifies potential issues

---

## 🔄 WORKFLOW: How It Works

### Initial Setup (One Time)

```bash
# 1. Review and edit master configuration
notepad deployment-config.json

# 2. Generate deployment bundles
node scripts/prepare-deployment-advanced.js

# 3. Verify compatibility
node scripts/check-cpanel-compatibility.js
```

### Daily Development Workflow

#### Option A: Manual Sync (Recommended for most users)

```bash
# 1. Make your code changes
# Edit files in src/, public/, etc.

# 2. Test locally
npm run dev

# 3. Build locally to verify
npm run build

# 4. Generate updated deployment bundles
node scripts/prepare-deployment-advanced.js

# 5. Create ZIP from appropriate bundle
# For cPanel: deploy_bundle_cpanel/
# For universal: deploy_bundle/

# 6. Upload to cPanel
```

#### Option B: Auto-Sync Watch Mode (For active development)

```bash
# Start watching for changes
node scripts/auto-sync-deployment.js --watch

# Now, whenever you edit files:
# - System detects changes automatically
# - Bundles regenerate in background
# - Ready to upload at any time

# Press Ctrl+C to stop watching
```

### cPanel Update Workflow

When you need to update your live cPanel site:

```bash
# 1. Make changes locally
# Edit your code

# 2. Test locally
npm run dev
npm run build

# 3. Regenerate bundles (if not using watch mode)
node scripts/prepare-deployment-advanced.js

# 4. Create ZIP
cd deploy_bundle_cpanel
# Select all → Right-click → Send to → Compressed folder
# Name: siwa_upload.zip

# 5. Upload to cPanel
# - File Manager → Upload ZIP
# - Extract (overwrite)
# - Setup Node.js App → Run JS Script → build
# - Restart
```

---

## 📦 Bundle Types Explained

### Universal Bundle (`deploy_bundle/`)

**Use when:**
- Unsure about cPanel environment
- Deploying to multiple environments
- Want maximum compatibility

**Features:**
- Safe build command: `next build` (no environment variables)
- Standard `.htaccess` with basic routing
- Normal Next.js configuration
- Works on Unix, Windows, cPanel

### cPanel-Optimized Bundle (`deploy_bundle_cpanel/`)

**Use when:**
- Deploying specifically to cPanel
- Want enhanced security and performance
- Need cPanel-specific optimizations

**Features:**
- Build command: `next build` (memory set in cPanel UI)
- Enhanced `.htaccess` with:
  - Security headers (X-Frame-Options, X-XSS-Protection)
  - Gzip compression
  - Static asset caching
- Standalone output mode
- Image optimization disabled (cPanel compatibility)
- cPanel-specific server configuration

---

## ⚙️ Configuration Guide

### Editing `deployment-config.json`

#### Change which bundles to generate:

```json
"deployment": {
  "bundles": {
    "universal": {
      "enabled": true,  // Set to false to skip
      "directory": "deploy_bundle"
    },
    "cpanel_optimized": {
      "enabled": true,  // Set to false to skip
      "directory": "deploy_bundle_cpanel"
    }
  }
}
```

#### Customize cPanel environment variables:

```json
"environments": {
  "cpanel": {
    "cpanel": {
      "environmentVariables": [
        "DB_HOST=localhost",
        "DB_PORT=3306",
        "DB_USER=__DB_USER__",  // Replace with actual value
        // ... more variables
      ]
    }
  }
}
```

#### Change which files to include:

```json
"files": {
  "include": [
    "src",
    "public",
    // Add more files/directories
  ],
  "exclude": [
    "node_modules",
    ".git",
    // Add more exclusions
  ]
}
```

#### Adjust auto-sync settings:

```json
"autoSync": {
  "enabled": true,
  "watchFiles": [
    "src/**/*",
    "public/**/*",
    // Add more patterns
  ],
  "rebuildOnChanges": true
}
```

---

## 🔍 Deployment Manifest

Each bundle includes `deployment-manifest.json` which tracks:

```json
{
  "version": "0.1.0",
  "environment": "cpanel",
  "generated": "2026-04-28T12:34:56.789Z",
  "nodeVersion": "v20.10.0",
  "files": [
    {
      "name": "src",
      "type": "directory",
      "size": 12345678,
      "modified": "2026-04-28T12:30:00.000Z"
    }
  ],
  "checksums": {
    "package.json": "a3f2b8c9d1e4f5a6..."
  }
}
```

**Use this to:**
- Verify upload integrity
- Track deployment versions
- Debug issues
- Compare deployments

---

## 🎯 Quick Commands Reference

### Prepare Deployment Bundles

```bash
# Generate all enabled bundles
node scripts/prepare-deployment-advanced.js

# Just universal bundle (edit config to disable others)
# Edit deployment-config.json → set cpanel_optimized.enabled = false
```

### Auto-Sync (Watch Mode)

```bash
# Start watching
node scripts/auto-sync-deployment.js --watch

# Bundles auto-regenerate when you edit files
```

### Check Compatibility

```bash
# Verify environment is ready
node scripts/check-cpanel-compatibility.js
```

### Traditional Deploy (Backward Compatible)

```bash
# Original simple script still works
node scripts/deploy-prepare.js
```

---

## 📊 Comparison: Old vs New System

### Old System (Still Available)

```bash
# Single script, one bundle type
node scripts/deploy-prepare.js

# Result: deploy_bundle/
```

**Limitations:**
- Single configuration
- No environment detection
- Manual updates required
- No change tracking

### New System (Recommended)

```bash
# Advanced script, multiple bundles
node scripts/prepare-deployment-advanced.js

# Results:
# - deploy_bundle/ (universal)
# - deploy_bundle_cpanel/ (optimized)
# Each with deployment-manifest.json
```

**Advantages:**
- ✅ Multiple environment support
- ✅ Auto-configuration
- ✅ Change detection
- ✅ Version tracking
- ✅ Enhanced security
- ✅ Performance optimizations

---

## 🛡️ Security Features

The cPanel-optimized bundle includes:

### 1. Security Headers (.htaccess)

```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

### 2. Gzip Compression

```apache
AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
```

### 3. Static Asset Caching

```apache
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
```

### 4. Safe Build Scripts

No environment variables in build commands - memory limits set via cPanel UI instead.

---

## 🔄 Update Propagation

### How Local Changes Reach cPanel

```
┌─────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                      │
│                                         │
│  1. Edit files in src/, public/, etc.  │
│  2. Test: npm run dev                   │
│  3. Build: npm run build                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BUNDLE GENERATION                      │
│                                         │
│  Run: node scripts/                     │
│       prepare-deployment-advanced.js    │
│                                         │
│  Creates:                               │
│  - deploy_bundle/                       │
│  - deploy_bundle_cpanel/                │
│  - deployment-manifest.json             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ZIP CREATION                           │
│                                         │
│  1. Go to deploy_bundle_cpanel/         │
│  2. Select all files                    │
│  3. Right-click → Compress to ZIP       │
│  4. Name: siwa_upload.zip               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  CPANEL UPLOAD                          │
│                                         │
│  1. File Manager → Upload ZIP           │
│  2. Extract (overwrite files)           │
│  3. Setup Node.js App                   │
│  4. Run JS Script → build               │
│  5. Restart                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  LIVE SITE UPDATED                      │
│                                         │
│  Your changes are now live!             │
└─────────────────────────────────────────┘
```

---

## 📋 Best Practices

### 1. Always Test Locally First

```bash
npm run dev      # Test in development
npm run build    # Verify build works
# Then generate bundles
```

### 2. Use Watch Mode During Active Development

```bash
# Start watch mode when coding
node scripts/auto-sync-deployment.js --watch

# Bundles always ready to upload
```

### 3. Check Manifest Before Upload

```bash
# Verify deployment-manifest.json
# Check version, timestamp, file count
```

### 4. Keep deployment-config.json Updated

- Review before each deployment
- Update environment variables
- Adjust file inclusions as needed

### 5. Document Your Deployments

Use the deployment manifest to track:
- Version deployed
- Date/time
- Files included
- Any custom changes

---

## 🆘 Troubleshooting

### Issue: Bundles Not Regenerating

**Solution:**
```bash
# Force regeneration
node scripts/prepare-deployment-advanced.js

# Or clear hash cache
rm .last-sync-hashes.json  # On Windows: del .last-sync-hashes.json
node scripts/auto-sync-deployment.js
```

### Issue: Watch Mode Not Detecting Changes

**Solution:**
```bash
# Restart watch mode
# Ctrl+C to stop
node scripts/auto-sync-deployment.js --watch
```

### Issue: Wrong Configuration in Bundle

**Solution:**
```bash
# 1. Edit deployment-config.json
# 2. Regenerate bundles
node scripts/prepare-deployment-advanced.js
# 3. Verify bundle contents
```

### Issue: cPanel Build Still Fails

**Solution:**
1. Check you're using `deploy_bundle_cpanel/` or `deploy_bundle/`
2. Verify package.json has `"build": "next build"`
3. Check cPanel memory limit is 1024MB+
4. Review TESTING_AND_DEPLOYMENT_FIXES.md

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `deployment-config.json` | Master configuration |
| `CPANEL_PRE_DEPLOYMENT_CHECKLIST.md` | Complete pre-deployment checklist |
| `DEPLOYMENT_QUICK_REFERENCE.md` | Quick reference card |
| `TESTING_AND_DEPLOYMENT_FIXES.md` | Troubleshooting guide |
| `DEPLOYMENT.md` | Basic deployment overview |

---

## 🎯 Summary

### What You Get:

1. ✅ **Automated bundle generation** for multiple environments
2. ✅ **Cross-platform compatibility** (Unix/Windows/cPanel)
3. ✅ **Automatic change detection** and sync
4. ✅ **Enhanced security** headers and optimizations
5. ✅ **Version tracking** with deployment manifests
6. ✅ **Easy update workflow** - edit locally, deploy globally
7. ✅ **Centralized configuration** in one JSON file
8. ✅ **Backward compatible** - old scripts still work

### Quick Start:

```bash
# 1. Generate bundles
node scripts/prepare-deployment-advanced.js

# 2. ZIP deploy_bundle_cpanel/

# 3. Upload to cPanel

# 4. Done!
```

---

**System Version:** 1.0  
**Last Updated:** 2026-04-28  
**Compatible with:** Next.js 15.x, Node.js 18.x/20.x
