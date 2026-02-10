import { Router, Request, Response } from "express";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";
import { loadConvexApi } from "../utils/convex-api.js";

const router: Router = Router();

let _convex: ConvexHttpClient | null = null;
const getConvex = () => {
  if (!_convex) {
    const url = process.env.CONVEX_URL;
    if (!url) throw new Error("CONVEX_URL environment variable is required");
    _convex = new ConvexHttpClient(url);
  }
  return _convex;
};

const getApi = async () => loadConvexApi();

const DASHBOARD_PIN = process.env.DASHBOARD_PIN || "260226";
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const rateLimitMap = new Map<string, { attempts: number; firstAttempt: number }>();
const activeTokens = new Set<string>();

function cleanupRateLimit(ip: string) {
  const entry = rateLimitMap.get(ip);
  if (entry && Date.now() - entry.firstAttempt > LOCKOUT_WINDOW_MS) {
    rateLimitMap.delete(ip);
  }
}

router.post("/auth", (req: Request, res: Response) => {
  const { pin } = req.body;
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  cleanupRateLimit(ip);

  const entry = rateLimitMap.get(ip);
  if (entry && entry.attempts >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - entry.firstAttempt;
    const retryAfter = Math.ceil((LOCKOUT_WINDOW_MS - elapsed) / 1000);
    res.status(429).json({
      success: false,
      error: "Too many attempts. Try again later.",
      retryAfter,
    });
    return;
  }

  if (!pin || typeof pin !== "string" || pin.length !== 6) {
    res.status(400).json({ success: false, error: "A 6-digit PIN is required" });
    return;
  }

  if (pin !== DASHBOARD_PIN) {
    const current = rateLimitMap.get(ip) || { attempts: 0, firstAttempt: Date.now() };
    current.attempts++;
    rateLimitMap.set(ip, current);

    const remaining = MAX_ATTEMPTS - current.attempts;
    res.status(401).json({
      success: false,
      error: "Incorrect PIN",
      attemptsRemaining: remaining,
    });
    return;
  }

  rateLimitMap.delete(ip);

  const token = crypto.randomUUID();
  activeTokens.add(token);
  setTimeout(() => activeTokens.delete(token), TOKEN_TTL_MS);

  res.json({ success: true, token });
});

function requireDashboardToken(req: Request, res: Response): boolean {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Authorization required" });
    return false;
  }
  const token = auth.slice(7);
  if (!activeTokens.has(token)) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
    return false;
  }
  return true;
}

router.get("/data", async (req: Request, res: Response) => {
  if (!requireDashboardToken(req, res)) return;

  try {
    const api = await getApi();
    const data = await getConvex().query(api.orders.getDashboardData, {});
    res.json({ success: true, data });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard data" });
  }
});

export default router;
