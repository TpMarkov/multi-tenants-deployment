import express from 'express';
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus,
  deleteOrder,
  getOrderAnalytics 
} from './order.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

// Public route to create order
router.post('/', createOrder);

// Protected routes for admin/staff
router.get('/', protect, authorize('super_admin', 'property_admin', 'staff'), getOrders);
router.get('/analytics', protect, authorize('super_admin', 'property_admin', 'staff'), getOrderAnalytics);
router.patch('/:id/status', protect, authorize('super_admin', 'property_admin', 'staff'), updateOrderStatus);

// Super admin only - delete order
router.delete('/:id', protect, authorize('super_admin'), deleteOrder);

export default router;
