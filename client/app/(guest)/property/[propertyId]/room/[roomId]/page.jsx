"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getCategories, getMenuItems } from '@/lib/api';
import MenuList from '@/components/menu/MenuList';
import CategoryNav from '@/components/menu/CategoryNav';
import CartSticky from '@/components/cart/CartSticky';
import { Loader2 } from 'lucide-react';

export default function MenuPage() {
  const { propertyId, roomId } = useParams();
  const setSession = useStore((state) => state.setSession);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propertyId && roomId) {
      setSession(propertyId, roomId);
      fetchData();
    }
  }, [propertyId, roomId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, itemRes] = await Promise.all([
        getCategories(propertyId),
        getMenuItems(propertyId)
      ]);
      setCategories(catRes.data.data);
      setItems(itemRes.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load menu. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="bg-white p-4 sticky top-0 z-10 border-b">
        <h1 className="text-xl font-bold text-slate-900 leading-tight">Room Dining</h1>
        <p className="text-sm text-slate-500">Room {roomId}</p>
      </header>

      <CategoryNav categories={categories} />

      <div className="p-4 space-y-8">
        {categories.map(category => (
          <MenuList
            key={category._id}
            category={category}
            items={items.filter(item => item.categoryId && (item.categoryId._id === category._id || item.categoryId === category._id))}
          />
        ))}

        {items.filter(item => !item.categoryId).length > 0 && (
           <MenuList
             category={{ _id: 'uncategorized', name: 'Other Options' }}
             items={items.filter(item => !item.categoryId)}
           />
        )}
      </div>

      <CartSticky />
    </div>
  );
}
