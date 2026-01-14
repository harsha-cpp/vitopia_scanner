// @ts-nocheck
// NOTE: Type checking is disabled until `npx convex dev` is run to generate types
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all active events
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
    return events;
  },
});

// Get event by ID
export const getById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

// Get all events (for admin)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

// Create a new event
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    date: v.number(),
    venue: v.string(),
    capacity: v.number(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
    return eventId;
  },
});

// Update event
export const update = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    venue: v.optional(v.string()),
    capacity: v.optional(v.number()),
    price: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(eventId, filteredUpdates);
    return eventId;
  },
});

// Get event stats
export const getStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const paidOrders = allOrders.filter((o) => o.paymentStatus === "paid");
    const checkedInOrders = paidOrders.filter((o) => o.checkedIn);

    return {
      event,
      totalTicketsSold: paidOrders.reduce((sum, o) => sum + o.quantity, 0),
      totalCheckedIn: checkedInOrders.reduce((sum, o) => sum + o.quantity, 0),
      totalRevenue: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      capacityRemaining:
        event.capacity - paidOrders.reduce((sum, o) => sum + o.quantity, 0),
    };
  },
});
