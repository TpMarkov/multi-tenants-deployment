"use client";
import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import { useAdminStore } from "@/store/useAdminStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import {
  ShoppingBag,
  Loader2,
  X,
  ChevronDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_FLOW = ["received", "preparing", "dispatched", "delivered"];

const STATUS_STYLES = {
  received: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  preparing: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  dispatched: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  delivered: {
    bg: "bg-[#26c6da]",
    text: "text-white",
    dot: "bg-green-400",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {};
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function StatusDropdown({ order, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const nextStatuses = STATUS_FLOW.filter((s) => s !== order.status);

  const handleChange = async (newStatus) => {
    setOpen(false);
    setLoading(true);
    try {
      await updateOrderStatus(order._id, newStatus);
      onUpdate(order._id, newStatus);
      toast.success(`Order updated to "${newStatus}"`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (order.status === "delivered") {
    return <StatusBadge status="delivered" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium capitalize border border-transparent hover:border-slate-300 transition-all group"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <StatusBadge status={order.status} />
        )}
        <ChevronDown className="h-3 w-3 text-[#99abb4]" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-slate-200 rounded shadow-lg overflow-hidden min-w-36">
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-[#f2f4f8] transition-colors"
            >
              <span
                className={`h-2 w-2 rounded-full ${STATUS_STYLES[s]?.dot}`}
              />
              <span className="capitalize font-medium">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-[#455a64]">
              Order Details
            </h3>
            <p className="text-[#99abb4] text-xs mt-0.5">ID: {order._id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-[#99abb4]">Room</span>
            <span className="font-semibold text-[#455a64]">
              #{order.roomId?.roomNumber || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#99abb4]">Status</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#99abb4]">Time</span>
            <span className="font-semibold text-[#455a64]">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          {order.specialInstructions && (
            <div className="text-sm">
              <span className="text-[#99abb4]">Note: </span>
              <span className="text-[#67757c] italic">
                {order.specialInstructions}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-[#f3f3f3] pt-4">
          <p className="text-xs font-semibold text-[#99abb4] uppercase tracking-wider mb-3">
            Order Items
          </p>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#455a64]">
                    {item.name}
                  </p>
                  {item.specialInstructions && (
                    <p className="text-xs text-[#99abb4] italic">
                      {item.specialInstructions}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">${item.price?.toFixed(2)}</p>
                  <p className="text-[#99abb4]">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-[#f3f3f3]">
            <span className="font-semibold text-[#455a64]">Total</span>
            <span className="font-semibold text-xl text-[#455a64]">
              ${order.totalAmount?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { propertyId, token, user } = useAdminStore();
  const markAsReadByOrderId = useNotificationStore((s) => s.markAsReadByOrderId);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  const pid = propertyId || user?.propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  console.log("🔍 [Orders] propertyId from store:", propertyId);
  console.log("🔍 [Orders] user?.propertyId:", user?.propertyId);
  console.log("🔍 [Orders] user object:", user);
  console.log("🔍 [Orders] Using pid:", pid);

  const fetchOrders = useCallback(async () => {
    try {
      console.log("📥 [Admin Orders] Fetching orders for property:", pid);
      const res = await getOrders(pid);
      console.log(
        "✅ [Admin Orders] Orders fetched:",
        res.data.data?.length,
        "orders",
      );
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("❌ [Admin Orders] Failed to fetch orders:", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    console.log("🔍 [Orders] useEffect running, pid:", pid);
    if (pid) fetchOrders();
  }, [pid, fetchOrders]);

  // Real-time via Socket.io
  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;

    console.log("📡 [Admin Orders] Socket connected for real-time updates");

    const handleNewOrder = (order) => {
      console.log("📦 [Admin Orders] New order received:", order);
      setOrders((prev) => [order, ...prev]);
      setCurrentPage(1); // Reset to first page to see new order
      setHighlightedOrderId(order._id);
      setTimeout(() => setHighlightedOrderId(null), 3000);
      toast.success(
        `🔔 New order from Room #${order.roomId?.roomNumber || order.roomId}!`,
      );
    };

    const handleOrderUpdated = ({ orderId, status }) => {
      console.log(
        "🔄 [Admin Orders] Order updated:",
        orderId,
        "Status:",
        status,
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
      );
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdated);

    return () => {
      console.log("📡 [Admin Orders] Socket listeners cleanup");
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [token]);

  // When an admin opens an order's detail view, mark its notification as
  // reviewed so the bell updates (requirement: reviewed once by an admin).
  useEffect(() => {
    if (selectedOrder?._id) {
      markAsReadByOrderId(selectedOrder._id);
    }
  }, [selectedOrder, markAsReadByOrderId]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
    );
  };

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sorted.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <>
      <TopBar title="Orders" />
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
        {/* Filters + Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <div className="flex flex-wrap items-center gap-1 md:gap-2 bg-white border border-slate-200 rounded-lg p-1 max-w-full overflow-x-auto">
            {["all", ...STATUS_FLOW].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-medium capitalize whitespace-nowrap transition-all ${
                  filter === s
                    ? "bg-[#1e88e5] text-white"
                    : "text-[#67757c] hover:text-[#455a64]"
                }`}
              >
                {s}
                {s !== "all" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({orders.filter((o) => o.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-200 rounded text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 md:h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center py-12 md:py-20 text-slate-400">
                <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-25" />
                <p className="font-semibold text-slate-500">No orders found</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Table */}
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 text-left text-[#455a64] text-xs uppercase font-semibold">
                      <th className="px-3 md:px-6 py-3">Room</th>
                      <th className="px-3 md:px-6 py-3 hidden sm:table-cell">
                        Items
                      </th>
                      <th className="px-3 md:px-6 py-3">Total</th>
                      <th className="px-3 md:px-6 py-3">Status</th>
                      <th className="px-3 md:px-6 py-3 hidden md:table-cell">
                        Time
                      </th>
                      <th className="px-3 md:px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f3f3]">
                    {paginatedOrders.map((order) => (
                      <tr
                        key={order._id}
                        className={`transition-colors ${
                          highlightedOrderId === order._id
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-[#f2f4f8]"
                        }`}
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-[#455a64] text-sm">
                          #{order.roomId?.roomNumber || "Unknown"}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-[#67757c] max-w-[150px] md:max-w-[200px] truncate text-xs hidden sm:table-cell">
                          {order.items
                            ?.map((i) => `${i.name} ×${i.quantity}`)
                            .join(", ")}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-[#455a64]">
                          ${order.totalAmount?.toFixed(2)}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <StatusDropdown
                            order={order}
                            onUpdate={handleStatusUpdate}
                          />
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-[#99abb4] text-xs hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <br />
                          <span className="text-[#99abb4]">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs text-[#1e88e5] hover:text-[#1e88e5] font-medium hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-[#f3f3f3] px-3 md:px-6 py-3 md:py-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-xs font-medium text-[#67757c] hidden xs:inline">
                    Items per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 md:px-3 py-1 md:py-1.5 border border-slate-200 rounded text-xs md:text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-medium text-[#67757c] order-1 sm:order-2">
                  {sorted.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(endIndex, sorted.length)} of {sorted.length}
                </div>

                <div className="flex items-center gap-1 order-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 md:p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1 md:px-2">
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
                          className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded text-xs font-medium transition-all ${
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
                    className="p-1 md:p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
