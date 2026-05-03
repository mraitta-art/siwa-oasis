# 🖱️ CPANEL WIZARD-ONLY DEPLOYMENT GUIDE
## (No Terminal/SSH Required!)

**This guide assumes you CANNOT use terminal/SSH in cPanel - only the wizard interface!**

---

## ✅ GOOD NEWS: Everything Works Through cPanel Wizards!

Your deployment system is **100% compatible** with cPanel wizard-only deployment. You only need:
- ✅ cPanel File Manager (for uploading)
- ✅ Setup Node.js App (for configuration and building)
- ✅ MySQL Databases (for database setup)
- ✅ phpMyAdmin (for importing schema)

**NO terminal/SSH required on cPanel!**

---

## 📋 TWO-PART WORKFLOW

### Part 1: LOCAL COMPUTER (You do this on your PC)
- Prepare files
- Generate deployment bundles
- Create ZIP file

### Part 2: CPANEL WIZARDS (You do this in browser)
- Upload via File Manager
- Configure via Setup Node.js App
- Build via wizard buttons
- Import database via phpMyAdmin

---

## 🖥️ PART 1: LOCAL PREPARATION (On Your Computer)

### Step 1: Generate Deployment Bundle

On your local computer (Windows):

1. **Open File Explorer**
2. **Navigate to:** `e:\ANitgravity\siwatoday\siwa-oasis`
3. **Right-click in empty space** → "Open in Terminal" or "Open PowerShell window here"
4. **Type this command:**
   ```
   node scripts/prepare-deployment-advanced.js
   ```
5. **Wait for completion** (takes ~30 seconds)

**Result:** Two folders created:
- `deploy_bundle/` (universal)
- `deploy_bundle_cpanel/` (optimized for cPanel) ← **USE THIS ONE**

### Step 2: Create ZIP File

1. **Open:** `e:\ANitgravity\siwatoday\siwa-oasis\deploy_bundle_cpanel`
2. **Select ALL files and folders** (Ctrl+A)
3. **Right-click** → "Send to" → "Compressed (zipped) folder"
4. **Rename** the ZIP file to: `siwa_upload.zip`

**You now have:** `siwa_upload.zip` ready to upload!

---

## 🌐 PART 2: CPANEL WIZARD DEPLOYMENT (In Browser)

### PHASE 1: Database Setup (Using cPanel Wizards)

#### 1. Create MySQL Database

**Wizard Path:** cPanel Home → **MySQL Databases**

1. Click **MySQL Databases** icon
2. Under "Create New Database":
   - **Database Name:** Type `siwa_oasis` (or any name)
   - Click **Create Database**
3. Note the full name (usually has prefix like `username_siwa_oasis`)

#### 2. Create Database User

**Same wizard: MySQL Databases**

