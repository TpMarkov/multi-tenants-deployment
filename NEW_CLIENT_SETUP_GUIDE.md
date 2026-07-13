# New Client Setup Guide — Multi-Tenant Hospitality OS

This guide explains how to take this codebase and onboard a **new client** cleanly:
reset the database, set the client's super-admin credentials in one place, run
locally, and deploy to production (Vercel frontend + backend host).

---

## 0. Tech Stack

| Layer      | Tech                                    | Default Port |
|------------|-----------------------------------------|--------------|
| Frontend   | Next.js (React)                         | `3000`       |
| Backend    | Node.js / Express + Socket.io           | `10000`*     |
| Database   | MongoDB (Atlas recommended)             | `27017`      |
| Auth       | JWT + bcrypt. Roles: `super_admin`, `property_admin`, `staff` |

\* The committed `server/.env` sets `PORT=10000` (works on Render). Use `5000` for local if you prefer.

---

## 1. How Credentials / "Demo Data" Actually Work (read this first!)

This is the part that most often causes "I can't log in" confusion:

- **`server/seed.js`** wipes **every collection** in the database and creates one
  Super Admin. Run it once to reset a database to a clean state.
- **`server/src/config/ensureDemoData.js`** runs **automatically on every backend
  startup** (see `server/src/config/db.js`). It idempotently makes sure the Super
  Admin account exists — and **resets the password if it was changed**. This is what
  keeps a running deployment logged-in-able after a redeploy.

Both files read the **same** credentials from **one source of truth**:

```
server/src/config/superAdmin.js
```

> 👉 **To set a new client's login, edit ONLY `server/src/config/superAdmin.js`.**
> Both the seed and the running backend will pick it up. Never hardcode credentials
> in two places.

Current default (change for each client):
```js
const SUPER_ADMIN = {
  name: "New Super Admin",
  email: "superadmin@hospitalityos.com",
  password: "TestAdmin2026!",
  role: "super_admin",
};
```

---

## 2. Local Machine Prerequisites

- **Node.js** >= 18 (`node -v`)
- **Git**
- A **MongoDB Atlas** cluster (or local MongoDB) connection string
- Accounts on **GitHub**, **Vercel**, and your backend host (e.g. Render)

---

## 3. Get the Code

```bash
# Clone (or fork) the repository
git clone https://github.com/<YOUR_USERNAME>/<repo>.git
cd <repo>

# Install dependencies for both apps
cd server && npm install && cd ..
cd client && npm install && cd ..
```

> To start a **brand-new repo** without old history: `rm -rf .git && git init`,
> then `git add . && git commit -m "Initial commit for <CLIENT>"`, create the repo
> on GitHub, `git remote add origin ...`, and `git push -u origin main`.

---

## 4. Configure Environment Variables

### 4.1 Backend — `server/.env`
Copy `server/.env.example` → `server/.env` and fill in:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/hospitality
PORT=10000
NODE_ENV=development            # -> "production" when deploying
JWT_SECRET=<long-random-secret> # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:3000
SOCKET_ORIGIN=http://localhost:3000
```

### 4.2 Frontend — `client/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:10000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:10000
```

---

## 5. Set the New Client's Super Admin

Open **`server/src/config/superAdmin.js`** and set the client's name, email, and a
strong unique password:
```js
const SUPER_ADMIN = {
  name: "<Client Owner Name>",
  email: "<owner@client.com>",
  password: "<StrongUniquePassword!>",
  role: "super_admin",
};
```

---

## 6. Reset the Database & Create the Super Admin

```bash
cd server
npm run seed
```

Expected output:
```
Connected!
Clearing all collections...
Database cleared.
--- DATABASE RESET COMPLETE ---
SUPER ADMIN LOGIN CREDENTIALS:
  Email:    <owner@client.com>
  Password: <StrongUniquePassword!>
  Role:     super_admin
```

This wipes **all** collections (users, properties, rooms, menu, orders, feedback,
audit, QR sessions) and creates exactly one Super Admin.

> `ensureDemoData` will also re-affirm this same account on every backend start,
> so you never need to re-run the seed after a deploy.

---

## 7. Run Locally & Verify Login

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```
1. Open http://localhost:3000/admin/login
2. Log in with the credentials from `superAdmin.js` → you should reach the dashboard.

---

## 8. Deploy to Production

### 8.1 Backend host (e.g. Render)
1. New Web Service → connect the repo. Runtime: **Node**, Branch: `main`.
2. Build: `cd server && npm install`, Start: `npm start`.
3. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE=24h`,
   `NODE_ENV=production`, `PORT=10000`, `CORS_ORIGIN` + `SOCKET_ORIGIN` = your
   Vercel domain.
4. Deploy. Note the backend URL (e.g. `https://<client>-backend.onrender.com`).

> On first start, `ensureDemoData` creates the Super Admin from `superAdmin.js`.

### 8.2 Frontend on Vercel
1. Import the repo (root dir = `client`).
2. Set build-time env vars:
   - `NEXT_PUBLIC_API_URL=https://<client>-backend/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://<client>-backend`
