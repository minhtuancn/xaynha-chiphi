import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/login"];
const apiAuthPrefix = "/api/auth";
const healthPath = "/api/health";
const publicAssets = ["/favicon.ico", "/manifest.json", "/sw.js"];
const publicPrefixes = ["/_next/", "/icons/", "/uploads/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) return;
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return;
  if (publicAssets.includes(pathname)) return;
  if (pathname === "/api/health") return;
  if (publicPaths.some((p) => pathname.startsWith(p))) return;

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|uploads/).*)"],
};