// @ts-nocheck
// NOTE: Type checking is disabled until `npx convex dev` is run to generate types
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

// Create a new order
export const create = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.isActive) {
      throw new Error("Event is not active");
    }

    // Check capacity
    const existingOrders = await ctx.db
      .query("orders")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const soldTickets = existingOrders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.quantity, 0);

    if (soldTickets + args.quantity > event.capacity) {
      throw new Error("Not enough tickets available");
    }

    const orderId = generateOrderId();
    const totalAmount = event.price * args.quantity;

    const id = await ctx.db.insert("orders", {
      orderId,
      userId: args.userId,
      eventId: args.eventId,
      quantity: args.quantity,
      totalAmount,
      paymentStatus: "pending",
      checkedIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, orderId, totalAmount };
  },
});

// Mark order as paid (simulated payment)
export const markAsPaid = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(order._id, {
      paymentStatus: "paid",
      updatedAt: Date.now(),
    });

    return order._id;
  },
});

// Get order by orderId
export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) return null;

    const event = await ctx.db.get(order.eventId);
    const user = await ctx.db.get(order.userId);

    return { ...order, event, user };
  },
});

// Get order by ID
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    const event = await ctx.db.get(order.eventId);
    const user = await ctx.db.get(order.userId);

    return { ...order, event, user };
  },
});

// Check-in order (called after Redis lock acquired)
export const checkIn = mutation({
  args: {
    orderId: v.string(),
    scannedBy: v.string(),
    gate: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      return { success: false, reason: "not_found" };
    }

    if (order.paymentStatus !== "paid") {
      return { success: false, reason: "not_paid" };
    }

    if (order.checkedIn) {
      return {
        success: false,
        reason: "already_used",
        checkedInAt: order.checkedInAt,
        checkedInBy: order.checkedInBy,
        checkedInGate: order.checkedInGate,
      };
    }

    // Perform check-in
    await ctx.db.patch(order._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
      checkedInBy: args.scannedBy,
      checkedInGate: args.gate,
      updatedAt: Date.now(),
    });

    // Get user and event for response
    const user = await ctx.db.get(order.userId);
    const event = await ctx.db.get(order.eventId);

    return {
      success: true,
      reason: "success",
      order: {
        orderId: order.orderId,
        quantity: order.quantity,
      },
      user: user ? { name: user.name, email: user.email } : null,
      event: event ? { name: event.name, venue: event.venue } : null,
    };
  },
});

// Validate order without checking in
export const validate = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      return { valid: false, reason: "not_found" };
    }

    if (order.paymentStatus !== "paid") {
      return { valid: false, reason: "not_paid" };
    }

    if (order.checkedIn) {
      return {
        valid: false,
        reason: "already_used",
        checkedInAt: order.checkedInAt,
      };
    }

    const event = await ctx.db.get(order.eventId);
    const user = await ctx.db.get(order.userId);

    return {
      valid: true,
      reason: "valid",
      order: {
        orderId: order.orderId,
        quantity: order.quantity,
        eventId: order.eventId,
      },
      user: user ? { name: user.name } : null,
      event: event ? { name: event.name } : null,
    };
  },
});

// Log a scan attempt
export const logScan = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scanLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get recent scan logs for an event
export const getScanLogs = query({
  args: {
    eventId: v.id("events"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("scanLogs")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(args.limit ?? 100);

    return logs;
  },
});