1. Scroll to "MySQL Users" → "Add New User"
2. **Username:** Type `siwa_admin` (or any name)
3. **Password:** Click "Password Generator"
   - Click "Generate Password"
   - **COPY THIS PASSWORD** (you'll need it!)
   - Click "Use Password"
4. Click **Create User**

#### 3. Add User to Database

**Same wizard: MySQL Databases**

1. Scroll to "Add User to Database"
2. **User:** Select the user you just created
3. **Database:** Select the database you created
4. Click **Add**
5. **Check "ALL PRIVILEGES"**
6. Click **Make Changes**

#### 4. Import Database Schema

**Wizard Path:** cPanel Home → **phpMyAdmin**

1. Click **phpMyAdmin** icon
2. **Left sidebar:** Click your database name
3. **Top menu:** Click **Import** tab
4. Click **Choose File** button
5. **Navigate to:** `e:\ANitgravity\siwatoday\siwa-oasis\schema.sql`
6. Select the file
7. Scroll down, click **Go** button
8. **Wait** for "Import has been successfully finished" message

**✅ Database is ready!**

---

### PHASE 2: Create Node.js Application (Using Wizard)

#### 1. Open Setup Node.js App

**Wizard Path:** cPanel Home → **Setup Node.js App**

(Look in "Software" section)

#### 2. Create Application

1. Click **+ Create Application** button
2. **Fill in the form:**

```
┌─────────────────────────────────────────┐
│ Node.js version:      [20.x] ▼         │
│ Application mode:     [Production] ▼    │
│ Application root:     [siwa-oasis]      │
│ Application URL:      [yourdomain.com]  │
│ Application startup   [server.js]       │
│ file:                                     │
│                                         │
│ Passenger log file:  [auto-filled]      │
│ Memory Limit:        [1024] MB          │
└─────────────────────────────────────────┘
```

**Important Settings:**
- **Node.js version:** Select **20.x** (or 18.x if 20 not available)
- **Application mode:** Select **Production**
- **Application root:** Type `siwa-oasis`
- **Application URL:** Select your domain
- **Application startup file:** Type `server.js`
- **Memory Limit:** Type `1024` (very important for build!)

3. Click **Create** button

**✅ Node.js app created!**

---

### PHASE 3: Upload Files (Using File Manager)

#### 1. Open File Manager

**Wizard Path:** cPanel Home → **File Manager**

#### 2. Navigate to App Directory

1. In left sidebar, find and click: `siwa-oasis` folder
   (Path: `/home/username/siwa-oasis`)

#### 3. Upload ZIP File

1. Click **Upload** button (top toolbar)
2. **Drag and drop** your `siwa_upload.zip` file
   OR click "Select File" and browse to it
3. **Wait** for upload to complete (100%)
4. Click "Go Back to..." link

#### 4. Extract ZIP File

1. In File Manager, find `siwa_upload.zip`
2. **Right-click** on the ZIP file
3. Click **Extract**
4. In popup, verify path is: `/home/username/siwa-oasis`
5. Click **Extract Files** button
6. Click **Reload** button
7. **Verify you see these files:**
   - `src/` folder
   - `public/` folder
   - `package.json`
   - `server.js`
   - `.htaccess`
   - etc.

8. **Optional:** Delete `siwa_upload.zip` to save space
   - Right-click → Delete

**✅ Files uploaded and extracted!**

---

### PHASE 4: Configure Environment Variables (Using Wizard)

#### 1. Open Setup Node.js App

**Wizard Path:** cPanel Home → **Setup Node.js App**

#### 2. Edit Application

1. Find your `siwa-oasis` app in the list
2. Click the **Edit** (pencil icon) button

#### 3. Add Environment Variables

Scroll to **Environment Variables** section.

Add these variables **one by one** (click "Add Variable" for each):

| Variable | Value | Notes |
|----------|-------|-------|
| `DB_HOST` | `localhost` | Type exactly |
| `DB_PORT` | `3306` | Type exactly |
| `DB_USER` | `username_siwa_admin` | Your full DB username with prefix |
| `DB_PASSWORD` | `[paste password]` | The password you copied earlier |
| `DB_NAME` | `username_siwa_oasis` | Your full DB name with prefix |
| `JWT_SECRET` | `[64-char hex]` | See below how to generate |
| `SESSION_COOKIE_NAME` | `siwa_session` | Type exactly |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Your actual domain |
| `NODE_ENV` | `production` | Type exactly |
| `HOST` | `0.0.0.0` | Type exactly |
| `PORT` | `3000` | Type exactly |

**How to Generate JWT_SECRET (On Your Local Computer):**

1. On your Windows PC, open PowerShell
2. Type this command:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Copy the output** (64 characters)
4. **Paste** it as the JWT_SECRET value in cPanel

#### 4. Save Configuration

1. Click **Save** button (bottom of page)

**✅ Environment variables configured!**

---

### PHASE 5: Install Dependencies & Build (Using Wizard Buttons)

#### 1. Install npm Packages

**Wizard Path:** cPanel Home → **Setup Node.js App**

1. Find your app in the list
2. Look for the **buttons** on the right side
3. Click **Run npm install** button
4. **Wait** 2-3 minutes
   - A loading indicator will show
   - Wait for success message

**✅ Dependencies installed!**

#### 2. Build the Application

1. Find **Run JS Script** dropdown menu
2. Click the dropdown → Select **build**
3. Click **Run** button
4. **Wait** 3-5 minutes
   - This takes longer than npm install
   - Wait for success message

**✅ Application built!**

#### 3. Start the Application

1. Click **Restart** button
2. The app status should show **green dot** (running)

**✅ Application is running!**

---

### PHASE 6: Verify Deployment (In Browser)

#### 1. Test Homepage

1. Open new browser tab
2. Go to: `https://yourdomain.com`
3. You should see the Siwa Oasis homepage

#### 2. Test Admin Login

1. Go to: `https://yourdomain.com/login`
2. **Login with:**
   - Email: `super@siwa.com`
   - Password: `super123`
3. **IMPORTANT:** Change this password immediately after login!

**✅ Deployment successful!**

---

## 🔄 HOW TO UPDATE (When You Make Changes Locally)

### Local Steps (On Your Computer):

1. **Make your code changes**
   - Edit files in `src/`, `public/`, etc.

2. **Test locally**
   ```
   npm run dev
   ```

3. **Build locally**
   ```
   npm run build
   ```

4. **Generate new deployment bundle**
   ```
   node scripts/prepare-deployment-advanced.js
   ```

5. **Create new ZIP**
   - Go to `deploy_bundle_cpanel/`
   - Select all → Right-click → Compress
   - Name: `siwa_upload.zip`

### cPanel Steps (In Browser - Wizards Only):

1. **Open File Manager**
2. **Navigate to:** `/home/username/siwa-oasis`
3. **Upload new `siwa_upload.zip`**
   - Click Upload button
   - Drag/drop the new ZIP
4. **Extract (overwrite)**
   - Right-click ZIP → Extract
   - Click "Yes to All" if asked about overwriting
5. **Open Setup Node.js App**
6. **Click "Run JS Script" → build**
7. **Click Restart**

**✅ Update is live!**

---

## 📊 CPANEL WIZARD MAP

Here's where to find everything in cPanel:

```
CPANEL HOME
│
├─ DATABASE SECTION
│  ├─ MySQL Databases (create DB, user, privileges)
│  └─ phpMyAdmin (import schema.sql)
│
├─ FILES SECTION
│  └─ File Manager (upload ZIP, extract files)
│
├─ SOFTWARE SECTION
│  └─ Setup Node.js App (create app, configure, build)
│     │
│     ├─ Create Application button
│     ├─ Edit (pencil icon)
│     │  ├─ Environment Variables section
│     │  └─ Save button
│     │
│     ├─ Run npm install button
│     ├─ Run JS Script dropdown → build
│     └─ Restart button
│
└─ DOMAINS SECTION
   └─ SSL/TLS Status (install HTTPS certificate)
```

---

## ✅ CHECKLIST: cPanel Wizard-Only Deployment

### Database Setup
- [ ] MySQL Databases → Created database
- [ ] MySQL Databases → Created user
- [ ] MySQL Databases → Added user to database (ALL PRIVILEGES)
- [ ] phpMyAdmin → Imported schema.sql
- [ ] phpMyAdmin → Verified tables created

### Node.js App Setup
- [ ] Setup Node.js App → Created application
- [ ] Node.js version: 20.x (or 18.x)
- [ ] Application mode: Production
- [ ] Application root: siwa-oasis
- [ ] Startup file: server.js
- [ ] Memory Limit: 1024 MB

### File Upload
- [ ] File Manager → Navigated to app folder
- [ ] File Manager → Uploaded siwa_upload.zip
- [ ] File Manager → Extracted ZIP
- [ ] Verified files extracted correctly

### Configuration
- [ ] Setup Node.js App → Added all 11 environment variables
- [ ] Setup Node.js App → Saved configuration

### Build & Start
- [ ] Setup Node.js App → Clicked "Run npm install"
- [ ] Setup Node.js App → Ran "build" script
- [ ] Setup Node.js App → Clicked "Restart"
- [ ] App shows green "running" indicator

### Verification
- [ ] Homepage loads: https://yourdomain.com
- [ ] Login page works: https://yourdomain.com/login
- [ ] Can login with admin credentials
- [ ] No errors in browser

---

## 🆘 TROUBLESHOOTING (Wizard-Only Solutions)

### Issue: "Run npm install" Fails

**Solution:**
1. Go to **Setup Node.js App**
2. Click **View Logs** button
3. Check error messages
4. Common fixes:
   - Node.js version wrong? → Edit app → Change to 20.x
   - Memory issue? → Edit app → Increase memory to 1024 MB
   - Files missing? → Re-extract ZIP in File Manager

### Issue: Build Fails

**Solution:**
1. Go to **Setup Node.js App**
2. Click **View Logs** button
3. Check for errors
4. Common fixes:
   - Memory limit too low? → Edit app → Set to 1024 MB or higher
   - package.json error? → Re-upload ZIP (might be corrupted)
   - TypeScript errors? → Already configured to ignore, check logs

### Issue: App Won't Start (502 Error)

**Solution:**
1. Check app shows **green dot** (running)
2. Go to **Setup Node.js App** → **View Logs**
3. Verify:
   - Environment variables correct? → Edit app → Check all 11 variables
   - server.js exists? → File Manager → Check file exists
   - Port conflict? → Edit app → Ensure PORT=3000
4. Try **Restart** button again

### Issue: Routes Return 404

**Solution:**
1. Go to **File Manager**
2. Check `.htaccess` file exists in app root
3. If missing:
   - Re-run on local computer: `node scripts/prepare-deployment-advanced.js`
   - Create new ZIP
   - Re-upload and extract
4. Verify `.htaccess` contains:
   ```apache
   RewriteEngine On
   RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
   ```

### Issue: Database Connection Error

**Solution:**
1. Go to **Setup Node.js App** → Edit
2. Verify environment variables:
   - DB_HOST = localhost (not 127.0.0.1)
   - DB_USER = full username with cPanel prefix
   - DB_PASSWORD = correct password
   - DB_NAME = full database name with prefix
3. Test in **phpMyAdmin**:
   - Can you see your database?
   - Can you see tables?

---

## 💡 IMPORTANT NOTES FOR WIZARD-ONLY USERS

### ✅ What You CAN Do (All Through Wizards):

- ✅ Upload files (File Manager)
- ✅ Extract ZIP files (File Manager)
- ✅ Create databases (MySQL Databases wizard)
- ✅ Import SQL files (phpMyAdmin)
- ✅ Create Node.js apps (Setup Node.js App wizard)
- ✅ Configure environment variables (Setup Node.js App wizard)
- ✅ Install npm packages (Click "Run npm install" button)
- ✅ Build application (Click "Run JS Script → build" button)
- ✅ Restart application (Click "Restart" button)
- ✅ View logs (Click "View Logs" button)

### ❌ What You DON'T Need:

- ❌ Terminal/SSH access
- ❌ Command line in cPanel
- ❌ Manual npm commands
- ❌ SSH file transfers
- ❌ Terminal-based editors

### ⚠️ What You MUST Do Locally (On Your PC):

These steps require PowerShell/Command Prompt **on your local Windows computer**:

1. **Generate deployment bundle:**
   ```
   node scripts/prepare-deployment-advanced.js
   ```

2. **Generate JWT_SECRET:**
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Test locally before uploading:**
   ```
   npm run dev
   npm run build
   ```

**But ALL cPanel actions are wizard-only!**

---

## 📞 If You Get Stuck

### Contact Hosting Support

**Ask them to:**
1. Enable "Setup Node.js App" if not visible
2. Ensure Node.js 18.x or 20.x is available
3. Verify MySQL Databases is enabled
4. Confirm phpMyAdmin is accessible

### Common Questions for Support

```
"Hi, I need to deploy a Next.js application to cPanel.
Can you confirm:

1. Is 'Setup Node.js App' available in my cPanel?
2. What Node.js versions can I select? (Need 18.x or 20.x)
3. Can I set memory limit to 1024 MB for the app?
4. Is phpMyAdmin available for database import?

I don't have SSH access, so I need to use only the cPanel wizards.

Thank you!"
```

---

## 🎯 SUMMARY

### Your Workflow (Wizard-Only):

```
LOCAL COMPUTER (PowerShell/Command Prompt):
  ↓
1. Run: node scripts/prepare-deployment-advanced.js
2. Create ZIP from deploy_bundle_cpanel/
  ↓
CPANEL (Browser - Wizards Only):
  ↓
3. MySQL Databases → Create DB & User
4. phpMyAdmin → Import schema.sql
5. Setup Node.js App → Create Application
6. File Manager → Upload & Extract ZIP
7. Setup Node.js App → Add Environment Variables
8. Setup Node.js App → Run npm install (button)
9. Setup Node.js App → Run build (button)
10. Setup Node.js App → Restart (button)
  ↓
DONE! Site is live!
```

**NO TERMINAL/SSH NEEDED IN CPANEL!** ✅

---

**Last Updated:** 2026-04-28  
**Compatible with:** All cPanel versions with Setup Node.js App  
**Requires:** cPanel wizards only (no terminal/SSH)
