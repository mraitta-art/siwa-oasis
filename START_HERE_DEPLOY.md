# 🌅 SIWA.TODAY - UPDATE DEPLOYMENT INSTRUCTIONS

**⏰ Time Required:** 5-10 minutes  
**📱 Impact:** Your live website will show all the dark olive theme + carousel updates  
**✅ Status:** Build complete and ready  

---

## 📍 YOUR FILES ARE HERE

On your computer at:
```
e:\ANitgravity\siwatoday\siwa-oasis\
```

### What you'll find there:
- ✅ `.next` folder (production build with all updates)
- ✅ `package.json` (dependencies)
- ✅ `server.js` (Node.js server)
- ✅ `src/` folder (source code with dark olive theme)

---

## 🚀 DEPLOYMENT STEPS (5 Minutes)

### **Step 1: Open cPanel** (1 minute)

Go to:
```
https://siwa.today:2083
```

Or:
```
cpanel.siwa.today
```

Login with your cPanel username and password.

### **Step 2: Open File Manager** (30 seconds)

In cPanel home:
- Click **File Manager** (under Files section)
- Click to open `/public_html/` folder
- Look for your app folder (usually `siwa-oasis` or `oasis`)
- Double-click to open it

### **Step 3: Upload New Build Files** (2-3 minutes)

You need to upload 3 things from your computer:

#### **Upload #1: The `.next` folder**
- From your computer: `e:\ANitgravity\siwatoday\siwa-oasis\.next`
- To cPanel: Same location as the old `.next`
- Method: Click "Upload" → Select the entire `.next` folder
- (If too large, ZIP it first, upload ZIP, then extract)

#### **Upload #2: package.json**
- From your computer: `e:\ANitgravity\siwatoday\siwa-oasis\package.json`
- To cPanel: Replace the old `package.json`
- Method: Click "Upload" → Select `package.json`

#### **Upload #3: server.js**
- From your computer: `e:\ANitgravity\siwatoday\siwa-oasis\server.js`
- To cPanel: Replace the old `server.js`
- Method: Click "Upload" → Select `server.js`

### **Step 4: Update Environment Variables** (1 minute)

In File Manager, find the `.env` file:
- Right-click on `.env` → "Edit"
- Update these values with YOUR database info:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=siwa_oasis
DB_USER=your_database_user
DB_PASSWORD=your_database_password
NODE_ENV=production
```

Save the file (Ctrl+S).

### **Step 5: Restart the App** (1 minute)

Back in cPanel:
- Look for **"Setup Node.js App"** (under Development section)
- Find the **"siwa-oasis"** application
- Click the **"Restart"** button
- Wait 2-3 seconds for it to restart

---

## ✅ VERIFY IT WORKED

Wait 1-2 minutes, then:

1. **Open your phone**
2. **Go to:** `https://www.siwa.today`
3. **Look for:**
   - ✅ **Dark olive background** (should be dark olive #556B2F, not blue)
   - ✅ **Golden sun icon** in the top navigation
   - ✅ **Carousel** showing journey data (should have real content from database)
   - ✅ **Responsive** - looks good on mobile

If you see all ✅, **YOU'RE DONE!** 🎉

---

## 🆘 QUICK TROUBLESHOOTING

### **Still seeing old version?**
- **Mobile:** Go to Settings → Privacy → Clear browsing data (ALL TIME)
- **Desktop:** Press `Ctrl + Shift + Delete` to clear cache
- Try again in a new incognito/private window

### **App not responding?**
- Go back to cPanel → Setup Node.js App
- Click Restart again
- Wait 30 seconds
- Refresh page

### **Upload failed?**
- Try uploading smaller files first
- If `.next` is large (>100MB), compress to ZIP first
- Upload ZIP, then right-click → Extract in File Manager

### **Database error?**
- Check your `.env` file has correct DB credentials
- Go to cPanel → phpMyAdmin
- Verify your database exists and user has access

---

## 📞 SUPPORT DOCUMENTS

For more details, read these files in your `siwa-oasis` folder:

- **`DEPLOY_NOW_5_MINUTES.md`** - Detailed deployment guide
- **`FILES_TO_UPLOAD.md`** - Exact file list and instructions
- **`CPANEL_DEPLOYMENT_GUIDE.md`** - Full cPanel reference

---

## 🎯 THAT'S IT!

You've successfully deployed all your updates:
- 🌅 Dark olive background (#556B2F)
- ✨ Golden sun accents (#FFB700)
- 🎠 Dynamic carousel with real data
- 📱 Mobile responsive design
- 🚀 All 170 pre-optimized pages

**Your users are now seeing the new beautiful SIWA.TODAY!** 🎉

---

**Questions?** Check the troubleshooting section above.  
**Still stuck?** Contact your hosting provider's support - they can help with cPanel access issues.

---

**Build Date:** May 30, 2026  
**Status:** ✅ Ready to deploy  
**Estimated Time:** 5-10 minutes  
**Impact:** Live immediately after restart
