import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import errorHandler from "./middlewares/errorHandler.js";

// Load env vars
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api", limiter);

// Body parser - increased limit for base64 images (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import propertyRoutes from "./modules/properties/property.routes.js";
import roomRoutes from "./modules/rooms/room.routes.js";
import menuRoutes from "./modules/menu/menu.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

// Health / DB-connection check (used by the frontend login screen)
app.get("/api/v1/health", async (req, res) => {
  let dbStatus = "disconnected";
  let dbHost = null;
  let dbName = null;
  let pingOk = false;
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      pingOk = true;
      dbStatus = "connected";
      dbHost = mongoose.connection.host;
      dbName = mongoose.connection.name;
    }
  } catch (err) {
    dbStatus = "error";
  }
  res.status(200).json({
    success: true,
    server: "ok",
    db: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
      ping: pingOk,
      host: dbHost,
      name: dbName,
    },
    time: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Hospitality SaaS API API v1" });
});

// Error Handler (must be last)
app.use(errorHandler);

export default app;
