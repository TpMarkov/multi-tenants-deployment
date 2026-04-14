import express from 'express';
import { getProperties, createProperty } from './property.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.route('/')
  .get(getProperties)
  .post(createProperty);

export default router;
