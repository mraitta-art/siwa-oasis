# 🔐 GitHub Secrets Setup Guide

To enable automated deployment to Vercel, you need to set up GitHub Secrets. Follow these steps:

## 1️⃣ **Get Vercel Token**
- Go to https://vercel.com/account/tokens
- Create new token (name: `GITHUB_ACTIONS_DEPLOY`)
- Copy the token

## 2️⃣ **Get Vercel Organization ID & Project ID**
- Go to https://vercel.com/dashboard
- Click on your project (siwa-oasis)
- Go to Settings → General
- Copy `Project ID`
- Go to Settings → Team → Team ID

OR find them in project URL:
- Project ID: Last part of URL
- Org ID: Team account settings

## 3️⃣ **Add Secrets to GitHub**
1. Go to your GitHub repo: https://github.com/mraitta-art/siwa-oasis
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel API token |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID |
| `VERCEL_PROJECT_ID` | Your siwa-oasis project ID |
| `DATABASE_URL` | MySQL connection string (optional) |
| `NEXT_PUBLIC_API_URL` | Production API URL |

## 4️⃣ **Automatic Deployment Triggers**

✅ **Deploys to PRODUCTION when:**
- Push to `main` branch
- Manually trigger from GitHub Actions tab

✅ **Deploys to PREVIEW when:**
- Push to `develop` branch
- Create/update Pull Request

## 5️⃣ **Monitor Deployments**
- Go to GitHub repo → **Actions** tab
- Watch workflows run in real-time
- Click workflow to see detailed logs

## 6️⃣ **How It Works** 🔄

```
Your Code → Git Push
    ↓
GitHub Actions triggers
    ↓
1. Install dependencies
2. Run build
3. Upload to Vercel
4. Live deployment
    ↓
✅ Done! Site is live
```

## ⚠️ **Troubleshooting**

| Issue | Solution |
|---|---|
| Build fails | Check logs in GitHub Actions, fix code, push again |
| Secrets not working | Verify secret names match exactly (case-sensitive) |
| Deployment slow | Normal for large projects, wait 10-15 minutes |
| Preview not showing | Check PR comments for Vercel URL |

## 🚀 **Quick Test**
After setting up secrets:
1. Make a small code change
2. Push to `main`: `git push origin main`
3. Go to GitHub Actions tab
4. Watch deployment happen automatically!
