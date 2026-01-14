import { createApp } from "./app.js";

const app = createApp();
const PORT = process.env.PORT || 3001;

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
