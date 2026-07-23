import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

export const maxDuration = 15;

type Scores = {
  liking?: unknown;
  harshness?: unknown;
  longevityGuess?: unknown;
  clarity?: unknown;
  uniqueness?: unknown;
};

function clampScore(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const v = Math.round(n);
  if (v < 1 || v > 7) return null;
  return v;
}

/**
 * POST /api/studies/rate — auth required, one rating per uid per study.
 * Prefer client SDK path; this route adds server rate limits + validation.
 */
export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "study-rate");
  if (limited) return limited.response;

  let body: { studyId?: unknown } & Scores;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studyId =
    typeof body.studyId === "string" ? body.studyId.trim() : "";
  if (!studyId || studyId.length > 128) {
    return Response.json({ error: "studyId required" }, { status: 400 });
  }

  const liking = clampScore(body.liking);
  const harshness = clampScore(body.harshness);
  const longevityGuess = clampScore(body.longevityGuess);
  const clarity = clampScore(body.clarity);
  const uniqueness = clampScore(body.uniqueness);
  if (
    liking === null ||
    harshness === null ||
    longevityGuess === null ||
    clarity === null ||
    uniqueness === null
  ) {
    return Response.json(
      { error: "All ratings must be integers from 1 to 7" },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const studyRef = db.collection("studies").doc(studyId);
  const studySnap = await studyRef.get();
  if (!studySnap.exists) {
    return Response.json({ error: "Study not found" }, { status: 404 });
  }

  const ratingId = `${studyId}_${auth.uid}`;
  const ratingRef = db.collection("study_ratings").doc(ratingId);
  const existing = await ratingRef.get();
  if (existing.exists) {
    return Response.json(
      { error: "You already rated this study" },
      { status: 409 },
    );
  }

  const now = Date.now();
  const payload = {
    studyId,
    raterUid: auth.uid,
    liking,
    harshness,
    longevityGuess,
    clarity,
    uniqueness,
    createdAt: now,
  };
  await ratingRef.set(payload);

  const all = await db
    .collection("study_ratings")
    .where("studyId", "==", studyId)
    .limit(500)
    .get();

  const n = all.size;
  let sumL = 0;
  let sumH = 0;
  let sumLg = 0;
  let sumC = 0;
  let sumU = 0;
  for (const d of all.docs) {
    const r = d.data();
    sumL += typeof r.liking === "number" ? r.liking : 0;
    sumH += typeof r.harshness === "number" ? r.harshness : 0;
    sumLg += typeof r.longevityGuess === "number" ? r.longevityGuess : 0;
    sumC += typeof r.clarity === "number" ? r.clarity : 0;
    sumU += typeof r.uniqueness === "number" ? r.uniqueness : 0;
  }
  const aggregate = {
    count: n,
    liking: n ? sumL / n : 0,
    harshness: n ? sumH / n : 0,
    longevityGuess: n ? sumLg / n : 0,
    clarity: n ? sumC / n : 0,
    uniqueness: n ? sumU / n : 0,
  };
  await studyRef.update({ aggregate, updatedAt: now });

  return Response.json({ rating: { id: ratingId, ...payload }, aggregate });
}
