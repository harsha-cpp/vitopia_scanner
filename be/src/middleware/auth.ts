import { Request, Response, NextFunction } from "express";
import { getRedisLockManager } from "../utils/redis-lock.js";

/**
 * Rate limiting middleware for scan endpoints
 */
export function rateLimitMiddleware(maxPerMinute: number = 100) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const gateId = req.headers["x-gate-id"] as string || "default";
    const lockManager = getRedisLockManager();

    const isLimited = await lockManager.isRateLimited(gateId, maxPerMinute);
    
    if (isLimited) {
      res.status(429).json({
        success: false,
        error: "Too many requests. Please slow down.",
        code: "RATE_LIMITED",
      });
      return;
    }

    await lockManager.recordScanAttempt(gateId);
    next();
  };
}

/**
 * Gate authentication middleware
 */
export function gateAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const gateId = req.headers["x-gate-id"] as string;
  const gateSecret = req.headers["x-gate-secret"] as string;

  // In production, verify gate credentials against database
  // For now, just check if headers are present
  if (!gateId) {
    res.status(401).json({
      success: false,
      error: "Gate ID is required",
      code: "MISSING_GATE_ID",
    });
    return;
  }

  // Attach gate info to request
  (req as any).gate = { id: gateId, secret: gateSecret };
  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
