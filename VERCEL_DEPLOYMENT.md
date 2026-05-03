# 🚀 Vercel Deployment Guide for Siwa Oasis

This guide helps you deploy the project to Vercel while keeping your cPanel setup as a backup.

## 1. Prepare for Vercel
Vercel builds your project automatically from source code. You don't need the `deploy_bundle` or `node_modules`.

### Files you need to upload (GitHub or Vercel CLI):
- `src/`
- `public/`
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs` (optional)

## 2. Environment Variables
When setting up the project on Vercel, go to **Settings -> Environment Variables** and add these:

| Key | Value |
|---|---|
| `DB_HOST` | `gateway01.us-west-2.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` |
| `DB_USER` | `2RDNvrBK5WBgTcb.root` |
| `DB_PASSWORD` | [Your TiDB Password] |
| `DB_NAME` | `sys` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `5b9c2a8d3e7f1b4a6d9c0e2f5a8b3d7e1f4a6c9d0b2e5f8a3d6e9f0a2b5c8d1e` |
| `NEXT_PUBLIC_APP_URL` | `https://siwa.today` |
| `NODE_ENV` | `production` |

## 3. Database Connection (CRITICAL)
If you keep using your cPanel MySQL database, you MUST:
1. Go to cPanel -> **Remote MySQL**.
2. Add `%` to the allowed hosts (or find the Vercel IP ranges, but `%` is easier for testing).
3. Ensure your `DB_HOST` is your server's IP address (not `localhost`).

## 4. Custom Domain
1. In Vercel, go to **Settings -> Domains**.
2. Add `siwa.today`.
3. Follow the instructions to update your DNS records at your domain registrar.

---

**Note:** Your cPanel files in `public_html/soso` are still there. You can return to them anytime by pointing your DNS back to cPanel and fixing the disk space.
