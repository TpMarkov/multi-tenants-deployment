"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CheckoutRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("token");

  useEffect(() => {
    if (sessionToken) {
      // Redirect to the checkout page with the token as a query parameter
      router.push(`/checkout?token=${sessionToken}`);
    } else {
      // Token not found, redirect home
      router.push("/");
    }
  }, [sessionToken, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto mb-4" />
        <p className="text-slate-600 font-semibold">Loading checkout...</p>
      </div>
    </div>
  );
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutRedirectContent />
    </Suspense>
  );
}
