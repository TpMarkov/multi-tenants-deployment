import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      propertyId: null,
      roomId: null,
      cart: [],

      setSession: (propertyId, roomId) => set({ propertyId, roomId }),

      addToCart: (item) => set((state) => {
        // item should have menuItemId, name, price, quantity, specialInstructions
        const existingIndex = state.cart.findIndex(i => i.menuItemId === item.menuItemId);

        if (existingIndex > -1) {
          const newCart = [...state.cart];
          newCart[existingIndex].quantity += item.quantity;
          // Merge instructions if any? Or keep separate? Usually separate items if different instructions
          // For simplicity, we assume one entry per menuItemId for now, or you can key by ID + instructions hash
          return { cart: newCart };
        }

        return { cart: [...state.cart, item] };
      }),

      removeFromCart: (menuItemId) => set((state) => ({
        cart: state.cart.filter(i => i.menuItemId !== menuItemId)
      })),

      updateQuantity: (menuItemId, quantity) => set((state) => ({
        cart: quantity > 0
          ? state.cart.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
          : state.cart.filter(i => i.menuItemId !== menuItemId)
      })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'guest-dining-store',
      // only persist cart and session
      partialize: (state) => ({
        cart: state.cart,
        propertyId: state.propertyId,
        roomId: state.roomId
      }),
    }
  )
);
