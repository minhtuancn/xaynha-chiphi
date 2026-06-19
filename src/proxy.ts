import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import { loginLimiter } from "@/lib/rate-limit";

const publicPaths = ["/login"];
const apiAuthPrefix = "/api/auth";
const healthPath = "/api/health";
const publicAssets = ["/favicon.ico", "/manifest.json", "/sw.js"];
const publicPrefixes = ["/_next/", "/icons/", "/uploads/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Rate limit login POST only
  if (pathname === '/login' && req.method === 'POST') {
    const limitResponse = loginLimiter(req);
    if (limitResponse) return limitResponse;
  }

  if (pathname.startsWith("/api/auth")) return;
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return;
  if (publicAssets.includes(pathname)) return;
  if (pathname === "/api/health") return;
  if (publicPaths.some((p) => pathname.startsWith(p))) return;

  if (!req.auth) {
    const base = process.env.NEXTAUTH_URL || req.url;
    const loginUrl = new URL("/login", base);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|uploads/).*)"],
};