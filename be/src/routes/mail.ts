import { Router, Request, Response } from "express";
import { sendTicketEmailsBatch } from "../utils/mail.js";

const router: Router = Router();

router.post("/send", async (req: Request, res: Response) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ success: false, error: "orderIds array is required" });
    return;
  }

  const results = await sendTicketEmailsBatch(orderIds);

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  res.json({ success: true, data: { sent, failed, results } });
});

export default router;
