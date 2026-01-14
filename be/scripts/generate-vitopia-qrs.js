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
  console.error("Missing CONVEX_URL in /home/kaizen/opus-fest/be/.env");
  process.exit(1);
}

if (!jwtSecret) {
  console.error("Missing JWT_SECRET in /home/kaizen/opus-fest/be/.env");
  process.exit(1);
}

const outputDir = "/home/kaizen/opus-fest/QRs";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const client = new ConvexHttpClient(convexUrl);

const result = await client.mutation(api.orders.adjustVitopiaSeed, {});

for (const order of result.day1Orders) {
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
}

console.log(`Generated ${result.day1Orders.length} QR codes in ${outputDir}`);
