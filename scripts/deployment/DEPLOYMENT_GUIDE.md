# 🚀 DEPLOYMENT GUIDE: LOCAL TO PRODUCTION (siwa.today)

## ⚡ QUICK START (5 STEPS)

```powershell
# Step 1: Ensure all changes are committed
git status
git add -A
git commit -m "Final: All section management features ready for production"

# Step 2: Push to GitHub (auto-triggers Vercel deployment)
git push origin main

# Step 3: Verify Vercel deployment
# Go to: https://vercel.com/dashboard (check build status)

# Step 4: Access cPanel and run migrations
# SSH/cPanel → Database → Execute migrations 019 & 020

# Step 5: Test on production
# Visit: https://siwa.today/admin/section-guide
```

---

## 📋 DETAILED DEPLOYMENT STEPS

### STEP 1: LOCAL VERIFICATION (5 minutes)

**Verify everything is committed:**
```powershell
Set-Location E:\ANitgravity\siwatoday\siwa-oasis
git status
```

**Expected output:**
```
On branch main
Your branch is ahead of 'origin/main' by X commits
nothing to commit, working tree clean
```

**If there are uncommitted changes:**
```powershell
git add -A
git commit -m "Final: Section management system ready for production"
```

**Verify build succeeds:**
```powershell
npm run build
```

**Check for errors:**
- Should see: `✓ Compiled successfully`
- Should see: `✓ Build succeeded`

---

### STEP 2: GITHUB PUSH (2 minutes)

```powershell
git push origin main
```

**Expected output:**
```
Enumerating objects: X, done.
Total X (delta X), reused 0 (delta 0), pack-reused 0
To https://github.com/mraitta-art/siwa-oasis.git
   xxxxxx...xxxxxx  main -> main
```

---

### STEP 3: VERCEL AUTO-DEPLOYMENT (5-10 minutes)

**What happens automatically:**
1. GitHub webhook triggers Vercel
2. Vercel builds the Next.js project
3. Build completes and deploys
4. Production URL available

**Monitor deployment:**
1. Go to https://vercel.com/dashboard
2. Find "siwa-oasis" project
3. Watch build progress
4. Confirm "Production" shows "Ready"

**If build fails:**
- Check error logs on Vercel dashboard
- Most likely: TypeScript errors
- Review and fix locally, then push again

---

### STEP 4: DATABASE MIGRATION (10 minutes)

**Connect to cPanel/Database:**

**Option A: Via cPanel phpMyAdmin**
1. Log in to cPanel (siwa.today:2083)
2. Go to phpMyAdmin
3. Select your database
4. Go to "SQL" tab
5. Paste migration SQL (see below)
6. Click "Go"

**Option B: Via SSH**
```bash
ssh user@siwa.today
mysql -u username -p database_name < migrations/019_section_features_config.sql
mysql -u username -p database_name < migrations/020_section_components.sql
```

**Migration SQL Files:**

