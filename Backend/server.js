/**
 * Main Server Entry Point
 *
 * Architecture:
 * Express handles HTTP requests (REST API)
 * Socket.IO handles real-time WebSocket connections
 * Both run on the same HTTP server for simplicity
 */
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("Current directory:", __dirname);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("NODE_ENV:", process.env.NODE_ENV);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { setupSocket } = require("./sockets/socketHandlers");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// Connect to MongoDB
connectDB();

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173","https://letschats-1.onrender.com",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// ─── API ROUTES ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "ChatApp API is running" });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be LAST middleware)
app.use(errorHandler);

// ─── HTTP + SOCKET.IO SERVER ───────────────────────────────────
// We create an HTTP server manually so Socket.IO can attach to it
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // Disconnect after 60s of no response
});

// Initialize all socket event handlers
setupSocket(io);

// ─── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
