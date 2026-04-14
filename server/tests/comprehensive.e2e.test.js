import request from "supertest";
import app from "../src/app.js";
import User from "../src/modules/users/user.model.js";
import Property from "../src/modules/properties/property.model.js";
import MenuCategory from "../src/modules/menu/category.model.js";
import MenuItem from "../src/modules/menu/item.model.js";
import Room from "../src/modules/rooms/room.model.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { signToken } from "../src/utils/jwt.js";

let propertyAdminToken;
let propertyAdminUser;
let testProperty;

// Sample base64 encoded image for testing
const sampleImageBase64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

describe("Comprehensive E2E Tests - Rooms & Menu Management", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Create test property
    testProperty = await Property.create({
      name: "Test Hotel",
      address: "123 Main St",
      phone: "+1234567890",
    });

    // Create property_admin user
    propertyAdminUser = await User.create({
      name: "Property Manager",
      email: "manager@test.com",
      password: "Test1234!",
      role: "property_admin",
      propertyId: testProperty._id,
    });

    propertyAdminToken = signToken({
      id: propertyAdminUser._id,
      role: propertyAdminUser.role,
      propertyId: testProperty._id,
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  // ===== ROOM MANAGEMENT TESTS =====
  describe("Room Management Tests", () => {
    it("should create a new room successfully", async () => {
      const res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
          status: "available",
          description: "Standard double room",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roomNumber).toBe("101");
      expect(res.body.data.propertyId.toString()).toBe(
        testProperty._id.toString(),
      );
      expect(res.body.data.qrCodeUrl).toBeDefined();
    });

    it("should not allow duplicate room numbers in same property", async () => {
      // Create first room
      await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
          status: "available",
        });

      // Try to create duplicate
      const res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
          status: "available",
        });

      expect(res.status).toBe(400);
    });

    it("should create multiple rooms with different room numbers", async () => {
      const rooms = [
        { roomNumber: "101", type: "Standard", floor: 1, capacity: 2 },
        { roomNumber: "102", type: "Deluxe", floor: 1, capacity: 3 },
        { roomNumber: "201", type: "Suite", floor: 2, capacity: 4 },
      ];

      for (const roomData of rooms) {
        const res = await request(app)
          .post("/api/v1/rooms")
          .set("Authorization", `Bearer ${propertyAdminToken}`)
          .send(roomData);

        expect(res.status).toBe(201);
        expect(res.body.data.roomNumber).toBe(roomData.roomNumber);
      }

      // Verify all rooms were created
      const getRoomsRes = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(getRoomsRes.body.data.length).toBe(3);
    });

    it("should fetch all rooms for property admin", async () => {
      // Create multiple rooms
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post("/api/v1/rooms")
          .set("Authorization", `Bearer ${propertyAdminToken}`)
          .send({
            roomNumber: String(100 + i),
            type: "Standard",
            floor: i,
            capacity: 2,
          });
      }

      const res = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data.length).toBe(3);
    });

    it("should update room details", async () => {
      const createRes = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
          status: "available",
        });

      const roomId = createRes.body.data._id;

      const updateRes = await request(app)
        .patch(`/api/v1/rooms/${roomId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          type: "Deluxe",
          capacity: 3,
          status: "maintenance",
          description: "Updated description",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.type).toBe("Deluxe");
      expect(updateRes.body.data.capacity).toBe(3);
      expect(updateRes.body.data.status).toBe("maintenance");
      expect(updateRes.body.data.description).toBe("Updated description");
    });

    it("should delete room successfully", async () => {
      const createRes = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
        });

      const roomId = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/rooms/${roomId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify room is deleted
      const getRoomsRes = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(getRoomsRes.body.count).toBe(0);
    });
  });

  // ===== MENU MANAGEMENT TESTS =====
  describe("Menu Management Tests", () => {
    // --- CATEGORY CREATION ---
    it("should create a menu category", async () => {
      const res = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Appetizers",
          description: "Starters and appetizers",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Appetizers");
      expect(res.body.data.propertyId.toString()).toBe(
        testProperty._id.toString(),
      );
    });

    it("should fetch all menu categories", async () => {
      const categories = [
        { name: "Appetizers", description: "Starters" },
        { name: "Main Courses", description: "Entrees" },
        { name: "Desserts", description: "Sweet treats" },
      ];

      for (const cat of categories) {
        await request(app)
          .post("/api/v1/menu/categories")
          .set("Authorization", `Bearer ${propertyAdminToken}`)
          .send(cat);
      }

      const res = await request(app)
        .get("/api/v1/menu/categories")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
    });

    // --- MENU ITEM CREATION WITH IMAGES ---
    it("should create a menu item with image", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          description: "Toasted bread with tomatoes and basil",
          price: 8.99,
          categoryId: category._id,
          imageUrl: sampleImageBase64,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Bruschetta");
      expect(res.body.data.price).toBe(8.99);
      expect(res.body.data.imageUrl).toBe(sampleImageBase64);
      expect(res.body.data.categoryId).toBe(category._id.toString());
    });

    it("should create multiple menu items with different categories", async () => {
      const category1 = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const category2 = await MenuCategory.create({
        name: "Main Courses",
        propertyId: testProperty._id,
      });

      const items = [
        {
          name: "Bruschetta",
          description: "Toasted bread",
          price: 8.99,
          categoryId: category1._id,
          imageUrl: sampleImageBase64,
        },
        {
          name: "Caesar Salad",
          description: "Fresh greens",
          price: 12.99,
          categoryId: category1._id,
          imageUrl: sampleImageBase64,
        },
        {
          name: "Grilled Salmon",
          description: "Fresh salmon with herbs",
          price: 24.99,
          categoryId: category2._id,
          imageUrl: sampleImageBase64,
        },
      ];

      for (const item of items) {
        const res = await request(app)
          .post("/api/v1/menu/items")
          .set("Authorization", `Bearer ${propertyAdminToken}`)
          .send(item);

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe(item.name);
      }

      // Verify all items were created
      const getRes = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(getRes.body.count).toBe(3);
    });

    it("should create category and item together in a workflow", async () => {
      // Step 1: Create category
      const categoryRes = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Beverages",
          description: "Drinks and beverages",
        });

      expect(categoryRes.status).toBe(201);
      const categoryId = categoryRes.body.data._id;

      // Step 2: Create item under that category
      const itemRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Orange Juice",
          description: "Fresh squeezed orange juice",
          price: 5.99,
          categoryId: categoryId,
          imageUrl: sampleImageBase64,
        });

      expect(itemRes.status).toBe(201);
      expect(itemRes.body.data.categoryId).toBe(categoryId.toString());
    });

    // --- FETCHING MENU ITEMS ---
    it("should fetch all existing menu items", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const itemsData = [
        {
          name: "Bruschetta",
          description: "Toasted bread",
          price: 8.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
        },
        {
          name: "Calamari",
          description: "Fried squid",
          price: 12.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
        },
        {
          name: "Mozzarella Sticks",
          description: "Fried cheese",
          price: 9.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
        },
      ];

      // Create items directly in DB
      for (const itemData of itemsData) {
        await MenuItem.create(itemData);
      }

      // Fetch them via API
      const res = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data).toHaveLength(3);

      // Verify items have correct properties
      res.body.data.forEach((item) => {
        expect(item.name).toBeDefined();
        expect(item.price).toBeDefined();
        expect(item.imageUrl).toBeDefined();
        expect(item.categoryId).toBeDefined();
      });
    });

    it("should fetch menu items with category details populated", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        description: "Starters",
        propertyId: testProperty._id,
      });

      await MenuItem.create({
        name: "Bruschetta",
        price: 8.99,
        categoryId: category._id,
        propertyId: testProperty._id,
        imageUrl: sampleImageBase64,
      });

      const res = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data[0].categoryId).toHaveProperty("name");
      expect(res.body.data[0].categoryId.name).toBe("Appetizers");
    });

    // --- EDITING MENU ITEMS ---
    it("should update menu item with new image", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          description: "Toasted bread",
          price: 8.99,
          categoryId: category._id,
          imageUrl: sampleImageBase64,
        });

      const itemId = createRes.body.data._id;
      const newImageUrl = sampleImageBase64;

      const updateRes = await request(app)
        .patch(`/api/v1/menu/items/${itemId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta al Pomodoro",
          description: "Toasted bread with fresh tomatoes",
          price: 9.99,
          imageUrl: newImageUrl,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe("Bruschetta al Pomodoro");
      expect(updateRes.body.data.price).toBe(9.99);
      expect(updateRes.body.data.imageUrl).toBe(newImageUrl);
    });

    it("should update menu item price", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category._id,
        });

      const itemId = createRes.body.data._id;

      const updateRes = await request(app)
        .patch(`/api/v1/menu/items/${itemId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({ price: 12.99 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.price).toBe(12.99);
    });

    it("should change item category", async () => {
      const category1 = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const category2 = await MenuCategory.create({
        name: "Main Courses",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category1._id,
        });

      const itemId = createRes.body.data._id;

      const updateRes = await request(app)
        .patch(`/api/v1/menu/items/${itemId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({ categoryId: category2._id });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.categoryId.toString()).toBe(
        category2._id.toString(),
      );
    });

    it("should update item availability status", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category._id,
          isAvailable: true,
        });

      const itemId = createRes.body.data._id;

      const updateRes = await request(app)
        .patch(`/api/v1/menu/items/${itemId}/availability`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({ isAvailable: false });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.isAvailable).toBe(false);
    });

    // --- DELETING MENU ITEMS ---
    it("should delete menu item successfully", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category._id,
        });

      const itemId = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/menu/items/${itemId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify item is deleted
      const getRes = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(getRes.body.count).toBe(0);
    });

    it("should delete multiple menu items", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const items = [];
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post("/api/v1/menu/items")
          .set("Authorization", `Bearer ${propertyAdminToken}`)
          .send({
            name: `Item ${i + 1}`,
            price: 8.99 + i,
            categoryId: category._id,
          });
        items.push(res.body.data._id);
      }

      // Delete them one by one
      for (const itemId of items) {
        const deleteRes = await request(app)
          .delete(`/api/v1/menu/items/${itemId}`)
          .set("Authorization", `Bearer ${propertyAdminToken}`);

        expect(deleteRes.status).toBe(200);
      }

      // Verify all items are deleted
      const getRes = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(getRes.body.count).toBe(0);
    });

    it("should prevent deleting category with items", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category._id,
        });

      const deleteRes = await request(app)
        .delete(`/api/v1/menu/categories/${category._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.error).toContain("Cannot delete category");
    });

    it("should delete category after deleting all items", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      const createRes = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          price: 8.99,
          categoryId: category._id,
        });

      const itemId = createRes.body.data._id;

      // Delete item first
      await request(app)
        .delete(`/api/v1/menu/items/${itemId}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      // Now delete category
      const deleteRes = await request(app)
        .delete(`/api/v1/menu/categories/${category._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });

  // ===== GUEST USER MENU FETCHING TESTS =====
  describe("Guest User Menu Access Tests", () => {
    it("should allow guest to fetch menu items without authentication", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      await MenuItem.create({
        name: "Bruschetta",
        price: 8.99,
        categoryId: category._id,
        propertyId: testProperty._id,
        imageUrl: sampleImageBase64,
      });

      const res = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });

    it("should allow guest to fetch all categories without authentication", async () => {
      await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      await MenuCategory.create({
        name: "Main Courses",
        propertyId: testProperty._id,
      });

      const res = await request(app)
        .get("/api/v1/menu/categories")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });

    it("should properly render all menu items with images for customer redirect", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        description: "Starters",
        propertyId: testProperty._id,
      });

      const itemsData = [
        {
          name: "Bruschetta",
          description: "Toasted bread with tomatoes",
          price: 8.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
          isAvailable: true,
        },
        {
          name: "Calamari",
          description: "Fried squid",
          price: 12.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
          isAvailable: true,
        },
        {
          name: "Mozzarella Sticks",
          description: "Fried mozzarella cheese",
          price: 9.99,
          categoryId: category._id,
          propertyId: testProperty._id,
          imageUrl: sampleImageBase64,
          isAvailable: false,
        },
      ];

      for (const item of itemsData) {
        await MenuItem.create(item);
      }

      // Guest fetches menu
      const res = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(3);

      // Verify all items are properly rendered with complete data
      const items = res.body.data;
      items.forEach((item) => {
        expect(item._id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.price).toBeDefined();
        expect(item.imageUrl).toBe(sampleImageBase64);
        expect(item.isAvailable).toBeDefined();
        expect(item.categoryId).toBeDefined();
        expect(item.categoryId.name).toBe("Appetizers");
      });
    });

    it("should render only available items when needed", async () => {
      const category = await MenuCategory.create({
        name: "Appetizers",
        propertyId: testProperty._id,
      });

      await MenuItem.create({
        name: "Available Item",
        price: 8.99,
        categoryId: category._id,
        propertyId: testProperty._id,
        isAvailable: true,
      });

      await MenuItem.create({
        name: "Unavailable Item",
        price: 12.99,
        categoryId: category._id,
        propertyId: testProperty._id,
        isAvailable: false,
      });

      const res = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(res.body.count).toBe(2);
      const availableItems = res.body.data.filter((item) => item.isAvailable);
      expect(availableItems.length).toBe(1);
      expect(availableItems[0].name).toBe("Available Item");
    });
  });

  // ===== COMPLETE WORKFLOW TEST =====
  describe("Complete Workflow Integration Tests", () => {
    it("should execute complete menu setup workflow", async () => {
      // Step 1: Create categories
      const appetizersRes = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Appetizers",
          description: "Starters",
        });

      const mainRes = await request(app)
        .post("/api/v1/menu/categories")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Main Courses",
          description: "Entrees",
        });

      // Step 2: Create menu items with images
      const item1Res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Bruschetta",
          description: "Toasted bread",
          price: 8.99,
          categoryId: appetizersRes.body.data._id,
          imageUrl: sampleImageBase64,
        });

      const item2Res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Caesar Salad",
          description: "Fresh greens",
          price: 12.99,
          categoryId: appetizersRes.body.data._id,
          imageUrl: sampleImageBase64,
        });

      const item3Res = await request(app)
        .post("/api/v1/menu/items")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          name: "Grilled Salmon",
          description: "Fresh salmon",
          price: 24.99,
          categoryId: mainRes.body.data._id,
          imageUrl: sampleImageBase64,
        });

      // Step 3: Guest access menu
      const guestFetchRes = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(guestFetchRes.body.count).toBe(3);
      expect(guestFetchRes.body.data).toHaveLength(3);

      // Step 4: Update item
      const updateRes = await request(app)
        .patch(`/api/v1/menu/items/${item1Res.body.data._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          price: 9.99,
          isAvailable: false,
        });

      expect(updateRes.body.data.price).toBe(9.99);
      expect(updateRes.body.data.isAvailable).toBe(false);

      // Step 5: Delete one item
      await request(app)
        .delete(`/api/v1/menu/items/${item2Res.body.data._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      // Step 6: Verify final state
      const finalFetchRes = await request(app)
        .get("/api/v1/menu/items")
        .query({ propertyId: testProperty._id.toString() });

      expect(finalFetchRes.body.count).toBe(2);
    });

    it("should execute complete room setup workflow", async () => {
      // Create multiple rooms
      const room1Res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "101",
          type: "Standard",
          floor: 1,
          capacity: 2,
          status: "available",
        });

      const room2Res = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({
          roomNumber: "102",
          type: "Deluxe",
          floor: 1,
          capacity: 3,
          status: "available",
        });

      // Fetch all rooms
      const getRoomsRes = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(getRoomsRes.body.count).toBe(2);

      // Update room status
      const updateRes = await request(app)
        .patch(`/api/v1/rooms/${room1Res.body.data._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`)
        .send({ status: "occupied" });

      expect(updateRes.body.data.status).toBe("occupied");

      // Delete one room
      await request(app)
        .delete(`/api/v1/rooms/${room2Res.body.data._id}`)
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      // Verify final state
      const finalRes = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${propertyAdminToken}`);

      expect(finalRes.body.count).toBe(1);
    });
  });
});
