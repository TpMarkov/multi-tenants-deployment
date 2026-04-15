import express from 'express';
import { getProperties, createProperty } from './property.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// Allow both super_admin and property_admin to access properties
router.use(authorize('super_admin', 'property_admin'));

router.route('/')
  .get(getProperties)
  .post(authorize('super_admin'), createProperty);

export default router;