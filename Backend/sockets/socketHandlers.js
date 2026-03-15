/**
 * Socket.IO Event Handlers
 *
 * HOW SOCKET.IO WORKS IN THIS PROJECT:
 * 1. When a user logs in, the frontend connects to Socket.IO server
 * 2. The user "joins" their personal room (their userId) and all their conversation rooms
 * 3. When they send a message via the API, the server emits it to the conversation room
 * 4. All users in that room receive the message in real-time
 * 5. Typing indicators, online status, and read receipts also use socket events
 */
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Track connected users: { userId: socketId }
const connectedUsers = new Map();

const setupSocket = (io) => {
  /**
   * Middleware: Authenticate socket connection using JWT
   * This runs before the "connection" event
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket for use in event handlers
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // ─── ONLINE STATUS ──────────────────────────────────────────
    // Add user to connected users map
    connectedUsers.set(userId, socket.id);

    // Update DB: mark user as online and save socket ID
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Broadcast to all clients that this user is now online
    socket.broadcast.emit("user:online", {
      userId,
      username: socket.user.username,
    });

    // Send the current online users list to the newly connected user
    const onlineUserIds = Array.from(connectedUsers.keys());
    socket.emit("users:online-list", onlineUserIds);

    // ─── JOIN CONVERSATION ROOMS ─────────────────────────────────
    // Each conversation has its own room. Users join rooms to receive messages.
    socket.on("join:conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.username} joined room: ${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // ─── NEW MESSAGE ─────────────────────────────────────────────
    // When a message is sent via REST API, the controller emits this event
    // We use a helper function (emitMessage) to broadcast to the room
    socket.on("message:send", (data) => {
      // Broadcast to all users in the conversation room EXCEPT the sender
      socket.to(data.conversationId).emit("message:received", data.message);
    });

    // ─── TYPING INDICATORS ──────────────────────────────────────
    socket.on("typing:start", ({ conversationId, username }) => {
      socket.to(conversationId).emit("typing:start", { userId, username });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", { userId });
    });

    // ─── MESSAGE READ RECEIPTS ───────────────────────────────────
    socket.on("message:read", ({ conversationId, readBy }) => {
      socket.to(conversationId).emit("message:read", { conversationId, readBy });
    });

    // ─── DIRECT MESSAGE TO SPECIFIC USER ─────────────────────────
    // Useful for sending notifications to a specific user
    socket.on("message:direct", ({ recipientId, event, data }) => {
      const recipientSocketId = connectedUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(event, data);
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      connectedUsers.delete(userId);

      // Update DB: mark user as offline
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null,
      });

      // Notify others this user went offline
      socket.broadcast.emit("user:offline", {
        userId,
        lastSeen: new Date(),
      });
    });
  });
};

// Helper to get socket ID of a user (used by controllers if needed)
const getUserSocketId = (userId) => connectedUsers.get(userId.toString());

module.exports = { setupSocket, getUserSocketId };
