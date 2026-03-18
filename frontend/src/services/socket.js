/**
 * Socket.IO Client Service
 * ─────────────────────────────────────────────────────────────────
 * Manages a single shared socket instance for the whole app.
 *
 * HOW IT WORKS:
 * 1. On login  → connectSocket(token) is called
 * 2. The server verifies the token before accepting the connection
 * 3. On logout → disconnectSocket() is called
 * 4. Components use getSocket() to emit/listen to events
 */
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://letschats-shw9.onrender.com";

let socket = null;

/**
 * Connect to the socket server.
 * Safe to call multiple times — will not create duplicate connections.
 */
export const connectSocket = (token) => {
  // Already connected — reuse the existing socket
  if (socket?.connected) return socket;

 socket = io(SOCKET_URL, {
  auth: { token },
  transports: ["polling", "websocket"], // polling pehle, websocket baad mein
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

/** Cleanly close the connection (called on logout) */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Get the current socket instance (may be null before login) */
export const getSocket = () => socket;
