# 🚀 DEPLOY YOUR UPDATES TO SIWA.TODAY - QUICK GUIDE

**Status:** ✅ Build Complete  
**Destination:** siwa.today (cPanel)  
**What's Deploying:** Dark olive theme + Dynamic carousel + Database integration  

---

## ✨ WHAT'S NEW FOR YOUR USERS

When you deploy:
- ✅ **Dark Olive Background** - Modern desert aesthetic (#556B2F)
- ✅ **Golden Navigation** - Premium sun-inspired accents (#FFB700)
- ✅ **Dynamic Carousel** - Real journey data from database
- ✅ **Mobile Responsive** - Perfect on all devices
- ✅ **Fast Loading** - 170 pre-optimized pages

---

## 📤 DEPLOY IN 5 MINUTES

### **Step 1: Access cPanel**
```
URL: https://siwa.today:2083
OR: cpanel.siwa.today
Username: your_cpanel_username
Password: your_cpanel_password
```

### **Step 2: Navigate to File Manager**
```
cPanel Home → File Manager → public_html
(Look for your app folder - likely "siwa-oasis" or similar)
```

### **Step 3: Upload New Build**

Location to upload to:
```
/public_html/siwa-oasis/   (or wherever your app is)
```

Files needed from your computer:
```
📁 siwa-oasis/
├── 📁 .next/              (NEW BUILD - copy all contents)
├── 📄 package.json        (UPDATED)
├── 📄 server.js           (UNCHANGED)
├── 📄 next.config.js      (UNCHANGED)
└── 📄 .env                (CONFIGURE WITH YOUR DB)
```

**How to upload:**
1. Go to cPanel File Manager
2. Navigate to `/public_html/siwa-oasis/`
3. Click "Upload" button
4. Drag-and-drop or select these files/folders:
   - Entire `.next` folder
   - `package.json`
   - `server.js` (replace old one)
5. Wait for upload to complete

### **Step 4: Update Environment Variables**

In cPanel File Manager:
1. Find `.env` file in `/public_html/siwa-oasis/`
2. Right-click → "Edit"
3. Update with your database credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=siwa_oasis
DB_USER=your_database_user
DB_PASSWORD=your_database_password
NODE_ENV=production
```

4. Click "Save"

### **Step 5: Restart Node.js App**

In cPanel:
1. Go to **Setup Node.js App** (in Development section)
2. Find your "siwa-oasis" application
3. Click the **Restart** button
4. Wait 2-3 seconds for restart to complete

---

## ✅ VERIFY DEPLOYMENT

After 1-2 minutes, test on your mobile:

```
📱 Open: https://www.siwa.today

Look for:
✅ Dark olive background  (#556B2F color)
✅ Golden sun icon        (top navigation)
✅ Carousel with journey data
✅ Smooth animations
✅ Responsive layout
```

If you see all ✅, you're deployed! 🎉

---

## 🔍 TROUBLESHOOTING

### **Still Seeing Old Version?**
- **Mobile:** Clear browser cache
  - Settings → Privacy → Clear browsing data → ALL TIME
  - Restart browser
  - Open incognito/private window
  
- **Desktop:** Hard refresh
  - Press: `Ctrl + Shift + Delete`
  - Clear cache and reload

### **App Not Loading?**
- Go back to cPanel → Setup Node.js App
- Click "Restart" again
- Wait 30 seconds
- Try https://siwa.today again

### **500 Error?**
- Check cPanel logs: Setup Node.js App → Logs
- Usually means database connection issue
- Verify .env has correct DB credentials

### **Styles Not Loading?**
- Hard refresh: `Ctrl + F5` (or `Cmd + Shift + R` on Mac)
- Clear browser cache
- Try different browser (Chrome, Safari, Firefox)

---

## 📂 FILE LOCATIONS

Your app is located at (typical cPanel structure):
```
/home/yourusername/public_html/siwa-oasis/
├── .next/              ← Production build (upload this)
├── src/                ← Source code
├── public/             ← Static files
├── package.json        ← Dependencies
├── server.js           ← Node.js server
├── next.config.js      ← Next.js config
├── .env                ← Environment variables
└── tsconfig.json       ← TypeScript config
```

If you can't find "siwa-oasis", check:
- Home domain config
- Addon domains
- Parked domains

---

## 🎯 QUICK REFERENCE

| Step | Action | Time |
|------|--------|------|
| 1 | Access cPanel | 1 min |
| 2 | Upload .next folder | 2 min |
| 3 | Update .env file | 1 min |
| 4 | Restart Node app | 1 min |
| 5 | Test on mobile | 2 min |
| **Total** | **Ready to go** | **~7 min** |

---

## 🆘 NEED HELP?

### **Can't find Setup Node.js App?**
- Make sure you're in cPanel (not WHM)
- Look for "Development" section
- Should show "Setup Node.js App"

### **Upload taking too long?**
- Large files (>100MB) may timeout
- Try uploading .next folder separately
- Contact hosting support if stuck

### **Database error after deploy?**
1. Check MySQL is running in cPanel
2. Verify database name, user, password in .env
3. Test connection: 
   - cPanel → PHP MyAdmin
   - Verify your database exists
   - Check user has access

---

## 📊 DEPLOYMENT CHECKLIST

Before clicking upload:
- [ ] You have cPanel access
- [ ] You located the siwa-oasis folder
- [ ] You downloaded the new .next folder
- [ ] You have package.json ready
- [ ] You know your DB credentials

After uploading:
- [ ] Files uploaded successfully
- [ ] .env updated with DB credentials
- [ ] App restarted in cPanel
- [ ] Waited 2-3 minutes
- [ ] Tested on mobile (saw dark olive theme)
- [ ] Carousel showing journey data

---

## 🎉 YOU'RE DONE!

Your SIWA.TODAY is now updated with:
- 🌅 Beautiful dark olive desert aesthetic
- 💎 Golden sun branding
- 🎠 Dynamic carousel with real data
- 📱 Perfect mobile experience

**Your users will see the updates immediately after restart!**

---

**Questions?** Check the troubleshooting section above or contact your hosting provider.

**All set for deployment!** 🚀
