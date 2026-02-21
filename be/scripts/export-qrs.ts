import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/db/prisma.js";
import { generateStyledQRImage } from "../src/utils/qr-image.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../QRs/exported");
const OLD_DIR = path.resolve(__dirname, "../../QRs");

async function exportEventQRs(token: string, limit: number) {
  const event = await (prisma as any).event.findUnique({ where: { accessToken: token } });
  if (!event) {
    console.error(`Event ${token} not found`);
    return;
  }

  const orders = await (prisma as any).order.findMany({
    where: { eventId: event.id, paymentStatus: 'paid' },
    take: limit,
    include: { user: true }
  });

  console.log(`Found ${orders.length} orders for ${token}`);
  const dir = path.join(OUT_DIR, token);
  fs.mkdirSync(dir, { recursive: true });

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (!order.qrToken) {
      console.log(`Skipping order ${order.orderId}, no qrToken`);
      continue;
    }
    
    try {
      const buffer = await generateStyledQRImage(order.qrToken);
      const safeName = (order.user?.name || "Unknown").replace(/[^a-z0-9]/gi, '_');
      const filename = `${String(i + 1).padStart(2, '0')}_${safeName}_${order.orderId}.png`;
      fs.writeFileSync(path.join(dir, filename), buffer);
    } catch (e) {
      console.error(`Failed to generate QR for order ${order.orderId}`, e);
    }
  }
  console.log(`✅ Exported QRs for ${token} to ${dir}`);
}

async function main() {
  console.log("Cleaning old QRs...");
  if (fs.existsSync(OLD_DIR)) {
    fs.rmSync(OLD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Starting QR export...");
  await exportEventQRs("DAY_1", 50);
  await exportEventQRs("PRANAV", 50);
  console.log("Done!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
