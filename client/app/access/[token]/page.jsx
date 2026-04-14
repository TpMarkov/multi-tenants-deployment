"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateQRSession } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";

export default function AccessPage({ params }) {
  const { token } = params;
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndRedirect = async () => {
      if (!token) {
        setError("Invalid QR code - no token provided");
        setLoading(false);
        return;
      }

      try {
        const res = await validateQRSession(token);
        const data = res.data;

        if (data.success) {
          const { propertyId, roomId, roomNumber } = data.data;

          document.cookie = `propertyId=${propertyId}; path=/; max-age=86400; sameSite=Lax`;
          document.cookie = `roomId=${roomId}; path=/; max-age=86400; sameSite=Lax`;
          document.cookie = `roomNumber=${roomNumber}; path=/; max-age=86400; sameSite=Lax`;
          document.cookie = `sessionToken=${token}; path=/; max-age=86400; sameSite=Lax`;

          router.push(`/property/${propertyId}/room/${roomId}`);
        } else {
          setError(data.error || "Invalid QR code");
        }
      } catch (err) {
        console.error("Failed to validate QR session:", err);
        if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
          setError("This QR code is invalid or has expired");
        } else {
          setError("Failed to validate QR code. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    validateAndRedirect();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600 font-medium">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <div className="bg-red-100 p-4 rounded-full inline-flex mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Unable to Access Menu</h1>
        <p className="text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