3. Redeploy.

### 8.3 Verify
- Backend health (if available): `https://<client>-backend/health` → DB connected.
- Admin login at `https://<your-vercel-domain>/admin/login` with the `superAdmin.js` credentials.

---

## 9. Onboarding a New Client Property (Developer Workflow)

Once the super admin is logged in, the developer must create the client's first
property and a `property_admin` account so the client can self-serve their own
admins and staff going forward.

### 9.1 Prerequisite — Log In as Super Admin

Use the credentials from `server/src/config/superAdmin.js`. You can verify login
via the UI at `/admin/login` or via curl:

```bash
TOKEN=$(curl -s -X POST https://<backend>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<superadmin-email>","password":"<password>"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")
```

> All requests below assume `$TOKEN` is set.

### 9.2 Create the Property

```bash
curl -X POST https://<backend>/api/v1/properties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<Client Property Name>",
    "address": "<Full address of the hotel/property>"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "_id": "<PROPERTY_ID>",
    "name": "<Client Property Name>",
    "address": "<Full address>",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Copy the returned `_id` — this is the `propertyId` you will use in the next step.

> **Route:** `POST /api/v1/properties`  
> **Controller:** `server/src/modules/properties/property.controller.js`  
> **Access:** Super admin only (`authorize('super_admin')`)

### 9.3 Create the Client's Property Admin

```bash
curl -X POST https://<backend>/api/v1/users/team \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<Client Owner / Manager Name>",
    "email": "<manager@client.com>",
    "password": "<StrongUniquePassword!>",
    "role": "property_admin",
    "propertyId": "<PROPERTY_ID>"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "_id": "<USER_ID>",
    "name": "<Client Owner / Manager Name>",
    "email": "<manager@client.com>",
    "role": "property_admin",
    "propertyId": "<PROPERTY_ID>",
    "permissions": {
      "canViewAll": true,
      "canManageRooms": false,
      "canManageMenu": false,
      "canToggleMenuAvailability": true,
      "noSettings": false
    },
    "createdAt": "..."
  }
}
```

> **Route:** `POST /api/v1/users/team`  
> **Controller:** `server/src/modules/users/user.controller.js` (`createTeamMember`)  
> **Access:** Super admin or property admin  
> **Note:** When called as `super_admin`, `propertyId` is required in the body.

### 9.4 What the Property Admin Can Do

The newly created `property_admin` can now log in at `/admin/login` with the
credentials you just set. Once logged in, they can:

- **Create more admins and staff** for their own property via `POST /api/v1/users/team`
  (they can only assign `staff` role; only super admins can create other
  `property_admin` accounts).
- **Manage rooms**, menu items, categories, and orders scoped to their `propertyId`.
- **View analytics** and feedback for their property.

> **Route:** `POST /api/v1/users/team`  
> **Access:** `property_admin` or `super_admin`  
> **Behavior:** A `property_admin` is locked to `req.user.propertyId` and can only
> create users with `role: "staff"`. A `super_admin` can pass any `role` and
> `propertyId`.

### 9.5 Validating the Setup (End-to-End Smoke Test)

1. Open `/admin/login` and sign in as the new `property_admin`.
2. Verify the dashboard loads data scoped to the new property (rooms, orders, etc.).
3. Create a test staff member via the team management UI or API.
4. Log in as the new staff member and confirm they can access the property but
   cannot create other admins.

### 9.6 API Reference Summary

| Step | Method | Endpoint | Body (key fields) | Who can call |
|------|--------|----------|-------------------|--------------|
| Create property | `POST` | `/api/v1/properties` | `name`, `address` | `super_admin` |
| Create property admin | `POST` | `/api/v1/users/team` | `name`, `email`, `password`, `role: "property_admin"`, `propertyId` | `super_admin` |
| Create staff (client self-serve) | `POST` | `/api/v1/users/team` | `name`, `email`, `password`, `role: "staff"` | `property_admin` (locked to own `propertyId`) |

---

## 10. Pre-Go-Live Security Checklist
- [ ] `superAdmin.js` has a strong, unique password for this client.
- [ ] `JWT_SECRET` is a strong random value.
- [ ] `NODE_ENV=production` on the deployed backend.
- [ ] `CORS_ORIGIN` restricted to the production frontend domain only.
- [ ] MongoDB Atlas IP whitelist set to the real server IP (no `0.0.0.0/0` in prod).
- [ ] `.env` files are git-ignored and never committed.
- [ ] Atlas backups enabled.
- [ ] Database wiped for the new client (seed clears all collections).

---

## 11. Quick Command Recap
```bash
# 1. Install
cd server && npm install && cd ../client && npm install && cd ..

# 2. Configure env (server/.env + client/.env.local) with new MONGODB_URI

# 3. Set credentials -> edit server/src/config/superAdmin.js

# 4. Reset DB + create super admin
cd server && npm run seed

# 5. Run locally
cd server && npm run dev      # terminal 1
cd client && npm run dev      # terminal 2

# 6. Deploy backend (Render) + frontend (Vercel) with env vars, then verify login
```
