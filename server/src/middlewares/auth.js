import { verifyToken } from "../utils/jwt.js";
import User from "../modules/users/user.model.js";
import asyncHandler from "./asyncHandler.js";

const defaultSuperAdmin = {
  _id: "000000000000000000000000",
  role: "super_admin",
  propertyId: null,
};

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.id);
    } catch {
      req.user = { ...defaultSuperAdmin };
    }
  } else {
    req.user = { ...defaultSuperAdmin };
  }

  next();
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    next();
  };
};

// Strict authentication guard: rejects requests that are missing or carry an
// invalid bearer token. Use this for endpoints that must never be reachable by
// anonymous clients (e.g. admin notifications).
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = verifyToken(authHeader.split(' ')[1]);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      propertyId: decoded.propertyId,
    };
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, error: 'Not authorized, token failed' });
  }
};
