import { PRODUCT_GOALS } from "@/domains/chemistry/data/goals";
import { CHEMICAL_BY_ID } from "@/domains/chemistry/data/chemicals";
import type { ReactionType } from "@/domains/chemistry/types";

const DISCOVERY_BADGE_IDS = [
  "first-precipitate",
  "first-combustion",
  "first-redox",
  "first-neutralization",
  "first-gas",
] as const;

export const VALID_BADGE_IDS = new Set<string>([
  ...DISCOVERY_BADGE_IDS,
  ...PRODUCT_GOALS.map((g) => g.badgeId),
]);

const VALID_REACTION_TYPES = new Set<ReactionType>([
  "neutralization",
  "precipitation",
  "single-displacement",
  "double-displacement",
  "redox",
  "combustion",
  "gas-forming",
  "product-craft",
  "no-reaction",
  "hazard",
]);

const MAX_DISCOVERIES = 500;
const MAX_BADGES = 64;
const MAX_XP = 50_000;
/** Max XP a single sync may add above the cloud value */
export const MAX_XP_DELTA = 200;
const MAX_DISCOVERY_ID_LEN = 240;

/**
 * discoveryId format: `${reactionType}::${sortedReactantIds}::${label}`
 */
export function isValidDiscoveryId(id: string): boolean {
  if (!id || id.length > MAX_DISCOVERY_ID_LEN) return false;
  const parts = id.split("::");
  if (parts.length < 3) return false;
  const [type, reactants] = parts;
  if (!type || !VALID_REACTION_TYPES.has(type as ReactionType)) return false;
  if (!reactants) return false;
  const ids = reactants.split("+").filter(Boolean);
  if (ids.length === 0 || ids.length > 8) return false;
  return ids.every((rid) => Boolean(CHEMICAL_BY_ID[rid]));
}

export function sanitizeProgressInput(input: {
  xp: number;
  discoveredIds: string[];
  badgeIds: string[];
}): { xp: number; discoveredIds: string[]; badgeIds: string[] } | { error: string } {
  if (
    typeof input.xp !== "number" ||
    !Number.isFinite(input.xp) ||
    input.xp < 0 ||
    input.xp > MAX_XP
  ) {
    return { error: "Invalid xp" };
  }

  if (!Array.isArray(input.discoveredIds) || !Array.isArray(input.badgeIds)) {
    return { error: "Invalid progress arrays" };
  }

  if (
    input.discoveredIds.length > MAX_DISCOVERIES ||
    input.badgeIds.length > MAX_BADGES
  ) {
    return { error: "Progress payload too large" };
  }

  const discoveredIds = Array.from(
    new Set(
      input.discoveredIds.filter(
        (id): id is string => typeof id === "string" && isValidDiscoveryId(id),
      ),
    ),
  );

  const badgeIds = Array.from(
    new Set(
      input.badgeIds.filter(
        (id): id is string =>
          typeof id === "string" && VALID_BADGE_IDS.has(id),
      ),
    ),
  );

  return {
    xp: Math.floor(input.xp),
    discoveredIds,
    badgeIds,
  };
}

export function mergeProgress(
  existing: { xp: number; discoveredIds: string[]; badgeIds: string[] },
  incoming: { xp: number; discoveredIds: string[]; badgeIds: string[] },
): { xp: number; discoveredIds: string[]; badgeIds: string[] } {
  const discoveredIds = Array.from(
    new Set([...existing.discoveredIds, ...incoming.discoveredIds]),
  ).slice(0, MAX_DISCOVERIES);

  const badgeIds = Array.from(
    new Set([...existing.badgeIds, ...incoming.badgeIds]),
  ).slice(0, MAX_BADGES);

  const cappedIncomingXp = Math.min(
    incoming.xp,
    existing.xp + MAX_XP_DELTA,
    MAX_XP,
  );
  const xp = Math.max(existing.xp, cappedIncomingXp);

  return { xp, discoveredIds, badgeIds };
}
