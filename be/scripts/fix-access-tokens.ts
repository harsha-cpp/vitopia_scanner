import "dotenv/config";
import { prisma } from "../src/db/prisma.js";

async function main() {
  const db = prisma as any;
  console.log("Fixing empty accessTokens for DAY_1 orders...");
  
  const day1Event = await db.event.findFirst({ where: { accessToken: "DAY_1" } });
  if (!day1Event) throw new Error("DAY_1 event not found");

  const orders = await db.order.findMany({
    where: { eventId: day1Event.id }
  });

  let fixed = 0;
  for (const order of orders) {
    if (!order.accessTokens || order.accessTokens.length === 0 || !order.accessTokens.includes("DAY_1")) {
      const newTokens = [...(order.accessTokens || [])];
      if (!newTokens.includes("DAY_1")) {
        newTokens.push("DAY_1");
      }
      await db.order.update({
        where: { id: order.id },
        data: { accessTokens: newTokens }
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} orders.`);
}

main().catch(console.error).finally(() => process.exit(0));
