"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";
import { loginAdmin, API_BASE_URL } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { UtensilsCrossed, Eye, EyeOff, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking"); // checking | connected | disconnected | unreachable
  const apiUrl = API_BASE_URL;

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (active) setDbStatus(data?.db?.status === "connected" ? "connected" : "disconnected");
      } catch {
        if (active) setDbStatus("unreachable");
      }
    };
    checkHealth();
    return () => { active = false; };
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[LOGIN] Attempting login with email:", email);
      console.log("[LOGIN] API baseURL:", API_BASE_URL);
      const res = await loginAdmin({ email, password });
      console.log("[LOGIN] Success response:", res.status, res.data);
      const { user, token } = res.data;
      login(user, token);
      connectSocket(token);
      toast.success(`Welcome back, ${user.name}!`);
      router.push("/admin/dashboard");
    } catch (err) {
      console.error("[LOGIN] Error object:", err);
      if (err.response) {
        console.error("[LOGIN] Server responded with status:", err.response.status);
        console.error("[LOGIN] Server error data:", err.response.data);
      } else if (err.request) {
        console.error("[LOGIN] NETWORK ERROR - no response received. The API URL is likely wrong or unreachable (check NEXT_PUBLIC_API_URL).");
      } else {
        console.error("[LOGIN] Request setup error:", err.message);
      }
      let message = "Invalid credentials. Please try again.";
      if (err.response) {
        if (err.response.status === 500) {
          message = "Server or database error — check the connection indicator above.";
        } else if (err.response.status === 401) {
          message = err.response?.data?.error || "Invalid credentials. Please try again.";
        } else {
          message = err.response?.data?.error || "Login failed. Please try again.";
        }
      } else if (err.request) {
        message = "Cannot reach the server. Check the connection indicator above.";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-white font-sans antialiased">
      {/* Left Side: Image/Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-[60%] bg-[#1e88e5] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-indigo-900/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Hotel"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-20 text-white max-w-lg">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Elevate Your Guest Experience.
            </h1>
            <p className="text-xl text-white/80 font-light leading-relaxed">
              Manage your hotel's dining services with precision and style.
              HospitalityOS provides the tools you need to excel.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-white/90">
              Trusted by 500+ hotels worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 lg:w-[40%] flex items-center justify-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-10">
            <div className="inline-flex bg-[#1e88e5] rounded-2xl p-4 shadow-xl shadow-blue-500/20 mb-8">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#333]">HospitalityOS</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#333] mb-3">Sign in</h2>
            <p className="text-[#999] text-sm font-medium">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Live DB / API connection indicator */}
          <div className="mb-6">
            {dbStatus === "checking" && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#999]">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                Checking server & database connection…
              </div>
            )}
            {dbStatus === "connected" && (
              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Server & database connected
              </div>
            )}
            {dbStatus === "disconnected" && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Database reachable but NOT connected
              </div>
            )}
            {dbStatus === "unreachable" && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Cannot reach API server ({apiUrl})
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="mb-6">
              <label
                className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-1"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@hotel.com"
                className="w-full py-3 bg-transparent border-b-2 border-[#e1e1e1] text-sm font-medium text-[#333] placeholder:text-[#999] focus:outline-none focus:border-[#1e88e5] transition-all duration-300"
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full py-3 bg-transparent border-b-2 border-[#e1e1e1] text-sm font-medium text-[#333] placeholder:text-[#999] focus:outline-none focus:border-[#1e88e5] transition-all duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#1e88e5] transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <label className="flex items-center gap-2 cursor-pointer text-[#999] hover:text-[#333] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#e1e1e1] text-[#1e88e5] focus:ring-[#1e88e5]"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-[#1e88e5] hover:text-[#1976d2] transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              id="login-btn"
              disabled={loading}
              className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#f1f1f1]">
            <p className="text-xs text-[#999] text-center font-medium">
              Demo Credentials: <br className="sm:hidden" />
              <span className="text-[#333] font-bold">
                superadmin@hospitalityos.com
              </span> /{" "}
              <span className="text-[#333] font-bold">TestAdmin2026!</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
