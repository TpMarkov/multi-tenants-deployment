# Verification Checklist

## Pre-Deployment
- [ ] Code pushed to GitHub main branch
- [ ] `cd server && npm install` runs successfully
- [ ] `npm start` runs without errors locally
- [ ] MongoDB Atlas connection works from local machine
- [ ] `.env` file has correct values
- [ ] No Railway config files remain (or are ignored)

## Render Deployment
- [ ] Render web service created successfully
- [ ] Build completes without errors
- [ ] Service starts without crashing
- [ ] Health check passes: `https://<render-url>/health` returns 200
- [ ] MongoDB connection established in Render logs

## API Verification
- [ ] GET `/health` returns 200 with db status
- [ ] GET `/api/v1/health` returns 200 with db status
- [ ] POST `/api/v1/auth/login` works with demo credentials
- [ ] JWT token returned in login response
- [ ] Protected routes return data with valid JWT
- [ ] Rate limiting works (5 login attempts per 15 min)

## Socket.IO Verification
- [ ] Socket.IO connects from Vercel frontend
- [ ] `new_order` event received in admin dashboard
- [ ] `order_updated` event received when order status changes
- [ ] `room:created` event received when room is created
- [ ] `menu:item:created` event received when menu item is created

## Frontend Verification
- [ ] Vercel environment variables updated
- [ ] Frontend loads without CORS errors
- [ ] Admin login page works
- [ ] Dashboard loads data correctly
- [ ] Orders page shows real-time updates
- [ ] Menu management works
- [ ] Room management works
- [ ] Team management works

## CORS Verification
- [ ] Vercel origin allowed in CORS
- [ ] localhost:3000 allowed in development
- [ ] Socket.IO CORS matches API CORS

## Performance
- [ ] API response times acceptable (<500ms)
- [ ] MongoDB queries optimized
- [ ] Compression enabled (check response headers)
- [ ] Cold start within acceptable range

## Security
- [ ] Helmet headers present
- [ ] Rate limiting active
- [ ] JWT secrets strong and in env vars
- [ ] No secrets in code or logs
- [ ] MongoDB Atlas IP whitelist configured

## Documentation
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] Environment variables documented
- [ ] Rollback plan documented
