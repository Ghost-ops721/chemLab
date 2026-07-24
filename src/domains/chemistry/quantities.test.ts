import { describe, expect, it } from "vitest";
import { vesselHas, AMOUNT_TOLERANCE_ML } from "@/domains/chemistry/data/goalSteps";
import { PRODUCT_GOALS } from "@/domains/chemistry/data/goals";
import { defaultPourMl } from "@/desk/vesselContents";
import {
  applyTeachingStoich,
  parseEquationSide,
} from "@/domains/chemistry/engine/teachingStoich";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { snapshotFromVessel } from "@/domains/chemistry/invention/types";
import { defaultStockMl } from "@/store/inventoryStockStore";
import { formatAmount, mlToGrams, mlToMmol } from "@/desk/unitDisplay";
import type { DeskVessel } from "@/types";
import type { ReactionResult } from "@/domains/chemistry/types";

function vesselWith(
  contents: { chemicalId: string; amountMl: number }[],
): DeskVessel {
  return {
    instanceId: "v1",
    equipmentId: "beaker",
    contents,
    contentIds: contents.map((c) => c.chemicalId),
    heatAttached: false,
    coolAttached: false,
    stirLevel: 0,
    position: { x: 0, y: 0 },
    fx: {},
  };
}

describe("goal amount checks", () => {
  it("product pour steps include minAmounts matching defaultPourMl", () => {
    const soap = PRODUCT_GOALS.find((g) => g.id === "soap")!;
    const fat = soap.steps.find((s) => s.id === "soap-fat")!;
    expect(fat.targetAmounts?.some((t) => t.chemicalId === "plant-oil")).toBe(
      true,
    );
    const oilAmt = fat.targetAmounts!.find(
      (t) => t.chemicalId === "plant-oil",
    )!.amountMl;
    expect(oilAmt).toBe(defaultPourMl("plant-oil"));
  });

  it("vesselHas fails when chemical present but under target ml", () => {
    const snap = {
      vessels: [
        vesselWith([{ chemicalId: "hcl", amountMl: 0.1 }]),
      ],
      activeVesselId: "v1",
    };
    expect(
      vesselHas(snap, ["hcl"], {
        minAmounts: { hcl: defaultPourMl("hcl") },
      }),
    ).toBe(false);
  });

  it("vesselHas passes at target within tolerance", () => {
    const target = defaultPourMl("hcl");
    const snap = {
      vessels: [
        vesselWith([
          {
            chemicalId: "hcl",
            amountMl: target - AMOUNT_TOLERANCE_ML / 2,
          },
        ]),
      ],
      activeVesselId: "v1",
    };
    expect(
      vesselHas(snap, ["hcl"], { minAmounts: { hcl: target } }),
    ).toBe(true);
  });
});

describe("teaching stoichiometry", () => {
  it("parses equation sides with coefficients", () => {
    const parts = parseEquationSide("2HCl + NaOH");
    expect(parts).toEqual([
      { coeff: 2, formula: "HCl" },
      { coeff: 1, formula: "NaOH" },
    ]);
  });

  it("leaves excess base when acid is limiting", () => {
    const hcl = getChemical("hcl")!;
    const naoh = getChemical("naoh")!;
    const nacl = getChemical("nacl")!;
    const h2o = getChemical("h2o")!;
    const result: ReactionResult = {
      ok: true,
      products: [nacl, h2o],
      balancedEquation: "HCl + NaOH → NaCl + H2O",
      explanationKey: "neutralization",
      reactionType: "neutralization",
    };
    const stoich = applyTeachingStoich(
      result,
      [hcl, naoh, nacl, h2o],
      { hcl: 2, naoh: 10 },
    );
    expect(stoich).not.toBeNull();
    expect(stoich!.limitingReagentId).toBe("hcl");
    const naohLeft = stoich!.nextContents.find((c) => c.chemicalId === "naoh");
    expect(naohLeft!.amountMl).toBeCloseTo(8, 1);
    const salt = stoich!.nextContents.find((c) => c.chemicalId === "nacl");
    expect(salt!.amountMl).toBeCloseTo(2, 1);
  });

  it("skips product-craft reactions", () => {
    const result: ReactionResult = {
      ok: true,
      products: [],
      balancedEquation: "fat + NaOH → soap",
      explanationKey: "product-soap",
      reactionType: "product-craft",
    };
    expect(
      applyTeachingStoich(result, [], { "plant-oil": 2, naoh: 2 }),
    ).toBeNull();
  });
});

describe("invention snapshot amounts", () => {
  it("persists vessel contents on snapshot", () => {
    const v = vesselWith([
      { chemicalId: "c2h5oh", amountMl: 5 },
      { chemicalId: "limonene", amountMl: 1 },
    ]);
    const snap = snapshotFromVessel(v);
    expect(snap.contents).toEqual([
      { chemicalId: "c2h5oh", amountMl: 5 },
      { chemicalId: "limonene", amountMl: 1 },
    ]);
    expect(snap.contentIds).toEqual(["c2h5oh", "limonene"]);
  });
});

describe("inventory stock defaults", () => {
  it("gives fragrance oils less starting stock than ethanol", () => {
    expect(defaultStockMl("c2h5oh")).toBeGreaterThan(defaultStockMl("bergamot-oil"));
    expect(defaultStockMl("bergamot-oil")).toBe(20);
  });
});

describe("unit display", () => {
  it("formats ml and converts HCl to grams/mmol", () => {
    expect(formatAmount("hcl", 2, "ml")).toMatch(/2/);
    expect(mlToGrams("hcl", 2)).toBeCloseTo(2, 5);
    const mmol = mlToMmol("hcl", 2);
    expect(mmol).not.toBeNull();
    expect(mmol!).toBeGreaterThan(0);
  });
});
