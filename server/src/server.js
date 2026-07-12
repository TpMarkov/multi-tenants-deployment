import app from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Resolve allowed CORS origins (supports comma-separated list)
const parseOrigins = (value) => {
  if (!value) return "http://localhost:3000";
  const origins = value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
};
const CORS_ORIGIN = parseOrigins(process.env.CORS_ORIGIN);

// Track MongoDB connection status for startup logging
let mongoStatus = "disconnected";
mongoose.connection.on("connecting", () => {
  mongoStatus = "connecting...";
});
mongoose.connection.on("connected", () => {
  mongoStatus = "connected";
});
mongoose.connection.on("disconnected", () => {
  mongoStatus = "disconnected";
});
mongoose.connection.on("error", () => {
  mongoStatus = "error";
});

// Connect to database
connectDB();

// Create HTTP server for Socket.io
const server = createServer(app);

// Track Socket.IO readiness for startup logging
let socketReady = false;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  if (NODE_ENV === "production") {
    console.log(`User connected: ${socket.id}`);
  } else {
    console.log(`✅ User connected: ${socket.id}`);
  }

  // Listen for custom events
  socket.on("order:created", (data) => {
    console.log("📦 Order created:", data);
    io.emit("order:created", data); // Broadcast to all connected clients
  });

  socket.on("order:updated", (data) => {
    console.log("📝 Order updated:", data);
    io.emit("order:updated", data);
  });

  socket.on("order:voided", (data) => {
    console.log("❌ Order voided:", data);
    io.emit("order:voided", data);
  });

  socket.on("disconnect", () => {
    if (NODE_ENV === "production") {
      console.log(`User disconnected: ${socket.id}`);
    } else {
      console.log(`❌ User disconnected: ${socket.id}`);
    }
  });
});

// Export io for use in other modules
app.locals.io = io;
socketReady = true;

server.listen(PORT, () => {
  console.log("==================== SERVER STARTUP ====================");
  console.log(`Timestamp:        ${new Date().toISOString()}`);
  console.log(`NODE_ENV:         ${NODE_ENV}`);
  console.log(`PORT:             ${PORT}`);
  console.log(`MongoDB:          ${mongoStatus}`);
  console.log(`Socket.IO:        ${socketReady ? "ready" : "initializing"}`);
  console.log(`CORS origins:     ${JSON.stringify(CORS_ORIGIN)}`);
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log("=======================================================");
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    server.close(() => {
      console.log("HTTP server closed.");
    });
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  } catch (err) {
    console.error("Error during shutdown:", err);
  } finally {
    console.log("Process exiting.");
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error(err);
  if (err && err.stack) {
    console.error(err.stack);
  }
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:");
  console.error(err);
  if (err && err.stack) {
    console.error(err.stack);
  }
  server.close(() => process.exit(1));
});
