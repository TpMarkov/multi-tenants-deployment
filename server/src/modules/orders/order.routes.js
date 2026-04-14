import express from 'express';
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus 
} from './order.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

// Public route to create order
router.post('/', createOrder);

// Protected routes for admin/staff
router.get('/', protect, authorize('super_admin', 'property_admin', 'staff'), getOrders);
router.patch('/:id/status', protect, authorize('super_admin', 'property_admin', 'staff'), updateOrderStatus);

export default router;
