import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores registered users
  users: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    college: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Events table - stores fest events
  events: defineTable({
    name: v.string(),
    description: v.string(),
    date: v.number(), // timestamp
    venue: v.string(),
    capacity: v.number(),
    price: v.number(), // in cents/paise
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_date", ["date"]),

  // Orders table - stores ticket purchases
  orders: defineTable({
    orderId: v.string(), // unique order ID for QR
    userId: v.id("users"),
    eventId: v.id("events"),
    quantity: v.number(),
    totalAmount: v.number(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    // Check-in status
    checkedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
    checkedInBy: v.optional(v.string()), // gate/volunteer identifier
    checkedInGate: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"])
    .index("by_eventId_checkedIn", ["eventId", "checkedIn"]),

  // Scan logs - audit trail of all scan attempts
  scanLogs: defineTable({
    orderId: v.string(),
    eventId: v.id("events"),
    scanResult: v.union(
      v.literal("success"),
      v.literal("already_used"),
      v.literal("invalid"),
      v.literal("not_found"),
      v.literal("wrong_event"),
      v.literal("not_paid")
    ),
    scannedBy: v.string(),
    gate: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_eventId", ["eventId"])
    .index("by_timestamp", ["timestamp"]),

  // Gates table - registered scanning gates
  gates: defineTable({
    gateId: v.string(),
    name: v.string(),
    eventId: v.id("events"),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_gateId", ["gateId"])
    .index("by_eventId", ["eventId"]),
});
