import { getAdminDb } from "@/lib/server/firebaseAdmin";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import {
  mergeInventions,
  mergeProgress,
  sanitizeInventionsInput,
  sanitizeProgressInput,
  type SanitizedInvention,
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
    completedPerfumeIds?: string[];
    starsDelta?: number;
    inventions?: unknown;
    inventionsOnly?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const inventionsOnly = Boolean(body.inventionsOnly);
  const sanitized = sanitizeProgressInput({
    xp: body.xp ?? 0,
    discoveredIds: body.discoveredIds ?? [],
    badgeIds: body.badgeIds ?? [],
    completedPerfumeIds: body.completedPerfumeIds,
    starsDelta: body.starsDelta,
    inventionsOnly,
  });
  if ("error" in sanitized) {
    return Response.json({ error: sanitized.error }, { status: 400 });
  }

  const inventionsSanitized = sanitizeInventionsInput(body.inventions);
  if ("error" in inventionsSanitized) {
    return Response.json({ error: inventionsSanitized.error }, { status: 400 });
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
    completedPerfumeIds: Array.isArray(data.completedPerfumeIds)
      ? (data.completedPerfumeIds as string[])
      : [],
    stars: typeof data.stars === "number" ? data.stars : 0,
  };

  const existingInventions = Array.isArray(data.inventions)
    ? (data.inventions as SanitizedInvention[])
    : [];

  const { inventions, improveStarEligible } = mergeInventions(
    existingInventions,
    inventionsSanitized,
  );

  const merged = mergeProgress(existing, sanitized, {
    improveStarEligible: inventionsOnly ? improveStarEligible : improveStarEligible,
  });

  const update: Record<string, unknown> = {
    updatedAt: Date.now(),
    lastSeenAt: Date.now(),
  };

  if (inventionsOnly) {
    update.inventions = inventions;
    update.stars = merged.stars;
  } else {
    update.xp = merged.xp;
    update.discoveredIds = merged.discoveredIds;
    update.badgeIds = merged.badgeIds;
    update.completedPerfumeIds = merged.completedPerfumeIds;
    update.stars = merged.stars;
    if (inventionsSanitized.length > 0) {
      update.inventions = inventions;
    }
  }

  await ref.update(update);

  return Response.json({
    xp: inventionsOnly ? existing.xp : merged.xp,
    discoveredIds: inventionsOnly
      ? existing.discoveredIds
      : merged.discoveredIds,
    badgeIds: inventionsOnly ? existing.badgeIds : merged.badgeIds,
    completedPerfumeIds: inventionsOnly
      ? existing.completedPerfumeIds
      : merged.completedPerfumeIds,
    stars: merged.stars,
    starsGranted: merged.starsGranted,
    inventions,
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
    completedPerfumeIds: data.completedPerfumeIds ?? [],
    stars: data.stars ?? 0,
    lastDailyStarAt: data.lastDailyStarAt ?? 0,
    unlockedShopItemIds: data.unlockedShopItemIds ?? [],
    inventions: data.inventions ?? [],
  });
}
