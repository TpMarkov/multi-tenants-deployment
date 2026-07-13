'use client';
import { useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { connectSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

// Owns the real-time connection for the admin area and keeps the notification
// bell in sync. Mounted once in the admin layout so the bell works on EVERY
// admin page (previously the socket was only opened on the Orders page, which
// is why the bell "wasn't working").
export default function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAdminStore();
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Initial load so the bell is correct immediately after login/refresh.
    fetchNotifications();

    const socket = connectSocket(token);
    if (!socket) return;

    const handleNewOrder = (order) => {
      // Server is the source of truth for the badge count.
      fetchNotifications();
      if (useNotificationStore.getState().soundEnabled) {
        useNotificationStore.getState().playNotificationSound();
      }
      const room = order?.roomId?.roomNumber || 'Unknown';
      toast.success(`🔔 New order from Room #${room}`);
    };

    const handleOrderUpdated = () => {
      // A status change may mark the order's notification as read.
      fetchNotifications();
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);
    socket.on('notification:updated', handleOrderUpdated);

    return () => {
      // Remove only our own listeners (reference based) so the Orders page
      // listeners are not accidentally torn down.
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
      socket.off('notification:updated', handleOrderUpdated);
    };
  }, [token, isAuthenticated, fetchNotifications]);

  return children;
}
