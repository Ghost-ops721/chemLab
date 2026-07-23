import { describe, expect, it } from "vitest";
import { checkIfraCompliance } from "./checkIfraCompliance";
import { IFRA_STANDARDS_VERSION } from "./types";

describe("checkIfraCompliance", () => {
  it("passes a balanced fine-fragrance teaching blend under Category 4", () => {
    const result = checkIfraCompliance({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 40 },
        { chemicalId: "bergamot-oil", amountMl: 0.1 },
        { chemicalId: "lavender-oil", amountMl: 0.5 },
        { chemicalId: "sandalwood-oil", amountMl: 1 },
      ],
      category: "cat4",
    });
    expect(result.version).toBe(IFRA_STANDARDS_VERSION);
    expect(result.status).toBe("pass");
    expect(result.screened).toBe(true);
    expect(result.ingredients.every((i) => i.status === "pass")).toBe(true);
  });

  it("fails when bergamot exceeds Category 4 teaching max", () => {
    const result = checkIfraCompliance({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 20 },
        { chemicalId: "bergamot-oil", amountMl: 2 },
      ],
      category: "cat4",
    });
    expect(result.status).toBe("fail");
    expect(result.screened).toBe(false);
    const berg = result.ingredients.find((i) => i.chemicalId === "bergamot-oil");
    expect(berg?.status).toBe("fail");
    expect(berg?.maxPct).toBe(0.4);
  });

  it("ignores ethanol as a solvent", () => {
    const result = checkIfraCompliance({
      contents: [{ chemicalId: "c2h5oh", amountMl: 50 }],
      category: "cat4",
    });
    expect(result.ingredients).toHaveLength(0);
    expect(result.status).toBe("unknown");
  });

  it("allows higher bergamot in rinse-off Category 9", () => {
    const result = checkIfraCompliance({
      contents: [
        { chemicalId: "c2h5oh", amountMl: 20 },
        { chemicalId: "bergamot-oil", amountMl: 0.2 },
      ],
      category: "cat9",
    });
    const berg = result.ingredients.find((i) => i.chemicalId === "bergamot-oil");
    expect(berg?.status).toBe("pass");
    expect(result.status).toBe("pass");
  });
});
