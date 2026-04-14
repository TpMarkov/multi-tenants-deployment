import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  updateItemAvailability,
} from "./menu.controller.js";
import { protect, authorize } from "../../middlewares/auth.js";

const router = express.Router();

// Categories
router.get("/categories", getCategories);
router.post(
  "/categories",
  protect,
  authorize("super_admin", "property_admin"),
  createCategory,
);
router.delete(
  "/categories/:id",
  protect,
  authorize("super_admin", "property_admin"),
  deleteCategory,
);

// Items
router.get("/items", getItems);
router.post(
  "/items",
  protect,
  authorize("super_admin", "property_admin"),
  createItem,
);
router.patch(
  "/items/:id/availability",
  protect,
  authorize("super_admin", "property_admin", "staff"),
  updateItemAvailability,
);
router.patch(
  "/items/:id",
  protect,
  authorize("super_admin", "property_admin"),
  updateItem,
);
router.delete(
  "/items/:id",
  protect,
  authorize("super_admin", "property_admin"),
  deleteItem,
);

export default router;
