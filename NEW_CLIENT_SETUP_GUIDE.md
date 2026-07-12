# New Client Deployment & Onboarding Guide

This guide walks you through taking the current multi-tenant hospitality codebase and
re-deploying it cleanly for a **new client**. It covers:

1. Clearing the previous client's data/config from the project
2. Creating a new GitHub repository and pushing the clean code
3. Setting up a fresh MongoDB database
4. Creating login credentials for **1 Super Admin** and **1 Normal Admin (property admin)**
5. Running the app locally
6. Deploying to production (Vercel + Railway)
7. Developing and running the test suite

---

## 0. Tech Stack Recap (so you know what you are deploying)

| Layer       | Tech                                   | Default Port |
|-------------|----------------------------------------|--------------|
| Frontend    | Next.js (React)                        | `3000`       |
| Backend     | Node.js / Express + Socket.io          | `5000`       |
| Database    | MongoDB (local or Atlas)               | `27017`      |
| Auth        | JWT + bcrypt, roles: `super_admin`, `property_admin`, `staff` |

> **Role note:** A "normal admin" in this app is the **`property_admin`** role. It can
> view everything, toggle menu availability, and manage the team, but **cannot** manage
> rooms/menu or global settings. The `super_admin` has full control.

---

## 1. Clear the Project From Previous Client Data

The previous client's data lives in two places:

- `server/seed.js` — hardcodes the property name, admin emails and passwords.
- `server/.env` and `client/.env.local` — environment variables (these are git-ignored, but
  may still exist on your machine).

### 1.1 Remove local secrets / env files

```bash
# From the project root
rm -f server/.env
rm -f client/.env.local
```

### 1.2 Scrub the seed script (the real "previous data")

Open `server/seed.js` and replace the client-specific values. Below is a **clean template**
you can copy in. Replace the `<PLACEHOLDER>` values with the new client's details.

```js
// server/seed.js  (CLEAN TEMPLATE — fill in the new client's values)
import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./src/modules/properties/property.model.js";
import Room from "./src/modules/rooms/room.model.js";
import MenuCategory from "./src/modules/menu/category.model.js";
import MenuItem from "./src/modules/menu/item.model.js";
import User from "./src/modules/users/user.model.js";

dotenv.config();

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    // Clear ALL existing data for a fresh start
    await Promise.all([
      Property.deleteMany(),
      Room.deleteMany(),
      MenuCategory.deleteMany(),
      MenuItem.deleteMany(),
      User.deleteMany(),
    ]);
    console.log("Cleared existing data.");

    // 1. Create the new client's Property (hotel/restaurant)
    const property = await Property.create({
      name: "<NEW_CLIENT_PROPERTY_NAME>",          // e.g. "Seaside Boutique Hotel"
      address: "<NEW_CLIENT_ADDRESS>",             // e.g. "1 Ocean Drive, Miami"
    });
    console.log(`✓ Created Property: ${property.name} (${property._id})`);

    // 2. Create SUPER ADMIN (full control)
    await User.create({
      name: "<SUPER_ADMIN_NAME>",
      email: "<SUPER_ADMIN_EMAIL>",                // e.g. owner@client.com
      password: "<SUPER_ADMIN_STRONG_PASSWORD>",   // min 6 chars, use a strong one
      role: "super_admin",
      propertyId: property._id,
    });
    console.log("✓ Created SUPER ADMIN");

    // 3. Create NORMAL ADMIN (property_admin)
    await User.create({
      name: "<ADMIN_NAME>",
      email: "<ADMIN_EMAIL>",                      // e.g. manager@client.com
      password: "<ADMIN_STRONG_PASSWORD>",
      role: "property_admin",
      propertyId: property._id,
    });
    console.log("✓ Created NORMAL ADMIN (property_admin)");

    console.log("\n--- DATA SEEDED SUCCESSFULLY ---");
    console.log("Property ID (save for later):", property._id);
    console.log("---------------------------------\n");

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
```

> **Tip:** Never commit real passwords. If you plan to commit the seed file, keep the
> placeholders above and inject real values into `server/.env` instead, then read them via
> `process.env` in `seed.js`.

