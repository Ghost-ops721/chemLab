import { describe, expect, it } from "vitest";
import { PRODUCT_GOALS } from "@/domains/chemistry/data/goals";
import { BADGE_DEFS } from "@/store/progressStore";
import { VESSEL_CARD } from "@/desk/vesselLayout";

describe("polish guards", () => {
  it("registers every goal badgeId in BADGE_DEFS", () => {
    const ids = new Set(BADGE_DEFS.map((b) => b.id));
    for (const goal of PRODUCT_GOALS) {
      expect(ids.has(goal.badgeId), `missing badge ${goal.badgeId}`).toBe(
        true,
      );
    }
  });

  it("keeps vessel card width aligned with 11.5rem layout", () => {
    expect(VESSEL_CARD.width).toBe(184);
    expect(VESSEL_CARD.height).toBeGreaterThan(200);
  });
});
