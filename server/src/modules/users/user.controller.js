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
