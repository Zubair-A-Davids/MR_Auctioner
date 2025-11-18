# MR Auctioner – Migration to PostgreSQL API

Your site now has **dual-mode support**: it can run with **localStorage** (current behavior) or switch to a **PostgreSQL API backend** running on your PC.

## Quick Overview
- **Frontend**: Stays on GitHub Pages (`https://mr-auctioner.co.za`)
- **Backend**: Optional Node.js + PostgreSQL API running locally (see `server/README.md`)
- **Mode switching**: Set `USE_API: true` in `config.js` to enable the API

---

## Testing the API Locally

### 1. Install PostgreSQL
```powershell
winget install -e --id PostgreSQL.PostgreSQL
```

Create the database:
```powershell
psql -U postgres -c "CREATE DATABASE mr_auctioner;"
```

### 2. Set up the API
```powershell
cd server
copy .env.example .env
```

Edit `.env`:
```env
PORT=8787
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/mr_auctioner
JWT_SECRET=change_me_to_a_long_random_secret_string
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Install dependencies and run migrations:
```powershell
npm install
npm run migrate
```

### 3. Start the API
```powershell
npm run start
```

You should see: `API listening on http://localhost:8787`

Test the health endpoint:
```powershell
curl http://localhost:8787/healthz
```

### 4. Test the Frontend Locally
Open `index.html` in a browser (use Live Server in VS Code or any local server on port 5500).

**Keep `USE_API: false` in `config.js` for now** to verify the site still works with localStorage.

### 5. Enable API Mode
Edit `config.js`:
```js
const API_CONFIG = {
  USE_API: true,  // ← Set to true
  API_BASE: 'http://localhost:8787',
};
```

Refresh the site. Now:
- Register a new account → stored in PostgreSQL
- Login → gets a JWT token
- Create listings → stored in PostgreSQL
- View listings → fetched from PostgreSQL

---

## Deploying to GitHub Pages with Local API

### Option A: Cloudflare Tunnel (Recommended)
Your domain (`mr-auctioner.co.za`) doesn't appear to use Cloudflare DNS (based on the screenshot showing different nameservers). If you migrate to Cloudflare DNS, you can use Cloudflare Tunnel:

```powershell
winget install -e --id Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create mr-auctioner-api
cloudflared tunnel route dns mr-auctioner-api api.mr-auctioner.co.za
cloudflared tunnel run mr-auctioner-api --url http://localhost:8787
```

Then update `config.js`:
```js
USE_API: true,
API_BASE: 'https://api.mr-auctioner.co.za',
```

And update `server/.env`:
```env
CORS_ORIGINS=https://mr-auctioner.co.za,https://www.mr-auctioner.co.za
```

### Option B: ngrok (Quick Testing)
```powershell
ngrok http 8787
```

Copy the `https://` URL from ngrok (e.g., `https://abc123.ngrok.io`) and update:
- `config.js` → `API_BASE: 'https://abc123.ngrok.io'`
- `server/.env` → `CORS_ORIGINS=https://mr-auctioner.co.za,https://www.mr-auctioner.co.za`

Restart the API after changing `.env`.

### Option C: Keep API Local
If you only want to test locally, keep:
- `config.js` → `USE_API: false` when pushing to GitHub
- Your live site will continue using localStorage
- You can test the API locally by setting `USE_API: true` in a local copy

---

## File Changes Summary
Created:
- `config.js` – Feature flag and API URL configuration
- `api-service.js` – Service layer that routes calls to localStorage or API
- `server/` – Full Node.js + PostgreSQL backend (see `server/README.md`)

Modified:
- `index.html` – Added `<script>` tags for `config.js` and `api-service.js`
- `app.js` – Updated `register`, `login`, `logout`, `createListing`, `updateListing`, `deleteListing`, `getListings` to use `ApiService`

---

## Current Limitations (API Mode)
The following features still use localStorage and won't sync across users when `USE_API: true`:
- User profiles (avatar, bio, discord, password changes)
- Admin/mod roles and permissions
- Ban status and moderation history
- Items sold history
- Item type selection (not stored in API schema yet)

These can be migrated to the API later if needed.

---

## Reverting to localStorage-Only
Set `USE_API: false` in `config.js` and push to GitHub. The site works exactly as before.

---

## Next Steps
- Test the API locally with `USE_API: true`
- If satisfied, expose the API via Cloudflare Tunnel or ngrok
- Update `server/.env` CORS origins to your live domain
- Deploy `config.js` with `USE_API: true` and the correct `API_BASE`

For detailed API setup and troubleshooting, see **`server/README.md`**.
