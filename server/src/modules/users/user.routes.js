import express from 'express';
import multer from 'multer';
import { 
  getUsers, 
  createUser, 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  updatePassword,
  getTeamMembers,
  createTeamMember,
  deleteTeamMember,
  updateTeamMember
} from './user.controller.js';
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

// Team management routes
router.route('/team')
  .get(authorize('super_admin', 'property_admin'), getTeamMembers)
  .post(authorize('super_admin', 'property_admin'), createTeamMember);

router.route('/team/:id')
  .put(authorize('super_admin'), updateTeamMember)
  .delete(authorize('super_admin', 'property_admin'), deleteTeamMember);

router.route('/')
  .get(authorize('super_admin', 'property_admin'), getUsers)
  .post(authorize('super_admin'), createUser);

export default router;
