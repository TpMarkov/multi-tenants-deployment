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
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
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
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${room.accessToken}`;

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 300,
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
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-900">
            QR Code — Room {room.roomNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {qrDataUrl ? (
          <>
            <div className="bg-white border-2 border-slate-100 rounded-2xl inline-block p-3 mb-4 shadow-inner">
              <img
                src={qrDataUrl}
                alt={`QR for room ${room.roomNumber}`}
                className="w-56 h-56"
              />
            </div>
            <p className="text-xs text-slate-400 mb-4 break-all">{url}</p>
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all"
            >
              <Download className="h-4 w-4" /> Download PNG
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-56">
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Room Number
              </label>
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
                placeholder="e.g. 101, 202, Suite A"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-60"
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

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} configured
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Room
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <DoorOpen className="h-12 w-12 mx-auto mb-3 opacity-25" />
              <p className="font-semibold text-slate-500">
                No rooms configured
              </p>
              <p className="text-sm mt-1">
                Add rooms to generate QR codes for guests.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-semibold">Room Number</th>
                  <th className="px-6 py-3.5 font-semibold">Guest URL</th>
                  <th className="px-6 py-3.5 font-semibold">Created</th>
                  <th className="px-6 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.map((room) => (
                  <tr
                    key={room._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-900 text-lg">
                      {room.roomNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono truncate max-w-xs">
                      /property/{pid}/room/{room.roomNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(room.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrRoom(room)}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs transition-colors"
                        >
                          <QrCode className="h-4 w-4" /> QR
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteRoom(room._id, room.roomNumber)
                          }
                          className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-semibold text-xs transition-colors"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
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
  );
}
