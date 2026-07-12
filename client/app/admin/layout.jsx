'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Login page renders on its own
  if (isLoginPage) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {children}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#eef5f9] overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        fixed lg:relative z-50 h-full transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <header className="lg:hidden h-14 bg-[#1e88e5] text-white flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-20">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-sm">HospitalityOS</span>
          <div className="w-10" /> {/* Spacer for alignment */}
        </header>
        
        {children}
      </main>
    </div>
  );
}
