# ✅ MANUAL DEPLOYMENT - STEP BY STEP

**Your Credentials:**
- Username: `vercel`
- Password: `[saved]`
- Server: `siwa.today`

**Deployment File:**
- ZIP: `siwa_production_20260530_032413.zip` (62 MB)
- Location: `e:\ANitgravity\siwatoday\siwa-oasis\`

---

## 📋 EXACT STEPS TO DEPLOY

### **STEP 1: Open cPanel**

1. In your browser, go to one of these URLs:
   - `https://siwa.today:2083`
   - `https://siwa.today:2087`
   - `https://www.siwa.today/cpanel`
   - Or check your hosting email for the cPanel access URL

2. **Enter Login:**
   - Username: `vercel`
   - Password: `PiCo@@4##73`

3. Click **Log In**

---

### **STEP 2: Open File Manager**

1. Find **File Manager** in cPanel (under "Files" section)
2. Click to open
3. Click **"Go To /public_html"** 
4. Look for your app folder (likely `siwa-oasis`, `oasis`, or `public_html`)
5. Double-click to enter it

---

### **STEP 3: Delete Old Build**

1. In File Manager, find the `.next` folder
2. **Right-click** on `.next`
3. Click **Delete**
4. Confirm deletion

---

### **STEP 4: Upload New ZIP**

1. Click **Upload** button
2. Select file: `siwa_production_20260530_032413.zip`
3. Click **Open** to start upload
4. **Wait for upload** to complete (may take 1-2 minutes)

✅ You should see: "File uploaded successfully"

---

### **STEP 5: Extract ZIP**

1. In File Manager, find the uploaded ZIP
2. **Right-click** on `siwa_production_20260530_032413.zip`
3. Click **Extract** (or "Uncompress")
4. Confirm: Extract to current directory
5. **Wait for extraction** to complete

✅ You should see new `.next` folder appear

---

### **STEP 6: Delete ZIP File**

1. Right-click the ZIP file
2. Click **Delete**
3. Confirm deletion

---

### **STEP 7: Verify Files**

You should now see in your app directory:
- ✅ `.next/` (new build folder)
- ✅ `package.json`
- ✅ `server.js`
- ✅ `.env` (with database credentials)

---

### **STEP 8: Restart Application**

1. Go back to **cPanel Home**
2. Look for **"Setup Node.js App"** or **"Node.js Selector"**
3. Find your app (should show `siwa-oasis` or similar)
4. Click the app name to select it
5. Click the **Restart** button
6. **Wait 2-3 seconds** for restart to complete
7. Status should show **"running"** in green ✅

---

### **STEP 9: Verify Deployment**

**Wait 1-2 minutes**, then:

1. Open your **mobile phone** (important! Test on mobile)
2. Open browser
3. Go to: `https://www.siwa.today`
4. Verify you see:
   - ✅ **Dark olive background** (NOT blue)
   - ✅ **Golden sun icon** in navigation
   - ✅ **Carousel** showing real journey data
   - ✅ **Page loads** quickly (<3 seconds)
   - ✅ **Mobile layout** responsive

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

- [ ] Logged into cPanel
- [ ] Opened File Manager
- [ ] Deleted old `.next` folder
- [ ] Uploaded ZIP file
- [ ] Extracted ZIP file
- [ ] Deleted ZIP file
- [ ] Restarted Node.js app
- [ ] Waited 1-2 minutes
- [ ] Opened siwa.today on mobile
- [ ] Verified dark olive background
- [ ] Verified carousel with real data
- [ ] Verified mobile responsive

**All checked?** 🎉 **DEPLOYMENT SUCCESSFUL!**

---

## 🆘 TROUBLESHOOTING

### If upload is taking too long or fails:
1. Try uploading just the `.next` folder (without ZIP)
2. Or contact your hosting: ask to increase file upload limit

### If extraction fails:
1. Try extracting with a different name
2. Or manually copy files from ZIP

### If app won't restart:
1. Check cPanel logs for errors
2. Verify `.env` file has correct database credentials
3. Contact your hosting provider

### If still seeing old version:
1. Clear browser cache completely
2. Try Incognito/Private window
3. Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
4. Wait 5 minutes for server cache

---

## 📞 NEED HELP?

If you get stuck:
1. Check your hosting control panel docs
2. Contact your hosting provider's support
3. Send me a screenshot of where you're stuck

---

**Your deployment package is ready!**

File: `siwa_production_20260530_032413.zip`
Size: 62 MB
Location: `e:\ANitgravity\siwatoday\siwa-oasis\`

**Follow these steps and your SIWA.TODAY will be live with the beautiful dark olive theme!** 🚀
