# 🔄 UPDATE REQUEST TEMPLATE

**Use this template when returning to make modifications**

---

## 📝 HOW TO USE THIS TEMPLATE

When you come back to make changes, fill out this template and show it to the AI. This ensures:
- ✅ Safe updates without breaking existing features
- ✅ Proper backup procedures
- ✅ Clear change tracking
- ✅ Smooth deployment process

---

## 📋 UPDATE REQUEST FORM

### Date & Version
```
Date: _______________________
Requested By: _______________________
Current Version: _________ (check cPanel or ask AI)
Target Version: _________
```

### Type of Update (CHECK ALL THAT APPLY)
- [ ] **Code Changes** - Modifying existing features
- [ ] **New Features** - Adding new functionality
- [ ] **Bug Fixes** - Fixing issues
- [ ] **Database Changes** - Schema modifications
- [ ] **UI/UX Updates** - Design changes
- [ ] **Performance** - Optimization
- [ ] **Security** - Security patches
- [ ] **Environment** - Config changes

---

## 🎯 WHAT DO YOU WANT TO CHANGE?

### Describe Your Changes

**Feature/Area to Modify:**
```
_______________________________________________________________

_______________________________________________________________
```

**What Should It Do?**
```
_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
```

**Why This Change?**
```
_______________________________________________________________

_______________________________________________________________
```

---

## 📊 IMPACT ASSESSMENT

### Files Likely Affected (AI will confirm)
- [ ] Frontend components (page.tsx files)
- [ ] Backend API routes (route.ts files)
- [ ] Database schema (SQL files)
- [ ] Environment variables
- [ ] Configuration files
- [ ] Dependencies (package.json)

### Database Changes Required?
- [ ] **No** - Code only changes
- [ ] **Yes** - Need to modify database
  - Describe: ___________________________________________

### Environment Variables Changes?
- [ ] **No** - Same configuration
- [ ] **Yes** - Need new/updated env vars
  - Describe: ___________________________________________

---

## 🔒 SAFETY REQUIREMENTS

### Before Making Changes
- [ ] **Backup current database** (if database changes)
- [ ] **Document current state** (take screenshots if needed)
- [ ] **Test locally first** (npm run dev)
- [ ] **Create migration file** (if schema changes)

### After Making Changes
- [ ] **Test all affected features**
- [ ] **Verify no regressions** (other features still work)
- [ ] **Update documentation**
- [ ] **Create deployment bundle**
- [ ] **Prepare changelog**

---

## 📦 DEPLOYMENT PLAN

### For AI to Fill Out (After implementing changes)

```
Files Modified:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

New Files Created:
1. _________________________________________________
2. _________________________________________________

Database Migration Required:
☐ Yes - File: ____________________________________
☐ No

Environment Variables Added/Changed:
1. _________________________________________________
2. _________________________________________________

Deployment Steps:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

Testing Checklist:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```

---

## 📝 CHANGELOG ENTRY

### AI will create this after changes:

```markdown
## Version [X.X.X] - [DATE]

### Added
- 

### Changed
- 

### Fixed
- 

### Database Changes
- 

### Migration Required
- [ ] Yes: [migration file name]
- [ ] No

### Breaking Changes
- [ ] Yes: [describe]
- [ ] No
```

---

## 🧪 TESTING CHECKLIST

### Before Deployment

After AI makes changes, test these locally:

- [ ] `npm run dev` starts without errors
- [ ] New feature works as expected
- [ ] Existing features not broken
- [ ] No console errors in browser
- [ ] Database queries working (if applicable)
- [ ] API endpoints responding correctly
- [ ] Authentication still works
- [ ] Admin panel accessible

### After Deployment

- [ ] Upload new bundle to cPanel
- [ ] Extract and overwrite files
- [ ] Run migration (if needed)
- [ ] Rebuild app (Run JS Script → build)
- [ ] Restart app
- [ ] Test on live site
- [ ] Check error logs
- [ ] Verify no 502/500 errors

---

## 📋 AI INSTRUCTIONS

**Show this section to the AI when requesting changes:**

---

### INSTRUCTIONS FOR AI:

I want to make updates to my Siwa Oasis platform deployed on cPanel.

**My Changes:**
```
[Fill out the sections above describing what you want]
```

**Requirements:**
1. ✅ Make changes safely without breaking existing features
2. ✅ Provide migration files if database changes
3. ✅ Update documentation
4. ✅ Create changelog entry
5. ✅ Provide deployment instructions
6. ✅ Include rollback plan if something goes wrong

**Deployment Context:**
- Platform: cPanel with Node.js App
- Node Version: 18.x or 20.x
- Database: MySQL
- Current setup is production-ready
- Need to maintain backward compatibility

**Please:**
1. Implement the requested changes
2. List all modified files
3. Provide migration SQL if needed
4. Create updated deployment bundle instructions
5. Give testing checklist
6. Document any breaking changes

---

---

## 📌 NOTES FOR FUTURE REFERENCE

### Previous Updates History

| Date | Version | Changes | Deployed By |
|------|---------|---------|-------------|
| | | | |
| | | | |
| | | | |

### Lessons Learned
```
_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
```

### Important Reminders
```
_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
```

---

## 🚀 QUICK DEPLOYMENT REMINDER

After AI implements changes:

```bash
# 1. Test locally
npm run dev

# 2. Create bundle
node scripts/deploy-prepare.js

# 3. ZIP deploy_bundle/ folder
# 4. Upload to cPanel
# 5. Extract (overwrite)
# 6. Run migration (if needed)
# 7. Rebuild & restart in Node.js App
```

---

## ✅ SIGN-OFF

### Pre-Update Checklist
- [ ] Described changes clearly
- [ ] Identified impact areas
- [ ] Noted database changes needed
- [ ] Noted env var changes needed
- [ ] Ready for AI to implement

### Post-Update Checklist
- [ ] Changes implemented by AI
- [ ] Tested locally successfully
- [ ] Documentation updated
- [ ] Migration file created (if needed)
- [ ] Deployment bundle ready
- [ ] Changelog written
- [ ] Ready to deploy

**Approved By:** _______________________  
**Date:** _______________________

---

**💡 TIP: Save a copy of this form for each update request!**

---

*Template Version: 1.0.0*  
*Created: 2026-04-25*
