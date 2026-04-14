'use client';
import TopBar from '@/components/layout/TopBar';
import { useAdminStore } from '@/store/useAdminStore';
import { useRouter } from 'next/navigation';
import { disconnectSocket } from '@/lib/socket';
import { User, Building2, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, propertyId, logout } = useAdminStore();
  const router = useRouter();
  const pid = propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push('/admin/login');
  };

  return (
    <>
      <TopBar title="Settings" />
      <div className="flex-1 p-6 max-w-2xl">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Your Profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Role', value: user?.role?.replace(/_/g, ' '), className: 'capitalize' },
            ].map(({ label, value, className }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className={`font-semibold text-slate-900 ${className}`}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Property Information</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Property ID</span>
              <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{pid}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h3 className="font-bold text-slate-900 mb-1">Danger Zone</h3>
          <p className="text-slate-500 text-sm mb-4">Sign out from this admin console.</p>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
