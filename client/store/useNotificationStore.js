'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api';

// Shared AudioContext so the notification sound can actually play in the
// browser. Audio is blocked until the user interacts with the page at least
// once (autoplay policy), so we unlock/resume the context on first gesture.
let audioCtx = null;
let audioUnlockBound = false;

const ensureAudioUnlocked = () => {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    // ignore
  }
};

if (typeof window !== 'undefined' && !audioUnlockBound) {
  audioUnlockBound = true;
  const bind = () => ensureAudioUnlocked();
  window.addEventListener('pointerdown', bind);
  window.addEventListener('keydown', bind);
  window.addEventListener('touchstart', bind);
}

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,
      lastViewedAt: null,
      loading: false,

      // Pull the authoritative notification list (and unread count) from the
      // backend. Used on mount, after login, and whenever a real-time event
      // arrives so the bell stays in sync across tabs/sessions.
      fetchNotifications: async () => {
        set({ loading: true });
        try {
          const res = await getNotifications();
          const notifications = res.data.data || [];
          const unreadCount =
            typeof res.data.unreadCount === 'number'
              ? res.data.unreadCount
              : notifications.filter((n) => !n.isRead).length;
          set({ notifications, unreadCount });
        } catch (err) {
          // 401 (logged out) or network errors are expected and silent here.
          if (err?.response?.status !== 401) {
            console.error('Failed to fetch notifications', err);
          }
        } finally {
          set({ loading: false });
        }
      },

      // Optimistic local add used when a real-time event is received before
      // the refetch resolves. Deduplicated by server _id.
      addNotification: (notification) => {
        set((state) => {
          if (state.notifications.some((n) => n._id === notification._id)) {
            return state;
          }
          return {
            notifications: [notification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
          };
        });

        if (get().soundEnabled && notification.type === 'new_order') {
          get().playNotificationSound();
        }
      },

      // Mark a single notification read (optimistic + persisted server side).
      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        try {
          await markNotificationRead(id);
        } catch (err) {
          if (err?.response?.status !== 401) {
            console.error('Failed to mark notification read', err);
          }
        }
      },

      // Convenience: mark read by the linked order id (used when an admin
      // opens the order detail view).
      markAsReadByOrderId: async (orderId) => {
        const target = get().notifications.find(
          (n) => String(n.orderId) === String(orderId) && !n.isRead
        );
        if (target) {
          await get().markAsRead(target._id);
        }
      },

      markAllAsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
          lastViewedAt: new Date().toISOString(),
        }));
        try {
          await markAllNotificationsRead();
        } catch (err) {
          if (err?.response?.status !== 401) {
            console.error('Failed to mark all notifications read', err);
          }
        }
      },

      setLastViewed: () => {
        set({ lastViewedAt: new Date().toISOString() });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      unlockAudio: () => ensureAudioUnlocked(),

      playNotificationSound: () => {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          if (!audioCtx) audioCtx = new Ctx();
          // Browsers start the context suspended until a user gesture; resume
          // so the notification tone is audible.
          if (audioCtx.state === 'suspended') audioCtx.resume();

          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;

          oscillator.start();
          setTimeout(() => {
            try {
              oscillator.stop();
            } catch {
              // already stopped
            }
          }, 200);
        } catch (e) {
          // Audio may be blocked until user interaction; ignore.
        }
      },
    }),
    {
      name: 'notification-store',
      // Persist the notification list + read state so the bell survives a
      // refresh / logout / browser restart. unreadCount is derived from the
      // list on fetch, but we also persist it for instant rendering.
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        soundEnabled: state.soundEnabled,
        lastViewedAt: state.lastViewedAt,
      }),
    }
  )
);
