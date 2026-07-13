import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
} from './notification.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = express.Router();

// All notification endpoints require a valid admin token.
router.get('/', requireAuth, getNotifications);
router.get('/unread-count', requireAuth, getUnreadCount);
router.patch('/:id/read', requireAuth, markAsRead);
router.post('/read-all', requireAuth, markAllRead);

export default router;
