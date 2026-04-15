import express from 'express';
import multer from 'multer';
import { getUsers, createUser, getProfile, updateProfile, uploadAvatar, updatePassword } from './user.controller.js';
import { protect, authorize } from '../../middlewares/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.route('/profile/avatar')
  .post(upload.single('avatar'), uploadAvatar);

router.route('/profile/password')
  .put(updatePassword);

router.route('/')
  .get(authorize('super_admin', 'property_admin'), getUsers)
  .post(authorize('super_admin'), createUser);

export default router;