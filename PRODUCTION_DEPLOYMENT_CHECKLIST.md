# PRODUCTION DEPLOYMENT READINESS CHECKLIST

## Overview
This checklist verifies that the Journey Request Policy Engine is ready for production deployment to siwa.today. Follow the steps in order.

---

## Phase 1: Pre-Deployment Validation (Local)

### Code Quality
- [ ] All TypeScript compiles without errors (run: `npm run build`)
- [ ] No ESLint critical errors (run: `npm run lint`)
- [ ] All imports resolve correctly
- [ ] Dark Olive theme applied consistently (#556B2F)
- [ ] Golden accents visible (#FFD700, #FFD700)

### Verification
```bash
# In siwa-oasis/ directory
npm run build
# Should output: "compiled successfully"
```

### UI Functionality (Local Testing)
- [ ] Admin policy dashboard loads at `/admin/journey-policies`
- [ ] Admin request list shows at `/admin/journey-requests`
- [ ] Admin search page works at `/admin/journey-requests/search`
- [ ] Admin analytics show at `/admin/analytics/journey-requests`
- [ ] Vendor leaderboard displays at `/admin/analytics/vendor-performance`
- [ ] Vendor queue loads at `/vendor/request-queue`
- [ ] Visitor form works at `/visitor/journey-request`
- [ ] Request tracking loads at `/visitor/journey-request/[id]`

### API Testing (Local)
- [ ] POST to `/api/admin/journey-policies` returns 200
- [ ] GET from `/api/admin/journey-policies` returns mock policies
- [ ] GET from `/api/admin/journey-requests` returns mock requests
- [ ] POST to `/api/visitor/journey-requests` creates request
- [ ] GET from `/api/vendor/request-queue` returns queue
- [ ] GET from `/api/admin/analytics/journey-requests` returns analytics

### Database Configuration
- [ ] `.env.local` exists in `siwa-oasis/` with DB credentials
- [ ] DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are configured
- [ ] MySQL connection is testable from local machine
- [ ] Test query runs successfully (can list tables)

### Documentation Review
- [ ] `ENHANCEMENT_GUIDE.md` covers all features ✅
- [ ] `DATABASE_CONFIG.md` has setup instructions ✅
- [ ] `JOURNEY_REQUEST_POLICY_ENGINE.md` documents system ✅
- [ ] `DEPLOYMENT_GUIDE.md` has production steps ✅
- [ ] This checklist is clear and comprehensive ✅

---

## Phase 2: Production Database Preparation

### Access & Backup
- [ ] Obtain cPanel credentials for siwa.today (contact hosting provider)
- [ ] Access phpMyAdmin or SSH terminal
- [ ] **BACKUP existing database:**
  ```bash
  # Via SSH
  mysqldump -u username -p siwa_oasis > siwa_oasis_backup_$(date +%s).sql
  
  # Or via phpMyAdmin: Export tab
  ```
- [ ] Store backup in safe location (AWS S3, Google Drive, etc.)

### Migration Execution
- [ ] Obtain migration file: `migrations/021_journey_request_policy_engine.sql`
- [ ] Execute migration via cPanel phpMyAdmin:
  1. Login to phpMyAdmin
  2. Select `siwa_oasis` database
  3. Click "SQL" tab
  4. Paste contents of migration 021
  5. Click "Go"
  6. Verify: "5 successful queries" appears
  
- [ ] Or execute via SSH:
  ```bash
  mysql -u username -p siwa_oasis < migrations/021_journey_request_policy_engine.sql
  ```

### Verification
- [ ] 5 new tables exist:
  - `admin_journey_policies`
  - `journey_requests`
  - `vendor_request_queue`
  - `journey_request_approvals`
  - `journey_request_analytics`
- [ ] 4 seed policies are populated:
  ```sql
  SELECT COUNT(*) FROM admin_journey_policies WHERE is_active = TRUE;
  -- Should return: 4
  ```
- [ ] Indexes are created:
  ```sql
  SHOW INDEX FROM journey_requests;
  -- Should show indexes on: status, matched_policy_id, created_at
  ```

---

## Phase 3: Production Environment Setup

### Environment Variables
- [ ] Login to Vercel project dashboard
- [ ] Go to Settings → Environment Variables
- [ ] Add variables (or update existing):
  ```
  DB_HOST=production.db.host (or localhost if same server)
  DB_USER=production_db_user
  DB_PASSWORD=production_db_password
  DB_NAME=siwa_oasis
  DB_CONNECTION_LIMIT=10
  
  JWT_SECRET=existing_jwt_secret
  ADMIN_ROLE=admin
  VENDOR_ROLE=vendor
  VISITOR_ROLE=visitor
  ```

### Email Configuration (Optional - Phase 2)
- [ ] Obtain SMTP credentials (Gmail, SendGrid, or company email)
- [ ] Add to Vercel environment:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=app-specific-password
  SMTP_FROM=noreply@siwa.today
  ```
- [ ] Test SMTP connection (setup SMTP testing in separate task)

---

## Phase 4: Code Deployment

### Git Preparation
- [ ] Verify all code changes are committed:
  ```bash
  git status
  # Should show: "working tree clean"
  ```
- [ ] Create feature branch for deployment:
  ```bash
  git checkout -b deploy/journey-request-enhancement
  ```

### Push to Production
- [ ] Push code to repository:
  ```bash
  git push origin deploy/journey-request-enhancement
  ```
- [ ] Create Pull Request on GitHub
- [ ] Request review (if team protocol requires)
- [ ] Merge to `main` branch after approval
- [ ] Vercel automatically deploys from main branch

### Deployment Monitoring
- [ ] Visit Vercel dashboard → Deployments
- [ ] Wait for deployment to complete (typically 2-3 minutes)
- [ ] Check build logs for errors
- [ ] Deployment status shows "✓ Ready" (green)

---

## Phase 5: Production Validation

### Smoke Tests (Critical Pages)
- [ ] Admin dashboard loads: `https://siwa.today/admin/journey-policies`
- [ ] Request list displays: `https://siwa.today/admin/journey-requests`
- [ ] Analytics dashboard works: `https://siwa.today/admin/analytics/journey-requests`
- [ ] Vendor leaderboard loads: `https://siwa.today/admin/analytics/vendor-performance`
- [ ] Visitor form submits: `https://siwa.today/visitor/journey-request`

### API Smoke Tests
- [ ] GET `/api/admin/journey-policies` returns 200
  - Check response has `success: true` and policies array
- [ ] POST `/api/visitor/journey-requests` accepts request
  - Send test visitor request, verify response
- [ ] GET `/api/admin/analytics/journey-requests` returns analytics
  - Check response includes daily metrics

### Database Connectivity
- [ ] API responses show real data (not mock data)
  - Verify policy count matches migration (4 policies)
  - Check request table for any existing records
- [ ] Error logs show no connection failures
  - Check Vercel function logs for ECONNREFUSED errors

### SSL/HTTPS
- [ ] All pages load over HTTPS
- [ ] No "Insecure content" warnings
- [ ] SSL certificate is valid (not expired)

---

## Phase 6: Real Data Transition

### Replace Mock Data
- [ ] Update API routes to use real database queries:
  - [ ] `src/app/api/admin/journey-policies/route.ts` → Use `journeyDB.getAllPolicies()`
  - [ ] `src/app/api/admin/journey-requests/route.ts` → Use `journeyDB.listJourneyRequests()`
  - [ ] `src/app/api/admin/analytics/journey-requests/route.ts` → Use `journeyDB.getDailyAnalytics()`
  - [ ] `src/app/api/admin/analytics/vendor-performance/route.ts` → Use `journeyDB.getVendorPerformance()`

### Testing Real Queries
- [ ] Submit a test visitor request via form
- [ ] Verify it appears in admin request list
- [ ] Check request shows correct policy matched
- [ ] Verify analytics update after request submission

### Performance Check
- [ ] Admin dashboard loads < 1 second
- [ ] Search with filters completes < 500ms
- [ ] Analytics queries complete < 1 second
- [ ] No timeout errors in logs

---

## Phase 7: Integration Testing

### End-to-End Workflows

#### Workflow 1: Quick Auto-Approve Request
- [ ] Visitor submits request (budget <$500, items <5, duration <7 days)
- [ ] Admin dashboard shows request as "approved"
- [ ] Matching vendors are notified and appear in leaderboard
- [ ] Visitor can view vendor quotes

#### Workflow 2: Admin Approval Process
- [ ] Visitor submits premium request (budget >$500)
- [ ] Admin sees request in "Under Review" status
- [ ] Admin uses search to find and bulk-approve requests
- [ ] Vendors are notified of approval
- [ ] Analytics update with new approval

#### Workflow 3: Vendor Response
- [ ] Vendor logs in and views request queue
- [ ] Vendor sees match score and request details
- [ ] Vendor submits quote with proposed price
- [ ] Admin can see vendor response in analytics
- [ ] Visitor receives notification of quote

#### Workflow 4: Request Modification
- [ ] Visitor submits request and views tracking page
- [ ] Visitor modifies title/budget while "under_review"
- [ ] Changes save to database
- [ ] Admin sees updated request details
- [ ] System re-evaluates policy match if needed

### User Authentication
- [ ] Admin login works and grants access to admin pages
- [ ] Vendor login shows personalized request queue
- [ ] Visitor can submit and track requests
- [ ] Roles are enforced (vendor can't access admin, etc.)

---

## Phase 8: Data Integrity & Security

### Database Verification
- [ ] Foreign key relationships are intact:
  ```sql
  SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_NAME = 'journey_requests' AND REFERENCED_TABLE_NAME = 'admin_journey_policies';
  -- Should show: matched_policy_id FK
  ```
- [ ] Indexes are functioning:
  ```sql
  ANALYZE TABLE journey_requests;
  SELECT * FROM journey_requests WHERE status = 'approved' LIMIT 1;
  -- Should be instant query
  ```

### Security Checks
- [ ] API endpoints validate JWT tokens
- [ ] Database queries use parameterized statements (no SQL injection)
- [ ] Sensitive data (passwords, API keys) not exposed in logs
- [ ] CORS headers allow only siwa.today domain

### Permissions Verification
- [ ] Admins can create/edit policies
- [ ] Vendors can only view their own queue
- [ ] Visitors can only see their own requests
- [ ] No user can access other users' data

---

## Phase 9: Performance & Monitoring

### Error Tracking Setup
- [ ] Sentry (or similar) configured for production
- [ ] Error notifications sent to admin email
- [ ] Real-time error dashboard is accessible

### Performance Monitoring
- [ ] Vercel Analytics shows page load times
- [ ] Database query times logged and reviewed
- [ ] No N+1 query problems
- [ ] Slow queries identified and optimized (>1 second)

### Metrics to Monitor
- [ ] Requests per second
- [ ] Error rate percentage
- [ ] Database connection pool utilization
- [ ] Page load times (P50, P95, P99)

---

## Phase 10: User Communication & Training

### Admin Training
- [ ] Admin staff trained on policy configuration
- [ ] Admin staff trained on request approval workflow
- [ ] Admin staff trained on bulk operations
- [ ] Admin staff know how to interpret analytics

### Vendor Communication
- [ ] Vendors notified of new request queue system
- [ ] Vendors receive documentation on leaderboard
- [ ] Vendors know how to submit quotes
- [ ] Vendor support contact provided

### Visitor Communication
- [ ] Visitors notified of new request tracking
- [ ] Visitors know they can modify pending requests
- [ ] Visitors understand status updates
- [ ] Help documentation is accessible

---

## Phase 11: Rollback Plan (If Issues)

### Immediate Actions
- [ ] If deployment causes errors:
  1. Access Vercel dashboard
  2. Go to Deployments
  3. Click on previous stable deployment
  4. Click "Rollback to this Deployment"
  5. Confirm rollback
  
- [ ] If database issues occur:
  1. Stop accepting new requests (disable form)
  2. Restore database from backup:
     ```bash
     mysql -u username -p siwa_oasis < siwa_oasis_backup_[timestamp].sql
     ```
  3. Redeploy code to previous version
  4. Communicate status to users

### Escalation Path
- [ ] Hosting provider technical support contact
- [ ] Database administrator contact
- [ ] Development team on-call contact
- [ ] Executive notification process (if critical)

---

## Phase 12: Post-Deployment Validation

### 24-Hour Check
- [ ] No critical errors in logs
- [ ] All pages loading normally
- [ ] Database queries performing well
- [ ] Users report no issues

### 7-Day Check
- [ ] Admin has successfully used all features
- [ ] Vendors are receiving and responding to requests
- [ ] Visitors are satisfied with tracking experience
- [ ] Analytics data looks correct

### 30-Day Optimization
- [ ] Slow queries identified and optimized
- [ ] Database indexes tuned based on real usage
- [ ] Error patterns addressed
- [ ] Feature feedback incorporated

---

## Sign-Off

### Deployment Team Approval
- [ ] Code Lead: _____________________ Date: _____
- [ ] Database Admin: ________________ Date: _____
- [ ] QA Lead: _______________________ Date: _____
- [ ] DevOps/Hosting: ________________ Date: _____

### Executive Sign-Off
- [ ] Product Manager: ________________ Date: _____
- [ ] CTO/Technical Director: _________ Date: _____

---

## Notes & Issues Log

| Date | Issue | Resolution | Status |
|------|-------|-----------|--------|
| | | | |
| | | | |
| | | | |

---

## Success Criteria Met?

✅ All 8 UI pages functional in production
✅ Database migration executed successfully
✅ Real data flowing through APIs
✅ Analytics showing correct metrics
✅ End-to-end workflows operational
✅ No critical errors in 24 hours
✅ Admin & vendor teams trained
✅ User communication complete

**DEPLOYMENT STATUS: [READY / IN PROGRESS / COMPLETE]**

---

## Next Steps After Deployment

1. **Week 1:** Monitor closely, gather user feedback
2. **Week 2:** Implement email notification system (SMTP)
3. **Week 3:** Optimize database queries, add indexes
4. **Week 4:** Plan advanced features (ML matching, gamification)
5. **Month 2:** Deploy WebSocket real-time notifications

---

**Document Version:** 1.0
**Last Updated:** [Current Date]
**Ready For:** Production Deployment to siwa.today
