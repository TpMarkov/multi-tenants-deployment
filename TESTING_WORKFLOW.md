# Complete End-to-End Testing Workflow

## ✅ System Setup
- ✓ Database: Clean with only Property + Admin User
- ✓ Backend: Running on port 5000 (MongoDB connected)
- ✓ Frontend: Running on port 3000 (Next.js) 
- ✓ Admin Credentials: admin@hotel.com / password123

---

## 🧪 TEST FLOW (Follow This Order)

### Phase 1: ADMIN SETUP

#### Step 1.1: Admin Login
1. Navigate to: http://localhost:3000/admin/login
2. Enter email: `admin@hotel.com`
3. Enter password: `password123`
4. Click "Sign in"
5. **Expected**: Redirect to admin dashboard

#### Step 1.2: Create Room
1. Click "Room Management" in sidebar
2. Click "Add Room" button
3. Enter room number: `101`
4. Click "Create Room"
5. **Expected**: Room appears in table
6. Click "View QR" for Room 101
7. **Important**: Note the URL pattern - should be `/property/{propertyId}/room/{roomId}`
8. Click "See Menu (Testing)" button
9. **Expected**: Redirected to guest menu page for this room

#### Step 1.3: Create Menu Category
1. Click "Menu Management" in sidebar
2. Click "Add Category" button
3. Enter category name: `Breakfast`
4. Click "Create"
5. **Expected**: Category appears in dropdown
6. Repeat and create: `Beverages`, `Desserts`

#### Step 1.4: Create Menu Items
1. Click "Add Menu Item" button
2. Fill form:
   - Name: `Pancakes`
   - Description: `Fluffy buttermilk pancakes with syrup`
   - Price: `12.99`
   - Category: `Breakfast`
   - Image: (optional - upload a test image)
3. Click "Create"
4. **Expected**: Item appears in table
5. **Repeat** for at least 3 items across different categories:

**Example Items:**
- Breakfast: Pancakes ($12.99), Omelette ($14.99)
- Beverages: Coffee ($3.99), Orange Juice ($4.99)
- Desserts: Cake ($6.99), Ice Cream ($5.99)

---

### Phase 2: GUEST ORDERING FLOW

#### Step 2.1: Access Menu via Room
1. Go back to Room Management
2. Click "View QR" for Room 101
3. Click "See Menu (Testing)" button
4. **Expected**: Redirected to `/property/{propertyId}/room/101` with menu displayed

#### Step 2.2: Verify Menu Display
1. **Check**: All categories displayed
2. **Check**: All items visible with:
   - Name
   - Description
   - Price
   - Image (if uploaded)
3. **Check**: Cart button appears at bottom

#### Step 2.3: Add Items to Cart
1. Click "+" button on "Pancakes"
2. **Expected**: Green checkmark appears, item added
3. **Expected**: Cart button shows "1" item and total "$12.99"
4. Add "Coffee" ($3.99)
5. **Expected**: Cart shows "2" items and total "$16.98"
6. Add "Cake" ($6.99)
7. **Expected**: Cart shows "3" items and total "$23.97"

#### Step 2.4: Modify Cart
1. Click "View Cart" button
2. **Expected**: Checkout page shows all 3 items
3. Find "Pancakes" - change quantity to 2
4. **Expected**: Total updates to "$36.96"
5. Remove "Coffee" 
6. **Expected**: Cart shows 2 items, Coffee gone
7. Add special instructions: `No syrup on pancakes`

#### Step 2.5: Place Order
1. Click "Place Order" button
2. **Expected**: Confirmation page displayed
3. **Expected**: Cart cleared
4. **Expected**: Order ID displayed

#### Step 2.6: Verify Order in Admin
1. Go to Admin Dashboard: http://localhost:3000/admin/orders
2. **Expected**: New order appears in orders list
3. **Check Order Details**:
   - ✓ Order is linked to Room 101
   - ✓ Contains 2 Pancakes + 0 Coffee + 1 Cake
   - ✓ Total amount is correct
   - ✓ Special instructions saved
   - ✓ Status is "received"

---

## 🔍 CRITICAL VALIDATION CHECKS

### Database Level
- [ ] Order has `roomId` field (not roomNumber)
- [ ] Room has `_id` (ObjectId) in QR URL
- [ ] Menu items have `propertyId`
- [ ] Order items have correct prices from backend

### API Level
- [ ] POST /rooms returns room with `_id`
- [ ] QR URL uses `/property/{propertyId}/room/{roomId}` pattern
- [ ] POST /orders calculates total backend-side
- [ ] Order response includes roomId

### Frontend Level
- [ ] Cart persists in localStorage
- [ ] Room ID extracted from URL correctly
- [ ] Menu items render without errors
- [ ] Image display works (or fallback shown)

---

## 🐛 TROUBLESHOOTING

### If menu doesn't load:
1. Check browser console for errors
2. Verify property ID matches room's propertyId
3. Check API requests in Network tab

### If order fails:
1. Verify cart has items
2. Check special instructions field is optional
3. Look for validation errors in response

### If room QR URL wrong:
1. Should be `/property/{propertyId}/room/{roomId}` (NOT roomNumber)
2. Clear cache if still seeing old format

---

## ✨ SUCCESS CRITERIA

✅ Admin can create rooms with QR codes  
✅ Admin can create menu items with images  
✅ Guest can access menu via "See Menu" button  
✅ Guest can add/remove/modify cart  
✅ Guest can place order with special instructions  
✅ Order appears in admin panel linked to correct room  
✅ No console errors during entire flow  
✅ Cart persists when navigating  
✅ Images display (or fallback gracefully)  

---

## 📋 TEST RESULTS LOG

**Date Tested**: [Date]  
**Tester**: [Name]  
**Overall Result**: [ ] PASS [ ] FAIL

### Phase 1 Results
- [ ] Admin login: PASS / FAIL
- [ ] Create room: PASS / FAIL
- [ ] Create categories: PASS / FAIL
- [ ] Create menu items: PASS / FAIL

### Phase 2 Results
- [ ] Access menu via room: PASS / FAIL
- [ ] Menu displays correctly: PASS / FAIL
- [ ] Add items to cart: PASS / FAIL
- [ ] Modify cart: PASS / FAIL
- [ ] Place order: PASS / FAIL
- [ ] Verify in admin: PASS / FAIL

### Issues Found
- Issue 1: [Description]
- Issue 2: [Description]