### 1.3 (Optional) Remove branding / references to the old client

- Search the `client/` folder for the old property name, logos, or copy and replace it.
- Update `client/public/manifest.json` (app name / icons) if you rebrand the PWA.

---

## 2. Clone the Code Into a New GitHub Repository

You are currently working inside a git repo whose remote is
`https://github.com/TpMarkov/multi-tenants-deployment.git`. To start a **fresh repo** for the
new client without carrying over the old commit history:

### Option A — New repo, NO old history (cleanest)

```bash
# From the project root
# 1. Remove the old git connection and history
rm -rf .git

# 2. Initialise a brand new repository
git init
git add .
git commit -m "Initial commit for <NEW_CLIENT_NAME> deployment"

# 3. Create the new repo on GitHub (do this in the browser OR via gh CLI)
gh repo create <new-client-repo-name> --private   # or --public

# 4. Point to the new remote and push
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<new-client-repo-name>.git
git push -u origin main
```

### Option B — New repo, KEEP old history (fork-style)

```bash
# Create the new empty repo on GitHub first, then:
git remote rename origin old-client
git remote add origin https://github.com/<YOUR_USERNAME>/<new-client-repo-name>.git
git push -u origin main
```

> `.env` files are already in `.gitignore`, so secrets won't be pushed. Double-check with
> `git ls-files | findstr .env` returns nothing before pushing.

---

## 3. Set Up a New MongoDB Database

### Option A — MongoDB Atlas (recommended for production)

1. Go to https://www.mongodb.com/cloud/atlas and sign up / log in.
2. Create a new **Organization** and **Project** for the new client.
3. Build a cluster — choose **Shared (Free)** or **Dedicated** for production.
4. **Database Access** → create a DB user (username + strong password). Save these.
5. **Network Access** → add your server IP. For local dev you can add `0.0.0.0/0`
   (NOT recommended for production — whitelist the real server IP instead).
6. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
   ```
7. Replace `<dbname>` with something like `hospitality` (or the client name).

### Option B — Local MongoDB (dev only)

```bash
# Windows (chocolatey)
choco install mongodb-community
mongod
mongosh --eval "db.adminCommand('ping')"
```
Local connection string: `mongodb://localhost:27017/hospitality`

---

## 4. Configure Environment Variables

### 4.1 Backend — `server/.env`

Create `server/.env` (copy from the template below):

```env
# Database — paste the NEW Atlas connection string from Step 3
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hospitality

# Server
PORT=5000
NODE_ENV=development          # change to "production" when deploying

# CORS (frontend origin)
CORS_ORIGIN=http://localhost:3000

# JWT — generate a strong random secret:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<strong-random-secret>
JWT_EXPIRY=7d

# Socket.io
SOCKET_ORIGIN=http://localhost:3000
```

### 4.2 Frontend — `client/.env.local`

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 5. Seed the Database & Create the Admin Accounts

With `server/.env` configured and `seed.js` cleaned (Step 1.2):

```bash
cd server
npm install
npm run seed
```

Expected output:
```
Connected!
Cleared existing data.
✓ Created Property: <NEW_CLIENT_PROPERTY_NAME> (<id>)
✓ Created SUPER ADMIN
✓ Created NORMAL ADMIN (property_admin)
--- DATA SEEDED SUCCESSFULLY ---
```

You now have:
- **1 Super Admin** → `<SUPER_ADMIN_EMAIL>` / `<SUPER_ADMIN_STRONG_PASSWORD>`
- **1 Normal Admin** → `<ADMIN_EMAIL>` / `<ADMIN_STRONG_PASSWORD>`

### 5.1 Adding more admins later (without reseeding)

Log in as the Super Admin, then call the users API:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<SUPER_ADMIN_EMAIL>","password":"<SUPER_ADMIN_STRONG_PASSWORD>"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

