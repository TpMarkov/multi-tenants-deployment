import asyncHandler from "../../middlewares/asyncHandler.js";
import Room from "./room.model.js";
import QRSession from "./qrSession.model.js";
import { logAudit } from "../../utils/auditLogger.js";
import qrcode from "qrcode";
import crypto from "crypto";

// @desc    Get room by room number (Public - for guest checkout)
// @route   GET /api/v1/rooms/by-number/:roomNumber
// @access  Public (requires valid accessToken)
export const getRoomByNumber = asyncHandler(async (req, res, next) => {
  const { roomNumber } = req.params;
  const { propertyId, token } = req.query;

  console.log(
    "🔍 [GetRoomByNumber] Looking for room:",
    roomNumber,
    "propertyId:",
    propertyId,
    "token provided:",
    !!token,
  );

  if (!propertyId) {
    console.error("❌ [GetRoomByNumber] Missing propertyId");
    return res
      .status(400)
      .json({ success: false, error: "Property ID is required" });
  }

  if (!token) {
    console.error("❌ [GetRoomByNumber] Missing access token");
    return res
      .status(401)
      .json({ success: false, error: "Invalid or missing access token" });
  }

  const room = await Room.findOne({ roomNumber, propertyId });

  if (!room) {
    console.error("❌ [GetRoomByNumber] Room not found:", roomNumber);
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  // Validate access token
  if (room.accessToken !== token) {
    console.error("❌ [GetRoomByNumber] Invalid token for room:", roomNumber);
    return res
      .status(403)
      .json({ success: false, error: "Invalid access token" });
  }

  console.log("✅ [GetRoomByNumber] Room found:", room._id, room.roomNumber);

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Validate and get room by QR session token (Public - for guest checkout)
// @route   GET /api/v1/rooms/validate-qr/:sessionToken
// @access  Public (QR session token only)
export const validateQRSession = asyncHandler(async (req, res, next) => {
  const { sessionToken } = req.params;

  console.log(
    "🔍 [ValidateQR] Looking for QR session:",
    sessionToken?.substring(0, 10) + "...",
  );

  if (!sessionToken) {
    console.error("❌ [ValidateQR] Missing session token");
    return res.status(401).json({ success: false, error: "Invalid QR code" });
  }

  // Find QR session
  const qrSession = await QRSession.findOne({
    accessToken: sessionToken,
  }).populate("roomId propertyId");

  if (!qrSession) {
    console.error("❌ [ValidateQR] QR session not found");
    return res
      .status(404)
      .json({ success: false, error: "Invalid or expired QR code" });
  }

  // Check if expired
  if (new Date() > qrSession.expiresAt) {
    console.error("❌ [ValidateQR] QR session expired");
    await QRSession.deleteOne({ _id: qrSession._id });
    return res
      .status(401)
      .json({ success: false, error: "QR code has expired" });
  }

  console.log(
    "✅ [ValidateQR] Valid QR session found for room:",
    qrSession.roomId.roomNumber,
  );

  res.status(200).json({
    success: true,
    data: {
      roomId: qrSession.roomId._id,
      roomNumber: qrSession.roomId.roomNumber,
      propertyId: qrSession.propertyId._id,
    },
  });
});

// @desc    Get rooms
// @route   GET /api/v1/rooms
// @access  Private
export const getRooms = asyncHandler(async (req, res, next) => {
  let query;

  // Multi-tenant check
  if (req.user.role === "super_admin") {
    const propertyId = req.query.propertyId;
    query = propertyId ? Room.find({ propertyId }) : Room.find();
  } else {
    query = Room.find({ propertyId: req.user.propertyId });
  }

  const rooms = await query;

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc    Create room
// @route   POST /api/v1/rooms
// @access  Private/Admin
export const createRoom = asyncHandler(async (req, res, next) => {
  // If not super_admin, force propertyId to be their own
  if (req.user.role !== "super_admin") {
    req.body.propertyId = req.user.propertyId;
  }

  const room = await Room.create(req.body);

  // Create QR session with temporary token (valid for 30 days)
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const qrSession = await QRSession.findOneAndUpdate(
    { roomId: room._id },
    {
      roomId: room._id,
      propertyId: room.propertyId,
      accessToken: sessionToken,
      expiresAt,
    },
    { upsert: true, new: true },
  );

  // Generate QR code with only session token (no propertyId, no roomNumber exposed)
  const url = `/checkout/${sessionToken}`;
  const qrCodeUrl = await qrcode.toDataURL(url);
  room.qrCodeUrl = qrCodeUrl;
  await room.save();

  // Log Audit
  await logAudit("ROOM_CREATED", req.user._id, room.propertyId, {
    roomId: room._id,
    roomNumber: room.roomNumber,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("room:created", {
      propertyId: room.propertyId.toString(),
      room: room,
    });
  }

  res.status(201).json({
    success: true,
    data: room,
  });
});

// @desc    Update room
// @route   PATCH /api/v1/rooms/:id
// @access  Private/Admin
export const updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    room.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  // Update allowed fields
  const allowedFields = [
    "roomNumber",
    "type",
    "floor",
    "status",
    "capacity",
    "description",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      room[field] = req.body[field];
    }
  });

  await room.save();

  // Log Audit
  await logAudit("ROOM_UPDATED", req.user._id, room.propertyId, {
    roomId: room._id,
    changes: req.body,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("room:updated", {
      propertyId: room.propertyId.toString(),
      room: room,
    });
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Delete room
// @route   DELETE /api/v1/rooms/:id
// @access  Private/Admin
export const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    room.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  await Room.findByIdAndDelete(req.params.id);

  // Log Audit
  await logAudit("ROOM_DELETED", req.user._id, room.propertyId, {
    roomId: room._id,
    roomNumber: room.roomNumber,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("room:deleted", {
      propertyId: room.propertyId.toString(),
      roomId: room._id,
    });
  }

  res.status(200).json({
    success: true,
    data: { message: "Room deleted successfully" },
  });
});

// @desc    Regenerate room access token (Admin only)
// @route   PATCH /api/v1/rooms/:id/regenerate-token
// @access  Private/Admin
export const regenerateAccessToken = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const room = await Room.findById(id);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  // Multi-tenant check
  if (
    req.user.role !== "super_admin" &&
    room.propertyId.toString() !== req.user.propertyId.toString()
  ) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  // Generate new QR session token
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const qrSession = await QRSession.findOneAndUpdate(
    { roomId: room._id },
    {
      roomId: room._id,
      propertyId: room.propertyId,
      accessToken: sessionToken,
      expiresAt,
    },
    { upsert: true, new: true }
  );

  // Regenerate QR code with only session token (no sensible data exposed in URL)
  const url = `/checkout/${sessionToken}`;
  const qrCodeUrl = await qrcode.toDataURL(url);
  room.qrCodeUrl = qrCodeUrl;
  await room.save();

  // Log Audit
  await logAudit("ROOM_TOKEN_REGENERATED", req.user._id, room.propertyId, {
    roomId: room._id,
    roomNumber: room.roomNumber,
  });

  // Emit socket event
  const io = req.app.locals.io;
  if (io) {
    io.emit("room:tokenRegenerated", {
      propertyId: room.propertyId.toString(),
      roomId: room._id,
    });
  }

  res.status(200).json({
    success: true,
    data: room,
    message: "Access token regenerated successfully",
  });
});
