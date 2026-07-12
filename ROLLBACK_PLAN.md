# Rollback Plan

## Objective
If Render deployment fails or causes issues, quickly restore service to Railway or previous working state.

## Pre-Migration Checklist
- [ ] Keep Railway service running until Render is verified
- [ ] Note current Railway URL and Render URL
- [ ] Export current MongoDB data as backup (if needed)

## Rollback Procedure

### Option A: Revert to Railway
1. Re-deploy from Railway dashboard
2. Update Vercel environment variables:
   - `NEXT_PUBLIC_API_URL` = old Railway URL + `/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL` = old Railway URL
3. Redeploy frontend on Vercel
4. Verify admin login works

### Option B: Fix Render
1. Check Render logs for errors
2. Fix environment variables in Render dashboard
3. Trigger manual deploy from Render dashboard
4. Verify health endpoint returns 200

### Option C: Frontend Downtime
If both backends are down:
1. Frontend will show "Cannot reach API server" error
2. Users cannot log in or perform actions
3. Fix backend first, then verify frontend

## Data Safety
- MongoDB Atlas is independent of both Railway and Render
- Data is not affected by backend migration
- No data export/import required

## Communication Plan
- Notify stakeholders of maintenance window
- Monitor Render logs during deployment
- Have Railway URL ready for immediate rollback

## Timeline
- Keep Railway running for minimum 24 hours after Render launch
- Monitor Render for stability
- Shut down Railway only after confirmation
