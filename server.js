import connectDB from "./src/configs/db.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
dotenv.config();

import userRoutes from "./src/routes/userRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import savedEventRoutes from "./src/routes/savedEventRoutes.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Support multiple allowed origins via comma-separated env
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting to protect auth and general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      console.log(`Request from origin: ${origin}`);
      
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed origins (exact match or with/without trailing slash)
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        const normalizedAllowed = allowedOrigin.replace(/\/$/, "");
        const normalizedOrigin = origin.replace(/\/$/, "");
        return normalizedAllowed === normalizedOrigin;
      });

      if (isAllowed) {
        console.log(`CORS allowed for: ${origin}`);
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);
      console.error(`Allowed origins: ${allowedOrigins.join(", ")}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

// Connect to the database
connectDB();

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/saved", savedEventRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "API is running",
    environment: process.env.NODE_ENV,
    allowedOrigins: allowedOrigins,
  });
});

// API health check
app.get("/api", (req, res) => {
  res.json({ 
    status: "success",
    message: "Event Listing API",
    version: "1.0.0"
  });
});

app.listen(PORT, () => {
  console.log(`Server is running url  http://localhost:${PORT}`);
});
