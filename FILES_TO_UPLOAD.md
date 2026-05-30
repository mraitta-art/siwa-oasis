# 📦 FILES TO UPLOAD TO CPANEL FOR SIWA.TODAY

**Build Date:** May 30, 2026  
**Status:** Ready to deploy  
**Location:** Upload to `public_html/siwa-oasis/` or your app folder  

---

## 🎯 WHAT TO UPLOAD

### **1. The `.next` Folder (CRITICAL)**
This is your production build with all updates:
```
Source: e:\ANitgravity\siwatoday\siwa-oasis\.next\
Upload to: /public_html/siwa-oasis/.next/
```

**This folder contains:**
- ✅ All 170 pre-generated pages
- ✅ Dark olive theme (applied globally)
- ✅ Golden accents (#FFB700)
- ✅ Dynamic carousel system
- ✅ API endpoints
- ✅ Server routes
- ✅ Static assets

### **2. The `package.json` File (IMPORTANT)**
Tells cPanel what dependencies to use:
```
Source: e:\ANitgravity\siwatoday\siwa-oasis\package.json
Upload to: /public_html/siwa-oasis/package.json
```

### **3. The `server.js` File (IMPORTANT)**
Custom Next.js server configuration:
```
Source: e:\ANitgravity\siwatoday\siwa-oasis\server.js
Upload to: /public_html/siwa-oasis/server.js
```

### **4. Create/Update `.env` File (CRITICAL - DO THIS IN CPANEL)**
In cPanel File Manager, find the `.env` file and edit it with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=siwa_oasis
DB_USER=your_db_username
DB_PASSWORD=your_db_password
NODE_ENV=production
```

---

## 📋 HOW TO UPLOAD VIA CPANEL

### **Option A: Using File Manager (Easiest)**

1. **Login to cPanel**
   - URL: https://siwa.today:2083 or cpanel.siwa.today
   
2. **Open File Manager**
   - From cPanel Home → File Manager
   - OR: Under Development section

3. **Navigate to Your App**
   - Go to: `/public_html/siwa-oasis/`
   - (or wherever your Node.js app is)

4. **Upload .next Folder**
   - Click "Upload" button
   - Select `.next` folder from `e:\ANitgravity\siwatoday\siwa-oasis\`
   - If it's a file, you may need to upload as ZIP then extract

5. **Upload package.json**
   - Click "Upload" button
   - Select `package.json` from `e:\ANitgravity\siwatoday\siwa-oasis\`

6. **Upload server.js**
   - Click "Upload" button
   - Select `server.js` from `e:\ANitgravity\siwatoday\siwa-oasis\`
   - This will replace your old `server.js`

7. **Edit .env File**
   - Find `.env` in File Manager
   - Right-click → "Edit"
   - Update database credentials
   - Save

### **Option B: Using FTP/SFTP (If You Have Access)**

1. Connect via FTP: `ftp://siwa.today` (or your FTP credentials)
2. Navigate to `/public_html/siwa-oasis/`
3. Upload the `.next` folder
4. Upload `package.json`
5. Upload `server.js`
6. Edit `.env` with credentials

### **Option C: Using SSH (Advanced)**

```bash
# SSH into your server
ssh username@siwa.today

# Navigate to app directory
cd public_html/siwa-oasis

# Download files from your computer using scp
# (Run this from your Windows PowerShell, not SSH):
scp -r "e:\ANitgravity\siwatoday\siwa-oasis\.next" username@siwa.today:/home/username/public_html/siwa-oasis/
scp "e:\ANitgravity\siwatoday\siwa-oasis\package.json" username@siwa.today:/home/username/public_html/siwa-oasis/
scp "e:\ANitgravity\siwatoday\siwa-oasis\server.js" username@siwa.today:/home/username/public_html/siwa-oasis/
```

---

## 🔧 AFTER UPLOADING: RESTART APP

In cPanel:
1. Go to **Setup Node.js App** (under Development)
2. Find your **siwa-oasis** application
3. Click **Restart** button
4. Wait 2-3 seconds
5. Done!

---

## ✅ VERIFY DEPLOYMENT

Test on your mobile after 1-2 minutes:

```
Open: https://www.siwa.today

You should see:
✅ Dark olive background (#556B2F)
✅ Golden sun icon in navigation
✅ Carousel showing journey data
✅ Smooth animations
✅ Mobile responsive layout
```

---

## 📊 FILE SIZES (For Reference)

- **`.next` folder:** ~200-400 MB (uncompressed)
- **`package.json`:** ~2 KB
- **`server.js`:** ~1 KB

**Total to upload:** ~400 MB (if uploading .next uncompressed)

**Tip:** If .next is too large, compress it to .zip first, upload, then extract in File Manager.

---

## 🆘 IF SOMETHING GOES WRONG

### **App not restarting?**
- Go back to Setup Node.js App
- Click Restart again
- Wait 30 seconds
- Refresh browser

### **Database connection error?**
- Check .env has correct credentials
- Verify database exists in MySQL
- Test connection in phpMyAdmin

### **Still showing old version?**
- Hard refresh browser: Ctrl+F5
- Clear cache: Ctrl+Shift+Delete
- Try incognito/private window
- Wait 2-3 minutes for cache to clear

### **Upload failed?**
- Try uploading just the files (not folder)
- Or ZIP the files first, upload ZIP, extract
- Check you have enough disk space
- Try a different browser

---

## 📝 QUICK CHECKLIST

- [ ] Can access cPanel
- [ ] Located `/public_html/siwa-oasis/`
- [ ] Have `.next` folder ready
- [ ] Have `package.json` ready
- [ ] Have `server.js` ready
- [ ] Know your database credentials
- [ ] Uploaded `.next`
- [ ] Uploaded `package.json`
- [ ] Uploaded `server.js`
- [ ] Updated `.env` file
- [ ] Restarted Node app
- [ ] Tested on mobile (saw dark olive theme!)

---

## 🎉 SUCCESS!

Once you see the dark olive background and carousel with real journey data on siwa.today, your deployment is complete!

Your users are now seeing:
- 🌅 Beautiful dark olive aesthetic
- ✨ Golden sun branding
- 🎠 Dynamic carousel with real data
- 📱 Perfect mobile experience

**All updates live on www.siwa.today!** 🚀
