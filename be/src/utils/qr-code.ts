import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

export interface QRPayload {
  orderId: string;
  // Legacy fields — kept optional for backward compat with old tokens
  eventId?: string;
  userId?: string;
  quantity?: number;
  issuedAt?: number;
  expiresAt?: number;
}

export function generateQRCode(data: { orderId: string }): string {
  return jwt.sign({ orderId: data.orderId }, JWT_SECRET, {
    algorithm: "HS256",
    noTimestamp: true,
  });
}

/**
 * Verify and decode a QR code
 */
export function verifyQRCode(token: string): {
  valid: boolean;
  payload?: QRPayload;
  error?: string;
} {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as QRPayload;

    // Check expiration for legacy tokens that have expiresAt
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return { valid: false, error: "Expired QR" };
    }

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: "Invalid QR" };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: "Expired QR" };
    }
    return { valid: false, error: "Invalid QR" };
  }
}

/**
 * Extract order ID from QR code without full verification
 * Used for quick lookups
 */
export function extractOrderId(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as QRPayload | null;
    return decoded?.orderId || null;
  } catch {
    return null;
  }
}
