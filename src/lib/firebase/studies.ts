import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import {
  EMPTY_STUDY_AGGREGATE,
  type Study,
  type StudyAggregate,
  type StudyMode,
  type StudyRating,
  type StudyRatingScores,
} from "@/domains/chemistry/market";
import type { VesselContent } from "@/types";
import { attachStudyToFormula, getPublishedFormula } from "./formulas";

function studiesCol() {
  return collection(getFirebaseDb(), "studies");
}

function ratingsCol() {
  return collection(getFirebaseDb(), "study_ratings");
}

function clampScore(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const v = Math.round(n);
  if (v < 1 || v > 7) return null;
  return v;
}

function parseAggregate(raw: unknown): StudyAggregate {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STUDY_AGGREGATE };
  const a = raw as DocumentData;
  return {
    count: typeof a.count === "number" ? a.count : 0,
    liking: typeof a.liking === "number" ? a.liking : 0,
    harshness: typeof a.harshness === "number" ? a.harshness : 0,
    longevityGuess: typeof a.longevityGuess === "number" ? a.longevityGuess : 0,
    clarity: typeof a.clarity === "number" ? a.clarity : 0,
    uniqueness: typeof a.uniqueness === "number" ? a.uniqueness : 0,
  };
}

function parseContents(raw: unknown): VesselContent[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((r): r is { chemicalId: string; amountMl: number } => {
      return (
        !!r &&
        typeof r === "object" &&
        typeof (r as { chemicalId?: unknown }).chemicalId === "string" &&
        typeof (r as { amountMl?: unknown }).amountMl === "number"
      );
    })
    .map((r) => ({ chemicalId: r.chemicalId, amountMl: r.amountMl }));
}

function studyFromDoc(id: string, data: DocumentData): Study {
  return {
    id,
    formulaId: typeof data.formulaId === "string" ? data.formulaId : "",
    creatorUid: typeof data.creatorUid === "string" ? data.creatorUid : "",
    creatorName:
      typeof data.creatorName === "string" ? data.creatorName : "Creator",
    mode: data.mode === "labeled" ? "labeled" : "blind",
    title: typeof data.title === "string" ? data.title : "Panel study",
    formulaLabel:
      typeof data.formulaLabel === "string" ? data.formulaLabel : undefined,
    bottleColor:
      typeof data.bottleColor === "string" ? data.bottleColor : undefined,
    contents: parseContents(data.contents),
    createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    aggregate: parseAggregate(data.aggregate),
  };
}

function ratingFromDoc(id: string, data: DocumentData): StudyRating {
  return {
    id,
    studyId: typeof data.studyId === "string" ? data.studyId : "",
    raterUid: typeof data.raterUid === "string" ? data.raterUid : "",
    liking: typeof data.liking === "number" ? data.liking : 0,
    harshness: typeof data.harshness === "number" ? data.harshness : 0,
    longevityGuess:
      typeof data.longevityGuess === "number" ? data.longevityGuess : 0,
    clarity: typeof data.clarity === "number" ? data.clarity : 0,
    uniqueness: typeof data.uniqueness === "number" ? data.uniqueness : 0,
    createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
  };
}

export async function getStudy(id: string): Promise<Study | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "studies", id));
  if (!snap.exists()) return null;
  return studyFromDoc(snap.id, snap.data());
}

export async function listStudiesForFormula(
  formulaId: string,
): Promise<Study[]> {
  const snap = await getDocs(
    query(studiesCol(), where("formulaId", "==", formulaId), limit(24)),
  );
  return snap.docs
    .map((d) => studyFromDoc(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);
}

export async function createStudy(input: {
  formulaId: string;
  mode: StudyMode;
  title?: string;
}): Promise<Study> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to start a study");

  const formula = await getPublishedFormula(input.formulaId);
  if (!formula) throw new Error("Formula not found");
  if (formula.authorUid !== user.uid) {
    throw new Error("Only the formula author can start a study");
  }

  const now = Date.now();
  const creatorName =
    user.displayName?.trim() ||
    user.email?.split("@")[0] ||
    formula.authorName;
  const ref = doc(studiesCol());
  const payload = {
    formulaId: formula.id,
    creatorUid: user.uid,
    creatorName,
    mode: input.mode,
    title:
      (input.title?.trim() || `Panel — ${formula.title}`).slice(0, 80),
    formulaLabel: input.mode === "labeled" ? formula.title : null,
    bottleColor: formula.bottleColor ?? null,
    contents: formula.contents,
    createdAt: now,
    updatedAt: now,
    aggregate: { ...EMPTY_STUDY_AGGREGATE },
  };
  await setDoc(ref, payload);
  await attachStudyToFormula(formula.id, ref.id);
  return studyFromDoc(ref.id, payload);
}

