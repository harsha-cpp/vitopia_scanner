import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "opus-session";

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "opus-fest-auth-secret-2026"
);

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(AUTH_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload;
  } catch {
    return null;
  }
}
