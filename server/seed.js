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

    await Promise.all([
      Property.deleteMany(),
      Room.deleteMany(),
      MenuCategory.deleteMany(),
      MenuItem.deleteMany(),
      User.deleteMany(),
    ]);

    console.log("Cleared existing data.");

    const property = await Property.create({
      name: "WebDev Studio Client",
      address: "1 Developer Lane, Tech City, TC 90210",
    });
    console.log(`Created Property: ${property.name} (${property._id})`);

    const superAdmin = await User.create({
      name: "Super Admin",
      email: "admin@webdevstudiohq.com",
      password: "HospitalityOS2026!",
      role: "super_admin",
      propertyId: property._id,
    });
    console.log(`Created Super Admin: ${superAdmin.email} / HospitalityOS2026!`);

    const propertyAdmin = await User.create({
      name: "Property Admin",
      email: "manager@webdevstudiohq.com",
      password: "ManagerOS2026!",
      role: "property_admin",
      propertyId: property._id,
    });
    console.log(`Created Property Admin: ${propertyAdmin.email} / ManagerOS2026!`);

    console.log("\n--- DATA SEEDED SUCCESSFULLY ---");
    console.log("Property ID:", property._id);
    console.log("---------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
