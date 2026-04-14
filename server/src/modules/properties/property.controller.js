import asyncHandler from '../../middlewares/asyncHandler.js';
import Property from './property.model.js';

// @desc    Get all properties
// @route   GET /api/v1/properties
// @access  Private/SuperAdmin
export const getProperties = asyncHandler(async (req, res, next) => {
  const properties = await Property.find();

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
