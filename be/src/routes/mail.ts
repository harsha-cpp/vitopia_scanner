import { Router, Request, Response } from "express";
import { sendTicketEmail } from "../utils/mail.js";

const router: Router = Router();

router.post("/send", async (req: Request, res: Response) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ success: false, error: "orderIds array is required" });
    return;
  }

  const CHUNK_SIZE = 10;
  const results: { orderId: string; status: "sent" | "failed"; error?: string }[] = [];

  for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
    const chunk = orderIds.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (orderId) => {
      try {
        await sendTicketEmail(orderId);
        return { orderId, status: "sent" as const };
      } catch (err: any) {
        return { orderId, status: "failed" as const, error: err.message || "Unknown error" };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  res.json({ success: true, data: { sent, failed, results } });
});

export default router;
