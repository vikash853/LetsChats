const path = require('path');
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors    = require("cors");
const connectDB      = require("./config/db");
const errorHandler   = require("./middleware/errorHandler");
const { setupSocket } = require("./sockets/socketHandlers");
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes      = require("./routes/messageRoutes");
const uploadRoutes       = require("./routes/uploadRoutes");

connectDB();
const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://letschats-1.onrender.com",
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/upload",        uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "ChatApp API is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  transports: ["polling", "websocket"],
  path: "/socket.io/",
});

setupSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
