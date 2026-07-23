import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";
import { rateLimit } from "@/lib/server/rateLimit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  name: z.string().trim().max(120).optional(),
  intent: z.enum(["premium", "launch"]).default("premium"),
});

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  const limited = rateLimit(`waitlist:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Waitlist unavailable (server not configured)." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const db = getAdminDb();
  const existing = await db
    .collection("waitlist")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ ok: true, already: true });
  }

  await db.collection("waitlist").add({
    email,
    name: parsed.data.name || null,
    intent: parsed.data.intent,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
