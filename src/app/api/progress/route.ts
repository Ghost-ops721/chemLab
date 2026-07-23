import { getAdminDb } from "@/lib/server/firebaseAdmin";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import {
  mergeProgress,
  sanitizeProgressInput,
} from "@/lib/server/progressValidate";

export const maxDuration = 15;

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "progress");
  if (limited) return limited.response;

  let body: {
    xp?: number;
    discoveredIds?: string[];
    badgeIds?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sanitized = sanitizeProgressInput({
    xp: body.xp ?? 0,
    discoveredIds: body.discoveredIds ?? [],
    badgeIds: body.badgeIds ?? [],
  });
  if ("error" in sanitized) {
    return Response.json({ error: sanitized.error }, { status: 400 });
  }

  const ref = getAdminDb().collection("users").doc(auth.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return Response.json(
      { error: "Profile not found. Complete signup first." },
      { status: 404 },
    );
  }

  const data = snap.data() ?? {};
  const existing = {
    xp: typeof data.xp === "number" ? data.xp : 0,
    discoveredIds: Array.isArray(data.discoveredIds)
      ? (data.discoveredIds as string[])
      : [],
    badgeIds: Array.isArray(data.badgeIds) ? (data.badgeIds as string[]) : [],
  };

  const merged = mergeProgress(existing, sanitized);
  await ref.update({
    xp: merged.xp,
    discoveredIds: merged.discoveredIds,
    badgeIds: merged.badgeIds,
    updatedAt: Date.now(),
    lastSeenAt: Date.now(),
  });

  return Response.json({
    xp: merged.xp,
    discoveredIds: merged.discoveredIds,
    badgeIds: merged.badgeIds,
  });
}

export async function GET(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const snap = await getAdminDb().collection("users").doc(auth.uid).get();
  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const data = snap.data() ?? {};
  return Response.json({
    xp: data.xp ?? 0,
    discoveredIds: data.discoveredIds ?? [],
    badgeIds: data.badgeIds ?? [],
  });
}
