# 🔑 ENVIRONMENT VARIABLES TEMPLATE
## Copy and paste these into cPanel Node.js App

---

## 📋 INSTRUCTIONS:

1. Go to cPanel → **Setup Node.js App**
2. Click on your application
3. Scroll to **Environment Variables** section
4. Click **Add Variable** for each variable below
5. Fill in the values
6. Click **Save**

---

## 🔧 REQUIRED VARIABLES:

### Database Configuration (Get from cPanel MySQL Databases)

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `DB_HOST` | `localhost` | cPanel (usually localhost) |
| `DB_PORT` | `3306` | Default MySQL port |
| `DB_USER` | `siwatoday_admin` | MySQL Databases → Your username |
| `DB_PASSWORD` | `[YOUR_PASSWORD]` | The password you created |
| `DB_NAME` | `siwatoday_main` | MySQL Databases → Your database name |

---

### Application Security (Generate or Use These)

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `JWT_SECRET` | `[GENERATE_64_CHARS]` | See generation instructions below |
| `SESSION_COOKIE_NAME` | `siwa_session` | Use exactly this value |

---

### Application Configuration

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Replace with your actual domain |
| `NODE_ENV` | `production` | Use exactly this value |

---

## 🔐 HOW TO GENERATE JWT_SECRET:

### Option 1: Using Online Generator
1. Go to: https://generate-secret.vercel.app/64
2. Copy the 64-character string
3. Paste as JWT_SECRET value

### Option 2: Using Node.js (if available)
```javascript
console.log(require('crypto').randomBytes(32).toString('hex'))
```

### Option 3: Use This Example (NOT for production!)
```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```
⚠️ **Generate your own for production!**

---

## 📝 COMPLETE EXAMPLE:

Here's what your environment variables should look like:

```
DB_HOST = localhost
DB_PORT = 3306
DB_USER = hsnfzljy_siwaadmin
DB_PASSWORD = MySecureP@ssw0rd123!
JWT_SECRET = a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
SESSION_COOKIE_NAME = siwa_session
NEXT_PUBLIC_APP_URL = https://siwatoday.com
NODE_ENV = production
```

⚠️ **Replace the example values above with your actual values!**

---

## ✅ VERIFICATION CHECKLIST:

After adding all variables, verify:

- [ ] All 9 variables are added
- [ ] No typos in variable names
- [ ] Database credentials are correct
- [ ] JWT_SECRET is 64 characters long
- [ ] NEXT_PUBLIC_APP_URL uses HTTPS (not HTTP)
- [ ] NODE_ENV is set to "production"
- [ ] Clicked "Save" button
- [ ] Restarted the application

---

## 🔍 WHERE TO FIND YOUR DATABASE CREDENTIALS:

### In cPanel:

1. **Go to:** MySQL Databases
2. **Find:**
   - Database Name: Listed under "Current Databases"
   - Username: Listed under "Current Users"
   - Host: Usually `localhost`
   - Port: Usually `3306`

### Example:
```
If your cPanel username is: hsnfzljy

Database Name: hsnfzljy_siwa_main
Database User: hsnfzljy_siwa_admin
Host: localhost
Port: 3306
```

---

## ⚠️ COMMON MISTAKES TO AVOID:

1. ❌ Using `127.0.0.1` instead of `localhost`
2. ❌ Forgetting to add the database prefix (e.g., `hsnfzljy_`)
3. ❌ Using HTTP instead of HTTPS in NEXT_PUBLIC_APP_URL
4. ❌ Making JWT_SECRET too short (must be 64 characters)
5. ❌ Typos in variable names (case-sensitive!)
6. ❌ Forgetting to click "Save" after adding variables
7. ❌ Not restarting the app after adding variables

---

## 🆘 TROUBLESHOOTING:

### Error: "Database connection failed"
**Check:**
- DB_HOST is `localhost`
- DB_USER and DB_PASSWORD are correct
- Database exists in phpMyAdmin
- User has ALL PRIVILEGES

### Error: "JWT_SECRET is too short"
**Fix:**
- Generate a new 64-character hex string
- Replace the current value
- Restart the app

### App won't start after adding variables
**Check:**
- All required variables are present
- No extra spaces in values
- Variable names are exact (case-sensitive)
- Clicked "Restart" after saving

---

## 📞 NEED HELP?

If you encounter issues:

1. Check the **View Logs** button in Node.js App
2. Verify all variables are added correctly
3. Test database connection in phpMyAdmin
4. Review this template for mistakes

---

**Ready to deploy? Copy these variables and add them to cPanel!**

*Generated: April 28, 2026*
