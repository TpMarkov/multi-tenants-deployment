'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const { isAuthenticated } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoginPage, router]);

  // Login page renders on its own
  if (isLoginPage) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {children}
      </>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
