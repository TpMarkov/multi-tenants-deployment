import asyncHandler from '../../middlewares/asyncHandler.js';
import User from '../users/user.model.js';
import { signToken } from '../../utils/jwt.js';

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide an email and password' });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Create token
  const token = signToken({ 
    id: user._id, 
    role: user.role, 
    propertyId: user.propertyId 
  });

  // Build permissions object based on role (fallback in case not in database)
  const buildPermissions = (role) => {
    switch (role) {
      case 'super_admin':
        return {
          canViewAll: true,
          canManageRooms: true,
          canManageMenu: true,
          canToggleMenuAvailability: true,
          noSettings: false,
        };
      case 'property_admin':
        return {
          canViewAll: true,
          canManageRooms: false,
          canManageMenu: false,
          canToggleMenuAvailability: true,
          noSettings: false,
        };
      case 'staff':
        return {
          canViewAll: true,
          canManageRooms: false,
          canManageMenu: false,
          canToggleMenuAvailability: true,
          noSettings: true,
        };
      default:
        return {};
    }
  };

  // Use user.permissions if exists, otherwise build from role
  const permissions = user.permissions || buildPermissions(user.role);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      propertyId: user.propertyId,
      avatar: user.avatar,
      permissions
    }
  });
});
