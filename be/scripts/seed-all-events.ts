import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { prisma } from "../src/db/prisma.ts";
import type { PrismaClient } from "../generated/prisma/client.js";
import { generateStyledQRImage } from "../src/utils/qr-image.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_DIR = path.resolve(__dirname, "../../QRs");

const ORDERS_PER_EVENT = 50;

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg1 = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const seg2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `ORD-${seg1}-${seg2}`;
}

function generateEmail(index: number, eventId: string): string {
  const prefix = eventId.substring(0, 8);
  return `participant${index + 1}.${prefix}@vitapstudent.ac.in`;
}

function generateName(index: number): string {
  const firstNames = ["Aarav", "Aditi", "Aisha", "Akash", "Ananya", "Arjun", "Bhavya", "Chetan", "Dev", "Diya", "Esha", "Gaurav", "Isha", "Kabir", "Kavya", "Krish", "Meera", "Neha", "Pranav", "Riya"];
  const lastNames = ["Sharma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Nair", "Joshi", "Verma", "Rao", "Das", "Chowdhury", "Shah", "Mehta", "Bose", "Dutta", "Bhatt", "Menon", "Pillai", "Yadav"];
  return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
}

async function main() {
  const db = prisma as unknown as PrismaClient;
  const now = BigInt(Date.now());

  console.log("=== Finding target events ===");
  const targetEvents = await db.event.findMany();

  if (targetEvents.length === 0) {
    throw new Error("No events found.");
  }

  console.log(`=== Found ${targetEvents.length} events. Deleting existing dummy orders ===`);
  
  const dummyUsers = await db.user.findMany({
    where: { email: { startsWith: 'participant' } },
    select: { id: true }
  });
  const dummyUserIds = dummyUsers.map(u => u.id);

  if (dummyUserIds.length > 0) {
    const dummyOrders = await db.order.findMany({
      where: { userId: { in: dummyUserIds } },
      select: { orderId: true }
    });
    const dummyOrderIds = dummyOrders.map(o => o.orderId);
    
    if (dummyOrderIds.length > 0) {
      await db.scanLog.deleteMany({ where: { orderId: { in: dummyOrderIds } } });
      await db.order.deleteMany({ where: { orderId: { in: dummyOrderIds } } });
    }
    await db.user.deleteMany({ where: { id: { in: dummyUserIds } } });
  }

  console.log("=== Step 2: Creating new orders & QR codes ===");
  
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }

  let totalOrders = 0;

  for (const event of targetEvents) {
    const folderName = event.name.replace(/[^a-zA-Z0-9 -]/g, '').trim();
    const folderPath = path.join(QR_DIR, folderName);
    
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    fs.mkdirSync(folderPath, { recursive: true });

    for (let i = 0; i < ORDERS_PER_EVENT; i++) {
      const orderId = generateOrderId();
      const email = generateEmail(i, event.id);
      const name = generateName(i);

      let user = await db.user.findFirst({ where: { email } });
      if (!user) {
        user = await db.user.create({
          data: { email, name, college: "VIT-AP", createdAt: now },
        });
      }

      const qrToken = crypto.createHmac("sha256", process.env.JWT_SECRET || "Salt123").update(orderId).digest("hex").toUpperCase().substring(0, 16);

      await db.order.create({
        data: {
          orderId,
          qrToken,
          userId: user.id,
          eventId: event.id,
          quantity: 1,
          totalAmount: 0,
          paymentStatus: "paid",
          checkedIn: false,
          accessTokens: event.accessToken ? [event.accessToken] : [],
          productMeta: `${event.name} - ${name}`,
          createdAt: now,
          updatedAt: now,
        },
      });

      const pngBuffer = await generateStyledQRImage(qrToken);
      const filePath = path.join(folderPath, `${orderId}.png`);
      fs.writeFileSync(filePath, pngBuffer);

      totalOrders++;
    }

    console.log(`  Generated ${ORDERS_PER_EVENT} QRs for [${event.name}]`);
  }

  console.log(`\n=== Done! Created ${totalOrders} tickets across ${targetEvents.length} events. QRs are in ${QR_DIR} ===`);
}

main()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as unknown as PrismaClient).$disconnect();
    process.exit(0);
  });
