"use client";

import { useStore } from '@/store/useStore';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

export default function MenuItem({ item }) {
  const addToCart = useStore((state) => state.addToCart);
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    setAdding(true);
    addToCart({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      specialInstructions: ""
    });

    setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="flex bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-slate-300 transition-all group">
      <div className="flex-1 pr-4">
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
        <p className="mt-2 font-bold text-slate-900">{formatPrice(item.price)}</p>
      </div>

      <div className="flex flex-col justify-between items-end">
        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden relative flex-shrink-0">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-xl">
              {item.name[0]}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!item.isAvailable || adding}
          className={cn(
            "mt-2 p-2 rounded-full transition-all duration-300 scale-100 active:scale-90",
            adding
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white hover:bg-black",
            !item.isAvailable && "bg-slate-200 cursor-not-allowed text-slate-400"
          )}
        >
          {adding ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
