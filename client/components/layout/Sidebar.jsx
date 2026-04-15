"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";
import { disconnectSocket } from "@/lib/socket";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  DoorOpen,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminStore();
  const canAccessSettings =
    !user?.permissions?.noSettings && user?.role !== "staff";

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-[#2f3d4a] text-[#a6b7bf] flex flex-col flex-shrink-0">
      {/* Mobile close button */}
      {onClose && (
        <div className="lg:hidden flex justify-end p-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#27333e] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="h-16 flex items-center px-6 bg-[#1e88e5] text-white">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6" />
          <span className="font-bold text-lg tracking-tight">
            HospitalityOS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="py-6 flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          if (href === "/admin/settings" && !canAccessSettings) return null;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-normal transition-all duration-200 border-l-4 border-transparent ${
                active
                  ? "text-white bg-[#27333e] border-[#1e88e5]"
                  : "hover:text-white hover:bg-[#27333e]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-6 border-t border-[#3e4d5c]">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-[#1e88e5] flex items-center justify-center text-white font-bold overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.[0] || "A"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-[#a6b7bf] text-xs">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#a6b7bf] hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
