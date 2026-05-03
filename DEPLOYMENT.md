# 🏜️ Siwa Oasis: Master Deployment & Update Guide

Follow these steps in order to move your project from your local machine to cPanel production.

---

## 💻 PHASE 1: LOCAL DEVICE (Preparation)
1. **Prepare the Bundle:**
   Run this command in your terminal:
   ```bash
   node scripts/deploy-prepare.js
   ```
2. **ZIP the Result:**
   Go into the `deploy_bundle` folder. Select all files and ZIP them. Name the file `siwa_upload.zip`.

---

## 🗄️ PHASE 2: CPANEL (Database Setup)
1. **Create Database:** Use cPanel **MySQL Databases** to create a database (e.g., `siwa_db`).
2. **Create User:** Create a DB user and password. Add the user to the DB with **All Privileges**.
3. **Import Schema:** Open **phpMyAdmin**, click your database, and **Import** the `schema.sql` file.

---

## 🚀 PHASE 3: CPANEL (Application Launch)
1. **Create Node.js App:** Go to **Setup Node.js App** in cPanel and click **Create**.
2. **Upload & Extract:** Use the cPanel **File Manager** to upload `siwa_upload.zip` to your app folder. **Extract** it there.
3. **Set Environment Variables:** In the Node.js App settings, add:
   - `DB_HOST`: `localhost`
   - `DB_USER`: (Your DB User)
   - `DB_PASSWORD`: (Your DB Password)
   - `DB_NAME`: (Your DB Name)
   - `JWT_SECRET`: (A strong random string)
4. **Build & Start:**
   - Click **Run npm install**.
   - Click **Run JS Script** and select `build`.
   - Click **Restart**.

---

## 🔄 UPDATING YOUR LIVE SITE
When you make changes to the code later:
1. **Repeat Phase 1** (Prepares a new clean ZIP).
2. **Upload & Overwrite:** Upload the new ZIP to cPanel File Manager and Extract (choose "Yes to All" to overwrite).
3. **Re-Build:** In **Setup Node.js App**, click **Run JS Script** -> `build`, then click **Restart**.
   *(Your database data stays safe!)*

---

### ⚠️ IMPORTANT PERMISSION RULES
- **ALWAYS** extract files using the cPanel File Manager to ensure correct ownership.
- **NEVER** upload files as `root` via SSH if you want to be able to delete/modify them later via cPanel.
