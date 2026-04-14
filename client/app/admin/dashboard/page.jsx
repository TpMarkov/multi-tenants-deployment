"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { useAdminStore } from "@/store/useAdminStore";
import { getOrders } from "@/lib/api";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const STATUS_COLORS = {
  received: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  dispatched: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function DashboardPage() {
  const { user, propertyId } = useAdminStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today,
  );
  const revenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const activeOrders = orders.filter((o) =>
    ["received", "preparing", "dispatched"].includes(o.status),
  );
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const stats = [
    {
      label: "Today's Orders",
      value: todayOrders.length,
      icon: ShoppingBag,
      color: "bg-[#1e88e5]",
    },
    {
      label: "Today's Revenue",
      value: `$${revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-[#26c6da]",
    },
    {
      label: "Active Orders",
      value: activeOrders.length,
      icon: Clock,
      color: "bg-[#ffb22b]",
    },
    {
      label: "Total Orders",
      value: orders.length,
      icon: TrendingUp,
      color: "bg-[#7460ee]",
    },
  ];

  return (
    <>
      <TopBar title="Overview" />
      <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-4">
        {/* Header */}
        <div className="mb-3 md:mb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base md:text-lg font-medium text-[#455a64]">
              Dashboard Overview
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#99abb4] mt-0.5">
              <span>Home</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#1e88e5]">Dashboard</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4 flex-shrink-0">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-md shadow-sm p-2 md:p-3 flex items-center gap-2 md:gap-3"
                >
                  <div
                    className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white ${color}`}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#455a64] leading-none">
                      {value}
                    </h3>
                    <p className="text-[#99abb4] text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="px-3 md:px-4 py-2 md:py-3 border-b border-[#f3f3f3] flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-[#455a64] text-sm md:text-base">
                  Recent Orders
                </h3>
                <button className="text-xs text-[#1e88e5] hover:underline">
                  View All
                </button>
              </div>
              <div className="overflow-auto flex-1 min-h-0">
                {paginatedOrders.length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-slate-400">
                    <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 opacity-25" />
                    <p className="font-semibold text-slate-500 text-sm">
                      No orders found
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left text-[#455a64] font-semibold border-b border-[#f3f3f3]">
                        <th className="px-3 md:px-4 py-2">Room</th>
                        <th className="px-3 md:px-4 py-2 hidden sm:table-cell">
                          Items
                        </th>
                        <th className="px-3 md:px-4 py-2">Total</th>
                        <th className="px-3 md:px-4 py-2 hidden sm:table-cell">
                          Status
                        </th>
                        <th className="px-3 md:px-4 py-2 hidden md:table-cell">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f3f3]">
                      {paginatedOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-[#f2f4f8] transition-colors"
                        >
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-[#eef5f9] h-6 w-6 rounded-full flex items-center justify-center text-[#1e88e5] font-bold text-[9px]">
                                {order.roomId?.roomNumber?.[0] || "U"}
                              </div>
                              <span className="font-medium text-[#455a64] text-xs md:text-sm">
                                Room {order.roomId?.roomNumber || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                            <p className="text-[#67757c] text-xs max-w-[120px] lg:max-w-[150px] truncate">
                              {order.items?.map((i) => i.name).join(", ")}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            <span className="font-semibold text-[#455a64] text-xs md:text-sm">
                              ${order.totalAmount?.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden sm:table-cell">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                                order.status === "delivered"
                                  ? "bg-[#26c6da] text-white"
                                  : "bg-[#ffb22b] text-white"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                            <p className="text-[#455a64] font-medium text-xs">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-[#f3f3f3] px-3 md:px-4 py-2 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-xs font-medium text-[#67757c]">
                    Show:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:border-slate-300"
                  >
                    {[5, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-medium text-[#67757c] order-1 sm:order-2">
                  {sortedOrders.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(endIndex, sortedOrders.length)} of{" "}
                  {sortedOrders.length}
                </div>

                <div className="flex items-center gap-1 order-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            currentPage === pageNum
                              ? "bg-[#1e88e5] text-white"
                              : "text-slate-600 hover:bg-white border border-slate-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
