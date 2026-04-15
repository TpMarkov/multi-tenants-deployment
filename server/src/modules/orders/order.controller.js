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

// @desc    Get all orders with filtering
// @route   GET /api/v1/orders
// @access  Private/Admin/Staff
export const getOrders = asyncHandler(async (req, res, next) => {
  let propertyId;
  const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

  // Super admin can see all properties, others only their property
  if (req.user.role === "super_admin") {
    propertyId = req.query.propertyId;
  } else {
    propertyId = req.user.propertyId;
  }

  if (!propertyId && req.user.role !== "super_admin") {
    return res.status(400).json({ success: false, error: "Property ID is required" });
  }

  // Build query
  const query = {};
  
  // For super admin without propertyId, don't filter by property (show all)
  if (propertyId) {
    query.propertyId = propertyId;
  }
  
  // Filter by status
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      // Start of day
      query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      // End of day (include the entire day)
      query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const orders = await Order.find(query)
    .populate("roomId", "roomNumber")
    .populate("propertyId", "name")
    .sort("-createdAt")
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
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

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/SuperAdmin
export const deleteOrder = asyncHandler(async (req, res, next) => {
  // Only super admin can delete orders
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ success: false, error: "Only super admin can delete orders" });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  await Order.findByIdAndDelete(req.params.id);

  await logAudit('ORDER_DELETED', req.user._id, order.propertyId, {
    orderId: order._id,
    roomId: order.roomId,
  });

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// @desc    Get order analytics
// @route   GET /api/v1/orders/analytics
// @access  Private/Admin
export const getOrderAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, propertyId } = req.query;
  
  console.log("📊 [Analytics] Query params:", { startDate, endDate, propertyId });
  console.log("📊 [Analytics] User role:", req.user.role);
  console.log("📊 [Analytics] User propertyId:", req.user.propertyId);
  
  // Build base query - allow empty query for super admin to get all orders
  const query = {};

  if (req.user.role !== "super_admin") {
    // Non-super admins can only see their property's orders
    if (req.user.propertyId) {
      query.propertyId = new mongoose.Types.ObjectId(req.user.propertyId);
    }
  } else if (propertyId && propertyId !== '') {
    // Super admin with specific property
    query.propertyId = new mongoose.Types.ObjectId(propertyId);
  }
  // For super admin with no propertyId, query remains empty (all properties)
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
    if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }
  
  console.log("📊 [Analytics] Final query:", JSON.stringify(query));

  // Revenue analytics
  const revenueByDate = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  console.log("📊 [Analytics] Revenue by date:", revenueByDate);

  // Status breakdown
  const statusBreakdown = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  console.log("📊 [Analytics] Status breakdown:", statusBreakdown);

  // Peak hours
  const peakHours = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  console.log("📊 [Analytics] Peak hours:", peakHours);

  // Top selling items
  const topItems = await Order.aggregate([
    { $match: query },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);
  console.log("📊 [Analytics] Top items:", topItems);

  // Summary stats
  const summary = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" }
      }
    }
  ]);
  console.log("📊 [Analytics] Summary:", summary);

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayQuery = { ...query, createdAt: { $gte: today } };
  
  const todayStats = await Order.aggregate([
    { $match: todayQuery },
    {
      $group: {
        _id: null,
        todayRevenue: { $sum: "$totalAmount" },
        todayOrders: { $sum: 1 }
      }
    }
  ]);
  console.log("📊 [Analytics] Today stats:", todayStats);

  // Yesterday's stats for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayQuery = { ...query, createdAt: { $gte: yesterday, $lt: today } };
  
  const yesterdayStats = await Order.aggregate([
    { $match: yesterdayQuery },
    {
      $group: {
        _id: null,
        yesterdayRevenue: { $sum: "$totalAmount" },
        yesterdayOrders: { $sum: 1 }
      }
    }
  ]);
  console.log("📊 [Analytics] Yesterday stats:", yesterdayStats);

  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
      todayStats: todayStats[0] || { todayRevenue: 0, todayOrders: 0 },
      yesterdayStats: yesterdayStats[0] || { yesterdayRevenue: 0, yesterdayOrders: 0 },
      revenueByDate,
      statusBreakdown,
      peakHours,
      topItems
    }
  });
});
