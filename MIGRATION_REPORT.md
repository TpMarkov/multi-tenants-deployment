# Migration Analysis Report

## Executive Summary
- Backend: Express 5 + Node.js ES Modules
- Database: MongoDB Atlas (already external, no data migration needed)
- Frontend: Next.js 16 on Vercel (no changes needed to code)
- Migration scope: Railway -> Render Free

## Existing Architecture

### API Routes
- POST /api/v1/auth/login
- GET/POST /api/v1/users
- GET/PUT /api/v1/users/profile
- POST /api/v1/users/profile/avatar
- PUT /api/v1/users/profile/password
- GET/POST /api/v1/users/team
- PUT/DELETE /api/v1/users/team/:id
- GET/POST /api/v1/properties
- GET /api/v1/rooms
- POST /api/v1/rooms
- PATCH /api/v1/rooms/:id
- DELETE /api/v1/rooms/:id
- GET /api/v1/rooms/validate-qr/:sessionToken
- GET /api/v1/rooms/by-number/:roomNumber
- GET/POST /api/v1/menu/categories
- DELETE /api/v1/menu/categories/:id
- GET/POST /api/v1/menu/items
- PATCH /api/v1/menu/items/:id/availability
- PATCH /api/v1/menu/items/:id
- DELETE /api/v1/menu/items/:id
- POST /api/v1/orders
- GET /api/v1/orders
- PATCH /api/v1/orders/:id/status
- DELETE /api/v1/orders/:id
- GET /api/v1/orders/analytics
- POST /api/v1/feedback
- GET /api/v1/feedback
- GET /api/v1/feedback/stats
- GET /api/v1/health
- GET /health (new)

### Middleware Stack
- helmet (security headers)
- cors (CORS with origin validation)
- express-rate-limit (global 100/15min, login 5/15min)
- express.json (50MB limit)
- express.urlencoded (50MB limit)
- morgan (logging)
- compression (gzip/brotli)
- asyncHandler (error catching)
- errorHandler (global error handler)

### Authentication & Authorization
- JWT-based auth with bcrypt password hashing
- protect middleware: extracts Bearer token, verifies JWT, fetches user
- authorize middleware: role-based access (currently passes all through - note this)
- Default super_admin fallback for missing/invalid tokens
- Roles: super_admin, property_admin, staff

### MongoDB
- Mongoose ODM
- Connection string: mongodb+srv://webdevstudiohq:Doktora922@cluster0.dowp7vv.mongodb.net/?appName=Cluster0
- Models: User, Property, Room, MenuCategory, MenuItem, Order, Feedback
- Connection retry: 10s interval on failure
- Demo data auto-provisioning on startup

### Socket.IO
- Events: order:created, order:updated, order:voided (server receives and broadcasts)
- Events emitted: new_order, order_updated, room:created, room:updated, room:deleted, room:tokenRegenerated, menu:category:created, menu:item:created, menu:item:updated, menu:item:deleted, menu:category:deleted
- CORS: configured via CORS_ORIGIN env var
- Auth: token passed via Socket.IO auth option

### File Uploads
- multer with memoryStorage
- Avatar uploads stored as base64 data URLs in MongoDB
- 2MB size limit
- Render ephemeral filesystem not an issue (memory storage)

### Environment Variables
- PORT
- NODE_ENV
- MONGO_URI
- JWT_SECRET
- JWT_EXPIRE
- CORS_ORIGIN
- SOCKET_ORIGIN

### Railway Configuration Found
- railway.json
- Procfile
- nixpacks.toml
- start.sh
- .env: SOCKET_ORIGIN pointed to Railway

### Frontend Integration
- NEXT_PUBLIC_API_URL for REST API
- NEXT_PUBLIC_SOCKET_URL for Socket.IO
- Axios interceptors for auth and auto-logout on 401
- Vercel deployment already configured

## Migration Decision
- MongoDB Atlas: REUSE (already external, no data migration)
- Railway: REMOVE (all config files and references)
- Render: DEPLOY NEW (Free tier, frankfurt region)
- Frontend: UPDATE ENV VARS only (no code changes)

## Risk Assessment
- Low risk: MongoDB already on Atlas
- Medium risk: Socket.IO CORS configuration must match new Render URL
- Medium risk: Cold starts on Render Free tier (15 min sleep, 30-90s wake)
- Low risk: CORS configuration changes
- Low risk: File uploads use memory storage (no persistent disk needed)
