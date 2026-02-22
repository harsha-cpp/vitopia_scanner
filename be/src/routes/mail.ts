import { Router, Request, Response } from "express";
import { sendTicketEmail } from "../utils/mail.js";

const router: Router = Router();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

router.post("/send", async (req: Request, res: Response) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ success: false, error: "orderIds array is required" });
    return;
  }

  // Resend rate limit: ~2-10 emails/sec depending on plan.
  // Send 2 concurrently with 1s gap between chunks to stay safe.
  const CHUNK_SIZE = 2;
  const CHUNK_DELAY_MS = 1000;
  const results: { orderId: string; status: "sent" | "failed"; error?: string }[] = [];

  for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
    const chunk = orderIds.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (orderId) => {
        try {
          await sendTicketEmail(orderId);
          return { orderId, status: "sent" as const };
        } catch (err: any) {
          return { orderId, status: "failed" as const, error: err.message || "Unknown error" };
        }
      })
    );
    results.push(...chunkResults);

    if (i + CHUNK_SIZE < orderIds.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0 && failed.length < orderIds.length) {
    console.log(`[Mail] Retrying ${failed.length} failed emails...`);
    await sleep(3000);

    for (const entry of failed) {
      try {
        await sendTicketEmail(entry.orderId);
        entry.status = "sent";
        delete entry.error;
      } catch (err: any) {
        entry.error = err.message || "Retry failed";
      }
      await sleep(CHUNK_DELAY_MS);
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  res.json({ success: true, data: { sent, failed: failedCount, results } });
});

export default router;
