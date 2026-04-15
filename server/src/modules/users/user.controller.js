import asyncHandler from '../../middlewares/asyncHandler.js';
import User from './user.model.js';
import { logAudit } from '../../utils/auditLogger.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  let query;

  // If super_admin, they can see all users OR filtered by property
  // If property_admin, they can only see users of their property
  if (req.user.role === 'super_admin') {
    const propertyId = req.query.propertyId;
    query = propertyId ? User.find({ propertyId }) : User.find();
  } else {
    query = User.find({ propertyId: req.user.propertyId });
  }

  const users = await query;

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
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
    propertyId
  });

  // Log Audit
  await logAudit('USER_CREATED', req.user._id, req.user.propertyId || user.propertyId, { userId: user._id, role: user.role });

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
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
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateFields,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Upload avatar for current user
// @route   POST /api/v1/users/profile/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload an image' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, error: 'Only image files are allowed' });
  }

  if (req.file.size > 2 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Image must be less than 2MB' });
  }

  const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: avatarUrl },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: { avatar: user.avatar }
  });
});
