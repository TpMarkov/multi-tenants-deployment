import asyncHandler from '../../middlewares/asyncHandler.js';
import Property from './property.model.js';

// @desc    Get all properties
// @route   GET /api/v1/properties
// @access  Private/SuperAdmin, PropertyAdmin
export const getProperties = asyncHandler(async (req, res, next) => {
  let properties;
  
  if (req.user.role === 'super_admin') {
    // Super admin can see all properties
    properties = await Property.find();
  } else {
    // Property admin can only see their own property
    properties = await Property.find({ _id: req.user.propertyId });
  }

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties
  });
});

// @desc    Create property
// @route   POST /api/v1/properties
// @access  Private/SuperAdmin
export const createProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.create(req.body);

  res.status(201).json({
    success: true,
    data: property
  });
});