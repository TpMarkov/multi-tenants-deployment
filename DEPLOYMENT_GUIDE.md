# 🚀 Deployment Guide - Multi-Tenant Hospitality SaaS

This guide covers deploying your full-stack application across different environments (Development, Staging, Production).

---

## 📋 Project Architecture Overview

Your application consists of:
- **Frontend**: Next.js 16.2.3 (React) - Port 3000
- **Backend**: Node.js/Express with Socket.io - Port 5000
- **Database**: MongoDB (local or Atlas)
- **Real-time**: Socket.io for live updates
- **Features**: Admin dashboard, Menu management, Room management, Orders, QR codes

---

## 🔧 Prerequisites for All Deployments

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: For version control
- **MongoDB**: Local instance OR Atlas account

### Environment Setup
1. Clone the repository
2. Navigate to project root
3. Prepare environment variables (see `.env` Configuration section below)

---

## 📝 Environment Variables Configuration

### Backend (.env file in `/server` directory)

Create `.env` file in `server/` folder with:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hospitality
# For MongoDB Atlas use: mongodb+srv://username:password@cluster.mongodb.net/hospitality

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# Socket.io
SOCKET_ORIGIN=http://localhost:3000
```

**Production Values** (update before deploying):
- `MONGODB_URI`: Use MongoDB Atlas connection string
- `CORS_ORIGIN`: Set to your production frontend domain
- `NODE_ENV`: Set to `production`
- `JWT_SECRET`: Use a strong, random secret

### Frontend (.env.local file in `/client` directory)

Create `.env.local` file in `client/` folder with:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Production Values** (update before deploying):
- `NEXT_PUBLIC_API_URL`: Your production backend API URL
- `NEXT_PUBLIC_SOCKET_URL`: Your production backend Socket.io URL

---

## 🏠 Part 1: Local Development Deployment

### Step 1: MongoDB Setup (Choose One)

#### Option A: Local MongoDB
```bash
# Windows - if MongoDB is not installed
choco install mongodb-community
# OR download from: https://www.mongodb.com/try/download/community

# Start MongoDB service
mongod

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a "Shared" cluster (free tier)
4. In Network Access: Allow current IP
5. Create database user with credentials
6. Copy connection string
7. Update `MONGODB_URI` in server `.env` file

### Step 2: Backend Setup & Deployment

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Seed initial data (admin user, sample property)
npm run seed

# Start development server
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected: localhost
🚀 Server running on PORT 5000
Socket.io server initialized
```

### Step 3: Frontend Setup & Deployment

```bash
# In new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.2.3
  - Local: http://localhost:3000
```

### Step 4: Verify Local Deployment

1. Open http://localhost:3000 in browser
2. Admin login: http://localhost:3000/admin/login
   - Email: `admin@hotel.com`
   - Password: `password123`
3. Test functionality:
   - Dashboard loads without errors
   - Create room and menu items
   - Test QR code generation
   - Test order placement

---

## ☁️ Part 2: Production Deployment (Recommended Platforms)

### Recommended Architecture
- **Frontend**: Vercel or Netlify (optimized for Next.js)
- **Backend**: Railway, Render, or AWS EC2
- **Database**: MongoDB Atlas (cloud)

### Option A: Deploy to Vercel + Railway (Easiest & Recommended)

#### Backend Deployment on Railway

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Create new project

3. **Connect Backend Repository**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository
   - Select `server/` as root directory

4. **Configure Environment Variables in Railway Dashboard**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospitality
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-domain.vercel.app
   JWT_SECRET=generate-strong-random-key
   JWT_EXPIRY=7d
   SOCKET_ORIGIN=https://your-domain.vercel.app
   ```

5. **Deploy**
   - Railway automatically deploys on push
   - Get your backend URL (e.g., `https://api-production.up.railway.app`)

#### Frontend Deployment on Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "New Project"
   - Select your repository
   - Select `client/` as "Root Directory"

3. **Configure Environment Variables**
   - `NEXT_PUBLIC_API_URL=https://your-railway-backend-url/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://your-railway-backend-url`

4. **Deploy**
   - Vercel automatically deploys on push
   - Get your frontend URL (e.g., `https://your-app.vercel.app`)

### Option B: Deploy to Render.com (Full-Stack Alternative)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Deploy Backend**
   - New → Web Service
   - Connect GitHub repository
   - Settings:
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `npm run start`
     - Environment: Node
   - Add environment variables (same as Railway)

3. **Deploy Frontend**
   - New → Static Site
   - Connect GitHub repository
   - Settings:
     - Root Directory: `client`
     - Build Command: `npm install && npm run build`
   - Add environment variables for frontend

---

## 🗄️ Part 3: Database Deployment on MongoDB Atlas

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create organization and project
3. Build a cluster:
   - Choose "Shared" (free tier) or "Dedicated" (production)
   - Select region closest to your users
   - Click "Create Cluster"

### Step 2: Configure Network Access

1. In left sidebar: Network Access
2. Add IP Address:
   - Click "Add IP Address"
   - For production: Add your server's IP
   - For development: Add `0.0.0.0/0` (allow all - NOT for production)

### Step 3: Create Database User

1. In left sidebar: Database Access
2. Create database user:
   - Username: `admin` or your preferred name
   - Password: Generate strong password
   - Database User Privileges: `Atlas Admin`

### Step 4: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Drivers"
3. Copy connection string
4. Replace `<username>`, `<password>`, and `<database_name>`
5. Update in `.env` files:
   ```
   MONGODB_URI=mongodb+srv://admin:password@cluster-name.mongodb.net/hospitality
   ```

