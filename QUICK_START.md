# 🚀 QUICK START - TEST THE APP NOW

## Prerequisites ✓
- Backend running on port 5000
- Frontend running on port 3000  
- Database seeded with property + admin user
- PropertyID: `69db3ba306c9c24563d9691e` (from seed output)

---

## 🎬 3-MINUTE QUICK TEST

### Step 1: Admin Login (30 seconds)
```
URL: http://localhost:3000/admin/login
Email: admin@hotel.com
Password: password123
```
→ Should see Admin Dashboard

### Step 2: Create a Room (1 minute)
```
1. Sidebar → "Room Management"
2. Click "Add Room" button
3. Room Number: 101
4. Click "Create Room"
5. Click "View QR" button for Room 101
```
→ You'll see QR modal with "See Menu (Testing)" button

### Step 3: Create Menu Items (1 minute)
```
1. Sidebar → "Menu Management"
2. Click "Add Category" → Enter "Breakfast" → Create
3. Click "Add Menu Item"
4. Fill: Name: Pancakes, Price: 12.99, Category: Breakfast
5. Click "Create"
6. Repeat with: Coffee (Beverages, $3.99), Cake (Desserts, $6.99)
```
→ Items appear in table

### Step 4: Test Guest Flow (30 seconds)
```
1. From Room 101 QR modal, click "See Menu (Testing)"
2. You should see all menu items
3. Click + on Pancakes
4. Click "View Cart"
5. Click "Place Order"
6. Order confirmation shown
```
→ Order created successfully

### Step 5: Verify Admin Panel (30 seconds)
```
1. Go to admin orders: http://localhost:3000/admin/orders
2. You should see your order
3. Check: Order linked to Room 101 ✓
```

---

## 🔍 WHAT TO CHECK

### Critical Points:
1. ✓ Room 101 URL shows: `/property/{propertyId}/room/{roomId}`
   - NOT: `/property/{propertyId}/room/101`
2. ✓ Menu items load after QR navigation
3. ✓ Cart updates when adding items
4. ✓ Order shows in admin panel with room linked
5. ✓ No console errors

### If Something Breaks:
1. Check browser console (F12)
2. Check Network tab for failed requests
3. Check server logs
4. Verify propertyId matches in URLs

---

## 📊 EXPECTED DATA FLOW

```
Admin Creates Room → QR Code Generated (with roomId)
                    ↓
Guest Scans QR → Same propertyId + roomId extracted
                 ↓
Guest Views Menu → Fetches items for propertyId
                 ↓
Guest Orders → Order sent with propertyId + roomId
             ↓
Order Stored in DB with roomId → Linked to Room 101
```

---

## 🎯 SUCCESS INDICATORS

- [ ] Admin can log in
- [ ] Can create rooms
- [ ] Can create menu items with prices
- [ ] QR URL uses roomId (not roomNumber)
- [ ] Guest can view menu
- [ ] Guest can add items to cart
- [ ] Cart persists on page refresh
- [ ] Guest can place order
- [ ] Order appears in admin panel
- [ ] Order linked to correct room
- [ ] No console errors

---

## 📝 NOTES

- Cart local to browser (localStorage)
- Images optional (fallback to first letter)
- Menu items shown by category
- Prices calculated on backend (not client)
- OrderId unique per order
- Room QR always has correct roomId

---

Everything is ready. Start with Step 1 above!
