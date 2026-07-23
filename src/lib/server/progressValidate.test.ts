import { describe, expect, it } from "vitest";
import {
  isValidDiscoveryId,
  mergeProgress,
  sanitizeProgressInput,
} from "@/lib/server/progressValidate";

describe("progressValidate", () => {
  it("accepts well-formed discovery ids with catalog chemicals", () => {
    expect(
      isValidDiscoveryId("neutralization::hcl+naoh::HCl + NaOH → NaCl + H2O"),
    ).toBe(true);
  });

  it("rejects unknown chemicals or types", () => {
    expect(isValidDiscoveryId("neutralization::notreal::x")).toBe(false);
    expect(isValidDiscoveryId("magic::hcl::x")).toBe(false);
  });

  it("sanitizes badges and discoveries", () => {
    const out = sanitizeProgressInput({
      xp: 40,
      discoveredIds: [
        "neutralization::hcl+naoh::HCl + NaOH → NaCl + H2O",
        "bogus",
      ],
      badgeIds: ["first-neutralization", "hacked-badge"],
    });
    expect("error" in out).toBe(false);
    if ("error" in out) return;
    expect(out.discoveredIds).toHaveLength(1);
    expect(out.badgeIds).toEqual(["first-neutralization"]);
  });

  it("caps xp delta on merge", () => {
    const merged = mergeProgress(
      { xp: 100, discoveredIds: [], badgeIds: [] },
      {
        xp: 9000,
        discoveredIds: [],
        badgeIds: ["first-gas"],
        completedPerfumeIds: [],
        starsDelta: 0,
      },
    );
    expect(merged.xp).toBe(300);
    expect(merged.badgeIds).toEqual(["first-gas"]);
  });

  it("grants perfume first-clear stars capped by delta", () => {
    const merged = mergeProgress(
      { xp: 0, discoveredIds: [], badgeIds: [], stars: 2, completedPerfumeIds: [] },
      {
        xp: 100,
        discoveredIds: [],
        badgeIds: ["perfume-havas"],
        completedPerfumeIds: ["inspired-havas"],
        starsDelta: 1,
      },
    );
    expect(merged.stars).toBe(3);
    expect(merged.starsGranted).toBe(1);
    expect(merged.completedPerfumeIds).toContain("inspired-havas");
  });
});
