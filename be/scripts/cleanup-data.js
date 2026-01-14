import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const { ConvexHttpClient } = require("convex/browser");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve("/home/kaizen/opus-fest/be/.env") });

const { api } = await import("../convex/_generated/api.js");

const convexUrl = process.env.CONVEX_URL;

if (!convexUrl) {
  console.error("Missing CONVEX_URL in .env");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

console.log("Running data cleanup...");
console.log("- Setting event price to 700");
console.log("- Removing college/phone from users");
console.log("- Removing checkedInGate from orders");
console.log("- Marking Day1 orders as checkedIn");

const result = await client.mutation(api.orders.adjustVitopiaSeed, {});

console.log("\nDone!");
console.log(`Day1 Event: ${result.day1EventId}`);
console.log(`Day2 Event: ${result.day2EventId}`);
console.log(`Day1 Orders updated: ${result.day1Orders.length}`);
