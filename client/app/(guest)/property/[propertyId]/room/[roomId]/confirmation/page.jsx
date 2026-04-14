"use client";

import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, Home, Package, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const { propertyId, roomId } = useParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center text-center">
      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Ordered!</h1>
        <p className="text-slate-500 mb-8">Your meal is being prepared with love and will be with you shortly.</p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Package className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Order ID</p>
              <p className="font-mono text-xs font-bold text-slate-700">{orderId || "..."}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Clock className="h-6 w-6 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Estimated Time</p>
              <p className="font-bold text-slate-700">25 - 35 minutes</p>
            </div>
          </div>
        </div>
        
        <Link 
          href={`/property/${propertyId}/room/${roomId}`}
          className="flex items-center justify-center gap-2 bg-black text-white w-full py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg"
        >
          <Home className="h-5 w-5" />
          Back to Menu
        </Link>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm">Need help? Call Guest Services from your room phone.</p>
    </div>
  );
}
