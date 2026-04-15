"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { getCategories, getMenuItems } from "@/lib/api";
import MenuList from "@/components/menu/MenuList";
import CategoryNav from "@/components/menu/CategoryNav";
import CartSticky from "@/components/cart/CartSticky";
import { Loader2 } from "lucide-react";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Always show loading initially - no way to bypass this
export default function MenuPage() {
  // Use useMemo to get params once
  const params = useParams();
  const paramPropertyId = params?.propertyId;
  const paramRoomId = params?.roomId;
  
  const setSession = useStore((state) => state.setSession);
  
  const [propertyId, setPropertyId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client side
    const resolvedPropertyId = paramPropertyId || getCookie("propertyId");
    const resolvedRoomId = paramRoomId || getCookie("roomId");
    
    if (resolvedPropertyId && resolvedRoomId) {
      setPropertyId(resolvedPropertyId);
      setRoomId(resolvedRoomId);
      setSession(resolvedPropertyId, resolvedRoomId);
      fetchMenu(resolvedPropertyId);
    } else {
      setError("Please scan a valid QR code to view the menu.");
      setLoading(false);
    }
  }, [paramPropertyId, paramRoomId]);

  async function fetchMenu(pid) {
    try {
      const [catRes, itemRes] = await Promise.all([
        getCategories(pid),
        getMenuItems(pid),
      ]);
      setCategories(catRes.data.data || []);
      setItems(itemRes.data.data || []);
    } catch (err) {
      console.error("Menu load error:", err);
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }

  // Show loader while loading OR before params are checked
  if (loading || propertyId === null) {
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
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchMenu(propertyId);
          }}
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
        <h1 className="text-xl font-bold text-slate-900 leading-tight">
          Room Dining
        </h1>
        <p className="text-sm text-slate-500">Room {roomId || "Unknown"}</p>
      </header>

      <CategoryNav categories={categories} />

      <div className="p-4 space-y-8">
        {categories.map((category) => (
          <MenuList
            key={category._id}
            category={category}
            items={items.filter(
              (item) =>
                item.categoryId &&
                (item.categoryId._id === category._id ||
                  item.categoryId === category._id),
            )}
          />
        ))}

        {items.filter((item) => !item.categoryId).length > 0 && (
          <MenuList
            category={{ _id: "uncategorized", name: "Other Options" }}
            items={items.filter((item) => !item.categoryId)}
          />
        )}
      </div>

      <CartSticky />
    </div>
  );
}