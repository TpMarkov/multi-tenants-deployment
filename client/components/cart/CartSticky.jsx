"use client";

import { useStore } from '@/store/useStore';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CartSticky() {
  const cart = useStore((state) => state.cart);
  const { propertyId, roomId } = useParams();
  
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link 
        href={`/property/${propertyId}/room/${roomId}/checkout`}
        className="flex items-center justify-between bg-black text-white px-6 py-4 rounded-3xl shadow-2xl hover:bg-slate-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-black">
              {totalItems}
            </span>
          </div>
          <span className="font-bold text-lg">View Cart</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">|</span>
          <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
        </div>
      </Link>
    </div>
  );
}
