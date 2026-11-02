# 🚀 INSTANT DEPLOY TO SIWA.TODAY

**Status:** Ready to push live  
**Time:** 2-3 minutes  
**Impact:** siwa.today will show dark olive theme + real carousel data  

---

## ⚡ QUICK DEPLOY (Copy-Paste These Steps)

### **Step 1: Copy the Production Build**

Open your File Manager and go to:
```
e:\ANitgravity\siwatoday\siwa-oasis\.next\
```

Select **ALL contents** (Ctrl+A), copy (Ctrl+C)

### **Step 2: Login to cPanel**

Open browser and go to:
```
https://siwa.today:2083
```

Login with your cPanel username/password

### **Step 3: Navigate to App Folder**

In cPanel:
- Click **File Manager** → Public HTML
- Find your app folder: `siwa-oasis` or `oasis`
- Open it (double-click)
- You should see folders like: `.next`, `src`, `public`, `node_modules`

### **Step 4: Delete OLD `.next` Folder**

In File Manager:
- Right-click the old `.next` folder
- Click **Delete**
- Confirm deletion

### **Step 5: Upload NEW `.next` Folder**

In File Manager:
- Click **Upload** button
- Select the `.next` folder from your computer: `e:\ANitgravity\siwatoday\siwa-oasis\.next\`
- Wait for upload to complete (may take 1-2 minutes for large folder)

### **Step 6: Update `.env` File**

In File Manager:
- Find `.env` file
- Right-click → **Edit**
- Replace entire content with:

```
DB_HOST=gateway01.eu-central-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3iv5fPeLo2ze3jn.root
DB_PASSWORD=Dj2teUVtQyMYghF3
DB_NAME=siwa_oasis
DB_SSL=true

JWT_SECRET=5b9c2a8d3e7f1b4a6d9c0e2f5a8b3d7e1f4a6c9d0b2e5f8a3d6e9f0a2b5c8d1e
SESSION_COOKIE_NAME=siwa_session

NEXT_PUBLIC_APP_URL=https://siwa.today
NODE_ENV=production
```

- Click **Save**

### **Step 7: Restart the App**

In cPanel:
- Go to **Setup Node.js App** (under Development section)
- Find **siwa-oasis** application
- Click **Restart** button
- Wait 2-3 seconds

### **Step 8: Verify on Mobile**

Wait 1-2 minutes, then:
1. Open your phone
2. Go to: `https://www.siwa.today`
3. Should see:
   - ✅ **Dark olive background** (not blue anymore!)
   - ✅ **Golden sun icon**
   - ✅ **Carousel with real journey data**
   - ✅ **Responsive mobile layout**

---

## ✅ YOU'RE DONE!

Both should now be **synchronized**:
- **localhost:3000** = Dark olive + carousel
- **siwa.today** = Dark olive + same carousel ✅

---

## 🆘 If Still Not Working

### **Problem: Still seeing old version**
- Hard refresh: `Ctrl + Shift + Delete` (clear cache)
- Or open in Incognito/Private window
- Wait 3-5 minutes (server cache)

### **Problem: Upload failed**
- Try uploading `.next` as ZIP file instead
- Right-click `.next` folder → Compress/ZIP
- Upload ZIP
- In cPanel, right-click ZIP → Extract
- Delete the ZIP file

### **Problem: App won't restart**
- Wait 30 seconds
- Try restarting again
- Check cPanel logs for errors

### **Problem: Database error**
- Check `.env` has correct credentials
- Verify TiDB credentials are correct
- Test in cPanel → phpMyAdmin

---

**Your production is ready to go live!** 🎉
