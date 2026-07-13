import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "./src/modules/properties/property.model.js";
import Room from "./src/modules/rooms/room.model.js";
import QrSession from "./src/modules/rooms/qrSession.model.js";
import MenuCategory from "./src/modules/menu/category.model.js";
import MenuItem from "./src/modules/menu/item.model.js";
import User from "./src/modules/users/user.model.js";
import Order from "./src/modules/orders/order.model.js";
import Feedback from "./src/modules/feedback/feedback.model.js";
import Audit from "./src/modules/audit/audit.model.js";
import SUPER_ADMIN from "./src/config/superAdmin.js";

dotenv.config();

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    // 1. Delete EVERY record from the database (all collections)
    console.log("Clearing all collections...");

    // Explicitly clear known collections
    await Promise.all([
      Property.deleteMany(),
      Room.deleteMany(),
      QrSession.deleteMany(),
      MenuCategory.deleteMany(),
      MenuItem.deleteMany(),
      User.deleteMany(),
      Order.deleteMany(),
      Feedback.deleteMany(),
      Audit.deleteMany(),
    ]);

    // Safety net: clear any other collections that exist in the DB
    const collections = await mongoose.connection.db.listCollections().toArray();
    await Promise.all(
      collections.map((c) =>
        mongoose.connection.db.collection(c.name).deleteMany({})
      )
    );

    console.log("Database cleared.");

    // 2. Create a fresh Super Admin with full permissions
    const superAdmin = await User.create({
      ...SUPER_ADMIN,
      permissions: {
        canViewAll: true,
        canManageRooms: true,
        canManageMenu: true,
        canToggleMenuAvailability: true,
        noSettings: false,
      },
    });

    console.log("\n--- DATABASE RESET COMPLETE ---");
    console.log("SUPER ADMIN LOGIN CREDENTIALS:");
    console.log("  Email:   ", superAdmin.email);
    console.log("  Password:", SUPER_ADMIN.password);
    console.log("  Role:    ", superAdmin.role);
    console.log("--------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
