import Notification from './notification.model.js';

// Build a human friendly notification payload from a (room-populated) order.
export const buildOrderNotification = (order) => {
  const roomNumber = order.roomId?.roomNumber || 'Unknown';
  const shortId = order._id.toString().slice(-6).toUpperCase();
  const itemSummary = (order.items || [])
    .slice(0, 3)
    .map((i) => `${i.quantity}× ${i.name}`)
    .join(', ');

  return {
    type: 'new_order',
    title: `New Order #${shortId}`,
    message: `Room #${roomNumber}${itemSummary ? ` · ${itemSummary}` : ''}`,
    orderId: order._id,
    propertyId: order.propertyId,
  };
};

// Persist a "new order" notification so it survives refresh/logout and is
// consistent across every connected admin session.
export const createOrderNotification = async (order) => {
  const data = buildOrderNotification(order);
  return Notification.create(data);
};

// Once an admin reviews an order (e.g. opens it or changes its status) the
// related notification is marked as read for everyone.
export const markOrderNotificationsRead = async (orderId) => {
  return Notification.updateMany(
    { orderId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};
