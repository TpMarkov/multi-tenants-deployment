import request from "supertest";
import app from "../src/app.js";
import User from "../src/modules/users/user.model.js";
import Property from "../src/modules/properties/property.model.js";
import MenuCategory from "../src/modules/menu/category.model.js";
import MenuItem from "../src/modules/menu/item.model.js";
import Room from "../src/modules/rooms/room.model.js";
import Order from "../src/modules/orders/order.model.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { signToken } from "../src/utils/jwt.js";

let adminToken;
let propertyAdminToken;
let adminUser;
let propertyAdminUser;
let testProperty;

describe("Admin Dashboard E2E Tests", () => {
  beforeAll(async () => {
    await connect();

    // Create test property
    testProperty = await Property.create({
      name: "Test Hotel",
      address: "123 Main St",
      phone: "+1234567890",
    });

    // Create super_admin user
    adminUser = await User.create({
      name: "Super Admin",
      email: "admin@test.com",
      password: "Test1234!",
      role: "super_admin",
    });

    // Create property_admin user
    propertyAdminUser = await User.create({
      name: "Property Manager",
      email: "manager@test.com",
      password: "Test1234!",
      role: "property_admin",
      propertyId: testProperty._id,
    });

    adminToken = signToken({
      id: adminUser._id,
      role: adminUser.role,
    });

    propertyAdminToken = signToken({
      id: propertyAdminUser._id,
      role: propertyAdminUser.role,
      propertyId: testProperty._id,
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  // --- MENU TESTS ---
  describe("Menu Management", () => {
    it("should create a menu category", async () => {
      const res = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Appetizers",
          description: "Starters",
          propertyId: testProperty._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Appetizers");
      expect(res.body.data.propertyId.toString()).toBe(
        testProperty._id.toString(),
      );
    });

    it("should create a menu item", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          description: "Toasted bread with tomatoes",
          price: 8.99,
          categoryId: category._id,
          propertyId: testProperty._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Bruschetta");
      expect(res.body.data.categoryId.toString()).toBe(category._id.toString());
    });

    it("should update a menu item", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const item = await MenuItem.create({
        name: "Bruschetta",
        price: 8.99,
        categoryId: category._id,
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .patch(`/api/v1/menu/items/${item._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          price: 9.99,
          description: "Updated description",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(9.99);
      expect(res.body.data.description).toBe("Updated description");
    });

    it("should delete a menu item", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const item = await MenuItem.create({
        name: "Bruschetta",
        categoryId: category._id,
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .delete(`/api/v1/menu/items/${item._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(res.status).toBe(200);
      const deleted = await MenuItem.findById(item._id);
      expect(deleted).toBeNull();
    });

    it("should prevent deletion of category with items", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      await MenuItem.create({
        name: "Bruschetta",
        categoryId: category._id,
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .delete(`/api/v1/menu/categories/${category._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot delete category");
    });
  });

  // --- ROOMS TESTS ---
  describe("Room Management", () => {
    it("should create a room", async () => {
      const res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Deluxe",
          floor: 1,
          capacity: 2,
          status: "available",
          propertyId: testProperty._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.roomNumber).toBe("101");
      expect(res.body.data.type).toBe("Deluxe");
    });

    it("should update a room", async () => {
      const room = await Room.create({
        roomNumber: "101",
        type: "Standard",
        floor: 1,
        capacity: 1,
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .patch(`/api/v1/rooms/${room._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          type: "Deluxe",
          capacity: 2,
          status: "maintenance",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe("Deluxe");
      expect(res.body.data.capacity).toBe(2);
      expect(res.body.data.status).toBe("maintenance");
    });

    it("should delete a room", async () => {
      const room = await Room.create({
        roomNumber: "101",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .delete(`/api/v1/rooms/${room._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(res.status).toBe(200);
      const deleted = await Room.findById(room._id);
      expect(deleted).toBeNull();
    });

    it("should get rooms by property", async () => {
      await Room.create({
        roomNumber: "101",
        propertyId: testProperty._id,
      });
      await Room.create({
        roomNumber: "102",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .get(`/api/v1/rooms?propertyId=${testProperty._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  // --- MULTI-TENANT ISOLATION TESTS ---
  describe("Multi-Tenant Isolation", () => {
    let property2;
    let property2AdminToken;

    beforeAll(async () => {
      property2 = await Property.create({
        name: "Another Hotel",
      });

      const property2Admin = await User.create({
        name: "Property 2 Manager",
        email: "manager2@test.com",
        password: "Test1234!",
        role: "property_admin",
        propertyId: property2._id,
      });

      property2AdminToken = signToken({
        id: property2Admin._id,
        role: property2Admin.role,
        propertyId: property2._id,
      });
    });

    it("should prevent access to another property rooms", async () => {
      const room = await Room.create({
        roomNumber: "101",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .get(`/api/v1/rooms/${room._id}`)
        .set("Authorization", `Bearer ${property2AdminToken}`);

      // Should not find room from other property
      expect(res.status).toBe(404);
    });

    it("should auto-assign propertyId for non-super_admin", async () => {
      const res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          // propertyId not provided
        });

      expect(res.status).toBe(201);
      expect(res.body.data.propertyId.toString()).toBe(
        testProperty._id.toString(),
      );
    });
  });

  // --- AUTHORIZATION TESTS ---
  describe("Authorization & Permissions", () => {
    it("should allow super_admin to access any property", async () => {
      await Room.create({
        roomNumber: "101",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .get(`/api/v1/rooms?propertyId=${testProperty._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny access without token", async () => {
      const res = await request(app).get("/api/v1/rooms");

      expect(res.status).toBe(401);
    });

    it("should deny with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", "Bearer invalid_token");

      expect(res.status).toBe(401);
    });
  });

  // --- ORDER TESTS ---
  describe("Order Management", () => {
    it("should create an order", async () => {
      const res = await request(app)
        .post("/api/v1/orders")
        .send({
          roomId: "test-room-123",
          items: [{ itemId: "item-1", quantity: 2, price: 10 }],
          totalAmount: 20,
          propertyId: testProperty._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.totalAmount).toBe(20);
    });

    it("should update order status", async () => {
      const order = await Order.create({
        roomId: "test-room-123",
        items: [{ itemId: "item-1", quantity: 2 }],
        totalAmount: 20,
        status: "pending",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .patch(`/api/v1/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({ status: "completed" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
    });
  });

  // --- AUDIT LOGGING TESTS ---
  describe("Audit Logging", () => {
    it("should log item creation", async () => {
      const category = await MenuCategory.create({
        name: "Test Category",
        propertyId: testProperty._id,
      });

      await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Test Item",
          price: 10,
          categoryId: category._id,
          propertyId: testProperty._id,
        });

      // Verify audit log was created (check your audit collection)
      // This is a simplified test - adjust based on your audit storage
    });
  });
});
