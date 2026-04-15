import express from 'express';
import { createFeedback, getFeedback, getFeedbackStats } from './feedback.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

// Public route - guests can submit feedback
router.post('/', createFeedback);

// Protected routes - admin can view feedback
router.get('/', protect, authorize('super_admin', 'property_admin', 'staff'), getFeedback);
router.get('/stats', protect, authorize('super_admin', 'property_admin', 'staff'), getFeedbackStats);

export default router;