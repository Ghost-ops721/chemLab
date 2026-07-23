import { getAdminDb } from "@/lib/server/firebaseAdmin";

export type OrgRole = "teacher" | "student";

export type OrgLlmQuota = {
  explainPerDay: number;
  ocrPerDay: number;
  tokensPerDay: number;
};

export type OrgDoc = {
  name: string;
  slug: string;
  inviteCode?: string;
  createdAt: number;
  createdBy: string;
  llmQuota: OrgLlmQuota;
  sso?: { provider: "google"; domain: string };
  contentPackIds?: string[];
};

export const DEFAULT_ORG_QUOTA: OrgLlmQuota = {
  explainPerDay: 200,
  ocrPerDay: 50,
  tokensPerDay: 500_000,
};

export function memberDocId(orgId: string, uid: string) {
  return `${orgId}_${uid}`;
}

export function classMemberDocId(classId: string, uid: string) {
  return `${classId}_${uid}`;
}

export function usageDocId(orgId: string, day = dayKey()) {
  return `${orgId}_${day}`;
}

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function getOrgMembership(uid: string) {
  const snap = await getAdminDb()
    .collection("orgMembers")
    .where("uid", "==", uid)
    .limit(20)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      orgId: string;
      uid: string;
      role: OrgRole;
      joinedAt: number;
    }),
  }));
}

export async function getPrimaryOrgForUser(uid: string) {
  const memberships = await getOrgMembership(uid);
  if (!memberships.length) return null;
  const first = memberships[0]!;
  const orgSnap = await getAdminDb().collection("orgs").doc(first.orgId).get();
  if (!orgSnap.exists) return null;
  return {
    orgId: first.orgId,
    role: first.role,
    org: orgSnap.data() as OrgDoc,
  };
}

/** Returns null if under quota; Response if exceeded. Increments usage on success path. */
export async function enforceOrgQuota(
  uid: string,
  kind: "explain" | "ocr",
  tokensApprox = 0,
): Promise<Response | null> {
  const primary = await getPrimaryOrgForUser(uid);
  if (!primary?.org?.llmQuota) return null;

  const quota = { ...DEFAULT_ORG_QUOTA, ...primary.org.llmQuota };
  const db = getAdminDb();
  const ref = db.collection("orgUsageDaily").doc(usageDocId(primary.orgId));
  const snap = await ref.get();
  const data = snap.data() ?? {
    orgId: primary.orgId,
    day: dayKey(),
    explain: 0,
    ocr: 0,
    tokens: 0,
  };

  const nextExplain = (data.explain ?? 0) + (kind === "explain" ? 1 : 0);
  const nextOcr = (data.ocr ?? 0) + (kind === "ocr" ? 1 : 0);
  const nextTokens = (data.tokens ?? 0) + tokensApprox;

  if (kind === "explain" && nextExplain > quota.explainPerDay) {
    return Response.json(
      { error: "Org daily explain quota exceeded.", code: "quota_exceeded" },
      { status: 429 },
    );
  }
  if (kind === "ocr" && nextOcr > quota.ocrPerDay) {
    return Response.json(
      { error: "Org daily OCR quota exceeded.", code: "quota_exceeded" },
      { status: 429 },
    );
  }
  if (quota.tokensPerDay > 0 && nextTokens > quota.tokensPerDay) {
    return Response.json(
      { error: "Org daily token quota exceeded.", code: "quota_exceeded" },
      { status: 429 },
    );
  }

  await ref.set(
    {
      orgId: primary.orgId,
      day: dayKey(),
      explain: nextExplain,
      ocr: nextOcr,
      tokens: nextTokens,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
  return null;
}

export function randomInviteCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
