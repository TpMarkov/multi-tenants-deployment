# Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (sign up at render.com)
- MongoDB Atlas account (already set up - mongodb+srv://webdevstudiohq:Doktora922@cluster0.dowp7vv.mongodb.net/?appName=Cluster0)
- Vercel account (frontend already deployed)

## Step 1: Push Code to GitHub
```bash
git add .
git commit -m "chore: migrate from Railway to Render"
git push origin main
```

## Step 2: Deploy Backend to Render
1. Go to https://dashboard.render.com
2. Click "New +" -> "Web Service"
3. Connect your GitHub repository
4. Select the repository
5. Configure:
   - Name: `multi-tenants-backend` (or your preferred name)
   - Runtime: Node
   - Region: Frankfurt (or closest to you)
   - Branch: main
   - Build Command: `cd server && npm install`
   - Start Command: `npm start`
   - Plan: Free

6. Add Environment Variables (click "Advanced" -> "Add Environment Variable"):
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://webdevstudiohq:Doktora922@cluster0.dowp7vv.mongodb.net/?appName=Cluster0`
   - `JWT_SECRET` = `your_super_secret_jwt_key_123!_is_impossible-to-GET` (CHANGE THIS to a strong random secret)
   - `JWT_EXPIRE` = `24h`
   - `CORS_ORIGIN` = `https://your-vercel-app.vercel.app` (your actual Vercel frontend URL)
   - `SOCKET_ORIGIN` = `https://your-vercel-app.vercel.app`
   - `PORT` = `10000`

7. Click "Create Web Service"

## Step 3: Verify MongoDB Atlas Connectivity
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) OR add Render's IP ranges
- The existing connection string uses retryWrites=true by default in mongodb+srv
- Verify in Atlas dashboard: Network Access -> IP Access List

## Step 4: Update Vercel Environment Variables
Go to your Vercel project settings -> Environment Variables:
- `NEXT_PUBLIC_API_URL` = `https://your-render-app.onrender.com/api/v1`
- `NEXT_PUBLIC_SOCKET_URL` = `https://your-render-app.onrender.com`

Then redeploy the frontend on Vercel.

## Step 5: Verify Deployment
- Backend health: `https://your-render-app.onrender.com/health`
- Admin login: `https://your-vercel-app.vercel.app/admin/login`
- Demo credentials: admin@hotel.com / password123

## Step 6: Socket.IO Configuration
The backend already has Socket.IO configured with CORS. Ensure `SOCKET_ORIGIN` matches your Vercel URL.

## Step 7: Health Checks
- Render will automatically ping `/health` every 30 seconds
- If `/health` returns non-200, Render will restart the service
- Free tier services spin down after 15 minutes of inactivity

## Render Free Tier Limitations
- 512 MB RAM
- 0.5 CPU
- Services sleep after 15 minutes of inactivity
- Cold starts can take 30-90 seconds
- 100 GB bandwidth/month
- No persistent disk (ephemeral filesystem)

## File Upload Notes
- Avatar uploads use memoryStorage (base64 in DB) - works fine on Render
- No persistent file storage needed

## Troubleshooting
1. **Service won't start**: Check Render logs for errors
2. **MongoDB connection fails**: Verify MONGODB_URI and Atlas IP whitelist
3. **CORS errors**: Ensure CORS_ORIGIN matches Vercel domain exactly
4. **Socket.IO won't connect**: Ensure SOCKET_ORIGIN matches Vercel domain
5. **Health check fails**: Ensure `/health` endpoint returns 200
6. **Cold start timeout**: Increase health check timeout in render.yaml to 100s

## Rollback Plan
1. Keep Railway service running until Render is verified
2. If issues arise, redeploy from Railway or switch Vercel env vars back to Railway URL
3. Railway can be shut down after 24 hours of stable Render operation

## Common Render Issues
- **Build fails**: Ensure `cd server && npm install` works locally
- **Port binding**: Render sets PORT automatically; app must use `process.env.PORT || 5000`
- **Environment variables**: Must be set in Render dashboard, not just in .env
- **Git submodules**: If using any, ensure they're public or handled correctly

## Environment Variables Reference
| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | production |
| PORT | Server port | 10000 |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| JWT_SECRET | Secret for signing JWTs | random-string |
| JWT_EXPIRE | Token expiration | 24h |
| CORS_ORIGIN | Allowed frontend origins | https://app.vercel.app |
| SOCKET_ORIGIN | Socket.IO allowed origin | https://app.vercel.app |
