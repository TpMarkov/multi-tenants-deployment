"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, Search, X, Volume2, VolumeX, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";
import { useNotificationStore } from "@/store/useNotificationStore";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} d ago`;
}

export default function TopBar({ title }) {
  const { user } = useAdminStore();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    toggleSound,
  } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.orderId) {
      router.push(`/admin/orders?orderId=${notification.orderId}`);
    }
    setShowDropdown(false);
  };

  // Close dropdown on Escape and on outside click (keyboard + a11y friendly).
  useEffect(() => {
    if (!showDropdown) return;
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setShowDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showDropdown]);

  const badgeLabel =
    unreadCount > 0 ? `${unreadCount} new order notification${unreadCount > 1 ? "s" : ""}` : "No new notifications";

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
          title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
          aria-label={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={`Notifications. ${badgeLabel}`}
            aria-haspopup="true"
            aria-expanded={showDropdown}
            data-testid="notification-bell"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                key={unreadCount}
                className="bell-badge-pop absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] leading-[18px] flex items-center justify-center font-bold text-white ring-2 ring-[#1e88e5]"
                aria-hidden="true"
                data-testid="notification-badge"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Visually hidden live region announces badge changes to screen readers */}
          <span className="sr-only" role="status" aria-live="polite">
            {badgeLabel}
          </span>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
              role="menu"
              aria-label="Notifications"
            >
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:underline"
                      role="menuitem"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto" data-testid="notification-list">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex gap-3 items-start ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                      data-testid="notification-item"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" aria-label="Unread" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
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
              <span className="text-[#1e88e5]">{user?.name?.[0] || "A"}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
