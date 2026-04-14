'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useAdminStore } from '@/store/useAdminStore';
import { getOrders } from '@/lib/api';
import { ShoppingBag, DollarSign, Clock, TrendingUp, Loader2, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  received:   'bg-blue-100 text-blue-700',
  preparing:  'bg-amber-100 text-amber-700',
  dispatched: 'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user, propertyId } = useAdminStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const pid = propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getOrders(pid);
        setOrders(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (pid) fetchDashboard();
  }, [pid]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const activeOrders = orders.filter(o => ['received', 'preparing', 'dispatched'].includes(o.status));
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'bg-[#1e88e5]' },
    { label: "Today's Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: 'bg-[#26c6da]' },
    { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'bg-[#ffb22b]' },
    { label: 'Total Orders', value: orders.length, icon: TrendingUp, color: 'bg-[#7460ee]' },
  ];

  return (
    <>
      <TopBar title="Overview" />
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-medium text-[#455a64]">Dashboard Overview</h2>
            <div className="flex items-center gap-2 text-xs text-[#99abb4] mt-1">
              <span>Home</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#1e88e5]">Dashboard</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-md shadow-sm p-4 md:p-6 flex items-center gap-3 md:gap-4 transition-all duration-300 hover:shadow-md">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-white ${color}`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-[#455a64] leading-none">{value}</h3>
                    <p className="text-[#99abb4] text-xs md:text-sm mt-0.5 md:mt-1">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#f3f3f3] flex items-center justify-between">
                <h3 className="font-semibold text-[#455a64] text-base md:text-lg">Recent Orders</h3>
                <button className="text-xs text-[#1e88e5] hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12 md:py-20 text-slate-400">
                    <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-25" />
                    <p className="font-semibold text-slate-500">No orders found</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#455a64] font-semibold border-b border-[#f3f3f3]">
                        <th className="px-4 md:px-6 py-3 md:py-4">Room</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">Items</th>
                        <th className="px-4 md:px-6 py-3 md:py-4">Total</th>
                        <th className="px-4 md:px-8 py-3 md:py-5 hidden sm:table-cell">Status</th>
                        <th className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f3f3]">
                      {recentOrders.map(order => (
                        <tr key={order._id} className="hover:bg-[#f2f4f8] transition-colors group">
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="bg-[#eef5f9] h-8 w-8 rounded-full flex items-center justify-center text-[#1e88e5] font-bold text-[10px]">
                                {order.roomId?.roomNumber?.[0] || 'U'}
                              </div>
                              <span className="font-medium text-[#455a64] text-sm md:text-base">Room {order.roomId?.roomNumber || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                            <div className="max-w-[180px] lg:max-w-xs truncate">
                              <p className="text-[#67757c] text-xs md:text-sm">
                                {order.items?.map(i => i.name).join(', ')}
                              </p>
                              <p className="text-[11px] text-[#99abb4] mt-0.5">{order.items?.length} items</p>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <span className="font-semibold text-[#455a64]">${order.totalAmount?.toFixed(2)}</span>
                          </td>
                          <td className="px-4 md:px-8 py-3 md:py-5 hidden sm:table-cell">
                            <span className={`px-2 py-1 rounded text-[11px] font-medium uppercase ${
                              order.status === 'delivered' ? 'bg-[#26c6da] text-white' : 'bg-[#ffb22b] text-white'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                            <p className="text-[#455a64] font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[11px] text-[#99abb4]">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
