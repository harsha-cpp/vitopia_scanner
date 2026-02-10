import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "opus-session";
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "opus-fest-auth-secret-2026"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/health"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, AUTH_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
