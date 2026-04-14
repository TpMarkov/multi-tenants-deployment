'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useAdminStore } from '@/store/useAdminStore';
import { getOrders } from '@/lib/api';
import { ShoppingBag, DollarSign, Clock, TrendingUp, Loader2 } from 'lucide-react';

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
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 text-blue-600' },
    { label: "Today's Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'from-amber-500 to-orange-600', light: 'bg-amber-50 text-amber-600' },
    { label: 'Total Orders', value: orders.length, icon: TrendingUp, color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <>
      <TopBar title="Overview" />
      <div className="flex-1 p-8 bg-slate-50/50">
        {/* Welcome */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-blue-600">{user?.name?.split(' ')[0]}</span>! 👋
            </h2>
            <p className="text-slate-500 font-medium mt-1">Here's a look at your property's performance for today.</p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Live Updates Active
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
               <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-2 w-2 bg-blue-600 rounded-full animate-ping" />
               </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              {stats.map(({ label, value, icon: Icon, color, light }) => (
                <div key={label} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${light} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-lg">Live</div>
                  </div>
                  <div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</p>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Recent Orders</h3>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-all">View All</button>
              </div>
              <div className="overflow-x-auto px-2">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-24 text-slate-400">
                    <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-bold text-slate-500 text-lg">Waiting for orders...</p>
                    <p className="text-sm mt-1 max-w-xs mx-auto">New guest orders will appear here automatically as soon as they are placed.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100/50">
                        <th className="px-8 py-5">Room</th>
                        <th className="px-8 py-5">Items</th>
                        <th className="px-8 py-5">Total</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentOrders.map(order => (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-all duration-300 group cursor-default">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 h-9 w-9 rounded-xl flex items-center justify-center text-slate-900 font-black">
                                {order.roomId?.roomNumber || 'Unknown'}
                              </div>
                              <span className="font-bold text-slate-900">Room {order.roomId?.roomNumber || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="max-w-[180px] lg:max-w-xs truncate">
                              <p className="font-medium text-slate-600">
                                {order.items?.map(i => i.name).join(', ')}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{order.items?.length} items</p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-black text-slate-900 text-base">${order.totalAmount?.toFixed(2)}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${STATUS_COLORS[order.status]}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 animate-pulse" />
                              {order.status}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-right sm:text-left">
                               <p className="font-bold text-slate-900">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Placed Dec 24</p>
                            </div>
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
