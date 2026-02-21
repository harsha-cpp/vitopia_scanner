import crypto from "crypto";
import { prisma } from "../src/db/prisma.js";

const QR_SECRET = process.env.JWT_SECRET || "Salt123";

async function main() {
  const orders = await (prisma as any).order.findMany();
  for (const order of orders) {
    const token = crypto
      .createHmac("sha256", QR_SECRET)
      .update(order.orderId)
      .digest("hex")
      .toUpperCase()
      .substring(0, 16);
      
    await (prisma as any).order.update({
      where: { id: order.id },
      data: { qrToken: token }
    });
  }
  console.log(`Updated ${orders.length} orders with 16-char uppercase qrTokens.`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
