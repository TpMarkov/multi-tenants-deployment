"use client";
import { useState, useEffect } from "react";
import { Bell, Search, X, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getSocket } from "@/lib/socket";

export default function TopBar({ title }) {
  const { user } = useAdminStore();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, soundEnabled, toggleSound } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.orderId) {
      router.push(`/admin/orders?orderId=${notification.orderId}`);
    }
    setShowDropdown(false);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrder = (order) => {
      useNotificationStore.getState().addNotification({
        type: 'order',
        title: 'New Order',
        message: `New order from Room ${order.roomId?.roomNumber || 'Unknown'}`,
        orderId: order._id,
      });
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, []);

  return (
    <header className="h-16 bg-[#1e88e5] text-white flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/10 border-none rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/20 w-64 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSound}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-[1px] bg-white/20 mx-1"></div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-1.5 rounded-lg transition-colors">
          <div className="text-right hidden sm:block">
            <p className="font-medium text-sm leading-none">
              {user?.name || "Admin"}
            </p>
            <p className="text-white/70 text-[10px] uppercase font-bold mt-1">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center font-bold border-2 border-white/20 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#1e88e5]">{user?.name?.[0] || 'A'}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}