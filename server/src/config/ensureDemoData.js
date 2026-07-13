import User from "../modules/users/user.model.js";
import SUPER_ADMIN from "./superAdmin.js";

// Super admin credentials come from ./superAdmin.js (single source of truth,
// Runs on startup so the configured credentials always work after a
// deployment without needing a manual `npm run seed` (which wipes data).
export const ensureDemoData = async () => {
  try {
    const existing = await User.findOne({ email: SUPER_ADMIN.email }).select("+password");

    if (!existing) {
      await User.create({
        name: SUPER_ADMIN.name,
        email: SUPER_ADMIN.email,
        password: SUPER_ADMIN.password,
        role: SUPER_ADMIN.role,
      });
      console.log(`✓ Created Super Admin: ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}`);
    } else {
      // Self-heal: if the stored password doesn't match the expected password
      // (e.g. a corrupted/changed hash), reset it.
      const matches = await existing.matchPassword(SUPER_ADMIN.password);
      if (!matches) {
        existing.password = SUPER_ADMIN.password;
        await existing.save();
        console.log(`✓ Reset password for: ${SUPER_ADMIN.email}`);
      } else {
        console.log(`• Super Admin already exists: ${SUPER_ADMIN.email}`);
      }
    }

    console.log("✓ Super admin provisioned.");
  } catch (error) {
    console.error("Error ensuring super admin:", error.message);
  }
};

export default ensureDemoData;
