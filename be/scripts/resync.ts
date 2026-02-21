import "dotenv/config";
import { prisma as basePrisma } from "../src/db/prisma.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { syncRegistrations } from "../src/jobs/vtopiaSync.js";

const prisma = basePrisma as unknown as PrismaClient;

type EventSeedDefinition = {
  token: string;
  name: string;
  description: string;
  venue: string;
  date: string;
  category: "day" | "speaker" | "distribution";
  scanOrder: number;
};

const EVENT_SEEDS: EventSeedDefinition[] = [
  {
    token: "DAY_1",
    name: "Vitopia2026-Day1",
    description: "VITopia 2026 - Day 1",
    venue: "VIT-AP Campus",
    date: "2026-02-22T10:00:00+05:30",
    category: "day",
    scanOrder: 1,
  },
  {
    token: "DAY_2",
    name: "Vitopia2026-Day2",
    description: "VITopia 2026 - Day 2",
    venue: "VIT-AP Campus",
    date: "2026-02-23T10:00:00+05:30",
    category: "day",
    scanOrder: 2,
  },
  {
    token: "DAY_3",
    name: "Vitopia2026-Day3",
    description: "VITopia 2026 - Day 3",
    venue: "VIT-AP Campus",
    date: "2026-02-24T10:00:00+05:30",
    category: "day",
    scanOrder: 3,
  },
  {
    token: "PRANAV",
    name: "Mr. Pranav Sharma on 22 Feb 2026 from 2.30 PM to 3.30 PM",
    description: "Speaker Event - Mr. Pranav Sharma",
    venue: "VIT-AP Campus",
    date: "2026-02-22T14:30:00+05:30",
    category: "speaker",
    scanOrder: 4,
  },
  {
    token: "UDAYA",
    name: "Mr. Sarat Raja Uday Boddeda on 23rd Feb 2026 from 2.30 PM to 3.30 PM",
    description: "Speaker Event - Mr. Sarat Raja Uday Boddeda",
    venue: "VIT-AP Campus",
    date: "2026-02-23T14:30:00+05:30",
    category: "speaker",
    scanOrder: 5,
  },
  {
    token: "TSHIRT",
    name: "VITopia 2026 T-Shirt Distribution",
    description: "T-Shirt Distribution Counter",
    venue: "VIT-AP Campus",
    date: "2026-02-24T09:00:00+05:30",
    category: "distribution",
    scanOrder: 6,
  },
];

async function main() {
  console.log("=== Step 1: Clearing ALL existing data ===");
  await prisma.scanLog.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.gate.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database cleared.");

  console.log("=== Step 2: Seeding canonical events ===");
  const now = BigInt(Date.now());

  for (const def of EVENT_SEEDS) {
    await prisma.event.create({
      data: {
        name: def.name,
        description: def.description,
        date: BigInt(new Date(def.date).getTime()),
        venue: def.venue,
        capacity: 10000,
        price: 0,
        isActive: true,
        accessToken: def.token,
        category: def.category,
        scanOrder: def.scanOrder,
        createdAt: now,
      },
    });
    console.log(`  Created event: ${def.name} [${def.token}]`);
  }

  console.log("=== Step 3: Seeding 40 scanner gates ===");
  const day1Event = await prisma.event.findFirst({
    where: { accessToken: "DAY_1" },
  });
  if (!day1Event) throw new Error("DAY_1 event not found after seeding");

  const commonSecret = "v2026";
  for (let i = 1; i <= 20; i++) {
    await prisma.gate.create({
      data: {
        gateId: `M-${i.toString().padStart(2, "0")}`,
        name: `Male Scanner ${i}`,
        secret: commonSecret,
        gender: "M",
        eventId: day1Event.id,
        isActive: true,
        createdAt: now,
      },
    });
  }
  for (let i = 1; i <= 20; i++) {
    await prisma.gate.create({
      data: {
        gateId: `F-${i.toString().padStart(2, "0")}`,
        name: `Female Scanner ${i}`,
        secret: commonSecret,
        gender: "F",
        eventId: day1Event.id,
        isActive: true,
        createdAt: now,
      },
    });
  }
  console.log("Seeded 40 scanner gates.");

  console.log("=== Step 4: Syncing registrations from VTOPIA API ===");
  await syncRegistrations();

  console.log("=== Done ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Resync failed:", err);
  process.exit(1);
});
