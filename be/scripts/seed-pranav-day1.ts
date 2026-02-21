import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/db/prisma.ts";
import type { PrismaClient } from "../generated/prisma/client.js";
import { generateQRCode } from "../src/utils/qr-code.ts";
import { generateStyledQRImage } from "../src/utils/qr-image.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_DIR = path.resolve(__dirname, "../../QRs");

const ORDERS_PER_EVENT = 50;
const EVENTS_TO_SEED = ["PRANAV", "DAY_1"];

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg1 = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const seg2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `ORD-${seg1}-${seg2}`;
}

function generateEmail(index: number, eventToken: string): string {
  const prefix = eventToken.toLowerCase().replace(/_/g, "");
  return `participant${index + 1}.${prefix}@vitapstudent.ac.in`;
}

function generateName(index: number): string {
  const firstNames = ["Aarav", "Aditi", "Aisha", "Akash", "Ananya", "Arjun", "Bhavya", "Chetan"];
  const lastNames = ["Sharma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Nair", "Joshi"];
  return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
}

async function main() {
  const db = prisma as unknown as PrismaClient;
  const now = BigInt(Date.now());

  console.log("=== Finding target events ===");
  const targetEvents = await db.event.findMany({
    where: { accessToken: { in: EVENTS_TO_SEED } }
  });

  if (targetEvents.length === 0) {
    throw new Error("No events found. You might need to run seed.ts first.");
  }

  const eventIds = targetEvents.map(e => e.id);

  console.log("=== Step 1: Deleting existing orders for these events ===");
  await db.scanLog.deleteMany({ where: { eventId: { in: eventIds } } });
  await db.order.deleteMany({ where: { eventId: { in: eventIds } } });

  console.log("=== Step 2: Creating new orders & QR codes ===");
  
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }

  let totalOrders = 0;

  for (const event of targetEvents) {
    const folderName = event.accessToken === "PRANAV" ? "Pranav Sharma" : "Day 1";
    const folderPath = path.join(QR_DIR, folderName);
    
    // Clear out old QRs for this event if they exist
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true });
    }
    fs.mkdirSync(folderPath, { recursive: true });

    for (let i = 0; i < ORDERS_PER_EVENT; i++) {
      const orderId = generateOrderId();
      const email = generateEmail(i, event.accessToken || "unknown");
      const name = generateName(i);

      let user = await db.user.findFirst({ where: { email } });
      if (!user) {
        user = await db.user.create({
          data: { email, name, college: "VIT-AP", createdAt: now },
        });
      }

      await db.order.create({
        data: {
          orderId,
          userId: user.id,
          eventId: event.id,
          quantity: 1,
          totalAmount: 0,
          paymentStatus: "paid",
          checkedIn: false,
          accessTokens: [event.accessToken || ""],
          productMeta: `${event.name} - ${name}`,
          createdAt: now,
          updatedAt: now,
        },
      });

      const qrToken = generateQRCode({ orderId });
      const pngBuffer = await generateStyledQRImage(qrToken);

      const filePath = path.join(folderPath, `${orderId}.png`);
      fs.writeFileSync(filePath, pngBuffer);

      totalOrders++;
    }

    console.log(`  Generated 50 styled tickets for ${event.name}`);
  }

  console.log(`\n=== Done! Created ${totalOrders} tickets in total. ===`);
}

main()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
