# 🔧 COMPREHENSIVE DIAGNOSIS: YouTube Embeds Not Working + Database Sync Issues

**Date:** 2026-06-25  
**Status:** ⚠️ MULTIPLE ISSUES IDENTIFIED

---

## 📋 Problem Summary

### Issue #1: Database Not Synchronized
❌ **Status:** Sync failed with 2 critical errors

### Issue #2: YouTube Videos Not Playing on Production
❌ **Status:** IFrame API issues detected

---

## 🔴 ISSUE #1: Database Sync Failure (WHY LOCAL DATA IS OUTDATED)

### Error Details

```
PHASE 3: Database Schema Sync
  ❌ Failed: 013_create_custom_journey_packages.sql
  Error: Referencing column 'consultant_id' and referenced column 'id' 
         in foreign key constraint 'fk_1' are incompatible.

PHASE 4: Database Data Sync
  ❌ Failed: connect ECONNREFUSED 127.0.0.1:3306
  Error: Local MySQL database not running!
```

### Root Causes

#### Cause A: Local MySQL Database Not Running
- **Problem:** Connection refused on 127.0.0.1:3306
- **Why This Happened:** 
  - XAMPP / Local MySQL server is stopped
  - Database service needs to be started
- **Impact:** Cannot sync production data to local

#### Cause B: Foreign Key Type Mismatch
- **Problem:** consultant_id column type doesn't match id column type
- **Why This Happened:**
  - Migration schema expects different data types
  - TiDB Cloud may have stricter type checking
- **Impact:** New migrations can't run on production

---

## 🔴 ISSUE #2: YouTube Videos Not Working on Production

### Root Causes Identified

#### Cause A: YouTube IFrame API Not Loading
**Problem:** The YouTube IFrame API script may not be loading in production
```
Expected: <script src="https://www.youtube.com/iframe_api"></script>
Actual:   Script load may fail due to:
  - CSP (Content Security Policy) blocking
  - Network issues
  - CORS restrictions
```

**Detection Method:**
Open browser DevTools (F12) → Network tab → Search "iframe_api"
- ✓ If found: API is loading
- ❌ If NOT found: API failed to load

#### Cause B: Origin Parameter Mismatch
**Problem:** `origin` parameter in YouTube URL may not match actual domain
```javascript
// In production, should be:
const origin = 'https://siwa.today';

// But code uses:
const origin = window.location.origin;  // Works locally, may fail in production
```

**Why This Causes Issues:**
- YouTube validates the `origin` parameter
- If origin doesn't match siwa.today, iframe may fail
- Localhost URLs work locally but fail in production

#### Cause C: Content Security Policy (CSP) Headers
**Problem:** Production server CSP headers may block YouTube resources
```
What YouTube needs:
  - Allow iframe from: https://www.youtube.com
  - Allow iframe from: https://www.youtube-nocookie.com
  - Allow scripts from: https://www.youtube.com

If blocked:
  - YouTube IFrame won't load
  - No error shown to user
  - Appears as broken/blank section
```

#### Cause D: YouTube Player Initialization Timing
**Problem:** Multiple YouTube players competing for API ready callback
```javascript
// Issue in YouTubeCarouselPlayer.tsx:
window.onYouTubeIframeAPIReady = () => {
  // Only first player's callback wins
  // Other players don't initialize
};

// Should use queue system (code already does this, but may have issues)
```

---

## 🛠️ SOLUTIONS

### FIX #1: Start Local MySQL Database (Unblock Local Sync)

**For XAMPP Users:**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for green indicator
4. Run sync again: `npm run sync:db`

**For Docker Users:**
```bash
docker start mysql_container_name
# Or
docker-compose up -d mysql
```

**For Direct MySQL Installation:**
```bash
# Windows (PowerShell as Admin)
net start MySQL80

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

**Verify Connection:**
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: '127.0.0.1', user: 'root', password: ''}).then(() => console.log('✓ Connected')).catch(e => console.error('✗ Failed:', e.message))"
```

---

### FIX #2: Fix Foreign Key Type Mismatch (Unblock Production Schema Sync)

**Location:** [e:\ANitgravity\siwatoday\siwa-oasis\database-migrations\013_create_custom_journey_packages.sql](e:\ANitgravity\siwatoday\siwa-oasis\database-migrations\013_create_custom_journey_packages.sql)

**Issue:** `consultant_id` references `id` but types don't match

**Solution Options:**

**Option A: Check Consultant Table** (Recommended)
```sql
-- Check what type 'id' is in consultants table
SHOW COLUMNS FROM consultants WHERE Field = 'id';

-- Check what type consultant_id should be
SHOW COLUMNS FROM journey_packages WHERE Field = 'consultant_id';
```

**Option B: Fix Migration (if consultant_id is INT)**
```sql
-- Before:
ALTER TABLE journey_packages 
ADD CONSTRAINT fk_consultant_id 
FOREIGN KEY (consultant_id) REFERENCES consultants(id);

-- After (ensure consultant_id is BIGINT UNSIGNED if id is):
MODIFY consultant_id BIGINT UNSIGNED NOT NULL;

ALTER TABLE journey_packages 
ADD CONSTRAINT fk_consultant_id 
FOREIGN KEY (consultant_id) REFERENCES consultants(id);
```

---

### FIX #3: Fix YouTube Embeds on Production (Make Videos Work)

#### Step 1: Add CSP Headers to Production

**Location:** [e:\ANitgravity\siwatoday\siwa-oasis\next.config.ts](e:\ANitgravity\siwatoday\siwa-oasis\next.config.ts)

**Add/Update:**
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com;
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com;
      connect-src 'self' https://www.youtube.com https://youtube.com;
      img-src 'self' data: https: blob:;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data:;
    `
  }
];
```

