"use client";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { getOrderAnalytics } from "@/lib/api";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Clock, Award, Calendar, Filter, Loader2 
} from "lucide-react";

export default function Analytics() {
  const { user, propertyId } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState("7"); // days
  
  const pid = propertyId || user?.propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const params = { startDate, endDate };
        if (isSuperAdmin) {
          params.propertyId = pid || '';
        }
        
        console.log("📊 [Client] Fetching analytics with params:", params);
        const res = await getOrderAnalytics(params);
        console.log("📊 [Client] Analytics response:", res.data);
        setAnalytics(res.data.data);
      } catch (err) {
        console.error("📊 [Client] Failed to fetch analytics:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [dateRange, pid, isSuperAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const { summary, todayStats, yesterdayStats, revenueByDate, statusBreakdown, peakHours, topItems } = analytics || {};
  
  // Calculate trends
  const revenueChange = todayStats?.todayRevenue && yesterdayStats?.yesterdayRevenue 
    ? ((todayStats.todayRevenue - yesterdayStats.yesterdayRevenue) / yesterdayStats.yesterdayRevenue * 100).toFixed(1)
    : 0;
    
  const ordersChange = todayStats?.todayOrders && yesterdayStats?.yesterdayOrders
    ? ((todayStats.todayOrders - yesterdayStats.yesterdayOrders) / yesterdayStats.yesterdayOrders * 100).toFixed(1)
    : 0;

  const statusMap = statusBreakdown?.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}) || {};

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#455a64]">Order Analytics</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#67757c]" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#67757c]">Today's Revenue</span>
            <span className={`flex items-center text-xs ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(revenueChange)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-[#455a64] mt-1">
            ${todayStats?.todayRevenue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-[#99abb4]">vs ${yesterdayStats?.yesterdayRevenue?.toFixed(2) || '0.00'} yesterday</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#67757c]">Today's Orders</span>
            <span className={`flex items-center text-xs ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ordersChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(ordersChange)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-[#455a64] mt-1">
            {todayStats?.todayOrders || 0}
          </p>
          <p className="text-xs text-[#99abb4]">vs {yesterdayStats?.yesterdayOrders || 0} yesterday</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <span className="text-sm text-[#67757c]">Total Revenue ({dateRange} days)</span>
          <p className="text-2xl font-bold text-[#455a64] mt-1">
            ${summary?.totalRevenue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-[#99abb4]">{summary?.totalOrders || 0} orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <span className="text-sm text-[#67757c]">Avg Order Value</span>
          <p className="text-2xl font-bold text-[#455a64] mt-1">
            ${summary?.avgOrderValue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-[#99abb4]">per order</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <h3 className="font-semibold text-[#455a64] mb-4">Order Status</h3>
          <div className="space-y-3">
            {['received', 'preparing', 'dispatched', 'delivered'].map(status => {
              const count = statusMap[status] || 0;
              const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
              const percent = total > 0 ? (count / total * 100).toFixed(1) : 0;
              const colors = {
                received: 'bg-blue-500',
                preparing: 'bg-amber-500',
                dispatched: 'bg-purple-500',
                delivered: 'bg-green-500'
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-[#455a64]">{status}</span>
                    <span className="text-[#67757c]">{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <h3 className="font-semibold text-[#455a64] mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Peak Hours
          </h3>
          <div className="space-y-2">
            {peakHours?.slice(0, 6).map((hour, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[#455a64]">
                  {hour._id}:00 - {hour._id + 1}:00
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1e88e5] rounded-full" 
                      style={{ width: `${(hour.count / (peakHours[0]?.count || 1)) * 100}%` }} 
                    />
                  </div>
                  <span className="text-xs text-[#67757c] w-8 text-right">{hour.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
        <h3 className="font-semibold text-[#455a64] mb-4 flex items-center gap-2">
          <Award className="h-4 w-4" /> Top Selling Items
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[#67757c]">Item</th>
                <th className="text-right py-2 text-[#67757c]">Sold</th>
                <th className="text-right py-2 text-[#67757c]">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topItems?.map((item, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 text-[#455a64]">{item._id}</td>
                  <td className="py-2 text-right text-[#455a64]">{item.totalSold}</td>
                  <td className="py-2 text-right text-[#455a64]">${item.totalRevenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}