function recomputeAggregate(ratings: StudyRatingScores[]): StudyAggregate {
  if (ratings.length === 0) return { ...EMPTY_STUDY_AGGREGATE };
  const sum = {
    liking: 0,
    harshness: 0,
    longevityGuess: 0,
    clarity: 0,
    uniqueness: 0,
  };
  for (const r of ratings) {
    sum.liking += r.liking;
    sum.harshness += r.harshness;
    sum.longevityGuess += r.longevityGuess;
    sum.clarity += r.clarity;
    sum.uniqueness += r.uniqueness;
  }
  const n = ratings.length;
  return {
    count: n,
    liking: sum.liking / n,
    harshness: sum.harshness / n,
    longevityGuess: sum.longevityGuess / n,
    clarity: sum.clarity / n,
    uniqueness: sum.uniqueness / n,
  };
}

export async function getMyStudyRating(
  studyId: string,
): Promise<StudyRating | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  const id = `${studyId}_${user.uid}`;
  const snap = await getDoc(doc(getFirebaseDb(), "study_ratings", id));
  if (!snap.exists()) return null;
  return ratingFromDoc(snap.id, snap.data());
}

export async function submitStudyRating(
  studyId: string,
  scores: StudyRatingScores,
): Promise<{ rating: StudyRating; aggregate: StudyAggregate }> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to rate");

  const liking = clampScore(scores.liking);
  const harshness = clampScore(scores.harshness);
  const longevityGuess = clampScore(scores.longevityGuess);
  const clarity = clampScore(scores.clarity);
  const uniqueness = clampScore(scores.uniqueness);
  if (
    liking === null ||
    harshness === null ||
    longevityGuess === null ||
    clarity === null ||
    uniqueness === null
  ) {
    throw new Error("All ratings must be integers from 1 to 7");
  }

  // Prefer Admin API (rate limits + validation) when auth headers available.
  try {
    const { getAuthHeaders } = await import("@/lib/client/authHeaders");
    const headers = await getAuthHeaders();
    if (headers) {
      const res = await fetch("/api/studies/rate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          studyId,
          liking,
          harshness,
          longevityGuess,
          clarity,
          uniqueness,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        rating?: StudyRating;
        aggregate?: StudyAggregate;
      };
      if (res.ok && data.rating && data.aggregate) {
        return { rating: data.rating, aggregate: data.aggregate };
      }
      if (res.status === 409) {
        throw new Error(data.error ?? "You already rated this study");
      }
      // Fall through to client SDK if Admin not configured
      if (res.status !== 503) {
        throw new Error(data.error ?? `Rating failed (${res.status})`);
      }
    }
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes("already rated") ||
        e.message.includes("integers") ||
        e.message.includes("Rating failed"))
    ) {
      throw e;
    }
    /* fall through to client write */
  }

  const studyRef = doc(getFirebaseDb(), "studies", studyId);
  const studySnap = await getDoc(studyRef);
  if (!studySnap.exists()) throw new Error("Study not found");

  const ratingId = `${studyId}_${user.uid}`;
  const ratingRef = doc(getFirebaseDb(), "study_ratings", ratingId);
  const existing = await getDoc(ratingRef);
  if (existing.exists()) {
    throw new Error("You already rated this study");
  }

  const now = Date.now();
  const payload = {
    studyId,
    raterUid: user.uid,
    liking,
    harshness,
    longevityGuess,
    clarity,
    uniqueness,
    createdAt: now,
  };
  await setDoc(ratingRef, payload);

  const all = await getDocs(
    query(ratingsCol(), where("studyId", "==", studyId), limit(500)),
  );
  const ratings = all.docs.map((d) => ratingFromDoc(d.id, d.data()));
  const aggregate = recomputeAggregate(ratings);
  await updateDoc(studyRef, { aggregate, updatedAt: Date.now() });

  return {
    rating: ratingFromDoc(ratingId, payload),
    aggregate,
  };
}

export async function listRatingsForStudy(
  studyId: string,
): Promise<StudyRating[]> {
  const snap = await getDocs(
    query(ratingsCol(), where("studyId", "==", studyId), limit(200)),
  );
  return snap.docs.map((d) => ratingFromDoc(d.id, d.data()));
}
