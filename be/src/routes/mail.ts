import { Router, Request, Response } from "express";
import { sendTicketEmail } from "../utils/mail.js";
import * as ordersRepo from "../db/orders.js";

const router: Router = Router();

router.post("/send", async (req: Request, res: Response) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ success: false, error: "orderIds array is required" });
    return;
  }

  const results: { orderId: string; status: "sent" | "failed"; error?: string }[] = [];

  for (const orderId of orderIds) {
    try {
      await sendTicketEmail(orderId);
      results.push({ orderId, status: "sent" });
    } catch (err: any) {
      results.push({ orderId, status: "failed", error: err.message || "Unknown error" });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  res.json({ success: true, data: { sent, failed, results } });
});

export default router;
