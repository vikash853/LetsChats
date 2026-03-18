import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://letschats-shw9.onrender.com";

let socket = null;

export const connectSocket = (token) => {
  // Disconnect stale socket first
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
    forceNew: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
    // Auto reconnect on server disconnect
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
