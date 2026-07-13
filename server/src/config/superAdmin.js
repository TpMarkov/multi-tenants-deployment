// Single source of truth for the Super Admin credentials used by both
// `server/seed.js` (fresh wipe + reseed) and `server/src/config/ensureDemoData.js`
// (self-heal on backend startup). Keep these two in sync by editing ONLY here.
const SUPER_ADMIN = {
  name: "New Super Admin",
  email: "superadmin@hospitalityos.com",
  password: "TestAdmin2026!",
  role: "super_admin",
};

export default SUPER_ADMIN;
