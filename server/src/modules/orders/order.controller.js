import asyncHandler from "../../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import Order from "./order.model.js";
import MenuItem from "../menu/item.model.js";
import Room from "../rooms/room.model.js";
import { logAudit } from "../../utils/auditLogger.js";

// @desc    Create order (Public)
// @route   POST /api/v1/orders
// @access  Public
export const createOrder = asyncHandler(async (req, res, next) => {
  const { propertyId, roomId, items, specialInstructions } = req.body;

  console.log('📦 [Create Order] Received request body:', JSON.stringify(req.body, null, 2));
  console.log('🏢 [Create Order] Property ID:', propertyId, 'Type:', typeof propertyId);
  console.log('🚪 [Create Order] Room ID:', roomId, 'Type:', typeof roomId);
  console.log('📝 [Create Order] Items:', items);

  // Validate required fields
  if (!propertyId) {
    console.error('❌ [Create Order] Missing propertyId');
    return res.status(400).json({ success: false, error: 'Property ID is required' });
  }
  if (!roomId) {
    console.error('❌ [Create Order] Missing roomId');
    return res.status(400).json({ success: false, error: 'Room ID is required' });
  }
  if (!items || items.length === 0) {
    console.error('❌ [Create Order] Missing or empty items');
    return res.status(400).json({ success: false, error: 'No items in order' });
  }

  // Validate ObjectIds
  const isValidPropertyId = mongoose.Types.ObjectId.isValid(propertyId);
  console.log('✓ [Create Order] Property ID valid:', isValidPropertyId);
  if (!isValidPropertyId) {
    console.error('❌ [Create Order] Invalid propertyId format');
    return res.status(400).json({ success: false, error: 'Invalid Property ID' });
  }

  const isValidRoomId = mongoose.Types.ObjectId.isValid(roomId);
  console.log('✓ [Create Order] Room ID valid:', isValidRoomId);
  if (!isValidRoomId) {
    console.error('❌ [Create Order] Invalid roomId format');
    return res.status(400).json({ success: false, error: 'Invalid Room ID' });
  }

  // Validate room exists and belongs to property
  console.log('🔍 [Create Order] Looking for room with _id:', roomId, 'propertyId:', propertyId);
  const room = await Room.findOne({ _id: roomId, propertyId });
  console.log('🔍 [Create Order] Room found:', room ? 'Yes' : 'No', room ? `(${room.roomNumber})` : '');
  if (!room) {
    console.error('❌ [Create Order] Room not found or does not belong to property');
    return res.status(400).json({ success: false, error: 'Room not found or does not belong to this property' });
  }

  // Validate items and calculate total on backend
  let totalAmount = 0;
  const validatedItems = [];

  for (const item of items) {
    console.log('🔍 [Create Order] Processing item - menuItemId:', item.menuItemId, 'quantity:', item.quantity);
    const menuItem = await MenuItem.findById(item.menuItemId);

    if (!menuItem) {
      console.error('❌ [Create Order] Menu item not found:', item.menuItemId);
      return res
        .status(404)
        .json({
          success: false,
          error: `Menu item ${item.menuItemId} not found`,
        });
    }

    console.log('✓ [Create Order] Menu item found:', menuItem.name, 'Available:', menuItem.isAvailable);

    if (!menuItem.isAvailable) {
      console.error('❌ [Create Order] Menu item unavailable:', menuItem.name);
      return res
        .status(400)
        .json({
          success: false,
          error: `Item ${menuItem.name} is currently unavailable`,
        });
    }

    // Ensure item belongs to the same property
    const itemPropertyId = menuItem.propertyId.toString();
    const requestPropertyId = propertyId.toString();
    console.log('✓ [Create Order] Item property check - itemProp:', itemPropertyId, 'requestProp:', requestPropertyId, 'Match:', itemPropertyId === requestPropertyId);

    if (itemPropertyId !== requestPropertyId) {
      console.error('❌ [Create Order] Item belongs to different property');
      return res
        .status(400)
        .json({
          success: false,
          error: `Item ${menuItem.name} does not belong to this property`,
        });
    }

    const price = menuItem.price;
    const quantity = item.quantity || 1;
    totalAmount += price * quantity;

    validatedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity,
      price,
    });

    console.log('✓ [Create Order] Item validated:', menuItem.name, '- Qty:', quantity, 'Price:', price);
  }

  console.log('💰 [Create Order] Total amount:', totalAmount);

  const order = await Order.create({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    roomId: new mongoose.Types.ObjectId(roomId),
    items: validatedItems,
    totalAmount,
    specialInstructions,
  });

  console.log('✅ [Create Order] Order created:', order._id);

  const io = req.app.locals.io;
  if (io) {
    const populatedOrder = await Order.findById(order._id).populate(
      "roomId",
      "roomNumber",
    );
    console.log('📡 [Create Order] Emitting new_order event');
    io.emit("new_order", populatedOrder);
  }

  res.status(201).json({
    success: true,
    data: order,
  });
});

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin/Staff
export const getOrders = asyncHandler(async (req, res, next) => {
  let propertyId;

  if (req.user.role === "super_admin") {
    propertyId = req.query.propertyId;
  } else {
    propertyId = req.user.propertyId;
  }

  if (!propertyId) {
    return res
      .status(400)
      .json({ success: false, error: "Property ID is required" });
  }

  const orders = await Order.find({ propertyId })
    .populate("roomId", "roomNumber")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Update order status
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Staff
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  let order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    order.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  order.status = status;
  await order.save();

  // Log Audit
  await logAudit("ORDER_STATUS_UPDATED", req.user._id, order.propertyId, {
    orderId: order._id,
    status,
  });

  const io = req.app.locals.io;
  if (io) {
    io.emit("order_updated", { orderId: order._id, status });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});
