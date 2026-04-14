"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { useAdminStore } from "@/store/useAdminStore";
import { getRooms, createRoom, deleteRoom } from "@/lib/api";
import {
  Plus,
  X,
  Loader2,
  DoorOpen,
  Download,
  QrCode,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import QRCode from "qrcode";

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md p-4 md:p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h3 className="text-base md:text-lg font-semibold text-[#455a64]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QRModal({ room, propertyId, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/access/${room.accessToken}`;

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [url]);

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `room-${room.roomNumber}-qr.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md p-4 md:p-8 w-full max-w-sm shadow-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-[#455a64]">
            Room {room.roomNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {qrDataUrl ? (
          <>
            <div className="bg-white border-2 border-slate-100 rounded p-2 md:p-3 mb-3 md:mb-4 inline-block">
              <img
                src={qrDataUrl}
                alt={`QR for room ${room.roomNumber}`}
                className="w-40 h-40 md:w-56 md:h-56"
              />
            </div>
            <p className="text-xs text-[#99abb4] mb-3 md:mb-4 break-all px-2">
              {url}
            </p>
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-[#1e88e5] text-white py-2.5 md:py-3 rounded font-medium hover:bg-[#1976d2] transition-all text-sm md:text-base"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-40 md:h-56">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { propertyId } = useAdminStore();
  const pid = propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrRoom, setQrRoom] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getRooms(pid);
        setRooms(res.data.data || []);
      } catch {
        toast.error("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    if (pid) fetch();
  }, [pid]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const guestUrl = `${window.location.origin}/property/${pid}/room/${roomNumber}`;
      const res = await createRoom({
        propertyId: pid,
        roomNumber,
        qrCodeUrl: guestUrl,
      });
      setRooms((prev) => [...prev, res.data.data]);
      setRoomNumber("");
      setShowModal(false);
      toast.success(`Room ${roomNumber} created!`);
    } catch {
      toast.error("Failed to create room");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!confirm(`Delete Room ${roomNumber}?`)) return;
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      toast.success(`Room ${roomNumber} deleted!`);
    } catch {
      toast.error("Failed to delete room");
    }
  };

  return (
    <>
      <TopBar title="Room Management" />
      {showModal && (
        <Modal title="Add New Room" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#67757c] mb-2">
                Room Number
              </label>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
                placeholder="e.g. 101, 202, Suite A"
                className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1e88e5]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1e88e5] text-white py-3 rounded font-semibold flex items-center justify-center gap-2 hover:bg-[#1976d2] transition-all disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
              Room
            </button>
          </form>
        </Modal>
      )}
      {qrRoom && (
        <QRModal
          room={qrRoom}
          propertyId={pid}
          onClose={() => setQrRoom(null)}
        />
      )}

      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <p className="text-[#67757c] text-sm">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} configured
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-[#1e88e5] text-white rounded text-sm font-medium hover:bg-[#1976d2] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Room</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 md:h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 md:py-20 text-slate-400">
              <DoorOpen className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-25" />
              <p className="font-semibold text-slate-500">
                No rooms configured
              </p>
              <p className="text-sm mt-1 hidden sm:block">
                Add rooms to generate QR codes for guests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[#455a64] text-xs uppercase font-semibold">
                    <th className="px-3 md:px-6 py-3">Room</th>
                    <th className="px-3 md:px-6 py-3 hidden sm:table-cell">
                      Guest URL
                    </th>
                    <th className="px-3 md:px-6 py-3 hidden md:table-cell">
                      Access Token
                    </th>
                    <th className="px-3 md:px-6 py-3 hidden lg:table-cell">
                      Created
                    </th>
                    <th className="px-3 md:px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f3f3]">
                  {rooms.map((room) => (
                    <tr
                      key={room._id}
                      className="hover:bg-[#f2f4f8] transition-colors"
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className="font-semibold text-[#455a64] text-base">
                          {room.roomNumber}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                        <div className="max-w-[180px] lg:max-w-xs">
                          <p
                            className="text-[#67757c] text-xs font-mono truncate"
                            title={`/property/${pid}/room/${room.roomNumber}`}
                          >
                            /property/{pid}/room/{room.roomNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                        <p
                          className="text-[#99abb4] text-xs font-mono truncate max-w-[100px]"
                          title={room.accessToken}
                        >
                          {room.accessToken}
                        </p>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                        <span className="text-[#99abb4] text-xs">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button
                            onClick={() => setQrRoom(room)}
                            className="flex items-center gap-1 text-[#1e88e5] hover:text-[#1976d2] font-medium text-xs transition-colors px-2 py-1.5 bg-blue-50 rounded"
                          >
                            <QrCode className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">QR</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteRoom(room._id, room.roomNumber)
                            }
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-xs transition-colors px-2 py-1.5"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
