# 🛡️ SIWIFY / SIWA OASIS — COMPLETE DISASTER RECOVERY & RESCUE GUIDE
# دليل الإنقاذ والاستعادة الشامل لمنصة سيوة اليوم

This folder contains everything needed to reconstruct, connect, and run the entire Siwify platform from scratch on **ANY computer or operating system (Windows, Linux, macOS)**.

---

## 🚀 Scenario 1: You Have a Brand-New PC (Fresh Start from GitHub)

If your local computer was formatted or lost, and you only have access to GitHub:

### 1. Clone the repository:
```bash
git clone https://github.com/mraitta-art/siwa-oasis.git
cd siwa-oasis
```

### 2. Run the Restore Script:
- **On Windows**:
  ```powershell
  .\RESCUE_KIT\restore.ps1
  ```
  *(Or double-click `restore.ps1` or run `node RESCUE_KIT/restore.js`)*

- **On Linux / Ubuntu / Debian**:
  ```bash
  chmod +x RESCUE_KIT/restore.sh
  ./RESCUE_KIT/restore.sh
  ```

- **On macOS**:
  ```bash
  chmod +x RESCUE_KIT/restore.sh
  ./RESCUE_KIT/restore.sh
  ```

---

## 💾 Scenario 2: You Copied this Folder to a USB / External Drive

If you have this project folder copied onto a USB flash drive or zip archive:

1. Copy the `siwa-oasis` folder to your new computer (e.g. `C:\Projects\siwa-oasis` or `~/projects/siwa-oasis`).
2. Open terminal/PowerShell inside the folder.
3. Run:
   ```bash
   node RESCUE_KIT/restore.js
   npm install
   npm run dev
   ```

---

## 🔑 Critical Credentials & Infrastructure Map (خريطة البيانات الحساسة)

All services are cloud-hosted and persistent:

| Service | Purpose | Master Connection / Keys |
| :--- | :--- | :--- |
| **Database** | TiDB Cloud (AWS Frankfurt) | `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`<br>Database: `siwa_oasis`<br>User: `3iv5fPeLo2ze3jn.root`<br>SSL: `true` |
| **GitHub** | Version Control & CI/CD | `https://github.com/mraitta-art/siwa-oasis.git` (Branch: `main`) |
| **Cloudinary** | Media & Photo CDN | Cloud Name: `di8icdism`<br>API Key: `467732655659637`<br>API Secret: `8GEek_KykyLEmx_y-Mokn5G3Mtk` |
| **Vercel** | Production Hosting | Project ID: `prj_vCitnOksBb9IsdV8wsA9NX8GaRzf`<br>Team ID: `team_tbetVzuqEZB6lblqvgy9LGaH`<br>Domain: `siwify.com` / `siwa.today` |

---

## ⚡ Routine Commands Reference

- **Start Local Server**: `npm run dev` (Runs on `http://127.0.0.1:3000`)
- **Push & Auto-Deploy to Production**: `npm run live:once`
- **Verify Production Build Locally**: `npm run build`
- **Health Check**: `npm run health`
