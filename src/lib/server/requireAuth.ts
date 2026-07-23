import { getAdminAuth, isFirebaseAdminConfigured } from "./firebaseAdmin";
import { rateLimit, RATE_LIMITS } from "./rateLimit";

export type AuthOk = { uid: string; email?: string };

export type AuthFail = {
  response: Response;
};

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function requireFirebaseUser(
  req: Request,
): Promise<AuthOk | AuthFail> {
  if (!isFirebaseAdminConfigured()) {
    return {
      response: Response.json(
        {
          error:
            "Server auth is not configured. Set Firebase Admin credentials.",
        },
        { status: 503 },
      ),
    };
  }

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return {
      response: Response.json(
        { error: "Sign in required." },
        { status: 401 },
      ),
    };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return {
      response: Response.json(
        { error: "Sign in required." },
        { status: 401 },
      ),
    };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return {
      response: Response.json(
        { error: "Invalid or expired session. Sign in again." },
        { status: 401 },
      ),
    };
  }
}

export function enforceRateLimit(
  req: Request,
  uid: string,
  kind: keyof typeof RATE_LIMITS,
): AuthFail | null {
  const cfg = RATE_LIMITS[kind];
  const result = rateLimit(`${kind}:${uid}`, cfg.limit, cfg.windowMs);
  if (result.ok) return null;

  // Also touch IP bucket so anonymous scanners don't share one uid forever
  rateLimit(`${kind}:ip:${clientIp(req)}`, cfg.limit, cfg.windowMs);

  return {
    response: Response.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSec) },
      },
    ),
  };
}
