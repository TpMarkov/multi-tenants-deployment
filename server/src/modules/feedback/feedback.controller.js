import asyncHandler from '../../middlewares/asyncHandler.js';
import Feedback from './feedback.model.js';

// @desc    Create feedback
// @route   POST /api/v1/feedback
// @access  Public (guest after order)
export const createFeedback = asyncHandler(async (req, res, next) => {
  const { propertyId, orderId, rating, comment, feedbackType, roomId } = req.body;

  if (!propertyId || !orderId || !rating) {
    return res.status(400).json({ 
      success: false, 
      error: 'Property ID, Order ID and Rating are required' 
    });
  }

  const feedback = await Feedback.create({
    propertyId,
    orderId,
    roomId,
    rating,
    comment,
    feedbackType: feedbackType || 'overall'
  });

  res.status(201).json({
    success: true,
    data: feedback
  });
});

// @desc    Get feedback for a property
// @route   GET /api/v1/feedback
// @access  Private/Admin
export const getFeedback = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.query;
  
  if (req.user.role === "super_admin") {
    // Super admin can see all or filter by property
    const query = propertyId ? { propertyId } : {};
    const feedback = await Feedback.find(query)
      .populate('orderId', 'roomNumber totalAmount')
      .sort('-createdAt');
    
    return res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  }
  
  // Property admin/staff only see their property's feedback
  const query = { propertyId: req.user.propertyId };
  const feedback = await Feedback.find(query)
    .populate('orderId', 'roomNumber totalAmount')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: feedback.length,
    data: feedback
  });
});

// @desc    Get feedback stats
// @route   GET /api/v1/feedback/stats
// @access  Private/Admin
export const getFeedbackStats = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.query;
  
  const query = req.user.role === "super_admin" && propertyId 
    ? { propertyId } 
    : { propertyId: req.user.propertyId };

  const stats = await Feedback.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalFeedback: { $sum: 1 },
        fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0] || { avgRating: 0, totalFeedback: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 }
  });
});