import 'dotenv/config';
import { prisma } from '../src/db/prisma.js';

async function main() {
  const nullRegistrationCount = await (prisma as any).order.count({
    where: { registrationId: null }
  });
  const zeroAmountCount = await (prisma as any).order.count({
    where: { totalAmount: 0 }
  });
  console.log(`Orders with null registrationId: ${nullRegistrationCount}`);
  console.log(`Orders with totalAmount = 0: ${zeroAmountCount}`);
  
  const oldOrders = await (prisma as any).order.findMany({
    where: { registrationId: null },
    take: 2
  });
  console.log("Sample old orders:", JSON.stringify(oldOrders, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
