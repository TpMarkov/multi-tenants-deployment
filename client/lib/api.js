import axios from 'axios';
import { useAdminStore } from '@/store/useAdminStore';

// Guest API (no auth)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Admin API (with auth token injected)
export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT from store on every request
adminApi.interceptors.request.use((config) => {
  const token = useAdminStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAdminStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Guest endpoints ---
export const getCategories = (propertyId) => api.get(`/menu/categories?propertyId=${propertyId}`);
export const getMenuItems = (propertyId) => api.get(`/menu/items?propertyId=${propertyId}`);
export const validateQRSession = (sessionToken) => api.get(`/rooms/validate-qr/${sessionToken}`);
export const getRoomByNumber = (propertyId, roomNumber, token) => api.get(`/rooms/by-number/${roomNumber}?propertyId=${propertyId}&token=${token}`);
export const createOrder = (orderData) => api.post('/orders', orderData);

// --- Admin Auth ---
export const loginAdmin = (credentials) => api.post('/auth/login', credentials);

// --- Admin Orders ---
export const getOrders = (propertyId) => adminApi.get(`/orders?propertyId=${propertyId}`);
export const updateOrderStatus = (id, status) => adminApi.patch(`/orders/${id}/status`, { status });

// --- Admin Menu ---
export const createCategory = (data) => adminApi.post('/menu/categories', data);
export const createMenuItem = (data) => adminApi.post('/menu/items', data);
export const updateMenuItem = (id, data) => adminApi.patch(`/menu/items/${id}`, data);
export const updateMenuItemAvailability = (id, isAvailable) =>
  adminApi.patch(`/menu/items/${id}/availability`, { isAvailable });
export const deleteMenuItem = (id) => adminApi.delete(`/menu/items/${id}`);
export const deleteCategory = (id) => adminApi.delete(`/menu/categories/${id}`);

// --- Admin Rooms ---
export const getRooms = (propertyId) => adminApi.get(`/rooms?propertyId=${propertyId}`);
export const createRoom = (data) => adminApi.post('/rooms', data);
export const deleteRoom = (id) => adminApi.delete(`/rooms/${id}`);

export default api;
