import asyncHandler from "../../middlewares/asyncHandler.js";
import User from "./user.model.js";
import { logAudit } from "../../utils/auditLogger.js";

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  let query;

  // If super_admin, they can see all users OR filtered by property
  // If property_admin, they can only see users of their property
  if (req.user.role === "super_admin") {
    const propertyId = req.query.propertyId;
    query = propertyId ? User.find({ propertyId }) : User.find();
  } else {
    query = User.find({ propertyId: req.user.propertyId });
  }

  const users = await query;

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/SuperAdmin
export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, propertyId } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    propertyId,
  });

  // Log Audit
  await logAudit(
    "USER_CREATED",
    req.user._id,
    req.user.propertyId || user.propertyId,
    { userId: user._id, role: user.role },
  );

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update current user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  // Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Email already in use" });
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Upload avatar for current user
// @route   POST /api/v1/users/profile/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, error: "Please upload an image" });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res
      .status(400)
      .json({ success: false, error: "Only image files are allowed" });
  }

  if (req.file.size > 2 * 1024 * 1024) {
    return res
      .status(400)
      .json({ success: false, error: "Image must be less than 2MB" });
  }

  const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: avatarUrl },
    { new: true },
  );

  res.status(200).json({
    success: true,
    data: { avatar: user.avatar },
  });
});

// @desc    Update password for current user
// @route   PUT /api/v1/users/profile/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Please provide current and new password",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "New password must be at least 6 characters",
    });
  }

  // Get user with password
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, error: "Current password is incorrect" });
  }

  // Update password (the pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// @desc    Get team members for a property
// @route   GET /api/v1/users/team
// @access  Private/PropertyAdmin
export const getTeamMembers = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === "super_admin") {
    const propertyId = req.query.propertyId;
    if (propertyId) {
      query = User.find({ propertyId }).select("-password");
    } else {
      query = User.find().select("-password");
    }
  } else {
    query = User.find({ propertyId: req.user.propertyId }).select("-password");
  }

  const users = await query;

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Create team member
// @route   POST /api/v1/users/team
// @access  Private/PropertyAdmin or SuperAdmin
export const createTeamMember = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, propertyId } = req.body;

  let assignedPropertyId;
  if (req.user.role === "super_admin") {
    assignedPropertyId = propertyId;
    if (!assignedPropertyId) {
      return res
        .status(400)
        .json({ success: false, error: "Property ID is required" });
    }
  } else {
    assignedPropertyId = req.user.propertyId;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, error: "User with this email already exists" });
  }

  let assignedRole = role || "staff";
  if (req.user.role !== "super_admin" && assignedRole !== "staff") {
    assignedRole = "staff";
  }

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    propertyId: assignedPropertyId,
  });

  await logAudit("TEAM_MEMBER_CREATED", req.user._id, assignedPropertyId, {
    userId: user._id,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      propertyId: user.propertyId,
      permissions: user.permissions,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Delete team member
// @route   DELETE /api/v1/users/team/:id
// @access  Private/PropertyAdmin or SuperAdmin
export const deleteTeamMember = asyncHandler(async (req, res, next) => {
  const userToDelete = await User.findById(req.params.id);

  if (!userToDelete) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (userToDelete._id.toString() === req.user.id) {
    return res
      .status(400)
      .json({ success: false, error: "Cannot delete your own account" });
  }

  if (req.user.role === "property_admin") {
    if (
      userToDelete.propertyId?.toString() !== req.user.propertyId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "Cannot delete users from other properties",
      });
    }
    if (
      userToDelete.role === "super_admin" ||
      userToDelete.role === "property_admin"
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Cannot delete admin users" });
    }
  }

  await User.findByIdAndDelete(req.params.id);

  await logAudit("TEAM_MEMBER_DELETED", req.user._id, userToDelete.propertyId, {
    deletedUserId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: "Team member removed successfully",
  });
});

// @desc    Update team member
// @route   PUT /api/v1/users/team/:id
// @access  Private/SuperAdmin
export const updateTeamMember = asyncHandler(async (req, res, next) => {
  const { name, email, role } = req.body;
  const userToUpdate = await User.findById(req.params.id);

  if (!userToUpdate) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  // Only super admin can update team members
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: "Only super admin can update team members" });
  }

  // Cannot update yourself
  if (userToUpdate._id.toString() === req.user.id) {
    return res.status(400).json({ success: false, error: "Cannot update your own account" });
  }

  // Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (role) {
    // Validate role
    if (!['super_admin', 'property_admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }
    updateFields.role = role;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  await logAudit('TEAM_MEMBER_UPDATED', req.user._id, userToUpdate.propertyId, {
    updatedUserId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
});
