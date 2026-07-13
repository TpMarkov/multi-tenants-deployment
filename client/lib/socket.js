import { io } from 'socket.io-client';

let socket = null;

// Resolve the Socket.IO server URL. Prefer an explicit NEXT_PUBLIC_SOCKET_URL,
// otherwise reuse the same host as the REST API (NEXT_PUBLIC_API_URL). This
// prevents the common production bug where the socket silently defaults to
// http://localhost:5000 and never connects from the browser.
const resolveSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
};

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(resolveSocketUrl(), {
    auth: { token },
    // Omitting `transports` lets Socket.IO use HTTP long-polling first and then
    // upgrade to WebSocket, which is far more reliable behind proxies / LBs
    // than forcing websocket-only.
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) =>
    console.error('Socket connect_error:', err.message)
  );

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
