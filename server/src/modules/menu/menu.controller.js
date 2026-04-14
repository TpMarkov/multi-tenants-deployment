import asyncHandler from "../../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import MenuCategory from "./category.model.js";
import MenuItem from "./item.model.js";
import { logAudit } from "../../utils/auditLogger.js";

// --- Categories ---

// @desc    Get categories
// @route   GET /api/v1/menu/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res, next) => {
  let propertyId;

  if (req.user) {
    if (req.user.role === "super_admin") {
      propertyId = req.query.propertyId;
    } else {
      propertyId = req.user.propertyId;
    }
  } else {
    // Guest user (anonymous access)
    propertyId = req.query.propertyId;
  }

  if (!propertyId) {
    return res
      .status(400)
      .json({ success: false, error: "Property ID is required" });
  }

  // Convert string propertyId to ObjectId if needed
  try {
    if (typeof propertyId === "string") {
      propertyId = new mongoose.Types.ObjectId(propertyId);
    }
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid Property ID format" });
  }

  const categories = await MenuCategory.find({ propertyId });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// @desc    Create category
// @route   POST /api/v1/menu/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "super_admin") {
    req.body.propertyId = req.user.propertyId;
  }

  const category = await MenuCategory.create(req.body);

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("menu:category:created", {
      propertyId: category.propertyId.toString(),
      category: category,
    });
  }

  res.status(201).json({
    success: true,
    data: category,
  });
});

// --- Items ---

// @desc    Get items
// @route   GET /api/v1/menu/items
// @access  Private
export const getItems = asyncHandler(async (req, res, next) => {
  let propertyId;

  if (req.user) {
    if (req.user.role === "super_admin") {
      propertyId = req.query.propertyId;
    } else {
      propertyId = req.user.propertyId;
    }
  } else {
    // Guest user (anonymous access)
    propertyId = req.query.propertyId;
  }

  if (!propertyId) {
    return res
      .status(400)
      .json({ success: false, error: "Property ID is required" });
  }

  // Convert string propertyId to ObjectId if needed
  try {
    if (typeof propertyId === "string") {
      propertyId = new mongoose.Types.ObjectId(propertyId);
    }
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid Property ID format" });
  }

  const items = await MenuItem.find({ propertyId }).populate(
    "categoryId",
    "name",
  );

  res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

// @desc    Create item
// @route   POST /api/v1/menu/items
// @access  Private/Admin
export const createItem = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "super_admin") {
    req.body.propertyId = req.user.propertyId;
  }

  const item = await MenuItem.create(req.body);

  // Log Audit
  await logAudit("MENU_ITEM_CREATED", req.user._id, item.propertyId, {
    itemId: item._id,
    name: item.name,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("menu:item:created", {
      propertyId: item.propertyId.toString(),
      item: item,
    });
  }

  res.status(201).json({
    success: true,
    data: item,
  });
});

// @desc    Update item availability
// @route   PATCH /api/v1/menu/items/:id/availability
// @access  Private/Staff
export const updateItemAvailability = asyncHandler(async (req, res, next) => {
  let item = await MenuItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    item.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  item.isAvailable = req.body.isAvailable;
  await item.save();

  // Log Audit
  await logAudit("MENU_ITEM_UPDATED", req.user._id, item.propertyId, {
    itemId: item._id,
    isAvailable: item.isAvailable,
  });

  res.status(200).json({
    success: true,
    data: item,
  });
});

// @desc    Update item (full update)
// @route   PATCH /api/v1/menu/items/:id
// @access  Private/Admin
export const updateItem = asyncHandler(async (req, res, next) => {
  let item = await MenuItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    item.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  // Update allowed fields
  const allowedFields = [
    "name",
    "description",
    "price",
    "categoryId",
    "isAvailable",
    "imageUrl",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field];
    }
  });

  await item.save();

  // Log Audit
  await logAudit("MENU_ITEM_UPDATED", req.user._id, item.propertyId, {
    itemId: item._id,
    changes: req.body,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("menu:item:updated", {
      propertyId: item.propertyId.toString(),
      item: item,
    });
  }

  res.status(200).json({
    success: true,
    data: item,
  });
});

// @desc    Delete item
// @route   DELETE /api/v1/menu/items/:id
// @access  Private/Admin
export const deleteItem = asyncHandler(async (req, res, next) => {
  const item = await MenuItem.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    item.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  await MenuItem.findByIdAndDelete(req.params.id);

  // Log Audit
  await logAudit("MENU_ITEM_DELETED", req.user._id, item.propertyId, {
    itemId: item._id,
    name: item.name,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("menu:item:deleted", {
      propertyId: item.propertyId.toString(),
      itemId: item._id,
    });
  }

  res.status(200).json({
    success: true,
    data: { message: "Item deleted successfully" },
  });
});

// @desc    Delete category
// @route   DELETE /api/v1/menu/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await MenuCategory.findById(req.params.id);

  if (!category) {
    return res
      .status(404)
      .json({ success: false, error: "Category not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    category.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  // Check if any items belong to this category
  const itemCount = await MenuItem.countDocuments({
    categoryId: req.params.id,
  });
  if (itemCount > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete category. It has ${itemCount} item(s). Delete items first.`,
    });
  }

  await MenuCategory.findByIdAndDelete(req.params.id);

  // Log Audit
  await logAudit("MENU_CATEGORY_DELETED", req.user._id, category.propertyId, {
    categoryId: category._id,
    name: category.name,
  });
  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("menu:category:deleted", {
      propertyId: category.propertyId.toString(),
      categoryId: category._id,
    });
  }
  res.status(200).json({
    success: true,
    data: { message: "Category deleted successfully" },
  });
});
