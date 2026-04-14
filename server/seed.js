import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./src/modules/properties/property.model.js";
import Room from "./src/modules/rooms/room.model.js";
import MenuCategory from "./src/modules/menu/category.model.js";
import MenuItem from "./src/modules/menu/item.model.js";
import User from "./src/modules/users/user.model.js";

dotenv.config();

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    // Clear existing data
    await Promise.all([
      Property.deleteMany(),
      Room.deleteMany(),
      MenuCategory.deleteMany(),
      MenuItem.deleteMany(),
      User.deleteMany(),
    ]);

    console.log("Cleared existing data.");

    // 1. Create Property (Our first client - The Hotel)
    const property = await Property.create({
      name: "Grand Antigravity Resort",
      address: "123 Luxury Way, Paradise City",
    });
    console.log(`✓ Created Property: ${property.name} (${property._id})`);

    // 2. Create Admin User
    await User.create({
      name: "Admin User",
      email: "admin@hotel.com",
      password: "password123",
      role: "super_admin",
      propertyId: property._id,
    });
    console.log("✓ Created Admin User: admin@hotel.com / password123");

    console.log("\n--- DATA SEEDED SUCCESSFULLY ---");
    console.log("Property ID (save for later):", property._id);
    console.log("---------------------------------\n");

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
