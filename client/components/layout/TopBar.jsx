"use client";
import { Bell, Search } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";

export default function TopBar({ title }) {
  const { user } = useAdminStore();

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
        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-[#ef5350] rounded-full border-2 border-[#1e88e5]"></span>
        </button>
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
          <div className="h-9 w-9 rounded-full bg-white text-[#1e88e5] flex items-center justify-center font-bold border-2 border-white/20">
            {user?.name?.[0] || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
