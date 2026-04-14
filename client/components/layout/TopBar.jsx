'use client';
import { Bell } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';

export default function TopBar({ title }) {
  const { user } = useAdminStore();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-5">
        <button className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 group">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform" />
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-1" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-slate-900 text-sm leading-none group-hover:text-blue-600 transition-colors">{user?.name}</p>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl h-10 w-10 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-500/20 border border-white/10">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
