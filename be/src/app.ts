import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import scanRoutes from "./routes/scan.js";
import eventsRoutes from "./routes/events.js";
import ordersRoutes from "./routes/orders.js";
import usersRoutes from "./routes/users.js";
import { errorHandler } from "./middleware/auth.js";

type AppOptions = {
  enableNotFound?: boolean;
};

export const createApp = ({ enableNotFound = true }: AppOptions = {}): express.Express => {
  const app = express();

  // Middleware
  const corsOrigin = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "fest-entry-verification",
    });
  });

  // API Routes
  app.use("/api/scan", scanRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/users", usersRoutes);

  // Error handling
  app.use(errorHandler);

  if (enableNotFound) {
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
      });
    });
  }

  return app;
};
