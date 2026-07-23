import { rateLimit } from "@/lib/server/rateLimit";
import {
  checkIfraCompliance,
  IFRA_PRODUCT_CATEGORIES,
  type IfraProductCategoryId,
} from "@/domains/chemistry/ifra";
import type { VesselContent } from "@/types";

export const maxDuration = 10;

const CATEGORY_IDS = new Set(
  IFRA_PRODUCT_CATEGORIES.map((c) => c.id),
);

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * POST /api/ifra/check — optional auth; teaching IFRA screen.
 * Body: { contents: VesselContent[], category?: IfraProductCategoryId }
 */
export async function POST(req: Request) {
  const limited = rateLimit(
    `ifra-check:ip:${clientIp(req)}`,
    60,
    60_000,
  );
  if (!limited.ok) {
    return Response.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: { contents?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.contents)) {
    return Response.json(
      { error: "contents must be an array of { chemicalId, amountMl }" },
      { status: 400 },
    );
  }

  const contents: VesselContent[] = [];
  for (const raw of body.contents.slice(0, 40)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as { chemicalId?: unknown; amountMl?: unknown };
    if (typeof row.chemicalId !== "string" || !row.chemicalId.trim()) continue;
    const amount =
      typeof row.amountMl === "number" && Number.isFinite(row.amountMl)
        ? Math.max(0, Math.min(500, row.amountMl))
        : 0;
    contents.push({ chemicalId: row.chemicalId.trim(), amountMl: amount });
  }

  let category: IfraProductCategoryId = "cat4";
  if (typeof body.category === "string" && CATEGORY_IDS.has(body.category as IfraProductCategoryId)) {
    category = body.category as IfraProductCategoryId;
  }

  const result = checkIfraCompliance({ contents, category });
  return Response.json(result);
}
