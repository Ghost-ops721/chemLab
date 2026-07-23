import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import {
  marketBadgeFromIfra,
  type PublishedFormula,
  type PublishFormulaInput,
} from "@/domains/chemistry/market";
import type { IfraProductCategoryId } from "@/domains/chemistry/ifra";
import type { VesselContent } from "@/types";

const IFRA_CATEGORY_IDS = new Set<IfraProductCategoryId>([
  "cat4",
  "cat5a",
  "cat5b",
  "cat9",
  "cat11a",
]);

function parseIfraCategory(raw: unknown): IfraProductCategoryId {
  if (typeof raw === "string" && IFRA_CATEGORY_IDS.has(raw as IfraProductCategoryId)) {
    return raw as IfraProductCategoryId;
  }
  return "cat4";
}

function formulasCol() {
  return collection(getFirebaseDb(), "formulas");
}

function parseContents(raw: unknown): VesselContent[] {
  if (!Array.isArray(raw)) return [];
  const out: VesselContent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as { chemicalId?: unknown; amountMl?: unknown };
    if (typeof r.chemicalId !== "string") continue;
    const amountMl =
      typeof r.amountMl === "number" && Number.isFinite(r.amountMl)
        ? r.amountMl
        : 0;
    out.push({ chemicalId: r.chemicalId, amountMl });
  }
  return out;
}

function fromDoc(id: string, data: DocumentData): PublishedFormula {
  const ifraRaw = (data.ifra ?? {}) as DocumentData;
  const status =
    ifraRaw.status === "pass" ||
    ifraRaw.status === "fail" ||
    ifraRaw.status === "unknown"
      ? ifraRaw.status
      : "unknown";
  return {
    id,
    title: typeof data.title === "string" ? data.title : "Untitled formula",
    description: typeof data.description === "string" ? data.description : "",
    authorUid: typeof data.authorUid === "string" ? data.authorUid : "",
    authorName:
      typeof data.authorName === "string" ? data.authorName : "Anonymous",
    contents: parseContents(data.contents),
    equipmentId:
      typeof data.equipmentId === "string" ? data.equipmentId : "beaker",
    scentVerdict:
      typeof data.scentVerdict === "string" ? data.scentVerdict : undefined,
    scentSummary:
      typeof data.scentSummary === "string" ? data.scentSummary : undefined,
    bottleColor:
      typeof data.bottleColor === "string" ? data.bottleColor : undefined,
    ifra: {
      status,
      category: parseIfraCategory(ifraRaw.category),
      version:
        typeof ifraRaw.version === "string"
          ? ifraRaw.version
          : "49th-Amendment-teaching",
      screened: Boolean(ifraRaw.screened ?? status === "pass"),
    },
    badge: data.badge === "screened" ? "screened" : "experimental",
    createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    studyId: typeof data.studyId === "string" ? data.studyId : undefined,
  };
}

export async function getPublishedFormula(
  id: string,
): Promise<PublishedFormula | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "formulas", id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export async function listPublishedFormulas(opts?: {
  search?: string;
  badge?: "screened" | "experimental" | "all";
  max?: number;
}): Promise<PublishedFormula[]> {
  // Single-field orderBy avoids composite indexes; badge/search filter client-side.
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(Math.min(120, Math.max(opts?.max ?? 48, 48))),
  ];
  const snap = await getDocs(query(formulasCol(), ...constraints));
  let rows = snap.docs.map((d) => fromDoc(d.id, d.data()));
  if (opts?.badge && opts.badge !== "all") {
    rows = rows.filter((f) => f.badge === opts.badge);
  }
  const q = opts?.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.authorName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.scentVerdict ?? "").toLowerCase().includes(q),
    );
  }
  return rows.slice(0, opts?.max ?? 48);
}

export async function publishFormula(
  input: PublishFormulaInput,
): Promise<PublishedFormula> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to publish a formula");

  const title = input.title.trim().slice(0, 80);
  if (!title) throw new Error("Title is required");
  if (!input.contents.length) throw new Error("Formula has no contents");

  const now = Date.now();
  const badge = marketBadgeFromIfra(input.ifra.status);
  const authorName =
    user.displayName?.trim() ||
    user.email?.split("@")[0] ||
    "Lab chemist";

  const payload = {
    title,
    description: (input.description ?? "").trim().slice(0, 280),
    authorUid: user.uid,
    authorName,
    contents: input.contents.map((c) => ({
      chemicalId: c.chemicalId,
      amountMl: c.amountMl,
    })),
    equipmentId: input.equipmentId || "beaker",
    scentVerdict: input.scentVerdict ?? null,
    scentSummary: input.scentSummary ?? null,
    bottleColor: input.bottleColor ?? null,
    ifra: {
      status: input.ifra.status,
      category: input.ifra.category,
      version: input.ifra.version,
      screened: input.ifra.screened,
    },
    badge,
    createdAt: now,
    updatedAt: now,
    // Firestore rules allow client create; serverTimestamp as soft signal
    createdAtServer: serverTimestamp(),
  };

  const ref = await addDoc(formulasCol(), payload);
  return fromDoc(ref.id, { ...payload, createdAtServer: undefined });
}

export async function attachStudyToFormula(
  formulaId: string,
  studyId: string,
): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in required");
  const ref = doc(getFirebaseDb(), "formulas", formulaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Formula not found");
  if (snap.data().authorUid !== user.uid) {
    throw new Error("Only the author can start a study");
  }
  await updateDoc(ref, { studyId, updatedAt: Date.now() });
}
