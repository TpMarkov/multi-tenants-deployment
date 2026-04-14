'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { loginAdmin } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginAdmin({ email, password });
      const { user, token } = res.data;
      login(user, token);
      connectSocket(token);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef5f9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex bg-[#1e88e5] rounded-md p-4 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#455a64]">HospitalityOS</h1>
          <p className="text-[#99abb4] mt-1 text-sm">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-md p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#455a64] mb-1">Sign in to your account</h2>
          <p className="text-[#99abb4] text-sm mb-7">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#67757c] mb-2">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@hotel.com"
                className="w-full px-4 py-3 border border-slate-200 rounded text-sm text-[#455a64] placeholder:text-[#99abb4] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#67757c] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded text-sm text-[#455a64] placeholder:text-[#99abb4] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99abb4] hover:text-[#67757c] transition-colors"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-btn"
              disabled={loading}
              className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white font-semibold py-3 px-6 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#f3f3f3]">
            <p className="text-xs text-[#99abb4] text-center">
              Demo credentials: <span className="font-medium text-[#67757c]">admin@hotel.com</span> / <span className="font-medium text-[#67757c]">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
