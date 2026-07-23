import { getAdminDb } from "@/lib/server/firebaseAdmin";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import { nextDailyClaimState } from "@/lib/server/progressValidate";
import { MAX_STARS } from "@/lib/server/progressValidate";

export const maxDuration = 15;

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "daily-star");
  if (limited) return limited.response;

  const now = Date.now();
  const ref = getAdminDb().collection("users").doc(auth.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return Response.json(
      { error: "Profile not found. Complete signup first." },
      { status: 404 },
    );
  }

  const data = snap.data() ?? {};
  const lastDailyStarAt =
    typeof data.lastDailyStarAt === "number" ? data.lastDailyStarAt : 0;
  const stars = typeof data.stars === "number" ? data.stars : 0;
  const { canClaim, nextClaimInMs } = nextDailyClaimState(lastDailyStarAt, now);

  if (!canClaim) {
    return Response.json({
      granted: false,
      stars,
      lastDailyStarAt,
      nextClaimInMs,
      message: "Daily star already claimed. Come back in 24 hours.",
    });
  }

  const nextStars = Math.min(MAX_STARS, stars + 1);
  await ref.update({
    stars: nextStars,
    lastDailyStarAt: now,
    updatedAt: now,
    lastSeenAt: now,
  });

  return Response.json({
    granted: true,
    stars: nextStars,
    lastDailyStarAt: now,
    nextClaimInMs: 24 * 60 * 60 * 1000,
    message: "Welcome back! +1★ for showing up.",
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
  const now = Date.now();
  const lastDailyStarAt =
    typeof data.lastDailyStarAt === "number" ? data.lastDailyStarAt : 0;
  const { canClaim, nextClaimInMs } = nextDailyClaimState(lastDailyStarAt, now);
  return Response.json({
    stars: data.stars ?? 0,
    lastDailyStarAt,
    canClaim,
    nextClaimInMs,
  });
}
