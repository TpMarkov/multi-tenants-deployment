import Property from "../modules/properties/property.model.js";
import User from "../modules/users/user.model.js";

const DEMO_ADMINS = [
  {
    name: "Admin User",
    email: "admin@hotel.com",
    password: "password123",
    role: "super_admin",
  },
  {
    name: "Admin User 2",
    email: "admin2@hotel.com",
    password: "password123",
    role: "super_admin",
  },
];

// Idempotently ensure the demo property and admin accounts exist.
// This runs on startup so the seeded demo credentials always work after
// a deployment without needing a manual `npm run seed` (which wipes data).
export const ensureDemoData = async () => {
  try {
    let property = await Property.findOne({ name: "Grand Antigravity Resort" });

    if (!property) {
      property = await Property.create({
        name: "Grand Antigravity Resort",
        address: "123 Luxury Way, Paradise City",
      });
      console.log(`✓ Created Property: ${property.name} (${property._id})`);
    }

    for (const admin of DEMO_ADMINS) {
      const existing = await User.findOne({ email: admin.email }).select("+password");

      if (!existing) {
        await User.create({
          name: admin.name,
          email: admin.email,
          password: admin.password,
          role: admin.role,
          propertyId: property._id,
        });
        console.log(`✓ Created Admin User: ${admin.email} / ${admin.password}`);
      } else {
        // Self-heal: if the stored password doesn't match the expected demo
        // password (e.g. a corrupted/changed hash), reset it.
        const matches = await existing.matchPassword(admin.password);
        if (!matches) {
          existing.password = admin.password;
          await existing.save();
          console.log(`✓ Reset password for: ${admin.email}`);
        } else {
          console.log(`• Admin User already exists: ${admin.email}`);
        }
      }
    }

    console.log("✓ Demo data provisioned.");
  } catch (error) {
    console.error("Error ensuring demo data:", error.message);
  }
};

export default ensureDemoData;
