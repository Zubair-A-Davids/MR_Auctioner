# MR Auctioner – Local API (Node + PostgreSQL)

Static frontend stays on GitHub Pages. This folder provides a local API you can run on your PC and (optionally) expose to the internet via a secure tunnel. The API supports user registration/login and creating/listing items.

## Architecture
- Frontend: GitHub Pages (your parked domain) serves `index.html/app.js`.
- API: Local Node/Express server on your PC (default `http://localhost:8787`).
- Database: Local PostgreSQL.
- Public access: Optional via Cloudflare Tunnel to `https://api.yourdomain.com`.

## Endpoints (v0)
- `POST /auth/register` → `{ token }`
- `POST /auth/login` → `{ token }`
- `GET /auth/me` (Bearer token)
- `GET /items` → list items (query: `q`, `ownerId`)
- `GET /items/:id` → item details
- `POST /items` (Bearer token) → create
- `PUT /items/:id` (owner only)
- `DELETE /items/:id` (owner only)

Auth uses JWT in the `Authorization: Bearer <token>` header.

## 1) Install PostgreSQL (Windows)
- Winget:
```powershell
winget install -e --id PostgreSQL.PostgreSQL
```
- Ensure `psql` works in a new terminal. Then create a DB:
```powershell
psql -U postgres -c "CREATE DATABASE mr_auctioner;"
```
(If prompted for a password, it’s the one you set during install.)

## 2) Configure environment
Copy `.env.example` to `.env` and adjust:
```
PORT=8787
DATABASE_URL=postgres://postgres:YOURPASSWORD@localhost:5432/mr_auctioner
JWT_SECRET=change_me_to_a_long_random_secret
CORS_ORIGINS=https://mr-auctioner.co.za,https://www.mr-auctioner.co.za
```

## 3) Install deps + run migrations
```powershell
cd server
npm install
npm run migrate
```

## 4) Start the API
```powershell
npm run start
```
- Health: `GET http://localhost:8787/healthz`

## 5) Expose to the internet (Cloudflare Tunnel)
This keeps the API on your PC but reachable publicly.

1. Install cloudflared:
```powershell
winget install -e --id Cloudflare.cloudflared
```
2. Login and authorize domain DNS (only needs to be done once):
```powershell
cloudflared tunnel login
```
3. Create a tunnel:
```powershell
cloudflared tunnel create mr-auctioner-api
```
4. Map a subdomain to the tunnel (replace with your domain):
```powershell
cloudflared tunnel route dns mr-auctioner-api api.mr-auctioner.co.za
```
5. Run the tunnel (forwarding to local API):
```powershell
cloudflared tunnel run mr-auctioner-api --url http://localhost:8787
```
Now your API is reachable at `https://api.mr-auctioner.co.za` and your GitHub Pages frontend can call it.

> Alternative: For quick tests, use `ngrok http 8787` and copy the https URL into `CORS_ORIGINS`.

## Frontend integration notes
- Keep your static site on GitHub Pages.
- In your JS, call `https://api.mr-auctioner.co.za` for login and items.
- Store the JWT in memory or `localStorage` and send it in `Authorization` header.

Example fetch (browser):
```js
const API = 'https://api.mr-auctioner.co.za';
async function login(email, password){
  const r = await fetch(`${API}/auth/login`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email, password})});
  const { token } = await r.json();
  localStorage.setItem('token', token);
}
async function createItem(data){
  const token = localStorage.getItem('token');
  const r = await fetch(`${API}/items`, {method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`}, body: JSON.stringify(data)});
  return r.json();
}
```

## Security considerations
- Never expose your database to the internet. Only the API should be public (via tunnel).
- Use a long random `JWT_SECRET`.
- Lock `CORS_ORIGINS` to just your domains.
- Consider moving images to object storage (Cloudflare R2/S3) later.

## Schema
- `users(id, email unique, password_hash, display_name, created_at)`
- `items(id, owner_id -> users.id, title, description, price, image_url, created_at, updated_at)`

## Next steps (optional)
- Add email verification and password reset.
- Image uploads via pre-signed URLs to object storage.
- Pagination and richer search.
- Rate limiting and request validation.
