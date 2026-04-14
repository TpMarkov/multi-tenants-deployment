# 📋 Menu & Rooms CRUD Implementation

## Overview
All Menu and Room CRUD endpoints have been implemented on the backend with full multi-tenant support and audit logging.

## ✅ Changes Made

### 1. Menu CRUD Operations

#### Backend (`server/src/modules/menu/`)

**Controller (`menu.controller.js`)** - Added:
- `updateItem()` - PATCH `/api/v1/menu/items/:id` - Update menu item details
- `deleteItem()` - DELETE `/api/v1/menu/items/:id` - Remove menu item
- `deleteCategory()` - DELETE `/api/v1/menu/categories/:id` - Remove category (with safety check)

**Routes (`menu.routes.js`)** - Added:
- `DELETE /categories/:id` - Delete category (requires auth)
- `PATCH /items/:id` - Update item full details (requires auth)
- `DELETE /items/:id` - Delete menu item (requires auth)

#### Frontend (`full-app/app/src/lib/api.ts`)
✅ Already implemented:
- `createCategory(data)` - POST new category
- `createMenuItem(data)` - POST new menu item
- `updateMenuItemAvailability(id, isAvailable)` - Toggle availability
- `updateMenuItem(id, data)` - Update menu item
- `deleteMenuItem(id)` - Delete menu item

### 2. Room CRUD Operations

#### Backend (`server/src/modules/rooms/`)

**Controller (`room.controller.js`)** - Added:
- `updateRoom()` - PATCH `/api/v1/rooms/:id` - Update room details
- `deleteRoom()` - DELETE `/api/v1/rooms/:id` - Remove room

**Routes (`room.routes.js`)** - Added:
- `PATCH /:id` - Update room (requires auth)
- `DELETE /:id` - Delete room (requires auth)

#### Frontend (`full-app/app/src/lib/api.ts`)
✅ Already implemented:
- `createRoom(data)` - POST new room
- `updateRoom(id, data)` - PATCH existing room
- `deleteRoom(id)` - DELETE room

## 📚 API Endpoints Reference

### Menu Categories

#### Get Categories
```javascript
GET /api/v1/menu/categories?propertyId={propertyId}
Auth: Optional (guest can view)
Response: { success, count, data: Category[] }
```

#### Create Category
```javascript
POST /api/v1/menu/categories
Auth: Required (super_admin, property_admin)
Body: {
  name: string,
  description?: string,
  propertyId: string (auto-set for non-super_admin)
}
Response: { success, data: Category }
```

#### Delete Category
```javascript
DELETE /api/v1/menu/categories/:id
Auth: Required (super_admin, property_admin)
Response: { success, data: { message: "..." } }
Safety: Prevents deletion if items exist
```

### Menu Items

#### Get Items
```javascript
GET /api/v1/menu/items?propertyId={propertyId}
Auth: Optional (guest can view)
Response: { success, count, data: MenuItem[] }
```

#### Create Item
```javascript
POST /api/v1/menu/items
Auth: Required (super_admin, property_admin)
Body: {
  name: string,
  description?: string,
  price: number,
  categoryId: string,
  isAvailable?: boolean,
  image?: string,
  propertyId: string (auto-set for non-super_admin)
}
Response: { success, data: MenuItem }
```

#### Update Item (Full)
```javascript
PATCH /api/v1/menu/items/:id
Auth: Required (super_admin, property_admin)
Body: {
  name?: string,
  description?: string,
  price?: number,
  categoryId?: string,
  isAvailable?: boolean,
  image?: string
}
Response: { success, data: MenuItem }
```

#### Update Item Availability
```javascript
PATCH /api/v1/menu/items/:id/availability
Auth: Required (super_admin, property_admin, staff)
Body: {
  isAvailable: boolean
}
Response: { success, data: MenuItem }
```

#### Delete Item
```javascript
DELETE /api/v1/menu/items/:id
Auth: Required (super_admin, property_admin)
Response: { success, data: { message: "Item deleted successfully" } }
```

### Rooms

#### Get Rooms
```javascript
GET /api/v1/rooms?propertyId={propertyId}
Auth: Required
Response: { success, count, data: Room[] }
```

#### Create Room
```javascript
POST /api/v1/rooms
Auth: Required (super_admin, property_admin)
Body: {
  roomNumber: string,
  type: string,
  floor: number,
  status: 'available' | 'occupied' | 'maintenance',
  capacity?: number,
  description?: string,
  propertyId: string (auto-set for non-super_admin)
}
Response: { success, data: Room }
```

#### Update Room
```javascript
PATCH /api/v1/rooms/:id
Auth: Required (super_admin, property_admin)
Body: {
  roomNumber?: string,
  type?: string,
  floor?: number,
  status?: 'available' | 'occupied' | 'maintenance',
  capacity?: number,
  description?: string
}
Response: { success, data: Room }
```