# Create a new admin (property_admin or staff)
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Manager","email":"manager2@client.com","password":"anotherPass123","role":"property_admin","propertyId":"<PROPERTY_ID>"}'
```

(`propertyId` is printed by the seed script — "Property ID (save for later)".)

---

## 6. Run Locally & Verify Login

```bash
# Terminal 1 — backend
cd server && npm run dev
# Terminal 2 — frontend
cd client && npm install && npm run dev
```

1. Open http://localhost:3000
2. Go to http://localhost:3000/admin/login
3. Log in with the **Super Admin** credentials → should reach `/admin/dashboard`
4. Log out and log in with the **Normal Admin** credentials → should also reach the dashboard
   (with reduced permissions).

---

## 7. Production Deployment (Vercel + Railway)

### 7.1 Backend on Railway
1. Go to https://railway.app, sign in with GitHub, "New Project" → "Deploy from GitHub".
2. Select the **new repo**, set root directory to `server`.
3. Add environment variables (same as `server/.env`) but with:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://<your-vercel-domain>`
   - `SOCKET_ORIGIN=https://<your-vercel-domain>`
4. Deploy. Copy the generated backend URL (e.g. `https://api-xxx.up.railway.app`).

### 7.2 Frontend on Vercel
1. Go to https://vercel.com, import the **new repo**, set root directory to `client`.
2. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://<railway-backend>/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://<railway-backend>`
3. Deploy.

### 7.3 Seed the production database
Set the production `MONGODB_URI` in Railway, then run seed against it locally by temporarily
pointing `server/.env`'s `MONGODB_URI` at the Atlas prod DB and running `npm run seed`, OR run
it from the Railway shell. **Reseed wipes all data**, so only do this on a fresh DB.

---

## 8. Develop & Run Testing

The repo ships with two test layers.

### 8.1 Backend unit/integration tests (Jest + Supertest + MongoDB Memory Server)

These run against an in-memory MongoDB, so they never touch your real data.

```bash
cd server
npm install
npm test
```

- Test files live in `server/tests/`: `auth.test.js`, `admin.e2e.test.js`,
  `comprehensive.e2e.test.js`, `order.test.js`.
- `server/tests/setup.js` spins up `MongoMemoryServer` automatically.

### 8.2 End-to-end tests (Playwright)

These drive the real running app (frontend + backend on ports 3000/5000), so **start both
servers first** (Step 6), then:

```bash
# From the project root (or wherever playwright is installed)
npm install --save-dev @playwright/test
npx playwright install            # download browsers (one time)
npx playwright test tests/e2e.spec.js
```

> The e2e suite logs in with `admin@hotel.com` / `password123` by default. After you change
> credentials in `seed.js`, update those strings at the top of `tests/e2e.spec.js`
> (`Admin Login` test) to match your new Super Admin email/password, or the login test will fail.

### 8.3 Suggested testing workflow while onboarding a client
1. Run `npm test` in `server` → backend endpoints (auth, admin, orders) pass.
2. Start servers, run `npx playwright test` → full UI flow (login → menu → room → order).
3. Manually verify both admin accounts can log in and that the Normal Admin cannot reach
   room/menu management (permission check).
4. Add a test for the new admin-creation API (Step 5.1) if you extended the team feature.

---

## 9. Pre-Go-Live Security Checklist

- [ ] `JWT_SECRET` is a strong random value (not the default).
- [ ] `NODE_ENV=production` on the deployed backend.
- [ ] `CORS_ORIGIN` restricted to the production frontend domain only.
- [ ] MongoDB Atlas IP whitelist set to the real server IP (no `0.0.0.0/0` in prod).
- [ ] New client's admin passwords are strong and unique.
- [ ] `.env` files are git-ignored and never committed.
- [ ] Atlas backups enabled.
- [ ] Old client's data fully wiped (seed clears all collections).

---

## 10. Quick Command Recap

```bash
# 1. Clean
rm -f server/.env client/.env.local
#    -> edit server/seed.js with new client + admin values

# 2. New repo
rm -rf .git && git init && git add . && git commit -m "Initial commit <client>"
gh repo create <repo> --private
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main

# 3. Configure env (server/.env + client/.env.local) with new MONGODB_URI

# 4. Seed + admins
cd server && npm install && npm run seed

# 5. Run
cd server && npm run dev      # terminal 1
cd client && npm install && npm run dev   # terminal 2

# 6. Test
cd server && npm test
npx playwright test tests/e2e.spec.js
```
