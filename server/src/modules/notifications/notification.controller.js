import asyncHandler from '../../middlewares/asyncHandler.js';
import Notification from './notification.model.js';

// List notifications for the requesting admin, most recent first.
// Super admins see every property; others are scoped to their property.
export const getNotifications = asyncHandler(async (req, res) => {
  const { role, propertyId } = req.user;

  const query = {};
  if (role !== 'super_admin') {
    query.propertyId = propertyId;
  }

  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    ...query,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications,
  });
});

// Lightweight endpoint used to keep the bell badge in sync.
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { role, propertyId } = req.user;

  const query = {};
  if (role !== 'super_admin') {
    query.propertyId = propertyId;
  }

  const unreadCount = await Notification.countDocuments({
    ...query,
    isRead: false,
  });

  res.status(200).json({ success: true, unreadCount });
});

// Mark a single notification as read. Admins may only touch notifications
// that belong to their own property (super admins may touch any).
export const markAsRead = asyncHandler(async (req, res) => {
  const { role, propertyId } = req.user;

  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res
      .status(404)
      .json({ success: false, error: 'Notification not found' });
  }

  if (
    role !== 'super_admin' &&
    notification.propertyId?.toString() !== propertyId?.toString()
  ) {
    return res
      .status(403)
      .json({ success: false, error: 'Not authorized' });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

// Mark every notification for the admin's scope as read.
export const markAllRead = asyncHandler(async (req, res) => {
  const { role, propertyId } = req.user;

  const query = {};
  if (role !== 'super_admin') {
    query.propertyId = propertyId;
  }

  await Notification.updateMany(
    { ...query, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
