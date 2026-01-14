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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🎫 Fest Entry Verification System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server running on http://localhost:${PORT}
Health check: http://localhost:${PORT}/health

API Endpoints:
  POST /api/scan/verify     - Verify & check-in ticket
  POST /api/scan/validate   - Validate ticket (no check-in)
  GET  /api/scan/stats/:id  - Real-time scan statistics
  
  GET  /api/events          - List events
  POST /api/events          - Create event
  GET  /api/events/:id      - Get event details
  
  POST /api/users           - Create/get user
  GET  /api/users/:id       - Get user details
  
  POST /api/orders          - Create order
  POST /api/orders/:id/pay  - Process payment
  GET  /api/orders/:id      - Get order with QR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
