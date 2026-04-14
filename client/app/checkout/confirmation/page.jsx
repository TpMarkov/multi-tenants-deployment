"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Home } from "lucide-react";
import { Suspense } from "react";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const roomNumber = searchParams.get("roomNumber");

  return (
    <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gradient-to-b from-green-50 to-white">
      <div className="bg-green-100 p-8 rounded-full mb-6 animate-bounce">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h1>
      <p className="text-slate-600 mb-8 max-w-sm">
        Your order has been received and will be prepared shortly.
      </p>

      {orderId && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 w-full max-w-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Order Number</p>
          <p className="font-mono text-sm font-bold text-slate-700 break-all">
            {orderId}
          </p>
        </div>
      )}

      {roomNumber && (
        <div className="text-slate-600 mb-8">
          <p className="text-sm">
            Room number:{" "}
            <span className="font-bold text-slate-900">{roomNumber}</span>
          </p>
        </div>
      )}

      <div className="space-y-3 w-full max-w-sm">
        <button
          onClick={() => router.push("/")}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-900 transition-all"
        >
          <Home className="h-5 w-5" />
          Back to Home
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-12">
        Estimated delivery: 15-20 minutes
      </p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