**File 1: migrations/019_section_features_config.sql**
```sql
-- Add section feature configuration columns
ALTER TABLE sections ADD COLUMN (
    has_miniblog BOOLEAN DEFAULT TRUE,
    miniblog_enabled BOOLEAN DEFAULT TRUE,
    has_gallery BOOLEAN DEFAULT TRUE,
    gallery_enabled BOOLEAN DEFAULT TRUE,
    curation_policy ENUM('auto_approve', 'manual_review', 'admin_only') DEFAULT 'manual_review',
    vendor_permissions JSON DEFAULT '{"can_upload_images": true, "can_write_blogs": true, "can_edit_own": true}',
    content_instructions MEDIUMTEXT,
    max_gallery_items INT DEFAULT 50,
    auto_publish_blogs BOOLEAN DEFAULT FALSE,
    auto_publish_images BOOLEAN DEFAULT FALSE,
    created_by_admin VARCHAR(100)
);

-- Create section_blogs table
CREATE TABLE IF NOT EXISTS section_blogs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100),
    content_manager_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT,
    excerpt VARCHAR(500),
    featured_image_url VARCHAR(500),
    status ENUM('draft', 'pending_approval', 'published', 'rejected') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    approved_by_admin VARCHAR(100),
    approval_notes MEDIUMTEXT,
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_section_id (section_id),
    INDEX idx_business_id (business_id),
    INDEX idx_status (status),
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**File 2: migrations/020_section_components.sql**
```sql
-- Create section_components table
CREATE TABLE IF NOT EXISTS section_components (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_id VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_repeatable BOOLEAN DEFAULT FALSE,
    max_items INT DEFAULT 1,
    display_order INT DEFAULT 0,
    config JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_section_id (section_id),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create section_component_data table
CREATE TABLE IF NOT EXISTS section_component_data (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_component_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100),
    title VARCHAR(255),
    data JSON NOT NULL,
    status ENUM('draft', 'published', 'pending_approval') DEFAULT 'draft',
    approved_by_admin VARCHAR(100),
    published_at TIMESTAMP NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_section_component_id (section_component_id),
    INDEX idx_business_id (business_id),
    INDEX idx_status (status),
    FOREIGN KEY (section_component_id) REFERENCES section_components(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create component_templates table
CREATE TABLE IF NOT EXISTS component_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    fields JSON,
    example_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert component templates
INSERT INTO component_templates VALUES
('location', 'Location', 'fa-map-pin', 'Business location', 'Basic', '[]', '{}', NOW()),
('hours', 'Business Hours', 'fa-clock', 'Operating hours', 'Basic', '[]', '{}', NOW()),
('team_member', 'Team Member', 'fa-user', 'Team profile', 'Basic', '[]', '{}', NOW()),
('testimonial', 'Testimonial', 'fa-quote-left', 'Customer review', 'Basic', '[]', '{}', NOW()),
('faq', 'FAQ', 'fa-question-circle', 'FAQ item', 'Basic', '[]', '{}', NOW()),
('feature', 'Feature', 'fa-star', 'Feature highlight', 'Showcase', '[]', '{}', NOW()),
('pricing', 'Pricing', 'fa-tag', 'Price tier', 'Showcase', '[]', '{}', NOW()),
('gallery_showcase', 'Gallery', 'fa-images', 'Gallery showcase', 'Showcase', '[]', '{}', NOW());
```

**After running migrations:**
```sql
-- Verify tables were created
SHOW TABLES LIKE '%component%';
SHOW TABLES LIKE '%section_blog%';

-- Should return:
-- component_templates
-- section_component_data
-- section_components
-- section_blogs
```

---

### STEP 5: VERIFY DEPLOYMENT (5 minutes)

**Test URLs:**

```
Production URLs to test:
1. Admin Section Guide:     https://siwa.today/admin/section-guide
2. Create Section:          https://siwa.today/admin/sections/create
3. Image Curation:          https://siwa.today/admin/image-curation
4. Blog Approval:           https://siwa.today/admin/blog-approval
5. Vendor Components:       https://siwa.today/vendor/components-editor
6. Vendor Media:            https://siwa.today/vendor/media
7. Vendor Content Manager:  https://siwa.today/vendor/content-manager
```

**If pages load:**
✅ Deployment successful!

**If pages show 404:**
- Vercel build may not have completed
- Wait 2-3 minutes and try again
- Check Vercel dashboard for errors

**If pages show 500 error:**
- Database migration may have failed
- Check cPanel error logs
- Verify migrations ran successfully
- Re-run migrations if needed

---

## 🔄 ROLLBACK PLAN (If Issues Occur)

**If everything breaks:**

```bash
# Option 1: Revert to last known good commit
git revert HEAD~1
git push origin main

# Option 2: Revert database migrations
# SSH to cPanel and run:
ALTER TABLE sections DROP COLUMN has_miniblog;
DROP TABLE IF EXISTS section_components;
DROP TABLE IF EXISTS section_component_data;
DROP TABLE IF EXISTS section_blogs;
DROP TABLE IF EXISTS component_templates;
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] All local changes committed
- [ ] Build succeeds locally (`npm run build`)
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] Vercel deployment started
- [ ] Vercel build completed successfully
- [ ] Database migrations executed
- [ ] Tables verified in cPanel
- [ ] Admin pages load (section-guide)
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] Sample section creation works
- [ ] Vendor can access component editor

---

## 📊 SUCCESS CRITERIA

**Deployment is successful when:**

1. ✅ All new pages load at siwa.today
2. ✅ Admin can create a new section
3. ✅ Admin can select components for section
4. ✅ Vendor can access components editor
5. ✅ Vendor can upload images
6. ✅ No console errors in browser DevTools
7. ✅ Database tables exist and have correct structure
8. ✅ API endpoints respond (check Network tab in DevTools)

---

## 🆘 TROUBLESHOOTING

### Issue: "Internal Server Error" on /admin/section-guide

**Cause:** Database tables don't exist yet

**Solution:**
1. Check cPanel database
2. Run migrations again
3. Verify migrations executed without errors
4. Refresh page

### Issue: "404 Not Found"

**Cause:** Vercel deployment not complete or pages not built

**Solution:**
1. Check Vercel dashboard
2. Wait for build to finish
3. Verify build logs for errors
4. Redeploy if necessary

### Issue: Images fail to upload

**Cause:** File permissions or storage path issue

**Solution:**
1. Check cPanel file permissions (755 for folders)
2. Verify /uploads folder exists and is writable
3. Check browser console for error details
4. Contact hosting support if needed

### Issue: Vendors can't log in

**Cause:** Auth token mismatch between local and production

**Solution:**
1. Clear browser cookies/cache
2. Log out and log back in
3. Check localStorage for auth tokens
4. Verify API endpoints are accessible

---

## 📞 SUPPORT CONTACTS

- **Vercel Issues:** Check dashboard.vercel.com
- **cPanel Issues:** Contact hosting provider or check cPanel help
- **Database Issues:** Check MySQL error logs in cPanel
- **Code Issues:** Review error logs and commit changes

---

## 🎉 POST-DEPLOYMENT

Once deployed:

1. **Notify team:**
   - Send link to /admin/section-guide
   - Explain new features
   - Provide training materials

2. **Monitor:**
   - Check error logs daily
   - Collect user feedback
   - Track performance metrics

3. **Plan Phase 2:**
   - Multi-channel communication
   - Advanced analytics
   - Additional component types

---

**Estimated Total Time: 30-45 minutes**
**Risk Level: LOW (only new tables added, no conflicts)**
**Recommendation: PROCEED with deployment**
