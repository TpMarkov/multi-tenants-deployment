'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      propertyId: null,
      isAuthenticated: false,

      login: (user, token) => set({
        user,
        token,
        propertyId: user.role === 'super_admin' ? null : user.propertyId,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        token: null,
        propertyId: null,
        isAuthenticated: false,
      }),

      getToken: () => get().token,
    }),
    {
      name: 'admin-auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        propertyId: state.propertyId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