#### Step 2: Verify YouTube API Loading in Production

**Add to components/YouTubeCarouselPlayer.tsx:**
```typescript
useEffect(() => {
  // Diagnostic: Log when API loads
  if (!window.YT) {
    console.log('🔍 YouTube IFrame API not loaded, loading now...');
    
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.defer = true;
      
      tag.onerror = () => {
        console.error('❌ Failed to load YouTube IFrame API');
      };
      
      document.head.appendChild(tag);
    }
  } else {
    console.log('✓ YouTube IFrame API already loaded');
  }
}, []);
```

#### Step 3: Fix Origin Parameter for Production

**Location:** [e:\ANitgravity\siwatoday\siwa-oasis\src\components\YouTubeCarouselPlayer.tsx](e:\ANitgravity\siwatoday\siwa-oasis\src\components\YouTubeCarouselPlayer.tsx)

**Change:**
```typescript
// Before:
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// After (more reliable for production):
const origin = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
  : process.env.NEXT_PUBLIC_APP_URL || '';
```

**Verify in .env.production:**
```bash
NEXT_PUBLIC_APP_URL=https://siwa.today
```

#### Step 4: Add Error Recovery

**Location:** [e:\ANitgravity\siwatoday\siwa-oasis\src\components\YouTubeCarouselPlayer.tsx](e:\ANitgravity\siwatoday\siwa-oasis\src\components\YouTubeCarouselPlayer.tsx)

**Add:**
```typescript
const handlePlayerError = (event: any) => {
  const errorCode = event.data;
  const errors: Record<number, string> = {
    2: 'Invalid parameter',
    5: 'HTML5 player error',
    100: 'Video not found',
    101: 'Video owner does not allow embedding',
    150: 'Same as 101'
  };
  
  console.error('YouTube Player Error:', errors[errorCode] || `Code ${errorCode}`);
  
  // Fallback: Use YouTubeFacade as backup
  setError(true);
};

// Add to player events:
events: {
  onError: handlePlayerError
}
```

---

## 📊 Sync Sequence (After Fixes)

```
1. ✅ Start Local MySQL
   └─ npm run sync:db --verify

2. ✅ Fix Foreign Key Types
   └─ node scripts/run_migration.js

3. ✅ Run Full Sync
   └─ npm run sync

4. ✅ Test Local Version
   └─ http://localhost:3000 → Test YouTube videos

5. ✅ Deploy to Production
   └─ npm run build:cpanel
   └─ Upload to siwa.today

6. ✅ Verify Production
   └─ https://siwa.today → Check YouTube embeds
```

---

## 🔍 Diagnostic Commands

### Check Local Database Status
```bash
# Verify MySQL is running
cd e:\ANitgravity\siwatoday\siwa-oasis
node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: '127.0.0.1', user: 'root', password: '', database: 'siwa_oasis'}).then(c => c.query('SELECT COUNT(*) FROM businesses')).then(([rows]) => console.log('✓ Businesses:', rows[0]['COUNT(*)'])).catch(e => console.error('✗ Error:', e.message))"
```

### Check Foreign Key Status
```bash
# Production database
node -e "
const mysql = require('mysql2/promise');
const cfg = {host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com', port: 4000, user: '3iv5fPeLo2ze3jn.root', password: 'Dj2teUVtQyMYghF3', database: 'siwa_oasis', ssl: {}};
mysql.createConnection(cfg).then(c => c.query('SHOW CREATE TABLE journey_packages')).then(([rows]) => console.log(rows[0]['Create Table'])).catch(e => console.error('✗', e.message))
"
```

### Check YouTube Video URLs
```bash
# Verify YouTube videos in database
curl "http://localhost:3000/api/carousels/hero" | jq '.slides[] | select(.type=="youtube") | {type, mediaUrl}'
```

---

## ⚠️ Summary Table

| Issue | Local | Production | Status |
|-------|-------|------------|--------|
| **MySQL Running** | ❌ Stopped | ✓ Running | Fix: Start MySQL |
| **Data Sync** | ❌ Outdated | ✓ Current | Fix: Run sync after MySQL starts |
| **Foreign Keys** | ❌ Type mismatch | ⚠️ Fails | Fix: Update migration |
| **YouTube API** | ✓ Loads | ❌ May fail | Fix: Add CSP headers |
| **YouTube Origin** | ✓ localhost:3000 | ⚠️ siwa.today | Fix: Use NEXT_PUBLIC_APP_URL |
| **YouTube Players** | ✓ Single | ⚠️ Multiple | Fix: Queue system working |

---

## 🚀 Quick Fix Order

1. **START LOCAL MYSQL** (5 min)
   ```bash
   # XAMPP → Start MySQL
   # Or: net start MySQL80 (Windows)
   ```

2. **RUN SYNC** (10 min)
   ```bash
   npm run sync:db
   ```

3. **FIX FOREIGN KEYS** (5 min)
   - Edit migration file
   - Add type matching

4. **FIX YOUTUBE PRODUCTION** (10 min)
   - Add CSP headers
   - Update origin parameter
   - Add error recovery

5. **TEST & DEPLOY** (15 min)
   - Test locally: http://localhost:3000
   - Test YouTube videos
   - Deploy to siwa.today

---

## 📞 Questions?

- **Is local MySQL running?** Check XAMPP Control Panel
- **Why is sync failing?** Connection refused = MySQL not running
- **Why don't YouTube videos play?** CSP headers or API not loaded
- **How to test YouTube?** Play video in hero carousel on homepage

See: [LOCAL_vs_PRODUCTION_COMPARISON.md](LOCAL_vs_PRODUCTION_COMPARISON.md)
