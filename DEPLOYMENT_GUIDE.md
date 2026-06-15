# Pad Thai Cafe — Loyalty Card System
## Complete Deployment Guide (No Coding Experience Needed)

---

## What You Have

| File | What it does |
|------|-------------|
| `server/index.js` | The backend brain — handles login, stamps, QR codes |
| `public/index.html` | The app your customers and staff see |
| `data/db.json` | Your database (created automatically on first run) |
| `package.json` | Tells the server which libraries to use |

---

## PART 1 — Deploy to Railway (Free Trial → ~£5/month)

Railway is the easiest host for this stack. No credit card needed for the trial.

### Step 1 — Create a GitHub account (skip if you have one)
1. Go to **https://github.com**
2. Click **Sign up** — use any email
3. Verify your email

---

### Step 2 — Upload your code to GitHub

1. Go to **https://github.com/new**
2. Repository name: `padthai-loyalty`
3. Set to **Private** (so nobody can see your code)
4. Click **Create repository**
5. On the next page, click **uploading an existing file**
6. Drag and drop the entire `loyalty-app` folder contents:
   - `server/` folder
   - `public/` folder
   - `package.json`
   - `Procfile`
   - `railway.json`
   - `.gitignore`
   > ⚠️ Do NOT upload the `node_modules/` folder — it's very large and not needed
7. Click **Commit changes**

---

### Step 3 — Create a Railway account

1. Go to **https://railway.app**
2. Click **Login with GitHub**
3. Authorise Railway to access your GitHub

---

### Step 4 — Deploy your app on Railway

1. On Railway dashboard, click **+ New Project**
2. Choose **Deploy from GitHub repo**
3. Select `padthai-loyalty`
4. Railway will automatically detect it's a Node.js app and deploy it
5. Wait about 2 minutes — you'll see a green "Active" status

---

### Step 5 — Set your secret environment variables

This is important for security. In Railway:

1. Click your project → click the service → click **Variables** tab
2. Add these variables one by one:

| Variable name | Value | Notes |
|--------------|-------|-------|
| `JWT_SECRET` | `PadThaiCafe2026!YourSecretKey` | Change this to any long random string |
| `ADMIN_PASSWORD` | `YourAdminPassword123` | This is YOUR admin login password |
| `PORT` | `3000` | Leave as is |

3. Click **Add** after each one
4. Railway will automatically restart with the new settings

---

### Step 6 — Get your live URL

1. In Railway, click **Settings** → **Domains**
2. Click **Generate Domain**
3. You'll get a URL like: `padthai-loyalty-production.up.railway.app`
4. **This is your app's live address!** 🎉

---

### Step 7 — Test your live app

Open your URL in a browser and test:
- ✅ Register a customer account
- ✅ Login and see the stamp card
- ✅ Login to Admin with your `ADMIN_PASSWORD`
- ✅ Add a stamp from the admin panel

---

## PART 2 — Daily Use in the Café

### For customers:
1. Give them the URL (or put a QR code on the counter linking to it)
2. They register with their phone number
3. Every visit: they open the app → show their QR code

### For staff (you or your cashier):
1. Go to the URL → tap **Admin**
2. Login with your admin password
3. When a customer shows their QR:
   - Tap **Scan QR** → type their member ID (e.g. `PTF-0001`)
   - OR tap **+1** next to their name in the member list
4. When they reach 10 stamps, tap **Redeem Reward** → stamps reset to 0

---

## PART 3 — Make it Easy for Customers to Find

### Option A — Counter QR Code (Recommended)
1. Go to **https://www.qr-code-generator.com**
2. Paste your Railway URL
3. Download and print the QR code
4. Put it on the counter with a sign:
   > "สมัครสมาชิก Loyalty Card ได้เลยค่ะ 🍜"

### Option B — Share on Line / Facebook
Just share the URL directly with customers.

---

## PART 4 — Costs

| Service | Cost | Notes |
|---------|------|-------|
| Railway Hobby plan | ~£5/month | After free trial ends |
| GitHub | Free | Always free |
| Domain (optional) | ~£10/year | e.g. `loyalty.padthaicafe.co.uk` |

**Total: ~£5/month** — much cheaper than Meed Loyalty or Stamp Me!

---

## PART 5 — Important Security Steps (Do These First!)

1. **Change the admin password** — in Railway Variables, set `ADMIN_PASSWORD` to something only you know
2. **Change the JWT secret** — set `JWT_SECRET` to a long random string (e.g. `PTC2026_LondonE8_Kingsland_Secret!`)
3. **Backup your data** — the customer database is in `data/db.json`. Download a copy monthly.

---

## PART 6 — Backup Your Customer Data

Your data lives on Railway's server. To back it up:

**On Railway:**
1. Click your project → **Deployments** → **View Logs**
2. You can also connect to the server and copy `data/db.json`

**Easier option:** Ask me (Claude) to add an "Export to CSV" button to the admin panel, which lets you download all customer data with one click.

---

## PART 7 — Custom Domain (Optional, £10/year)

If you want `loyalty.padthaicafe.co.uk` instead of the Railway URL:

1. Buy a domain at **https://www.namecheap.com** (~£10/year for `.co.uk`)
2. In Railway → Settings → Domains → Add Custom Domain
3. Follow Railway's DNS instructions (they give you step-by-step)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect" | Wait 2 minutes, Railway may be deploying |
| Admin login fails | Check `ADMIN_PASSWORD` in Railway Variables |
| Customer can't login | Check they're using the exact phone number they registered with |
| App is slow | Normal on Railway free tier — upgrade to Hobby £5/month |
| Lost data | Always keep a downloaded copy of `data/db.json` |

---

## Quick Reference — Your Accounts

Write these down somewhere safe:

- **GitHub username:** _______________
- **Railway email:** _______________
- **Your app URL:** _______________
- **Admin password:** _______________ (keep secret!)

---

## Need to Update the App?

If you want changes (new reward, different number of stamps, new feature):
1. Tell Claude what you want to change
2. Claude will give you updated files
3. Upload the new files to GitHub
4. Railway redeploys automatically within 2 minutes

---

*Built for Pad Thai Cafe, 482 Kingsland Road, London E8 4AE*
*Version 1.0 — June 2026*
