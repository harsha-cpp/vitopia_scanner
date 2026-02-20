import 'dotenv/config';
import { prisma } from '../src/db/prisma.js';

async function main() {
  const orders = await (prisma as any).order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(orders, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
