import { describe, expect, it } from "vitest";
import {
  blendFillColor,
  capacityMlForEquipment,
  defaultPourMl,
  pourIntoContents,
  setContentAmount,
  totalMl,
  transferContents,
} from "@/desk/vesselContents";
import { computeLivePreview } from "@/domains/chemistry/engine/liveFormula";
import { tryHeatFlammableHazard, tryHazard } from "@/domains/chemistry/engine/hazards";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { adaptReactionResult } from "@/domains/chemistry/adapt";

describe("vesselContents", () => {
  it("maps glassware to teaching capacity ml", () => {
    expect(capacityMlForEquipment("beaker")).toBe(50);
    expect(capacityMlForEquipment("test-tube")).toBe(10);
  });

  it("pours and increases amount for the same oil", () => {
    const a = pourIntoContents([], "bergamot-oil", 1, 50);
    expect(a).toEqual([{ chemicalId: "bergamot-oil", amountMl: 1 }]);
    const b = pourIntoContents(a!, "bergamot-oil", 1, 50);
    expect(b![0]!.amountMl).toBe(2);
    expect(totalMl(b!)).toBe(2);
  });

  it("respects capacity when pouring", () => {
    const full = pourIntoContents(
      [{ chemicalId: "c2h5oh", amountMl: 49 }],
      "bergamot-oil",
      5,
      50,
    );
    expect(full![1]!.amountMl).toBe(1);
    expect(totalMl(full!)).toBe(50);
    expect(pourIntoContents(full!, "lavender-oil", 1, 50)).toBeNull();
  });

  it("transfers volume between vessels", () => {
    const result = transferContents(
      [
        { chemicalId: "c2h5oh", amountMl: 10 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
      ],
      [],
      5,
    );
    expect(result).not.toBeNull();
    expect(result!.movedMl).toBe(5);
    expect(totalMl(result!.to)).toBe(5);
    expect(totalMl(result!.from)).toBe(7);
  });

  it("clamps amount slider against remaining capacity", () => {
    const next = setContentAmount(
      [
        { chemicalId: "c2h5oh", amountMl: 40 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
      ],
      "bergamot-oil",
      20,
      50,
    );
    expect(next.find((c) => c.chemicalId === "bergamot-oil")!.amountMl).toBe(10);
  });

  it("blends colors by volume weight", () => {
    const color = blendFillColor([
      { chemicalId: "bergamot-oil", amountMl: 2 },
      { chemicalId: "lavender-oil", amountMl: 2 },
    ]);
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("defaults fragrance pours to 1 ml", () => {
    expect(defaultPourMl("bergamot-oil")).toBe(1);
    expect(defaultPourMl("c2h5oh")).toBe(5);
  });
});

describe("liveFormula", () => {
  it("reports ethanol flash hazard when heat is attached", () => {
    const preview = computeLivePreview({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 30 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
        { chemicalId: "lavender-oil", amountMl: 2 },
        { chemicalId: "sandalwood-oil", amountMl: 2 },
      ],
      equipmentId: "beaker",
      heatAttached: true,
    });
    expect(preview.hazards.some((h) => h.level === "danger")).toBe(true);
    expect(preview.effects.some((e) => e.kind === "flash" || e.kind === "blast")).toBe(
      true,
    );
  });

  it("flags incomplete perfume pyramid", () => {
    const preview = computeLivePreview({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 20 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
      ],
      equipmentId: "beaker",
    });
    expect(preview.scentVerdict).toBe("unbalanced");
  });

  it("labels concentration from oil load", () => {
    const preview = computeLivePreview({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 20 },
        { chemicalId: "bergamot-oil", amountMl: 1 },
        { chemicalId: "lavender-oil", amountMl: 1 },
        { chemicalId: "sandalwood-oil", amountMl: 1 },
      ],
      equipmentId: "beaker",
    });
    expect(preview.oilLoadPct).toBeGreaterThan(5);
    expect(preview.concentrationLabel).toBeTruthy();
  });

  it("attaches IFRA teaching screen to live preview", () => {
    const fail = computeLivePreview({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 20 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
      ],
      equipmentId: "beaker",
    });
    expect(fail.ifra?.status).toBe("fail");
    expect(fail.ifra?.version).toBe("49th-Amendment-teaching");

    const pass = computeLivePreview({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 40 },
        { chemicalId: "bergamot-oil", amountMl: 0.1 },
        { chemicalId: "lavender-oil", amountMl: 0.5 },
        { chemicalId: "sandalwood-oil", amountMl: 1 },
      ],
      equipmentId: "beaker",
    });
    expect(pass.ifra?.status).toBe("pass");
    expect(pass.ifra?.screened).toBe(true);
  });
});

describe("hazards + adapt FX", () => {
  it("blocks ethanol + heat as flash hazard", () => {
    const ethanol = getChemical("c2h5oh")!;
    const oil = getChemical("bergamot-oil")!;
    const result = tryHeatFlammableHazard([ethanol, oil], true);
    expect(result?.hazardTriggered).toBe(true);
    expect(result?.explanationKey).toBe("hazard-ethanol-flash");
  });

  it("maps flash hazard to blast/flash effects", () => {
    const ethanol = getChemical("c2h5oh")!;
    const oil = getChemical("bergamot-oil")!;
    const result = tryHeatFlammableHazard([ethanol, oil], true)!;
    const adapted = adaptReactionResult(result, ["c2h5oh", "bergamot-oil"]);
    expect(adapted.ok).toBe(false);
    const kinds = adapted.effects.map((e) => e.kind);
    expect(kinds).toContain("flash");
    expect(kinds).toContain("blast");
  });

  it("still blocks sodium + water", () => {
    const na = getChemical("na")!;
    const h2o = getChemical("h2o")!;
    expect(tryHazard([na, h2o])?.reactionType).toBe("hazard");
  });
});
