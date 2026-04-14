import express from 'express';
import { getUsers, createUser } from './user.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('super_admin', 'property_admin'), getUsers)
  .post(authorize('super_admin'), createUser);

export default router;
