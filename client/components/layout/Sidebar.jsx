'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { disconnectSocket } from '@/lib/socket';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed,
  DoorOpen, Settings, LogOut, ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders',    label: 'Orders',    icon: ShoppingBag },
  { href: '/admin/menu',      label: 'Menu',      icon: UtensilsCrossed },
  { href: '/admin/rooms',     label: 'Rooms',     icon: DoorOpen },
  { href: '/admin/settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminStore();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push('/admin/login');
  };

  return (
    <aside className="w-68 min-h-screen bg-[#0B0F1A] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800/50">
      {/* Logo */}
      <div className="px-7 py-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-2.5 shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-tight leading-none">Hospitality<span className="text-blue-500">OS</span></p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-4 space-y-1.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative ${
                active
                  ? 'bg-gradient-to-r from-blue-600/10 to-transparent text-white'
                  : 'hover:bg-slate-800/40 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] transition-colors duration-300 ${active ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="flex-1">{label}</span>
              {active && (
                <>
                  <ChevronRight className="h-3 w-3 text-blue-500" />
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="mx-4 mb-6 p-4 bg-slate-800/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl h-10 w-10 flex items-center justify-center text-sm font-black text-white shadow-inner uppercase border border-white/5">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate tracking-tight">{user?.name || 'Admin'}</p>
            <p className="text-blue-500 text-[10px] font-bold uppercase tracking-tighter opacity-80">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-400/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
