import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import errorHandler from "./middlewares/errorHandler.js";

// Load env vars
dotenv.config();

const app = express();

// Trust the Render proxy (terminates TLS, sets X-Forwarded-* headers)
app.set("trust proxy", 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "same-origin" },
    hsts: {
      maxAge: 60 * 60 * 24 * 365,
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(
  cors({
    origin: function (origin, callback) {
      const isDev = process.env.NODE_ENV !== "production";

      const devOrigins = ["http://localhost:3000", "http://localhost:3001"];
      const envOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : [];

      const allowedOrigins = isDev
        ? [...new Set([...envOrigins, ...devOrigins])]
        : envOrigins;

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Compression
app.use(compression());

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api", limiter);

// Stricter rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/auth/login", loginLimiter);

// Body parser - increased limit for base64 images (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else if (process.env.NODE_ENV === "development") {
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

// Render health check endpoint
app.get("/health", async (req, res) => {
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
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

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