### Step 5: Initialize Database (First Time)

```bash
cd server
npm run seed
```

This creates:
- Admin user
- Sample property
- Indexes for collections

---

## 🔐 Security Checklist for Production

### Before Deploying to Production

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to production domain ONLY
- [ ] Enable MongoDB Atlas IP whitelist (don't use 0.0.0.0/0)
- [ ] Use HTTPS for all URLs (Vercel/Railway handle this)
- [ ] Enable database backups in MongoDB Atlas
- [ ] Set up rate limiting (already configured in Express)
- [ ] Review and update password for admin user
- [ ] Enable MongoDB encryption at rest
- [ ] Set up monitoring and logging
- [ ] Configure CORS headers properly
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable HTTPS/TLS for Socket.io connections

### Environment Variable Security

```bash
# ❌ DO NOT
MONGODB_URI=mongodb://user:password@localhost:27017

# ✅ DO Use
# Set in platform dashboard (Vercel, Railway, etc.)
# Never commit .env file
# Add .env to .gitignore
```

---

## 📊 Part 4: Scaling & Advanced Configuration

### For Higher Traffic

#### Enable Caching
Update `client/next.config.mjs`:
```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  swcMinify: true,
};
```

#### Implement Redis for Sessions (Optional)
For production with multiple server instances:
1. Add Redis to your deployment
2. Update Express session middleware
3. Configure Socket.io adapter for Redis

#### Database Optimization
- Create indexes for frequently queried fields
- Enable MongoDB compression
- Use connection pooling
- Monitor slow queries

### Multi-Instance Backend

If using Railway or Render:
1. Enable auto-scaling
2. Add load balancer (both platforms handle this)
3. Configure Socket.io adapter for distributed sessions
4. Use sticky sessions for real-time connections

---

## 📱 PushNotifications & PWA (Optional)

Your client is configured with PWA support. To enable:

1. **Manifest**: Already in `public/manifest.json`
2. **Service Worker**: Auto-generated by next-pwa
3. **Deployment**: Works automatically on production HTTPS

Users can:
- Install as native app
- Work offline (with cache strategy)
- Receive notifications (set up later)

---

## 🧪 Post-Deployment Verification

### Checklist

After deployment, verify:

1. **Frontend Access**
   - [ ] Frontend loads without errors
   - [ ] CSS and images load correctly
   - [ ] PWA installable (check browser prompts)

2. **Backend API**
   - [ ] Health check: `GET /` returns success
   - [ ] Authentication works: `POST /api/v1/auth/login`
   - [ ] CORS headers present in responses

3. **Real-time Features**
   - [ ] Socket.io connects successfully
   - [ ] Orders sync in real-time
   - [ ] Admin dashboard updates live

4. **Database**
   - [ ] Can read/write data
   - [ ] Backups enabled (MongoDB Atlas)
   - [ ] Connection string working

5. **Admin Functions**
   - [ ] Login with seeded admin user
   - [ ] Create room
   - [ ] Create menu items
   - [ ] Generate QR codes

6. **Guest Functions**
   - [ ] Access menu via QR code
   - [ ] Place order
   - [ ] View order confirmation

---

## 🚨 Troubleshooting Common Issues

### Issue: "Failed to connect to MongoDB"
**Solution:**
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist
- Ensure database user credentials are correct
- Verify database name exists

### Issue: "CORS errors in browser console"
**Solution:**
- Update `CORS_ORIGIN` to match frontend URL
- Ensure backend is running
- Check network tab in browser devtools

### Issue: "Socket.io connection fails"
**Solution:**
- Verify `SOCKET_ORIGIN` in backend `.env`
- Ensure both frontend and backend are accessible
- Check firewall/proxy settings
- Verify WebSocket is enabled on hosting platform

### Issue: "Admin login fails"
**Solution:**
```bash
# Reseed the database
cd server
npm run seed
```

### Issue: "QR codes not generating"
**Solution:**
- Check backend logs for qrcode library errors
- Verify room creation was successful
- Ensure room property relationship exists

---

## 📈 Monitoring & Maintenance

### Set Up Monitoring

1. **Backend Logs**
   - Railway/Render: View in platform dashboard
   - Use tools like: Sentry, LogRocket

2. **Frontend Monitoring**
   - Vercel: Built-in analytics
   - Use: Sentry, Datadog, or LogRocket

3. **Database Monitoring**
   - MongoDB Atlas: Built-in monitoring
   - Set up alerts for storage usage

### Regular Maintenance

- Weekly: Check error logs
- Monthly: Review database performance
- Quarterly: Update dependencies
- Yearly: Security audit

---

## 🔄 CI/CD Pipeline Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Backend Tests
        run: |
          cd server
          npm install
          npm test
      
      - name: Frontend Build
        run: |
          cd client
          npm install
          npm run build
```

---

## 📞 Support & Additional Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Socket.io Documentation](https://socket.io/docs/)

### Deployment Platforms
- [Vercel](https://vercel.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 🎯 Summary: Quick Deployment Paths

### Local Development (15 minutes)
1. MongoDB local or Atlas
2. `cd server && npm install && npm run seed && npm run dev`
3. `cd client && npm install && npm run dev`

### Production (30 minutes)
1. MongoDB Atlas (free tier)
2. Push code to GitHub
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Update environment variables
6. Run seed on production database

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Maintained By**: Development Team
