import { NextResponse } from 'next/server';

const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 300_000);

function checkRateLimit(request: Request, maxRequests: number, windowMs: number): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const key = `rl:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } }
    );
  }

  return null;
}

export function loginLimiter(request: Request): NextResponse | null {
  return checkRateLimit(request, 5, 15 * 60 * 1000);
}

/**
 * Rate limiter for FAILED credential attempts, keyed by IP + email so
 * legitimate logins are never blocked and attackers cannot brute-force a
 * specific account. Returns true when the attempt should be blocked.
 */
export function isLoginBlocked(request: Request, email: string): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = "loginfail:" + ip + ":" + email.toLowerCase();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxFailures = 10;

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxFailures;
}

/** Reset the failure counter after a successful login for that key. */
export function resetLoginFailures(request: Request, email: string): void {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  store.delete("loginfail:" + ip + ":" + email.toLowerCase());
}
