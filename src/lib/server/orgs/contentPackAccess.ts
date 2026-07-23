import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { getOrgMembership } from "@/lib/server/orgs/orgHelpers";
import {
  DEFAULT_CONTENT_PACKS,
  resolvePackFeatures,
  type ContentPackId,
} from "@/domains/chemistry/contentPacks";
import { PRODUCT_GOALS } from "@/domains/chemistry/data/goals";

export async function getContentPackIdsForUser(
  uid: string,
): Promise<ContentPackId[]> {
  const memberships = await getOrgMembership(uid);
  if (!memberships.length) return [...DEFAULT_CONTENT_PACKS];

  const db = getAdminDb();
  const packs = new Set<ContentPackId>();
  for (const m of memberships) {
    const org = await db.collection("orgs").doc(m.orgId).get();
    const raw = org.data()?.contentPackIds as string[] | undefined;
    const resolved = resolvePackFeatures(raw);
    for (const id of resolved.packIds) packs.add(id);
  }
  if (!packs.size) return [...DEFAULT_CONTENT_PACKS];
  return Array.from(packs);
}

export async function getAllowedGoalIdsForUser(uid: string): Promise<{
  packIds: ContentPackId[];
  goalIds: string[] | "all";
  perfumeAtelier: boolean;
  freeformPerfume: boolean;
  scan: boolean;
}> {
  const packIds = await getContentPackIdsForUser(uid);
  const features = resolvePackFeatures(packIds);

  if (features.includeAllClassic && features.includeAllProduct) {
    return {
      packIds,
      goalIds: "all",
      perfumeAtelier: features.perfumeAtelier,
      freeformPerfume: features.freeformPerfume,
      scan: features.scan,
    };
  }

  const allowed = new Set<string>(features.extraGoalIds);
  for (const g of PRODUCT_GOALS) {
    if (g.category === "classic" && features.includeAllClassic) {
      allowed.add(g.id);
    }
    if (g.category === "product" && features.includeAllProduct) {
      allowed.add(g.id);
    }
  }

  return {
    packIds,
    goalIds: Array.from(allowed),
    perfumeAtelier: features.perfumeAtelier,
    freeformPerfume: features.freeformPerfume,
    scan: features.scan,
  };
}
