# 🔄 Local vs Production Comparison Guide

**Generated:** 2026-06-25  
**Local Version:** http://localhost:3000  
**Production Version:** https://siwa.today  

---

## ✅ Server Status

### Local Development Server
- **Status:** ✓ RUNNING
- **URL:** http://localhost:3000
- **Network URL:** http://10.242.239.73:3000
- **Port:** 3000
- **Database:** Local MySQL (localhost:3306)
- **Database Name:** siwa_oasis
- **Environment:** .env.local

### Production Server
- **Status:** ✓ LIVE
- **URL:** https://siwa.today
- **Database:** TiDB Cloud (EU Central 1)
- **Environment:** .env.production
- **Deployment:** Vercel

---

## 📊 Configuration Comparison

### Database Configuration

| Aspect | Local | Production |
|--------|-------|-----------|
| **Host** | 127.0.0.1 | gateway01.eu-central-1.prod.aws.tidbcloud.com |
| **Port** | 3306 | 4000 |
| **User** | root | 3iv5fPeLo2ze3jn.root |
| **Database** | siwa_oasis | siwa_oasis |
| **SSL** | false | true |
| **Connection Type** | Direct MySQL | TiDB Cloud (MySQL compatible) |

### Application Configuration

| Aspect | Local | Production |
|--------|-------|-----------|
| **URL** | http://localhost:3000 | https://siwa.today |
| **Node Environment** | development | production |
| **Auth Secret** | local_development_secret_key_123456789 | 5b9c2a8d3e7f1b4a... (production key) |
| **Session Cookie** | siwa_session_local | siwa_session |

### Media Configuration (Cloudinary)

| Aspect | Local | Production |
|--------|-------|-----------|
| **Cloud Name** | di8icdism | di8icdism |
| **API Key** | 467732655659637 | 467732655659637 |
| **API Secret** | 8GEek_KykyLEmx_y-Mokn5G3Mtk | 8GEek_KykyLEmx_y-Mokn5G3Mtk |
| **Status** | ✓ Shared Account | ✓ Shared Account |

---

## 🔍 Key Areas to Compare

### 1. **Homepage & Hero Section**
- [ ] Hero carousel functionality
- [ ] Featured businesses display
- [ ] Call-to-action buttons
- [ ] Search bar behavior
- [ ] Navigation layout

### 2. **Search & Filter System**
- [ ] Advanced search filters
- [ ] Filter responsiveness
- [ ] Search result pagination
- [ ] Result count and sorting
- [ ] Business type filtering

### 3. **Business Profiles**
- [ ] Business card display
- [ ] Photo galleries (carousel)
- [ ] Pricing sections
- [ ] Amenities display
- [ ] Review/ratings system
- [ ] Contact information visibility

### 4. **Comparison Feature**
- [ ] Select/deselect businesses
- [ ] Comparison table rendering
- [ ] Cross-type business comparison
- [ ] Universal sections display
- [ ] Investment opportunities section

### 5. **Blog System**
- [ ] Blog post listing
- [ ] Post formatting
- [ ] Images and embeds
- [ ] Related posts
- [ ] Categories/tags

### 6. **Journey Builder**
- [ ] Journey creation interface
- [ ] Journey editing
- [ ] Journey preview
- [ ] Policy engine validation
- [ ] Request status management

### 7. **Forms & User Input**
- [ ] Form submission
- [ ] Validation messages
- [ ] Error handling
- [ ] Success confirmations
- [ ] Field visibility rules

### 8. **Admin Dashboard** (if accessible)
- [ ] Data source management
- [ ] Permissions system
- [ ] Business management
- [ ] Section management
- [ ] User management

### 9. **Responsive Design**
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout
- [ ] Touch interactions
- [ ] Screen reader compatibility

### 10. **Performance**
- [ ] Page load time
- [ ] Image optimization
- [ ] CSS/JS bundling
- [ ] API response times
- [ ] Database query performance

---

## 🧪 Testing Checklist

### Basic Navigation
- [ ] Homepage loads correctly
- [ ] Navigation menu works
- [ ] Footer links functional
- [ ] URL structure correct
- [ ] Browser back/forward buttons

### User Interactions
- [ ] Click handlers responsive
- [ ] Form inputs accept data
- [ ] Dropdowns/modals functional
- [ ] Buttons trigger actions
- [ ] Search works with different queries

### Data Display
- [ ] Images load correctly
- [ ] Text formatting consistent
- [ ] Numbers/prices display properly
- [ ] Dates formatted correctly
- [ ] Empty states handled

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## 📈 Common Issues to Watch For

### Database Issues
- ❌ Connection errors
- ❌ Missing data (businesses, blogs, forms)
- ❌ Stale data sync
- ❌ Authentication failures
- ❌ Permission errors

### UI/UX Issues
- ❌ Broken layouts on mobile
- ❌ Missing images from Cloudinary
- ❌ Styling inconsistencies
- ❌ Font loading failures
- ❌ Component rendering errors

### Performance Issues
- ❌ Slow page loads
- ❌ API timeouts
- ❌ Database connection delays
- ❌ Large image file sizes
- ❌ Memory leaks

### Authentication Issues
- ❌ Session not persisting
- ❌ JWT token expiration
- ❌ Cookie not saving
- ❌ CORS errors
- ❌ Login/logout failures

---

## 🚀 Quick Start: Side-by-Side Viewing

### Option 1: Split Screen
1. Open local version: http://localhost:3000
2. Open production: https://siwa.today (in separate window)
3. Position windows side-by-side
4. Resize windows to compare features

### Option 2: Tabs
1. Open Tab 1: http://localhost:3000 (Local)
2. Open Tab 2: https://siwa.today (Production)
3. Use Alt+Tab or browser tab switching to compare

### Option 3: Developer Tools
1. Open DevTools (F12)
2. Toggle device toolbar for responsive testing
3. Use Console for error checking
4. Use Network tab to monitor API calls

---

## 📝 Comparison Notes Template

Use this template when comparing features:

```
Feature: [Feature Name]
Location: [Page/Section]

LOCAL Version:
- Status: [Working/Broken/Different]
- Details: [What you see]
- Notes: [Any observations]

PRODUCTION Version:
- Status: [Working/Broken/Different]
- Details: [What you see]
- Notes: [Any observations]

Differences:
- [List any differences found]

Action Required:
- [ ] Fix local version
- [ ] Sync production
- [ ] Investigate further
```

---

## 🔐 Important Notes

### Security
- Never commit credentials to git
- .env files are git-ignored (protected)
- Production JWT secret is different from local
- Database passwords are environment-specific

### Database Sync
- Local database is independent from production
- To sync production data to local: Run `npm run sync:db`
- To backup local data: Check database_backups folder
- Changes to local DB don't affect production

### Deployments
- Local changes are NOT auto-deployed
- To deploy: Use `npm run build` then deployment scripts
- Production uses TiDB Cloud + Vercel
- See DEPLOYMENT_GUIDE.md for details

---

## 📞 Support

For detailed deployment information, see:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- [SYNC_LOCAL_PRODUCTION.md](SYNC_LOCAL_PRODUCTION.md)

Last Updated: 2026-06-25 18:05 UTC
