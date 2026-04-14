import app from "./app.js";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Create HTTP server for Socket.io
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

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
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
app.locals.io = io;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
