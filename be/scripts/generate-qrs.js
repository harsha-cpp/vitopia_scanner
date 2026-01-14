import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { ConvexHttpClient } = require("convex/browser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

dotenv.config({ path: path.resolve("/home/kaizen/opus-fest/be/.env") });

const { api } = await import("../convex/_generated/api.js");

const convexUrl = process.env.CONVEX_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!convexUrl) {
  console.error("Missing CONVEX_URL in .env");
  process.exit(1);
}

if (!jwtSecret) {
  console.error("Missing JWT_SECRET in .env");
  process.exit(1);
}

const outputDir = "/home/kaizen/opus-fest/QRs";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const client = new ConvexHttpClient(convexUrl);

console.log("Fetching Day1 orders...");

// Get Day1 event
const events = await client.query(api.events.listActive, {});
const day1Event = events.find((e) => e.name === "Vitopia2026-Day1");

if (!day1Event) {
  console.error("Vitopia2026-Day1 event not found");
  process.exit(1);
}

// Get orders for Day1
const allOrders = await client.query(api.orders.getScanLogs, {
  eventId: day1Event._id,
  limit: 100,
});

// We need to get orders directly - let's use a different approach
// Query orders by getting user orders
const ordersResult = await client.mutation(api.orders.adjustVitopiaSeed, {});
const orders = ordersResult.day1Orders;

console.log(`Found ${orders.length} Day1 orders`);
console.log("Generating QR codes...\n");

let count = 0;
for (const order of orders) {
  const payload = {
    orderId: order.orderId,
    eventId: order.eventId,
    userId: order.userId,
    quantity: order.quantity,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  };

  const token = jwt.sign(payload, jwtSecret, { algorithm: "HS256" });
  const filename = path.join(outputDir, `${order.orderId}.png`);
  await QRCode.toFile(filename, token, { width: 512, margin: 2 });
  count++;
  process.stdout.write(`\rGenerated ${count}/${orders.length} QR codes`);
}

console.log(`\n\nDone! Generated ${count} QR codes in ${outputDir}`);
