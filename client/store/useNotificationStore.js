'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,
      lastViewedAt: null,

      addNotification: (notification) => {
        const newNotification = {
          id: Date.now() + Math.random(),
          ...notification,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
        
        if (get().soundEnabled && notification.type === 'order') {
          get().playNotificationSound();
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            return {
              notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return state;
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
          lastViewedAt: new Date().toISOString(),
        }));
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

      playNotificationSound: () => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            audioContext.close();
          }, 200);
        } catch (e) {
          console.log('Could not play sound');
        }
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        lastViewedAt: state.lastViewedAt,
      }),
    }
  )
);
