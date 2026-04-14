import express from "express";
import {
  validateQRSession,
  getRoomByNumber,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  regenerateAccessToken,
} from "./room.controller.js";
import { protect, authorize } from "../../middlewares/auth.js";

const router = express.Router();

// Public routes - must be before the /:id route to prevent conflicts

// Validate QR code session - returns room, roomNumber, and propertyId without exposing them in URL
router.get("/validate-qr/:sessionToken", validateQRSession);

// Get room by number for guest checkout (legacy, kept for compatibility)
router.get("/by-number/:roomNumber", getRoomByNumber);

router.use(protect);

router
  .route("/")
  .get(getRooms)
  .post(authorize("super_admin", "property_admin"), createRoom);

router.patch(
  "/:id/regenerate-token",
  authorize("super_admin", "property_admin"),
  regenerateAccessToken,
);

router
  .route("/:id")
  .patch(authorize("super_admin", "property_admin"), updateRoom)
  .delete(authorize("super_admin", "property_admin"), deleteRoom);

export default router;