#### Delete Room
```javascript
DELETE /api/v1/rooms/:id
Auth: Required (super_admin, property_admin)
Response: { success, data: { message: "Room deleted successfully" } }
```

## 🔒 Security & Multi-Tenancy

### Authorization Checks
- **Super Admin**: Can access any property's data
- **Property Admin**: Can only access their own property
- **Staff**: Limited to availability updates only

### Audit Logging
All operations are logged with:
- Action type (CREATED, UPDATED, DELETED)
- User ID
- Property ID
- Change details
- Timestamp

Examples:
```javascript
// Menu item creation
MENU_ITEM_CREATED | userId | propertyId | { itemId, name }

// Room update
ROOM_UPDATED | userId | propertyId | { roomId, changes }

// Category deletion
MENU_CATEGORY_DELETED | userId | propertyId | { categoryId, name }
```

## 🚀 Usage Examples

### Frontend - Create Menu Item
```javascript
import { createMenuItem } from '@/lib/api';

const newItem = await createMenuItem({
  name: 'Grilled Chicken',
  description: 'Fresh grilled chicken breast',
  price: 12.99,
  categoryId: '65abc123def456',
  isAvailable: true,
  image: 'https://cdn.example/chicken.jpg'
});
```

### Frontend - Update Menu Item
```javascript
import { updateMenuItem } from '@/lib/api';

const updated = await updateMenuItem('65abc123item', {
  price: 13.99,
  isAvailable: false,
  description: 'Seasonal grilled chicken'
});
```

### Frontend - Delete Menu Item
```javascript
import { deleteMenuItem } from '@/lib/api';

await deleteMenuItem('65abc123item');
```

### Frontend - Create Room
```javascript
import { createRoom } from '@/lib/api';

const room = await createRoom({
  roomNumber: '101',
  type: 'Suite',
  floor: 1,
  capacity: 2,
  status: 'available'
});
```

### Frontend - Update Room
```javascript
import { updateRoom } from '@/lib/api';

const updated = await updateRoom('65abc123room', {
  status: 'occupied',
  floor: 2
});
```

## 🧪 Testing Checklist

- [ ] Create menu category
- [ ] Create menu item
- [ ] Update menu item details
- [ ] Toggle menu item availability
- [ ] Delete menu item
- [ ] Try to delete category with items (should fail)
- [ ] Delete empty category
- [ ] Create room
- [ ] Update room
- [ ] Delete room
- [ ] Verify multi-tenant isolation (property_admin can't see other properties)
- [ ] Verify staff can't delete items (only update availability)
- [ ] Check audit logs are created

## 📁 Files Modified

```
server/src/modules/
├── menu/
│   ├── meal.controller.js    ← Added updateItem, deleteItem, deleteCategory
│   └── menu.routes.js        ← Added PATCH/DELETE routes
└── rooms/
    ├── room.controller.js    ← Added updateRoom, deleteRoom
    └── room.routes.js        ← Added PATCH/:id and DELETE/:id routes
```

## ⚠️ Important Notes

### Cascade Behavior
- **Category Deletion**: Prevents deletion if items exist
  - Must delete all items first
  - Error: "Cannot delete category. It has X item(s)"

- **Room Deletion**: Direct deletion (future: check for open orders first)

### Property Auto-Assignment
For non-super_admin users:
- `propertyId` is automatically set from `req.user.propertyId`
- Cannot be overridden via request body
- Ensures multi-tenant isolation

### Allowed Update Fields
Only whitelisted fields can be updated to prevent unauthorized changes:
- **Menu Items**: name, description, price, categoryId, isAvailable, image
- **Rooms**: roomNumber, type, floor, status, capacity, description

## 🔄 Next Integration Steps

### Connect Frontend to Backend
The frontend API functions already exist and are ready to use in your admin pages:
1. Menu page (`/admin/menu`) - Use CRUD functions to manage categories/items
2. Rooms page (`/admin/rooms`) - Use CRUD functions to manage rooms

### Add Socket.io Events
Extend Socket.io to broadcast changes:
```javascript
// In controllers after successful operations:
const io = req.app.locals.io;

// Menu events
io.emit('menu:itemCreated', item);
io.emit('menu:itemUpdated', item);
io.emit('menu:itemDeleted', { itemId });

// Room events
io.emit('room:created', room);
io.emit('room:updated', room);
io.emit('room:deleted', { roomId });
```

## 📊 Database Impact
- **No schema changes** - All endpoints use existing models
- **Audit trail** - All operations logged for compliance
- **Referential integrity** - Category deletion checks for items

---

**Status:** ✅ Backend Complete - Ready for Frontend Integration  
**Frontend Integration:** Ready - All API calls already exist  
**Next Step:** Implement UI in Menu and Rooms admin pages
