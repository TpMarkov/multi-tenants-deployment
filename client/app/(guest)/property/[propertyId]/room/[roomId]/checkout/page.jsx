"use client";

import { useStore } from "@/store/useStore";
import { formatPrice } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Send,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createOrder, validateQRSession } from "@/lib/api";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("token");

  const cart = useStore((state) => state.cart);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);

  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [tokenError, setTokenError] = useState(false);
  const router = useRouter();

  // Validate QR session token on page load
  useEffect(() => {
    const validateSession = async () => {
      try {
        if (!sessionToken) {
          console.error(
            "🔐 [Checkout] No session token provided - invalid QR code",
          );
          setTokenError(true);
          setLoadingRoom(false);
          return;
        }

        console.log(
          "🔍 [Checkout] Validating QR session token:",
          sessionToken?.substring(0, 10) + "...",
        );
        const res = await validateQRSession(sessionToken);
        console.log(
          "✅ [Checkout] Session validated, room data:",
          res.data.data,
        );
        setRoomData(res.data.data);
        setTokenError(false);
      } catch (err) {
        console.error("❌ [Checkout] Failed to validate QR session:", err);
        if (
          err.response?.status === 401 ||
          err.response?.status === 403 ||
          err.response?.status === 404
        ) {
          setTokenError(true);
        }
      } finally {
        setLoadingRoom(false);
      }
    };

    if (sessionToken) {
      validateSession();
    }
  }, [sessionToken]);

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!roomData || !roomData.roomId) {
      alert("Room information is still loading. Please wait.");
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        propertyId: roomData.propertyId,
        roomId: roomData.roomId,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        specialInstructions: instructions,
      };

      console.log("📦 Order Data Being Sent:", orderData);
      console.log(
        "🏢 Property ID:",
        roomData.propertyId,
        "Type:",
        typeof roomData.propertyId,
      );
      console.log(
        "🚪 Room ID:",
        roomData.roomId,
        "Type:",
        typeof roomData.roomId,
      );
      console.log("📝 Items:", orderData.items);

      const res = await createOrder(orderData);
      console.log("✅ Order Response:", res);

      if (res.data.success) {
        clearCart();
        console.log("🎉 Order placed successfully:", res.data.data._id);
        router.push(
          `/checkout/confirmation?orderId=${res.data.data._id}&roomNumber=${roomData.roomNumber}`,
        );
      } else {
        console.error("❌ Order failed:", res.data);
        alert(`Order failed: ${res.data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Error placing order:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      alert(
        `Failed to place order: ${err.response?.data?.error || err.message || "Please try again."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <ShoppingBag className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-8">
          Add some delicious items from our menu to get started.
        </p>
        <Link
          href={sessionToken ? `/?token=${sessionToken}` : "/"}
          className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg"
        >
          View Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="sticky top-0 bg-white z-10 p-4 border-b flex items-center gap-4">
        <Link href={sessionToken ? `/?token=${sessionToken}` : "/"}>
          <div className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="h-6 w-6" />
          </div>
        </Link>
        <h1 className="text-xl font-bold">Your Cart</h1>
      </header>

      {tokenError && (
        <div className="bg-red-50 border border-red-200 p-4 m-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-900">Invalid QR Code</h3>
            <p className="text-sm text-red-700">
              This QR code is invalid or has expired. Please ask a staff member
              for a new one.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Items List */}
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.menuItemId} className="flex gap-4 border-b pb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-slate-400 uppercase">
                {item.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 bg-slate-100 rounded-full px-3 py-1">
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                      className="p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                      className="p-1"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Special Instructions
          </label>
          <textarea
            placeholder="Any allergies or special requests?"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Totals */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Room Service Fee</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-10">
        <button
          onClick={handlePlaceOrder}
          disabled={loading || loadingRoom || !roomData || tokenError}
          className="w-full bg-black text-white h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            tokenError
              ? "Invalid QR code"
              : loadingRoom
                ? "Loading room information..."
                : ""
          }
        >
          {loading || loadingRoom ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              {loadingRoom ? "Loading..." : "Placing Order..."}
            </>
          ) : tokenError ? (
            <>
              <AlertCircle className="h-6 w-6" />
              Invalid QR Code
            </>
          ) : (
            <>
              <Send className="h-6 w-6" />
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
}
