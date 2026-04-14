# Multi-Tenant Hospitality SaaS Backend (QR Dining)

A production-ready Node.js backend for a multi-tenant hospitality platform allowing guests to order room dining via QR codes.

## 🚀 Key Features

- **Multi-Tenancy**: Built-in support for multiple hotels/properties using `propertyId` scoping.
- **Role-Based Access Control (RBAC)**: `super_admin`, `property_admin`, and `staff` roles.
- **QR Dining System**: Public order creation for guests with backend validation.
- **Audit Logging**: Tracking of critical actions (menu changes, order updates, user creation).
- **Security**: JWT authentication, bcrypt hashing, helmet, rate limiting.
- **Production Standards**: Modular architecture, centralized error handling, input validation.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js (ES Modules)
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (JSON Web Tokens)
- **Testing**: Jest & Supertest

## 📁 Folder Structure

```text
/src
  /config       # Database and environment configurations
  /middlewares  # Auth, roles, error handling, async wrappers
  /modules      # Modular logic split by domain
    /audit      # Audit logging logic
    /auth       # Authentication and login
    /users      # User management
    /properties # Hotel/Property management
    /rooms      # Room and QR code management
    /menu       # Categories and Menu Items
    /orders     # Guest and admin order management
  /utils        # Reusable helpers (JWT, response formatter, logger)
  app.js        # Express application setup
  server.js     # Server entry point
```

## ⚙️ Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)

## ⚡ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   Create a `.env` file in the root:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hospitality_saas
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 🔌 API Endpoints (Prefix: /api/v1/)

### Auth
- `POST /auth/login` - Public login

### Users
- `POST /users` - Create user (Super Admin only)
- `GET /users` - List users (Admin only)

### Properties
- `POST /properties` - Create property (Super Admin only)
- `GET /properties` - List properties (Super Admin only)

### Rooms
- `POST /rooms` - Create room (Admin only)
- `GET /rooms?propertyId=` - List rooms

### Menu
- `POST /menu/categories` - Create category (Admin only)
- `GET /menu/categories?propertyId=` - List categories
- `POST /menu/items` - Create item (Admin only)
- `GET /menu/items?propertyId=` - List items
- `PATCH /menu/items/:id/availability` - Toggle availability (Staff+)

### Orders
- `POST /orders` - Create order (Public - Guests)
- `GET /orders?propertyId=` - Admin list orders
- `PATCH /orders/:id/status` - Update status (Staff+)

## 🧪 Testing

The project includes unit/integration tests using Jest and `mongodb-memory-server` to ensure no data leaks during tests.

- `tests/auth.test.js`: Login flow validation.
- `tests/order.test.js`: Order creation and total calculation validation.
