# Authentication Setup & Deployment Guide

How the auth system in this project is built, and exactly what to do — as a developer —
to stand it up from scratch and push it to production (GitHub → backend host → Vercel).

---

## 1. How Authentication Works (read this first)

**Stack:** JWT (signed with `JWT_SECRET`) + bcrypt password hashing. Roles:
`super_admin`, `property_admin`, `staff`.

**Flow:**
1. Admin submits email/password on `/admin/login`.
2. Frontend `POST`s to `${NEXT_PUBLIC_API_URL}/auth/login` → backend
   `server/src/modules/auth/auth.controller.js` (`login`).
3. Backend finds the user (`User.findOne({ email }).select('+password')`), compares
   the bcrypt hash (`user.matchPassword`), and on success returns a JWT signed with
   `signToken({ id, role, propertyId })`.
4. Frontend stores `{ user, token }` in a Zustand persisted store
   (`client/store/useAdminStore.js`) under key `admin-auth-store`.
5. Every admin API call sends `Authorization: Bearer <token>` (injected by
   `client/lib/api.js`). Backend `protect` middleware verifies it.

**Two places define the admin credentials (single source of truth):**
- `server/src/config/superAdmin.js` → used by both `seed.js` (DB reset) and
  `server/src/config/ensureDemoData.js` (runs on every backend start).

> ⚠️ The backend self-heals the Super Admin on startup via `ensureDemoData()`
> (called in `server/src/config/db.js`). So you normally do **not** need to run
> `npm run seed` after a deploy — the account is recreated automatically.

**CRITICAL:** All backend routes are mounted under `/api/v1`
(`server/src/app.js`). The frontend base URL MUST end with `/api/v1`, otherwise
every request 404s with `Cannot POST /auth/login` (this was the exact production
bug — `NEXT_PUBLIC_API_URL` was missing the `/api/v1` suffix). The frontend now
normalizes this automatically (`client/lib/api.js` `resolveApiBase`), but the env
var should still be set correctly.

---

## 2. GitHub

```bash
# 1. Create repo on GitHub (private or public), then:
git clone https://github.com/<YOU>/<repo>.git
cd <repo>

# 2. Install both apps
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Commit (NEVER commit secrets)
# .env / .env.local are already git-ignored. Verify:
git ls-files | grep -E "\.env$" && echo "LEAK!" || echo "clean"
git add . && git commit -m "feat: auth + admin dashboard"
git push -u origin main
```

`.gitignore` already excludes `server/.env` and `client/.env.local`. Do not force-add them.

---

## 3. Backend Deployment (Render — free tier)

1. **Render dashboard** → New → Web Service → connect the GitHub repo.
2. Settings:
   - Runtime: **Node**, Branch: `main`
   - Build Command: `cd server && npm install`
   - Start Command: `npm start`
   - Plan: Free (sleeps after 15 min; cold start 30–90s — expected)
3. **Environment Variables** (these are required — see `server/src/config/db.js`,
   `server/src/utils/jwt.js`):
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>` |
   | `JWT_SECRET` | long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
   | `JWT_EXPIRE` | `24h` |
   | `PORT` | `10000` |
   | `CORS_ORIGIN` | `https://<your-vercel-domain>` (comma-separate multiple) |
   | `SOCKET_ORIGIN` | `https://<your-vercel-domain>` |
4. Deploy. Copy the generated backend URL, e.g. `https://hospitality-backend.onrender.com`.
5. On first start, `ensureDemoData()` creates the Super Admin from
   `server/src/config/superAdmin.js`.

> To change the admin login for a client, edit `superAdmin.js`, commit, and redeploy.
> `ensureDemoData` will update the password on next start.

---

## 4. Frontend Deployment (Vercel)

1. **Vercel dashboard** → Import repo. **Root Directory = `client`**.
2. **Environment Variables** (build-time — a redeploy is required after changes):
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<backend>/api/v1`  ← MUST include `/api/v1` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://<backend>` (no `/api/v1`; Socket.IO connects to root) |
3. Framework preset: Next.js (auto-detected). Build outputs `.next`.
4. Redeploy. Visit `https://<vercel-domain>/admin/login`.

> `NEXT_PUBLIC_*` vars are baked at build time. If you change them, you must
> **redeploy** the frontend, not just restart it.

---

## 5. Resetting / Re-seeding the Database (new client)

```bash
cd server
# edit server/src/config/superAdmin.js with the client's email + strong password
npm run seed      # wipes EVERY collection, creates the one Super Admin
```
`seed.js` clears users, properties, rooms, menu, orders, feedback, audit, and QR
sessions, then creates the Super Admin from `superAdmin.js`.

---

## 6. Verifying Login Works (smoke test)

```bash
# Against a running backend (local or deployed):
curl -X POST https://<backend>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<superadmin-email>","password":"<password>"}'
# Expect: { "success": true, "token": "...", "user": { "role": "super_admin", ... } }
```

Then open `/admin/login` on the Vercel domain and sign in.

---

## 7. Known Issues To Fix Before Production Is Truly Safe

These are real code issues found while reviewing auth (not blocking login, but they
undermine security):

1. **`server/src/middlewares/auth.js` → `protect`** falls back to a hardcoded
   `defaultSuperAdmin` (`_id: "0000…"`) whenever a token is missing or invalid.
   This means **anonymous requests are treated as `super_admin`**. It should return
   `401` instead.
2. **`authorize(...roles)`** is a no-op (`return (req,res,next)=>next()`), so role
   checks on `/api/v1/users` and team routes do nothing. Implement real role
   enforcement.
3. Because of (1), several controllers assume `req.user` exists; once (1) is fixed
   they must handle `req.user` safely (the current tests crash with
   `Cannot read properties of null (reading 'role')` when the user is missing).

---

## 8. Quick Recap

```bash
# Backend (Render)
MONGODB_URI, JWT_SECRET, JWT_EXPIRE=24h, NODE_ENV=production,
PORT=10000, CORS_ORIGIN=<vercel>, SOCKET_ORIGIN=<vercel>

# Frontend (Vercel, build-time)
NEXT_PUBLIC_API_URL=<backend>/api/v1      # /api/v1 REQUIRED
NEXT_PUBLIC_SOCKET_URL=<backend>

# Admin credentials (edit + redeploy backend)
server/src/config/superAdmin.js
```
